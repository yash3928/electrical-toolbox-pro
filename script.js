function qs(id) { return document.getElementById(id); }

function formatNumber(num, digits = 1) {
  return Number(num).toLocaleString('ko-KR', { maximumFractionDigits: digits });
}

function populateSelects() {
  const hpSelect = qs('hpSelect');
  const kwSelect = qs('kwSelect');

  MOTOR_DB.forEach((item) => {
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
}

function switchInputMode() {
  const mode = document.querySelector('input[name="inputMode"]:checked').value;
  qs('hpGroup').classList.toggle('hidden', mode !== 'hp');
  qs('kwGroup').classList.toggle('hidden', mode !== 'kw');
}

function getSelectedMotor() {
  const mode = document.querySelector('input[name="inputMode"]:checked').value;
  if (mode === 'hp') {
    const hp = Number(qs('hpSelect').value);
    return MOTOR_DB.find((item) => item.hp === hp);
  }
  const kw = Number(qs('kwSelect').value);
  return MOTOR_DB.find((item) => item.kw === kw);
}

function parseAt(text) {
  const match = text.match(/\/\s*(\d+)AT/);
  return match ? Number(match[1]) : null;
}

function recommendMaterial() {
  const motor = getSelectedMotor();
  if (!motor) return;

  const at = parseAt(motor.mccb);
  const kecOk = at && motor.current <= at && at <= motor.iz;

  qs('result').classList.remove('hidden');
  qs('motorName').textContent = `${motor.hp} HP (${motor.kw} kW)`;
  qs('current').textContent = `${formatNumber(motor.current)} A`;
  qs('mccb').textContent = motor.mccb;
  qs('elb').textContent = motor.elb;
  qs('cable').textContent = motor.cable;
  qs('terminal').textContent = motor.terminal;
  qs('conduit').textContent = motor.conduit;
  qs('iz').textContent = `${formatNumber(motor.iz)} A`;

  qs('kecCheck').innerHTML = kecOk
    ? `<strong class="ok">적합</strong> · Ib(${formatNumber(motor.current)}A) ≤ In(${at}A) ≤ Iz(${formatNumber(motor.iz)}A)`
    : `<strong class="warn">확인 필요</strong> · Ib/In/Iz 관계를 현장 조건으로 재검토하세요.`;
}

async function copyResult() {
  const motor = getSelectedMotor();
  if (!motor) return;

  const text = `[Electrical Toolbox Pro]\n` +
    `모터: ${motor.hp}HP (${motor.kw}kW), 3상 380V\n` +
    `정격전류: ${motor.current}A\n` +
    `MCCB: ${motor.mccb}\n` +
    `ELB: ${motor.elb}\n` +
    `케이블: ${motor.cable}\n` +
    `터미널: ${motor.terminal}\n` +
    `전선관: ${motor.conduit}\n` +
    `※ 일반 기준 추천값이며, 포설조건/온도/집합보정/전압강하/차단용량은 현장 확인 필요`;

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
    radio.addEventListener('change', switchInputMode);
  });
  qs('recommendBtn').addEventListener('click', recommendMaterial);
  qs('copyBtn').addEventListener('click', copyResult);
}

document.addEventListener('DOMContentLoaded', () => {
  populateSelects();
  bindEvents();
  switchInputMode();
  recommendMaterial();
});
