/* Electrical Toolbox Pro - script.js */

const $ = (id) => document.getElementById(id);

function formatNumber(value, digits = 1) {
  return Number(value).toLocaleString('ko-KR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  });
}

function initOptions() {
  const hpSelect = $('hpSelect');
  const kwSelect = $('kwSelect');

  MOTOR_DB.forEach((item, index) => {
    const hpOption = document.createElement('option');
    hpOption.value = String(index);
    hpOption.textContent = `${item.hp} HP (${item.kw} kW)`;
    hpSelect.appendChild(hpOption);

    const kwOption = document.createElement('option');
    kwOption.value = String(index);
    kwOption.textContent = `${item.kw} kW (${item.hp} HP)`;
    kwSelect.appendChild(kwOption);
  });

  hpSelect.value = '2'; // 기본 3HP
  kwSelect.value = '2';
  toggleInputMode();
  recommendMaterials();
}

function toggleInputMode() {
  const mode = document.querySelector('input[name="inputMode"]:checked').value;
  $('hpGroup').classList.toggle('hidden', mode !== 'hp');
  $('kwGroup').classList.toggle('hidden', mode !== 'kw');
}

function getSelectedMotor() {
  const mode = document.querySelector('input[name="inputMode"]:checked').value;
  const index = mode === 'hp' ? Number($('hpSelect').value) : Number($('kwSelect').value);
  return MOTOR_DB[index];
}

function nextStandardBreaker(requiredAmp) {
  return BREAKER_STANDARDS.find((rating) => rating >= requiredAmp) || BREAKER_STANDARDS[BREAKER_STANDARDS.length - 1];
}

function chooseBreaker(current) {
  const required = current * 1.25;
  return nextStandardBreaker(required);
}

function chooseCable(current, breakerAt) {
  // 간편 KEC 검토: 전동기 회로 여유율과 보호장치 정격을 동시에 만족하도록 보수적으로 선정
  const requiredAmpacity = Math.max(current * 1.25, breakerAt);
  return CABLE_DB.find((cable) => cable.ampacity >= requiredAmpacity) || CABLE_DB[CABLE_DB.length - 1];
}

function makeResultText(motor, breakerAt, cable) {
  return [
    `모터: ${motor.hp}HP (${motor.kw}kW), 3상 380V`,
    `정격전류: ${formatNumber(motor.current)}A`,
    `MCCB: 3P ${breakerAt}AF / ${breakerAt}AT`,
    `누전차단기: 3P ${breakerAt}AF / ${breakerAt}AT, 감도전류는 현장 기준 적용`,
    `케이블: ${cable.cable}`,
    `터미널: ${cable.terminal}`,
    `전선관: ${cable.conduit}`
  ].join('\n');
}

function recommendMaterials() {
  const motor = getSelectedMotor();
  const breakerAt = chooseBreaker(motor.current);
  const cable = chooseCable(motor.current, breakerAt);
  const requiredBreaker = motor.current * 1.25;
  const requiredCable = Math.max(motor.current * 1.25, breakerAt);

  $('motorInfo').textContent = `${motor.hp}HP / ${motor.kw}kW`;
  $('currentInfo').textContent = `${formatNumber(motor.current)} A`;
  $('mccbInfo').textContent = `MCCB 3P ${breakerAt}AF / ${breakerAt}AT`;
  $('elbInfo').textContent = `ELB 3P ${breakerAt}AF / ${breakerAt}AT`;
  $('cableInfo').textContent = cable.cable;
  $('terminalInfo').textContent = cable.terminal;
  $('conduitInfo').textContent = cable.conduit;

  $('basisCurrent').textContent = `${formatNumber(motor.current)}A × 125% = ${formatNumber(requiredBreaker)}A → 표준 ${breakerAt}A 선정`;
  $('basisCable').textContent = `필요 허용전류 ${formatNumber(requiredCable)}A 이상 → ${cable.cable} (참고 허용전류 ${cable.ampacity}A)`;
  $('copyText').value = makeResultText(motor, breakerAt, cable);
  $('resultPanel').classList.remove('hidden');
}

async function copyResult() {
  const text = $('copyText').value;
  try {
    await navigator.clipboard.writeText(text);
    showToast('결과가 복사되었습니다.');
  } catch (error) {
    $('copyText').classList.remove('hidden');
    $('copyText').select();
    document.execCommand('copy');
    showToast('결과가 복사되었습니다.');
  }
}

function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function resetSelection() {
  document.querySelector('input[name="inputMode"][value="hp"]').checked = true;
  $('hpSelect').value = '2';
  $('kwSelect').value = '2';
  toggleInputMode();
  recommendMaterials();
}

window.addEventListener('DOMContentLoaded', () => {
  initOptions();
  document.querySelectorAll('input[name="inputMode"]').forEach((radio) => {
    radio.addEventListener('change', toggleInputMode);
  });
  $('hpSelect').addEventListener('change', () => {
    $('kwSelect').value = $('hpSelect').value;
  });
  $('kwSelect').addEventListener('change', () => {
    $('hpSelect').value = $('kwSelect').value;
  });
});
