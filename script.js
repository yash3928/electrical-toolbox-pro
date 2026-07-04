const $ = (id) => document.getElementById(id);

function init(){
  initTabs();
  initMotorSelects();
  initConduitSelect();
  initCableSelect();
  initTariffSelect();
  initTerminalBlockSelect();
  $('inputMode').addEventListener('change', updateInputMode);
  $('recommendBtn').addEventListener('click', recommendMotor);
  $('resetBtn').addEventListener('click', resetMotor);
  $('conduitType').addEventListener('change', initConduitSelect);
  $('conduitBtn').addEventListener('click', recommendConduit);
  $('cableType').addEventListener('change', initCableSelect);
  $('cableBtn').addEventListener('click', recommendCable);
  $('terminalBlockAmp').addEventListener('change', syncTerminalBlockDefaultSq);
  $('terminalBlockBtn').addEventListener('click', recommendTerminalBlock);
  $('energyMode').addEventListener('change', updateTariffInputs);
  $('tariffType').addEventListener('change', updateTariffInputs);
  $('tariffSeason').addEventListener('change', updateTariffInputs);
  $('tariffLoadMode').addEventListener('change', updateTariffInputs);
  $('touAutoMode')?.addEventListener('change', updateTariffInputs);
  $('energyBtn').addEventListener('click', calculateEnergy);
  $('energyResetBtn').addEventListener('click', resetEnergy);
  updateInputMode();
  updateTariffInputs();
}

document.addEventListener('DOMContentLoaded', init);

