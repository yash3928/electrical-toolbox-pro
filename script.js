function qs(id) { return document.getElementById(id); }

function formatNumber(num, digits = 1) {
  return Number(num).toLocaleString('ko-KR', { maximumFractionDigits: digits });
}

function populateSelects() {
  const hpSelect = qs('hpSelect');
  const kwSelect = qs('kwSelect');
  hpSelect.innerHTML = '';
  kwSelect.innerHTML = '';

  MOTOR_SIZES.forEach((item) => {
    const hpOpt = document.createElement('option');
    hpOpt.value = String(item.hp);
    hpOpt.textContent = `${item.hp} HP (${item.kw} kW)`;
    hpSelect.appendChild(hpOpt);

    const kwOpt = document.createElement('option');
    kwOpt.value = String(item.kw);
    kwOpt.textContent = `${item.kw} kW (${item.hp} HP)`;
    kwSelect.appendChild(kwOpt);
  });

  hpSelect.value = '3';
  kwSelect.value = '2.2';
  qs('kwInput').value = '2.2';
}

function getPhaseMode() {
  return document.querySelector('input[name="phaseMode"]:checked').value;
}

function getInputMode() {
  return document.querySelector('input[name="inputMode"]:checked').value;
}

function getInstallMode() {
  return qs('installMode').value;
}

function switchInputMode() {
  const mode = getInputMode();
  qs('hpGroup').classList.toggle('hidden', mode !== 'hp');
  qs('kwSelectGroup').classList.toggle('hidden', mode !== 'kwSelect');
  qs('kwCustomGroup').classList.toggle('hidden', mode !== 'kwCustom');
}

function getSelectedCapacity() {
  const mode = getInputMode();

  if (mode === 'hp') {
    const hp = Number(qs('hpSelect').value);
    const found = MOTOR_SIZES.find((item) => item.hp === hp);
    return { hp: found.hp, kw: found.kw, isStandard: true };
  }

  if (mode === 'kwSelect') {
    const kw = Number(qs('kwSelect').value);
    const found = MOTOR_SIZES.find((item) => item.kw === kw);
    return { hp: found.hp, kw: found.kw, isStandard: true };
  }

  const kw = Number(qs('kwInput').value);
  if (!kw || kw <= 0) return null;
  const hp = kw / 0.746;
  return { hp, kw, isStandard: false };
}

function getPfEff() {
  const pf = Number(qs('pfInput').value) || 0.85;
  const eff = Number(qs('effInput').value) || 0.85;
  return {
    pf: Math.min(Math.max(pf, 0.5), 1),
    eff: Math.min(Math.max(eff, 0.5), 1)
  };
}

function calculateCurrent(kw, phase, pf, eff) {
  const standard = APP_STANDARD[phase];
  const inputWatt = (kw * 1000) / eff;

  if (phase === 'three') {
    return inputWatt / (Math.sqrt(3) * standard.voltage * pf);
  }

  return inputWatt / (standard.voltage * pf);
}

function nextFromArray(array, required) {
  return array.find((value) => value >= required) || array[array.length - 1];
}

function getFrame(at) {
  const frame = BREAKER_FRAMES.find((item) => at <= item.max);
  return frame ? frame.af : BREAKER_FRAMES[BREAKER_FRAMES.length - 1].af;
}

function recommendBreaker(current) {
  const requiredAt = current * 1.25;
  const at = nextFromArray(BREAKER_AT, requiredAt);
  const af = getFrame(at);
  return { at, af };
}

function recommendCable(at) {
  return CABLE_TABLE.find((item) => item.iz >= at) || CABLE_TABLE[CABLE_TABLE.length - 1];
}

function buildConduitPackage(cable, standard, installMode) {
  const install = INSTALL_STANDARDS[installMode];
  const size = cable[standard.conduitSizeKey];
  const hole = HOLE_CUTTER_TABLE[size] || { cutter: '별도 검토', note: '전선관/커넥터 실측 후 선정' };
  const conduit = `${install.conduitType} ${size}`;
  const accessory = install.accessoryPrefix === 'CD'
    ? `CD ${size} 커넥터 · CD ${size} 인서트 · CD ${size} 새들`
    : `GW ${size} 방수커넥터 · GW ${size} 로크너트/부싱 · GW ${size} 새들`;

  return {
    size,
    conduit,
    accessory,
    holeCutter: hole.cutter,
    holeNote: hole.note,
    installLabel: install.label
  };
}