function initTabs(){
  document.querySelectorAll('.tab').forEach(btn=>{
    btn.addEventListener('click',()=>{
      document.querySelectorAll('.tab').forEach(b=>b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
      btn.classList.add('active');
      $(btn.dataset.tab).classList.add('active');
    });
  });
}

function initMotorSelects(){
  $('hpSelect').innerHTML = MOTOR_SIZES.map(m=>`<option value="${m.hp}">${m.hp}HP (${m.kw}kW)</option>`).join('');
  $('kwSelect').innerHTML = MOTOR_SIZES.map(m=>`<option value="${m.kw}">${m.kw}kW (${m.hp}HP)</option>`).join('');
  $('hpSelect').value = '3';
  $('kwSelect').value = '2.2';
}

function updateInputMode(){
  const mode = $('inputMode').value;
  $('hpWrap').classList.toggle('hidden', mode !== 'hpSelect');
  $('kwWrap').classList.toggle('hidden', mode !== 'kwSelect');
  $('kwDirectWrap').classList.toggle('hidden', mode !== 'kwDirect');
}

function initConduitSelect(){
  const type = $('conduitType').value;
  $('conduitSize').innerHTML = CONDUIT_ACCESSORIES[type].sizes.map(s=>`<option value="${s}">${type}${s}</option>`).join('');
}


function initCableSelect(){
  $('cableSq').innerHTML = CABLE_ACCESSORY_DB.map(c=>`<option value="${c.sq}">${c.sq}SQ</option>`).join('');
  $('cableSq').value = '16';
}

function initTerminalBlockSelect(){
  $('terminalBlockAmp').innerHTML = TERMINAL_BLOCK_DB.map(t=>`<option value="${t.amp}">${t.amp}A 단자대</option>`).join('');
  $('terminalBlockSq').innerHTML = CABLE_ACCESSORY_DB.map(c=>`<option value="${c.sq}">${c.sq}SQ</option>`).join('');
  $('terminalBlockAmp').value = '30';
  syncTerminalBlockDefaultSq();
}

function syncTerminalBlockDefaultSq(){
  const amp = parseInt($('terminalBlockAmp').value, 10);
  const block = TERMINAL_BLOCK_DB.find(t=>t.amp === amp);
  if(block) $('terminalBlockSq').value = String(block.defaultSq);
}

function formatTerminal(data){
  return data?.terminal || '제조사 확인';
}


function initTariffSelect(){
  const el = $('tariffType');
  if(!el || typeof TARIFFS === 'undefined') return;
  el.innerHTML = TARIFFS.map(t=>`<option value="${t.id}">${t.label}</option>`).join('');
  el.value = 'industrial_b_highA_1';
}

function getTariff(){
  const id = $('tariffType')?.value || 'manual';
  return (typeof TARIFFS !== 'undefined' ? TARIFFS.find(t=>t.id === id) : null) || TARIFFS[TARIFFS.length-1];
}

function getSeasonLabel(season){
  return {summer:'여름철', springAutumn:'봄·가을철', winter:'겨울철'}[season] || season;
}

function getTouTimeGuide(season){
  if(season === 'winter'){
    return {
      light:'경부하: 22:00~08:00',
      mid:'중간부하: 08:00~09:00, 12:00~16:00, 19:00~22:00',
      peak:'최대부하: 09:00~12:00, 16:00~19:00'
    };
  }
  return {
    light:'경부하: 22:00~08:00',
    mid:'중간부하: 08:00~15:00, 21:00~22:00',
    peak:'최대부하: 15:00~21:00'
  };
}

function getTouPresetHours(mode, season){
  if(mode === 'auto24') return {light:10, mid:8, peak:6, label:'24시간 연속운전'};
  if(mode === 'autoNight') return {light:10, mid:0, peak:0, label:'야간운전 22~08시'};
  if(mode === 'autoDay'){
    if(season === 'winter') return {light:0, mid:5, peak:5, label:'주간운전 08~18시'};
    return {light:0, mid:7, peak:3, label:'주간운전 08~18시'};
  }
  return null;
}

function updateTouTimeInfo(){
  if(!$('touTimeInfo')) return;
  const season = $('tariffSeason').value;
  const guide = getTouTimeGuide(season);
  const mode = $('touAutoMode')?.value || 'auto24';
  const preset = getTouPresetHours(mode, season);
  const h = preset || {light:getVal('lightHours'), mid:getVal('midHours'), peak:getVal('peakHours'), label:'직접입력'};
  $('touTimeInfo').value = `${getSeasonLabel(season)} 시간대\n${guide.light}\n${guide.mid}\n${guide.peak}\n\n현재 산정: ${h.label} → 경부하 ${h.light}h/일, 중간부하 ${h.mid}h/일, 최대부하 ${h.peak}h/일`;
}

function applyTouAutoHours(){
  if(!$('touAutoMode')) return;
  const season = $('tariffSeason').value;
  const mode = $('touAutoMode').value;
  const preset = getTouPresetHours(mode, season);
  if(preset){
    $('lightHours').value = preset.light;
    $('midHours').value = preset.mid;
    $('peakHours').value = preset.peak;
  }
  updateTouTimeInfo();
}

function updateTariffInputs(){
  if(!$('tariffType')) return;
  const tariff = getTariff();
  const season = $('tariffSeason').value;
  const requestedMode = $('tariffLoadMode').value;
  const useTou = tariff.type === 'tou' && requestedMode === 'tou';

  $('basicRate').value = tariff.id === 'manual' ? $('basicRate').value : tariff.basic;

  if(tariff.id !== 'manual'){
    if(tariff.type === 'flat'){
      $('tariffLoadMode').value = 'flat';
      $('energyRate').value = tariff.energy[season];
    }else if(useTou){
      $('energyRate').value = '';
      $('energyRate').placeholder = '시간대별 사용량으로 계산';
    }else{
      $('energyRate').value = tariff.energy[season].mid;
      $('energyRate').placeholder = '중간부하 단가 자동입력';
    }
  }

  const touVisible = tariff.type === 'tou' && $('tariffLoadMode').value === 'tou';
  ['touAutoModeWrap','lightHoursWrap','midHoursWrap','peakHoursWrap','touTimeInfoWrap','lightKwhWrap','midKwhWrap','peakKwhWrap'].forEach(id=>$(id)?.classList.toggle('hidden', !touVisible));
  const mode = $('touAutoMode')?.value || 'auto24';
  const manualKwh = mode === 'manualKwh';
  const customHours = mode === 'customHours';
  ['lightKwh','midKwh','peakKwh'].forEach(id=>{ if($(id)) $(id).readOnly = touVisible && !manualKwh; });
  ['lightHours','midHours','peakHours'].forEach(id=>{ if($(id)) $(id).readOnly = touVisible && !customHours; });
  ['lightHoursWrap','midHoursWrap','peakHoursWrap'].forEach(id=>$(id)?.classList.toggle('hidden', !touVisible || manualKwh));
  if(touVisible && !manualKwh) applyTouAutoHours();
  updateTouTimeInfo();
}

function getKw(){
  const mode = $('inputMode').value;
  if(mode === 'hpSelect'){
    const hp = parseFloat($('hpSelect').value);
    const found = MOTOR_SIZES.find(m=>m.hp === hp);
    return {kw: found.kw, label:`${found.hp}HP (${found.kw}kW)`};
  }
  if(mode === 'kwSelect'){
    const kw = parseFloat($('kwSelect').value);
    const found = MOTOR_SIZES.find(m=>m.kw === kw);
    return {kw: found.kw, label:`${found.kw}kW (${found.hp}HP)`};
  }
  const kw = parseFloat($('kwDirect').value);
  if(!kw || kw <= 0) throw new Error('kW 직접입력 값을 입력하세요.');
  return {kw, label:`${kw}kW 직접입력`};
}

function calcCurrent(kw, phase, pf, eff){
  if(phase === 'three') return kw * 1000 / (Math.sqrt(3) * 380 * pf * eff);
  return kw * 1000 / (220 * pf * eff);
}

function nextStandard(arr, value){
  return arr.find(v=>v >= value) || arr[arr.length-1];
}

function getFrame(at){
  return (BREAKER_FRAMES.find(f=>at <= f.max) || BREAKER_FRAMES[BREAKER_FRAMES.length-1]).frame;
}

function selectCable(inRating){
  return CABLES.find(c=>c.iz >= inRating) || CABLES[CABLES.length-1];
}

function selectConduitByCable(cable, locationKey){
  const type = LOCATION_RULES[locationKey].conduitType;
  // CV 4C 케이블 외경 기준의 단순 실무 매핑. 실제 관내 점유율/제조사 외경 확인 필요.
  let size = 16;
  if(cable.cableOD <= 14) size = 22;
  else if(cable.cableOD <= 18) size = 28;
  else if(cable.cableOD <= 25) size = 36;
  else if(cable.cableOD <= 34) size = 42;
  else size = 54;
  return buildConduitPackage(type, size);
}

function buildConduitPackage(type, size){
  const def = CONDUIT_ACCESSORIES[type];
  const f = def.fittings(size);
  return {type, name:def.name, size, label:`${type}${size}`, hole:HOLE_CUTTERS[size] || '제조사 확인', ...f};
}

function recommendMotor(){
  try{
    const {kw,label} = getKw();
    const phase = $('phase').value;
    const pf = parseFloat($('pf').value) || 0.85;
    const eff = parseFloat($('eff').value) || 0.85;
    const locationKey = $('location').value;
    const current = calcCurrent(kw, phase, pf, eff);
    const designCurrent = current; // KEC IB: 회로 설계전류. 모터 특성상 별도 과부하/기동 검토 필요.
    const targetBreaker = current * 1.25;
    const at = nextStandard(BREAKER_RATINGS, targetBreaker);
    const af = getFrame(at);
    const cable = selectCable(at);
    const conduit = selectConduitByCable(cable, locationKey);
    const poles = phase === 'three' ? '3P' : '2P';
    const voltage = phase === 'three' ? '삼상 380V' : '단상 220V';
    const mccb = `MCCB ${poles} ${af}AF / ${at}AT`;
    const elb = `ELB ${poles} ${af}AF / ${at}AT`;
    const cableText = `CV ${phase === 'three' ? '4C' : '3C'} × ${cable.sq}SQ`;

    const copyText = [
      `■ Electrical Toolbox Pro 추천`,
      `용량: ${label}`,
      `전원: ${voltage}`,
      `정격전류: ${current.toFixed(1)}A`,
      `차단기: ${mccb}`,
      `누전차단기: ${elb}`,
      `케이블: ${cableText}`,
      `터미널: ${cable.terminal}`,
      `전선관: ${conduit.label} (${conduit.name})`,
      `커넥터: ${conduit.connector}`,
      `인서트/부싱: ${conduit.insert}`,
      `새들: ${conduit.saddle}`,
      `홀커터 참고: ${conduit.hole}`
    ].join('\n');

    $('motorResult').innerHTML = `
      <h3>추천 결과</h3>
      <div class="resultGrid">
        <div class="item"><div class="k">모터 용량</div><div class="v">${label}</div></div>
        <div class="item"><div class="k">전원</div><div class="v">${voltage}</div></div>
        <div class="item"><div class="k">계산 전류</div><div class="v">${current.toFixed(1)} A</div></div>
        <div class="item"><div class="k">설치 상황</div><div class="v">${LOCATION_RULES[locationKey].label}</div></div>
        <div class="item"><div class="k">차단기</div><div class="v">${mccb}</div></div>
        <div class="item"><div class="k">누전차단기</div><div class="v">${elb}</div></div>
        <div class="item"><div class="k">케이블</div><div class="v">${cableText}</div></div>
        <div class="item"><div class="k">터미널</div><div class="v">${cable.terminal}</div></div>
        <div class="item"><div class="k">전선관</div><div class="v">${conduit.label} · ${conduit.name}</div></div>
        <div class="item"><div class="k">홀커터 참고</div><div class="v">${conduit.hole}</div></div>
        <div class="item"><div class="k">커넥터</div><div class="v">${conduit.connector}</div></div>
        <div class="item"><div class="k">인서트/부싱</div><div class="v">${conduit.insert}</div></div>
        <div class="item"><div class="k">새들</div><div class="v">${conduit.saddle}</div></div>
        <div class="item"><div class="k">KEC 간편 검토</div><div class="v"><span class="badge good">IB ≤ In ≤ Iz</span></div></div>
        <div class="item full"><div class="k">선정 근거</div><div class="v kv">IB=${designCurrent.toFixed(1)}A, In=${at}A, Iz=${cable.iz}A\n간편 검토: ${designCurrent.toFixed(1)}A ≤ ${at}A ≤ ${cable.iz}A</div></div>
      </div>
      <div class="basis">※ 차단기는 운전전류×125% 이상에서 표준 정격을 선택했습니다. 모터 기동전류, 기동방식, EOCR/과부하계전기, 전압강하, 차단용량은 현장 조건에 따라 별도 검토하세요.</div>
      <button class="copyBtn" data-copy="${escapeHtml(copyText)}">결과 복사하기</button>
    `;
    $('motorResult').classList.remove('hidden');
    bindCopyButtons();
  }catch(e){
    $('motorResult').innerHTML = `<div class="item error">${e.message}</div>`;
    $('motorResult').classList.remove('hidden');
  }
}

function recommendConduit(){
  const type = $('conduitType').value;
  const size = parseInt($('conduitSize').value,10);
  const p = buildConduitPackage(type, size);
  const copyText = [
    `■ 전선관 부속 추천`,
    `전선관: ${p.label} (${p.name})`,
    `커넥터: ${p.connector}`,
    `인서트/부싱: ${p.insert}`,
    `새들: ${p.saddle}`,
    `홀커터 참고: ${p.hole}`,
    `비고: ${p.note}`
  ].join('\n');

  $('conduitResult').innerHTML = `
    <h3>전선관 부속 추천</h3>
    <div class="resultGrid">
      <div class="item"><div class="k">전선관</div><div class="v">${p.label}</div></div>
      <div class="item"><div class="k">종류</div><div class="v">${p.name}</div></div>
      <div class="item"><div class="k">커넥터</div><div class="v">${p.connector}</div></div>
      <div class="item"><div class="k">인서트/부싱</div><div class="v">${p.insert}</div></div>
      <div class="item"><div class="k">새들</div><div class="v">${p.saddle}</div></div>
      <div class="item"><div class="k">홀커터 참고</div><div class="v">${p.hole}</div></div>
      <div class="item full"><div class="k">비고</div><div class="v">${p.note}</div></div>
    </div>
    <div class="basis">※ 홀커터 규격은 현장 참고용입니다. 박스 노크아웃, 커넥터 제조사, 판넬 재질과 실제 외경을 확인하세요.</div>
    <button class="copyBtn" data-copy="${escapeHtml(copyText)}">결과 복사하기</button>
  `;
  $('conduitResult').classList.remove('hidden');
  bindCopyButtons();
}



function recommendCable(){
  const typeKey = $('cableType').value;
  const sq = parseFloat($('cableSq').value);
  const useLabel = $('cableUse').selectedOptions[0].textContent;
  const typeInfo = CABLE_TYPE_INFO[typeKey];
  const data = CABLE_ACCESSORY_DB.find(c=>Number(c.sq) === Number(sq));
  if(!data){ toast('케이블 굵기 데이터를 찾을 수 없습니다.'); return; }

  const cableName = `${typeInfo.label} × ${sq}SQ`;
  const terminalText = formatTerminal(data);

  const copyText = [
    `■ 케이블 터미널 추천`,
    `케이블: ${cableName}`,
    `접속 목적: ${useLabel}`,
    `추천 터미널: ${terminalText}`,
    `비고: 일반적인 판넬/차단기/단자대 접속 기준의 대표 추천값`
  ].join('\n');

  $('cableResult').innerHTML = `
    <h3>케이블 터미널 추천</h3>
    <div class="resultGrid">
      <div class="item"><div class="k">케이블</div><div class="v">${cableName}</div></div>
      <div class="item"><div class="k">접속 목적</div><div class="v">${useLabel}</div></div>
      <div class="item full"><div class="k">추천 터미널</div><div class="v strong">${terminalText}</div></div>
      <div class="item full"><div class="k">비고</div><div class="v">${typeInfo.note}</div></div>
    </div>
    <div class="basis">※ 혼동을 줄이기 위해 대표 규격 1개만 표시합니다. 실제 적용 시에는 접속기기 단자 구멍 지름과 단자 폭을 최종 확인하세요.</div>
    <button class="copyBtn" data-copy="${escapeHtml(copyText)}">결과 복사하기</button>
  `;
  $('cableResult').classList.remove('hidden');
  bindCopyButtons();
}

function recommendTerminalBlock(){
  const amp = parseInt($('terminalBlockAmp').value, 10);
  const poles = $('terminalBlockPole').value;
  const sq = parseFloat($('terminalBlockSq').value);
  const block = TERMINAL_BLOCK_DB.find(t=>Number(t.amp) === Number(amp));
  const data = CABLE_ACCESSORY_DB.find(c=>Number(c.sq) === Number(sq));
  if(!block){ toast('단자대 정격 데이터를 찾을 수 없습니다.'); return; }
  if(!data){ toast('케이블 굵기 데이터를 찾을 수 없습니다.'); return; }

  const inRange = sq >= block.minSq && sq <= block.maxSq;
  const terminalText = formatTerminal(data);
  const copyText = [
    `■ 단자대/터미널 추천`,
    `단자대: ${amp}A ${poles}P`,
    `적용 전선 범위: ${block.cableRange}`,
    `선택 케이블: ${sq}SQ`,
    `추천 터미널: ${terminalText}`,
    `검토: ${inRange ? '선택 케이블이 단자대 적용 범위 안에 있음' : '선택 케이블이 단자대 권장 범위를 벗어남 - 단자대 정격 재검토'}`
  ].join('\n');

  $('terminalBlockResult').innerHTML = `
    <h3>단자대·터미널 추천</h3>
    <div class="resultGrid">
      <div class="item"><div class="k">단자대</div><div class="v">${amp}A ${poles}P</div></div>
      <div class="item"><div class="k">적용 전선 범위</div><div class="v">${block.cableRange}</div></div>
      <div class="item"><div class="k">선택 케이블</div><div class="v">${sq}SQ</div></div>
      <div class="item"><div class="k">범위 검토</div><div class="v"><span class="badge ${inRange ? 'good' : 'warn'}">${inRange ? '권장 범위' : '재검토 필요'}</span></div></div>
      <div class="item full"><div class="k">추천 터미널</div><div class="v strong">${terminalText}</div></div>
      <div class="item full"><div class="k">비고</div><div class="v">${block.note}</div></div>
    </div>
    <div class="basis">※ 혼동을 줄이기 위해 대표 규격 1개만 표시합니다. 단자대 제조사별 단자 구멍 지름, 단자 폭, 압착단자 외형 치수는 구매 전 도면으로 확인하세요.</div>
    <button class="copyBtn" data-copy="${escapeHtml(copyText)}">결과 복사하기</button>
  `;
  $('terminalBlockResult').classList.remove('hidden');
  bindCopyButtons();
}

function resetMotor(){
  $('phase').value='three';
  $('inputMode').value='hpSelect';
  $('hpSelect').value='3';
  $('kwSelect').value='2.2';
  $('kwDirect').value='';
  $('location').value='indoorHidden';
  $('pf').value='0.85';
  $('eff').value='0.85';
  updateInputMode();
  $('motorResult').classList.add('hidden');
}

function bindCopyButtons(){
  document.querySelectorAll('.copyBtn').forEach(btn=>{
    btn.onclick = async () => {
      const text = btn.dataset.copy.replaceAll('&quot;','"');
      try{
        await navigator.clipboard.writeText(text);
        toast('복사되었습니다');
      }catch(e){
        toast('복사 실패: 브라우저 권한 확인');
      }
    };
  });
}

function escapeHtml(str){
  return str.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

function toast(msg){
  const t = document.createElement('div');
  t.className='toast';
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),1800);
}


function won(n){
  if(!isFinite(n)) return '-';
  return Math.round(n).toLocaleString('ko-KR') + '원';
}
function num(n, digits=2){
  if(!isFinite(n)) return '-';
  return Number(n).toLocaleString('ko-KR', {maximumFractionDigits:digits});
}
function getVal(id){
  const v = parseFloat($(id).value);
  return isFinite(v) ? v : 0;
}

function calculateEnergy(){
  const mode = $('energyMode').value;
  const kw = getVal('energyKw');
  const hours = getVal('energyHours');
  const days = getVal('energyDays');
  const rate = getVal('energyRate');
  const basicRate = getVal('basicRate');
  const contractKw = getVal('contractKw');
  const beforeKw = getVal('beforeKw');
  const afterKw = getVal('afterKw');
  const investment = getVal('investment');
  const tariff = getTariff();
  const season = $('tariffSeason').value;
  const loadMode = $('tariffLoadMode').value;
  let lightKwh = getVal('lightKwh');
  let midKwh = getVal('midKwh');
  let peakKwh = getVal('peakKwh');
  const climateRate = getVal('climateRate');
  const fuelRate = getVal('fuelRate');
  const isTouBill = mode === 'bill' && tariff.type === 'tou' && loadMode === 'tou';
  let touHoursText = '';
  if(isTouBill){
    const autoMode = $('touAutoMode')?.value || 'auto24';
    if(autoMode !== 'manualKwh'){
      applyTouAutoHours();
      const lh = getVal('lightHours');
      const mh = getVal('midHours');
      const ph = getVal('peakHours');
      lightKwh = kw * lh * days;
      midKwh = kw * mh * days;
      peakKwh = kw * ph * days;
      $('lightKwh').value = num(lightKwh,1).replace(/,/g,'');
      $('midKwh').value = num(midKwh,1).replace(/,/g,'');
      $('peakKwh').value = num(peakKwh,1).replace(/,/g,'');
      touHoursText = `경부하 ${lh}h/일, 중간부하 ${mh}h/일, 최대부하 ${ph}h/일`;
    }else{
      touHoursText = '사용량 직접입력';
    }
  }

  if(mode !== 'saving' && (!isTouBill || (($('touAutoMode')?.value || 'auto24') !== 'manualKwh')) && kw <= 0){
    showEnergyError('부하용량 또는 절감전력(kW)을 입력하세요. 시간대별 자동산정은 부하용량(kW)이 필요합니다.');
    return;
  }

  const dailyKwh = kw * hours;
  const calculatedMonthlyKwh = dailyKwh * days;
  const touMonthlyKwh = lightKwh + midKwh + peakKwh;
  const monthlyKwh = isTouBill ? touMonthlyKwh : calculatedMonthlyKwh;
  const yearlyKwh = monthlyKwh * 12;

  let monthlyEnergyCharge = monthlyKwh * rate;
  let tariffText = `${tariff.label} · ${getSeasonLabel(season)}`;
  if(isTouBill){
    const r = tariff.energy[season];
    monthlyEnergyCharge = lightKwh * r.light + midKwh * r.mid + peakKwh * r.peak;
    tariffText += ` · 경부하 ${r.light}원/kWh, 중간부하 ${r.mid}원/kWh, 최대부하 ${r.peak}원/kWh`;
  }else if(tariff.id !== 'manual'){
    tariffText += ` · 적용단가 ${rate || 0}원/kWh`;
  }

  const basicCharge = contractKw * basicRate;
  const climateCharge = monthlyKwh * climateRate;
  const fuelCharge = monthlyKwh * fuelRate;
  const electricityCharge = basicCharge + monthlyEnergyCharge + climateCharge + fuelCharge;
  const vat = Math.round(electricityCharge * 0.1);
  const fund = Math.floor((electricityCharge * 0.027) / 10) * 10; // '25.7.1부 2.7%, 10원 미만 절사
  const totalBill = electricityCharge + vat + fund;

  let title = '전력량 계산 결과';
  let mainRows = '';
  let basis = '공식: 전력량(kWh)=전력(kW)×운전시간(h), 월 전력량=일 전력량×월 운전일수';
  let copy = [];

  if(mode === 'usage'){
    title = '전력량 계산 결과';
    mainRows = `
      <div class="item"><div class="k">일 전력량</div><div class="v">${num(dailyKwh)} kWh/일</div></div>
      <div class="item"><div class="k">월 전력량</div><div class="v">${num(monthlyKwh)} kWh/월</div></div>
      <div class="item"><div class="k">연 전력량</div><div class="v">${num(yearlyKwh)} kWh/년</div></div>
      <div class="item"><div class="k">전력량요금</div><div class="v">${rate ? won(monthlyEnergyCharge) + '/월' : '단가 입력 시 계산'}</div></div>`;
    copy = [`■ 전력량 계산`, `전력: ${kw}kW`, `운전: ${hours}h/일 × ${days}일/월`, `월 전력량: ${num(monthlyKwh)}kWh`, `연 전력량: ${num(yearlyKwh)}kWh`, `예상 전력량요금: ${rate ? won(monthlyEnergyCharge) : '단가 미입력'}`];
  }

  if(mode === 'bill'){
    title = '한전 전기요금 간편 계산';
    mainRows = `
      <div class="item full"><div class="k">적용 계약종별</div><div class="v">${tariffText}</div></div>
      <div class="item"><div class="k">월 사용량</div><div class="v">${num(monthlyKwh)} kWh</div></div>
      ${isTouBill ? `<div class="item full"><div class="k">시간대별 산정</div><div class="v">${touHoursText}<br>경 ${num(lightKwh)}kWh · 중 ${num(midKwh)}kWh · 최 ${num(peakKwh)}kWh</div></div>` : ''}
      <div class="item"><div class="k">기본요금</div><div class="v">${won(basicCharge)}</div></div>
      <div class="item"><div class="k">전력량요금</div><div class="v">${won(monthlyEnergyCharge)}</div></div>
      <div class="item"><div class="k">기후환경요금</div><div class="v">${won(climateCharge)}</div></div>
      <div class="item"><div class="k">연료비조정요금</div><div class="v">${won(fuelCharge)}</div></div>
      <div class="item"><div class="k">전기요금 소계</div><div class="v">${won(electricityCharge)}</div></div>
      <div class="item"><div class="k">부가세 10%</div><div class="v">${won(vat)}</div></div>
      <div class="item"><div class="k">전력산업기반기금 2.7%</div><div class="v">${won(fund)}</div></div>
      <div class="item"><div class="k">월 예상 청구금액</div><div class="v">${won(totalBill)}</div></div>`;
    basis = '2026.6.1 시행 한전 요금표(종합) 일반용·산업용 주요 계약종별 반영. 전기요금=기본요금+전력량요금+기후환경요금+연료비조정요금, 부가가치세=전기요금×10%, 전력산업기반기금=전기요금×2.7%(10원 미만 절사), 청구금액=전기요금+부가세+전력산업기반기금. 실제 청구액은 역률요금, 감면/가산, 최대수요전력 등에 따라 달라집니다.';
    copy = [`■ 한전 전기요금 간편 계산`, `계약종별: ${tariff.label}`, `계절: ${getSeasonLabel(season)}`, `월 사용량: ${num(monthlyKwh)}kWh`, ...(isTouBill ? [`시간대별: ${touHoursText}`, `경부하 ${num(lightKwh)}kWh / 중간부하 ${num(midKwh)}kWh / 최대부하 ${num(peakKwh)}kWh`] : []), `기본요금: ${won(basicCharge)}`, `전력량요금: ${won(monthlyEnergyCharge)}`, `기후환경요금: ${won(climateCharge)}`, `연료비조정요금: ${won(fuelCharge)}`, `전기요금 소계: ${won(electricityCharge)}`, `부가세: ${won(vat)}`, `전력산업기반기금: ${won(fund)}`, `월 예상 청구금액: ${won(totalBill)}`, `※ 실제 청구액은 한전 고지서 기준 확인 필요`];
  }

  if(mode === 'saving'){
    let saveKw = kw;
    if(beforeKw > 0 && afterKw >= 0 && beforeKw >= afterKw){
      saveKw = beforeKw - afterKw;
    }
    const saveRate = beforeKw > 0 ? (saveKw / beforeKw * 100) : 0;
    const saveDailyKwh = saveKw * hours;
    const saveMonthlyKwh = saveDailyKwh * days;
    const saveYearlyKwh = saveMonthlyKwh * 12;
    const saveMonthlyCost = saveMonthlyKwh * rate;
    const saveYearlyCost = saveMonthlyCost * 12;
    const paybackMonths = saveMonthlyCost > 0 ? investment / saveMonthlyCost : 0;
    title = '전력절감 계획 계산 결과';
    mainRows = `
      <div class="item"><div class="k">절감전력</div><div class="v">${num(saveKw,3)} kW</div></div>
      <div class="item"><div class="k">절감률</div><div class="v">${beforeKw ? num(saveRate,1)+'%' : '기존전력 입력 시 계산'}</div></div>
      <div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saveMonthlyKwh)} kWh/월</div></div>
      <div class="item"><div class="k">연 절감전력량</div><div class="v">${num(saveYearlyKwh)} kWh/년</div></div>
      <div class="item"><div class="k">월 절감금액</div><div class="v">${rate ? won(saveMonthlyCost) : '단가 입력 시 계산'}</div></div>
      <div class="item"><div class="k">연 절감금액</div><div class="v">${rate ? won(saveYearlyCost) : '단가 입력 시 계산'}</div></div>
      <div class="item full"><div class="k">투자회수기간</div><div class="v">${investment && rate ? num(paybackMonths,1)+'개월' : '투자비·단가 입력 시 계산'}</div></div>`;
    basis = '절감 공식: 절감전력=기존전력-개선후전력, 절감률=절감전력÷기존전력×100, 절감전력량=절감전력×운전시간, 절감금액=절감전력량×전력량요금단가, 회수기간=투자비÷월절감금액';
    copy = [`■ 전력절감 계획 계산`, `절감전력: ${num(saveKw,3)}kW`, `절감률: ${beforeKw ? num(saveRate,1)+'%' : '미계산'}`, `월 절감전력량: ${num(saveMonthlyKwh)}kWh`, `연 절감전력량: ${num(saveYearlyKwh)}kWh`, `월 절감금액: ${rate ? won(saveMonthlyCost) : '단가 미입력'}`, `연 절감금액: ${rate ? won(saveYearlyCost) : '단가 미입력'}`, `투자회수기간: ${investment && rate ? num(paybackMonths,1)+'개월' : '미계산'}`];
  }

  $('energyResult').innerHTML = `
    <h3>${title}</h3>
    <div class="resultGrid">${mainRows}</div>
    <div class="basis">${basis}</div>
    <button class="copyBtn" data-copy="${escapeHtml(copy.join('\n'))}">결과 복사하기</button>
  `;
  $('energyResult').classList.remove('hidden');
  bindCopyButtons();
}