function buildRecommendation() {
  const capacity = getSelectedCapacity();
  if (!capacity) {
    showToast('kW 값을 입력하세요.');
    return null;
  }

  const phase = getPhaseMode();
  const standard = APP_STANDARD[phase];
  const installMode = getInstallMode();
  const { pf, eff } = getPfEff();
  const current = calculateCurrent(capacity.kw, phase, pf, eff);
  const breaker = recommendBreaker(current);
  const cable = recommendCable(breaker.at);
  const conduitPackage = buildConduitPackage(cable, standard, installMode);
  const sensitivity = breaker.at >= 75 ? '100mA' : '30mA';

  return {
    ...capacity,
    phase,
    standard,
    installMode,
    pf,
    eff,
    current,
    breaker,
    cable,
    conduitPackage,
    sensitivity,
    mccb: `${standard.mccbName} ${standard.poles} ${breaker.af}AF / ${breaker.at}AT`,
    elb: `${standard.elbName} ${standard.poles} ${breaker.af}AF / ${breaker.at}AT / ${sensitivity}`,
    cableText: `${standard.cablePrefix} × ${cable.sq}SQ`,
    terminal: cable.terminal,
    conduit: conduitPackage.conduit
  };
}

function recommendMaterial() {
  const rec = buildRecommendation();
  if (!rec) return;

  const phaseText = rec.standard.label;
  const hpText = rec.isStandard ? `${rec.hp} HP` : `약 ${formatNumber(rec.hp, 1)} HP`;
  const kwText = `${formatNumber(rec.kw, 2)} kW`;
  const kecOk = rec.current <= rec.breaker.at && rec.breaker.at <= rec.cable.iz;

  qs('result').classList.remove('hidden');
  qs('motorName').textContent = `${hpText} (${kwText})`;
  qs('standardText').textContent = `${phaseText} · ${rec.conduitPackage.installLabel} · 역률 ${rec.pf} · 효율 ${rec.eff}`;
  qs('phaseBadge').textContent = phaseText;
  qs('current').textContent = `${formatNumber(rec.current)} A`;
  qs('mccb').textContent = rec.mccb;
  qs('elb').textContent = rec.elb;
  qs('cable').textContent = rec.cableText;
  qs('terminal').textContent = rec.terminal;
  qs('conduit').textContent = rec.conduit;
  qs('accessory').textContent = rec.conduitPackage.accessory;
  qs('holeCutter').textContent = `${rec.conduitPackage.holeCutter} (${rec.conduitPackage.holeNote})`;
  qs('iz').textContent = `${formatNumber(rec.cable.iz)} A`;

  qs('kecCheck').innerHTML = kecOk
    ? `<strong class="ok">적합</strong> · Ib(${formatNumber(rec.current)}A) ≤ In(${rec.breaker.at}A) ≤ Iz(${formatNumber(rec.cable.iz)}A)`
    : `<strong class="warn">확인 필요</strong> · Ib/In/Iz 관계를 현장 조건으로 재검토하세요.`;
}

async function copyResult() {
  const rec = buildRecommendation();
  if (!rec) return;

  const hpText = rec.isStandard ? `${rec.hp}HP` : `약 ${formatNumber(rec.hp, 1)}HP`;
  const text = `[Electrical Toolbox Pro]
` +
    `모터: ${hpText} (${formatNumber(rec.kw, 2)}kW), ${rec.standard.label}
` +
    `설치상황: ${rec.conduitPackage.installLabel}
` +
    `계산전류: ${formatNumber(rec.current)}A
` +
    `MCCB: ${rec.mccb}
` +
    `ELB: ${rec.elb}
` +
    `케이블: ${rec.cableText}
` +
    `터미널: ${rec.terminal}
` +
    `전선관: ${rec.conduit}
` +
    `부속자재: ${rec.conduitPackage.accessory}
` +
    `홀커터: ${rec.conduitPackage.holeCutter} (${rec.conduitPackage.holeNote})
` +
    `※ 간편 추천값이며, 포설조건/온도/집합보정/전압강하/차단용량/명판전류/제조사별 커넥터 치수는 현장 확인 필요`;

  try {
    await navigator.clipboard.writeText(text);
    showToast('결과를 복사했습니다.');
  } catch (e) {
    const area = qs('copyArea');
    area.value = text;
    area.classList.remove('hidden');
    area.select();
    showToast('복사창에서 직접 복사하세요.');
  }
}

function showToast(message) {
  const toast = qs('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function bindEvents() {
  document.querySelectorAll('input[name="inputMode"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      switchInputMode();
      recommendMaterial();
    });
  });
  document.querySelectorAll('input[name="phaseMode"]').forEach((radio) => {
    radio.addEventListener('change', recommendMaterial);
  });
  ['hpSelect', 'kwSelect', 'kwInput', 'pfInput', 'effInput', 'installMode'].forEach((id) => {
    qs(id).addEventListener('input', recommendMaterial);
    qs(id).addEventListener('change', recommendMaterial);
  });
  qs('recommendBtn').addEventListener('click', recommendMaterial);
  qs('copyBtn').addEventListener('click', copyResult);
}

function boot() {
  populateSelects();
  bindEvents();
  switchInputMode();
  recommendMaterial();
}

document.addEventListener('DOMContentLoaded', boot);