function showEnergyError(message){
  $('energyResult').innerHTML = `<div class="item error">${message}</div>`;
  $('energyResult').classList.remove('hidden');
}

function resetEnergy(){
  $('energyMode').value = 'usage';
  $('tariffType').value = 'industrial_b_highA_1';
  $('tariffSeason').value = 'summer';
  $('tariffLoadMode').value = 'flat';
  $('energyKw').value = '';
  $('energyHours').value = '8';
  $('energyDays').value = '30';
  $('energyRate').value = '';
  $('basicRate').value = '';
  $('contractKw').value = '';
  $('beforeKw').value = '';
  $('afterKw').value = '';
  $('investment').value = '';
  if($('climateRate')) $('climateRate').value = '0';
  if($('fuelRate')) $('fuelRate').value = '0';
  $('lightKwh').value = '';
  $('midKwh').value = '';
  $('peakKwh').value = '';
  $('touAutoMode').value = 'auto24';
  $('lightHours').value = '10';
  $('midHours').value = '8';
  $('peakHours').value = '6';
  updateTariffInputs();
  $('energyResult').classList.add('hidden');
}

// ===== Ver2.9 simplified energy calculator overrides =====
function getSeasonFromMonth(month){
  const m = Number(month || 1);
  if([6,7,8].includes(m)) return 'summer';
  if([3,4,5,9,10].includes(m)) return 'springAutumn';
  return 'winter';
}

function getSeasonFullLabel(season){
  return {
    summer:'여름철(6~8월)',
    springAutumn:'봄·가을철(3~5월, 9~10월)',
    winter:'겨울철(11~2월)'
  }[season] || season;
}

function getTouSegments(season){
  if(season === 'winter'){
    return {
      light:[[0,8],[22,24]],
      mid:[[8,9],[12,16],[19,22]],
      peak:[[9,12],[16,19]]
    };
  }
  return {
    light:[[0,8],[22,24]],
    mid:[[8,15],[21,22]],
    peak:[[15,21]]
  };
}

function overlap(a,b){
  return Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]));
}

function operatingIntervals(pattern, hours){
  const h = Math.max(0, Math.min(24, Number(hours || 0)));
  if(pattern === 'continuous') return {hours:24, intervals:[[0,24]], label:'24시간 연속운전'};
  const start = pattern === 'night' ? 22 : 8;
  const label = pattern === 'night' ? `야간운전 22시 시작, ${h}h/일` : `주간운전 08시 시작, ${h}h/일`;
  if(h === 0) return {hours:0, intervals:[], label};
  const end = start + h;
  if(end <= 24) return {hours:h, intervals:[[start,end]], label};
  return {hours:h, intervals:[[start,24],[0,end-24]], label};
}

function allocateTouHours(season, pattern, hours){
  const op = operatingIntervals(pattern, hours);
  const segments = getTouSegments(season);
  const result = {light:0, mid:0, peak:0, label:op.label};
  for(const interval of op.intervals){
    for(const key of ['light','mid','peak']){
      for(const seg of segments[key]) result[key] += overlap(interval, seg);
    }
  }
  return result;
}

function updateTariffInputs(){
  if(!$('tariffType')) return;
  const tariff = getTariff();
  const monthEl = $('tariffMonth');
  const month = monthEl ? Number(monthEl.value || new Date().getMonth()+1) : new Date().getMonth()+1;
  const season = getSeasonFromMonth(month);
  if($('tariffSeason')) $('tariffSeason').value = season;
  if($('seasonView')) $('seasonView').value = getSeasonFullLabel(season);
  if($('basicRate')) $('basicRate').value = tariff?.basic || 0;

  const pattern = $('operationPattern')?.value || 'day';
  if($('energyHours')){
    if(pattern === 'continuous'){
      $('energyHours').value = '24';
      $('energyHours').readOnly = true;
    }else{
      $('energyHours').readOnly = false;
    }
  }

  const hours = getVal('energyHours') || 0;
  const a = allocateTouHours(season, pattern, hours);
  if($('lightHours')) $('lightHours').value = a.light.toFixed(2);
  if($('midHours')) $('midHours').value = a.mid.toFixed(2);
  if($('peakHours')) $('peakHours').value = a.peak.toFixed(2);

  let info = `${getSeasonFullLabel(season)} 시간대\n`;
  const guide = getTouTimeGuide(season);
  info += `${guide.light}\n${guide.mid}\n${guide.peak}\n\n`;
  info += `현재 산정: ${a.label}\n`;
  info += `→ 경부하 ${num(a.light,2)}h/일, 중간부하 ${num(a.mid,2)}h/일, 최대부하 ${num(a.peak,2)}h/일`;
  if($('touTimeInfo')) $('touTimeInfo').value = info;

  if(tariff && tariff.id !== 'manual'){
    if(tariff.type === 'flat'){
      $('energyRate').value = tariff.energy[season];
    }else{
      const r = tariff.energy[season];
      const totalH = Math.max(a.light + a.mid + a.peak, 0.0001);
      const avg = (a.light*r.light + a.mid*r.mid + a.peak*r.peak)/totalH;
      $('energyRate').value = avg.toFixed(2);
    }
  }
}

function calcTouKwhByKw(kw, days, season, pattern, hours){
  const h = allocateTouHours(season, pattern, hours);
  return {
    hours:h,
    light:kw * h.light * days,
    mid:kw * h.mid * days,
    peak:kw * h.peak * days,
    total:kw * (h.light + h.mid + h.peak) * days
  };
}

function calcEnergyChargeForKw(kw, days, tariff, season, pattern, hours){
  if(tariff.type === 'tou'){
    const k = calcTouKwhByKw(kw, days, season, pattern, hours);
    const r = tariff.energy[season];
    return {
      kwh:k.total,
      lightKwh:k.light,
      midKwh:k.mid,
      peakKwh:k.peak,
      hours:k.hours,
      energyCharge:k.light*r.light + k.mid*r.mid + k.peak*r.peak,
      rateText:`경부하 ${r.light}원/kWh · 중간부하 ${r.mid}원/kWh · 최대부하 ${r.peak}원/kWh`,
      avgRate:k.total>0 ? (k.light*r.light + k.mid*r.mid + k.peak*r.peak)/k.total : 0
    };
  }
  const h = pattern === 'continuous' ? 24 : Number(hours || 0);
  const kwh = kw * h * days;
  const rate = tariff.energy[season] || 0;
  return {
    kwh,
    lightKwh:0,
    midKwh:0,
    peakKwh:0,
    hours:{light:0,mid:0,peak:0,label:pattern === 'continuous' ? '24시간 연속운전' : '일반 단가 적용'},
    energyCharge:kwh * rate,
    rateText:`전력량요금 ${rate}원/kWh`,
    avgRate:rate
  };
}

function calculateEnergy(){
  updateTariffInputs();
  const tariff = getTariff();
  const season = $('tariffSeason').value;
  const pattern = $('operationPattern')?.value || 'day';
  const loadKw = getVal('energyKw');
  const hours = getVal('energyHours');
  const days = getVal('energyDays');
  const contractKw = getVal('contractKw');
  const beforeKw = getVal('beforeKw');
  const afterKw = getVal('afterKw');
  const investment = getVal('investment');
  const climateRate = getVal('climateRate');
  const fuelRate = getVal('fuelRate');

  if(loadKw <= 0 && !(beforeKw > 0 && afterKw >= 0)){
    showEnergyError('부하용량(kW) 또는 기존전력/개선후 전력을 입력하세요.');
    return;
  }
  if(days <= 0){ showEnergyError('월 운전일수를 입력하세요.'); return; }
  if(pattern !== 'continuous' && hours <= 0){ showEnergyError('일 운전시간을 입력하세요.'); return; }

  const bill = calcEnergyChargeForKw(loadKw, days, tariff, season, pattern, hours);
  const basicCharge = contractKw * (tariff.basic || 0);
  const climateCharge = bill.kwh * climateRate;
  const fuelCharge = bill.kwh * fuelRate;
  const electricityCharge = basicCharge + bill.energyCharge + climateCharge + fuelCharge;
  const vat = Math.round(electricityCharge * 0.10);
  const fund = Math.floor((electricityCharge * 0.027) / 10) * 10;
  const totalBill = electricityCharge + vat + fund;

  const hasSaving = beforeKw > 0 && afterKw >= 0 && beforeKw >= afterKw;
  const saveKw = hasSaving ? beforeKw - afterKw : 0;
  const saving = hasSaving ? calcEnergyChargeForKw(saveKw, days, tariff, season, pattern, hours) : null;
  const savingEnergyPlusFees = saving ? saving.energyCharge + saving.kwh * (climateRate + fuelRate) : 0;
  const savingVat = Math.round(savingEnergyPlusFees * 0.10);
  const savingFund = Math.floor((savingEnergyPlusFees * 0.027) / 10) * 10;
  const savingMonthly = savingEnergyPlusFees + savingVat + savingFund;
  const savingYearly = savingMonthly * 12;
  const savingRate = hasSaving ? saveKw / beforeKw * 100 : 0;
  const payback = savingMonthly > 0 && investment > 0 ? investment / savingMonthly : 0;

  const touRows = tariff.type === 'tou' ? `
    <div class="item"><div class="k">경부하 사용량</div><div class="v">${num(bill.lightKwh)} kWh/월</div></div>
    <div class="item"><div class="k">중간부하 사용량</div><div class="v">${num(bill.midKwh)} kWh/월</div></div>
    <div class="item"><div class="k">최대부하 사용량</div><div class="v">${num(bill.peakKwh)} kWh/월</div></div>
  ` : '';

  const savingRows = hasSaving ? `
    <div class="item"><div class="k">절감전력</div><div class="v">${num(saveKw,3)} kW</div></div>
    <div class="item"><div class="k">절감률</div><div class="v">${num(savingRate,1)}%</div></div>
    <div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saving.kwh)} kWh/월</div></div>
    <div class="item"><div class="k">연 절감전력량</div><div class="v">${num(saving.kwh*12)} kWh/년</div></div>
    <div class="item"><div class="k">월 절감금액</div><div class="v">${won(savingMonthly)}</div></div>
    <div class="item"><div class="k">연 절감금액</div><div class="v">${won(savingYearly)}</div></div>
    <div class="item full"><div class="k">투자회수기간</div><div class="v">${payback ? num(payback,1)+'개월' : '투자비 입력 시 계산'}</div></div>
  ` : `<div class="item full"><div class="k">전력절감 계산</div><div class="v">기존전력과 개선후 전력을 입력하면 절감량·절감액·회수기간을 계산합니다.</div></div>`;

  const copy = [
    '■ 전력·요금·절감 간편 계산',
    `계약종별: ${tariff.label}`,
    `검침월/계절: ${$('tariffMonth')?.value || '-'}월 / ${getSeasonFullLabel(season)}`,
    `운전패턴: ${bill.hours.label}`,
    `부하용량: ${loadKw}kW`,
    `월 사용량: ${num(bill.kwh)}kWh`,
    `기본요금: ${won(basicCharge)}`,
    `전력량요금: ${won(bill.energyCharge)}`,
    `예상 청구금액: ${won(totalBill)}`,
    ...(hasSaving ? [`절감전력: ${num(saveKw,3)}kW`, `월 절감금액: ${won(savingMonthly)}`, `투자회수기간: ${payback ? num(payback,1)+'개월' : '미계산'}`] : []),
    '※ 실제 청구액은 한전 고지서 및 역률요금/감면/가산 기준 확인 필요'
  ];

  $('energyResult').innerHTML = `
    <h3>자동 계산 결과</h3>
    <div class="resultGrid">
      <div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${bill.rateText}<br>기후환경 ${climateRate}원/kWh · 연료비조정 ${fuelRate}원/kWh 자동 적용</div></div>
      <div class="item"><div class="k">월 사용량</div><div class="v">${num(bill.kwh)} kWh/월</div></div>
      <div class="item"><div class="k">연 사용량</div><div class="v">${num(bill.kwh*12)} kWh/년</div></div>
      ${touRows}
      <div class="item"><div class="k">기본요금</div><div class="v">${won(basicCharge)}</div></div>
      <div class="item"><div class="k">전력량요금</div><div class="v">${won(bill.energyCharge)}</div></div>
      <div class="item"><div class="k">기후환경요금</div><div class="v">${won(climateCharge)}</div></div>
      <div class="item"><div class="k">연료비조정요금</div><div class="v">${won(fuelCharge)}</div></div>
      <div class="item"><div class="k">부가세 10%</div><div class="v">${won(vat)}</div></div>
      <div class="item"><div class="k">전력산업기반기금 2.7%</div><div class="v">${won(fund)}</div></div>
      <div class="item full"><div class="k">월 예상 청구금액</div><div class="v">${won(totalBill)}</div></div>
      ${savingRows}
    </div>
    <div class="basis">입력은 부하용량·운전시간·계약전력·기존/개선후 전력·투자비 중심으로 단순화했습니다. 시간대별 사용량은 선택한 운전패턴과 한전 시간대 기준으로 자동 배분합니다.</div>
    <button class="copyBtn" data-copy="${escapeHtml(copy.join('\n'))}">결과 복사하기</button>
  `;
  $('energyResult').classList.remove('hidden');
  bindCopyButtons();
}

function resetEnergy(){
  if($('tariffType')) $('tariffType').value = 'industrial_b_highA_1';
  if($('tariffMonth')) $('tariffMonth').value = String(new Date().getMonth()+1);
  if($('operationPattern')) $('operationPattern').value = 'day';
  $('energyKw').value = '';
  $('energyHours').value = '8';
  $('energyHours').readOnly = false;
  $('energyDays').value = '30';
  $('contractKw').value = '';
  $('beforeKw').value = '';
  $('afterKw').value = '';
  $('investment').value = '';
  if($('climateRate')) $('climateRate').value = '9';
  if($('fuelRate')) $('fuelRate').value = '5';
  updateTariffInputs();
  $('energyResult').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  if($('tariffMonth')) $('tariffMonth').value = String(new Date().getMonth()+1);
  ['tariffMonth','operationPattern','energyHours','energyDays','energyKw','contractKw','beforeKw','afterKw','investment'].forEach(id=>{
    const el = $(id);
    if(el) el.addEventListener('input', updateTariffInputs);
    if(el) el.addEventListener('change', updateTariffInputs);
  });
  updateTariffInputs();
});
