const $ = (id) => document.getElementById(id);

function init(){
  initTabs();
  initMotorSelects();
  initConduitSelect();
  initCableSelect();
  initTariffSelect();
  initTerminalBlockSelect();
  $('inputMode').addEventListener('change', updateInputMode);
  $('loadType')?.addEventListener('change', updateLoadType);
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
  $('inputMode').value = 'kwDirect';
}

function updateLoadType(){
  const loadType = $('loadType')?.value || 'general';
  if(loadType === 'general' && $('inputMode').value === 'hpSelect') $('inputMode').value = 'kwDirect';
  if(loadType === 'general'){
    if(!$('pf').value) $('pf').value = '0.90';
    $('eff').value = '1.00';
    $('eff').readOnly = true;
  }else{
    if(Number($('eff').value) >= 1) $('eff').value = '0.85';
    $('eff').readOnly = false;
  }
  renderInputMode();
}

function updateInputMode(){
  if($('inputMode').value === 'hpSelect') $('loadType').value = 'motor';
  updateLoadType();
}

function renderInputMode(){
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

function calcCurrent(kw, phase, pf, eff, loadType){
  const appliedEff = loadType === 'motor' ? eff : 1;
  if(phase === 'three') return kw * 1000 / (Math.sqrt(3) * 380 * pf * appliedEff);
  return kw * 1000 / (220 * pf * appliedEff);
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
    const loadType = $('loadType')?.value || 'general';
    const pf = parseFloat($('pf').value) || 0.90;
    const eff = parseFloat($('eff').value) || 0.85;
    const locationKey = $('location').value;
    const current = calcCurrent(kw, phase, pf, eff, loadType);
    const designCurrent = current; // KEC IB: 회로 설계전류
    const targetBreaker = loadType === 'motor' ? current * 1.25 : current;
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
      `부하: ${label}`,
      `부하종류: ${loadType === 'motor' ? '모터 부하' : '일반 부하'}`,
      `전원: ${voltage}`,
      `설계전류: ${current.toFixed(1)}A`,
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
        <div class="item"><div class="k">부하 용량</div><div class="v">${label}</div></div>
        <div class="item"><div class="k">부하 종류</div><div class="v">${loadType === 'motor' ? '모터 부하' : '일반 부하'}</div></div>
        <div class="item"><div class="k">전원</div><div class="v">${voltage}</div></div>
        <div class="item"><div class="k">설계전류 IB</div><div class="v">${current.toFixed(1)} A</div></div>
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
      <div class="basis">※ 일반 부하는 IB 이상에서 표준 정격을 선택하고, 모터 부하는 기동·연속운전 여유를 위해 IB×125% 이상에서 표준 정격을 선택했습니다. 실제 적용 전 기동방식, EOCR/과부하계전기, 전압강하, 차단용량, 포설조건을 확인하세요.</div>
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
  $('inputMode').value='kwDirect';
  $('hpSelect').value='3';
  $('kwSelect').value='2.2';
  $('kwDirect').value='';
  $('location').value='indoorHidden';
  $('loadType').value='general';
  $('pf').value='0.90';
  $('eff').value='1.00';
  updateLoadType();
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

// ===== Ver3.1 simplified power-saving module =====
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

function updateSavingMode(){
  const type = $('savingType')?.value || 'time';
  $('timeSavingBox')?.classList.toggle('hidden', type !== 'time');
  $('powerSavingBox')?.classList.toggle('hidden', type !== 'power');
}

function updateTariffInputs(){
  if(!$('tariffType')) return;
  const tariff = getTariff();
  const month = Number($('tariffMonth')?.value || new Date().getMonth()+1);
  const season = getSeasonFromMonth(month);
  if($('tariffSeason')) $('tariffSeason').value = season;
  if($('seasonView')) $('seasonView').value = getSeasonFullLabel(season);
  if($('basicRate')) $('basicRate').value = tariff?.basic || 0;

  const guide = getTouTimeGuide(season);
  const rateText = tariff?.type === 'tou'
    ? `선택 계약종별은 시간대별 단가 적용\n${guide.light}\n${guide.mid}\n${guide.peak}`
    : `선택 계약종별은 전체시간 단가 적용\n${getSeasonFullLabel(season)} 전력량요금 단가로 계산`;
  if($('touTimeInfo')) $('touTimeInfo').value = rateText;
  updateSavingMode();
}

function getTouRates(tariff, season){
  if(tariff.type === 'tou') return tariff.energy[season];
  const flat = tariff.energy[season] || 0;
  return {light:flat, mid:flat, peak:flat};
}

function calcByTouHours(kw, days, hours, rates){
  const lightKwh = kw * (hours.light || 0) * days;
  const midKwh = kw * (hours.mid || 0) * days;
  const peakKwh = kw * (hours.peak || 0) * days;
  const kwh = lightKwh + midKwh + peakKwh;
  const energyCharge = lightKwh*rates.light + midKwh*rates.mid + peakKwh*rates.peak;
  return {lightKwh, midKwh, peakKwh, kwh, energyCharge};
}

function calcVariableTotal(energyCharge, kwh, climateRate, fuelRate){
  const climate = kwh * climateRate;
  const fuel = kwh * fuelRate;
  const subtotal = energyCharge + climate + fuel;
  const vat = Math.round(subtotal * 0.10);
  const fund = Math.floor((subtotal * 0.027) / 10) * 10;
  return {climate, fuel, subtotal, vat, fund, total:subtotal + vat + fund};
}

function validateHours(hours, label){
  const total = (hours.light || 0) + (hours.mid || 0) + (hours.peak || 0);
  if(total > 24.0001) throw new Error(`${label}의 경·중·최대부하 운전시간 합계가 24시간을 초과합니다.`);
  return total;
}

function rateSummary(tariff, season, rates){
  if(tariff.type === 'tou') return `경부하 ${rates.light}원/kWh · 중간부하 ${rates.mid}원/kWh · 최대부하 ${rates.peak}원/kWh`;
  return `전체시간 ${rates.mid}원/kWh`;
}

function calculateEnergy(){
  try{
    updateTariffInputs();
    const tariff = getTariff();
    const season = $('tariffSeason').value;
    const rates = getTouRates(tariff, season);
    const days = getVal('energyDays');
    const contractKw = getVal('contractKw');
    const climateRate = getVal('climateRate');
    const fuelRate = getVal('fuelRate');
    const basicCharge = contractKw * (tariff.basic || 0);
    const savingType = $('savingType')?.value || 'time';

    if(days <= 0) throw new Error('월 운전일수를 입력하세요.');

    let title = '';
    let rows = '';
    let copy = [];
    let basis = '';

    if(savingType === 'time'){
      const kw = getVal('loadKwTime');
      if(kw <= 0) throw new Error('부하용량(kW)을 입력하세요.');

      const oldHours = {light:getVal('oldLightHours'), mid:getVal('oldMidHours'), peak:getVal('oldPeakHours')};
      const newHours = {light:getVal('newLightHours'), mid:getVal('newMidHours'), peak:getVal('newPeakHours')};
      validateHours(oldHours, '기존 운전시간');
      validateHours(newHours, '변경 운전시간');

      const before = calcByTouHours(kw, days, oldHours, rates);
      const after = calcByTouHours(kw, days, newHours, rates);
      const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
      const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
      const saveKwh = before.kwh - after.kwh;
      const saveMoney = beforeFee.total - afterFee.total;
      const saveRate = before.kwh > 0 ? saveKwh / before.kwh * 100 : 0;

      title = '운전시간 개선 절감효과';
      rows = `
        <div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}<br>기후환경 ${climateRate}원/kWh · 연료비조정 ${fuelRate}원/kWh 자동 적용</div></div>
        <div class="item"><div class="k">부하용량</div><div class="v">${num(kw,3)} kW</div></div>
        <div class="item"><div class="k">기본요금 참고</div><div class="v">${won(basicCharge)}</div></div>
        <div class="item"><div class="k">기존 월 사용량</div><div class="v">${num(before.kwh)} kWh</div></div>
        <div class="item"><div class="k">변경 월 사용량</div><div class="v">${num(after.kwh)} kWh</div></div>
        <div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saveKwh)} kWh</div></div>
        <div class="item"><div class="k">연 절감전력량</div><div class="v">${num(saveKwh*12)} kWh</div></div>
        <div class="item"><div class="k">절감률</div><div class="v">${num(saveRate,1)}%</div></div>
        <div class="item"><div class="k">월 절감금액</div><div class="v">${won(saveMoney)}</div></div>
        <div class="item"><div class="k">연 절감금액</div><div class="v">${won(saveMoney*12)}</div></div>
        <div class="item full"><div class="k">기존 시간대별 사용량</div><div class="v">경 ${num(before.lightKwh)}kWh · 중 ${num(before.midKwh)}kWh · 최 ${num(before.peakKwh)}kWh</div></div>
        <div class="item full"><div class="k">변경 시간대별 사용량</div><div class="v">경 ${num(after.lightKwh)}kWh · 중 ${num(after.midKwh)}kWh · 최 ${num(after.peakKwh)}kWh</div></div>
      `;
      basis = '운전시간 개선: 기존 사용량=부하용량×기존 시간대별 운전시간×월 운전일수, 변경 사용량=부하용량×변경 시간대별 운전시간×월 운전일수, 절감량=기존-변경. 기본요금은 동일하다고 보고 절감금액에는 전력량요금·기후환경요금·연료비조정요금·부가세·전력산업기반기금의 변동분만 반영했습니다.';
      copy = ['■ 운전시간 개선 절감효과', `계약종별: ${tariff.label}`, `부하용량: ${num(kw,3)}kW`, `월 절감전력량: ${num(saveKwh)}kWh`, `연 절감전력량: ${num(saveKwh*12)}kWh`, `월 절감금액: ${won(saveMoney)}`, `연 절감금액: ${won(saveMoney*12)}`];
    }else{
      const beforeKw = getVal('beforeKw');
      const afterKw = getVal('afterKw');
      if(beforeKw <= 0) throw new Error('기존전력(kW)을 입력하세요.');
      if(afterKw < 0) throw new Error('개선후 전력(kW)을 입력하세요.');
      if(afterKw > beforeKw) throw new Error('개선후 전력이 기존전력보다 큽니다. 입력값을 확인하세요.');

      const hours = {light:getVal('saveLightHours'), mid:getVal('saveMidHours'), peak:getVal('savePeakHours')};
      validateHours(hours, '운전시간');
      const before = calcByTouHours(beforeKw, days, hours, rates);
      const after = calcByTouHours(afterKw, days, hours, rates);
      const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
      const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
      const saveKw = beforeKw - afterKw;
      const saveKwh = before.kwh - after.kwh;
      const saveMoney = beforeFee.total - afterFee.total;
      const saveRate = saveKw / beforeKw * 100;

      title = '전력량 절감효과';
      rows = `
        <div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}<br>기후환경 ${climateRate}원/kWh · 연료비조정 ${fuelRate}원/kWh 자동 적용</div></div>
        <div class="item"><div class="k">기존전력</div><div class="v">${num(beforeKw,3)} kW</div></div>
        <div class="item"><div class="k">개선후 전력</div><div class="v">${num(afterKw,3)} kW</div></div>
        <div class="item"><div class="k">절감전력</div><div class="v">${num(saveKw,3)} kW</div></div>
        <div class="item"><div class="k">절감률</div><div class="v">${num(saveRate,1)}%</div></div>
        <div class="item"><div class="k">기존 월 사용량</div><div class="v">${num(before.kwh)} kWh</div></div>
        <div class="item"><div class="k">개선 월 사용량</div><div class="v">${num(after.kwh)} kWh</div></div>
        <div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saveKwh)} kWh</div></div>
        <div class="item"><div class="k">연 절감전력량</div><div class="v">${num(saveKwh*12)} kWh</div></div>
        <div class="item"><div class="k">월 절감금액</div><div class="v">${won(saveMoney)}</div></div>
        <div class="item"><div class="k">연 절감금액</div><div class="v">${won(saveMoney*12)}</div></div>
        <div class="item full"><div class="k">시간대별 운전</div><div class="v">경 ${num(hours.light,1)}h/일 · 중 ${num(hours.mid,1)}h/일 · 최 ${num(hours.peak,1)}h/일</div></div>
      `;
      basis = '전력량 절감: 절감전력=기존전력-개선후전력, 절감전력량=절감전력×시간대별 운전시간×월 운전일수. 기본요금은 동일하다고 보고 절감금액에는 전력량요금·기후환경요금·연료비조정요금·부가세·전력산업기반기금의 변동분만 반영했습니다.';
      copy = ['■ 전력량 절감효과', `계약종별: ${tariff.label}`, `절감전력: ${num(saveKw,3)}kW`, `월 절감전력량: ${num(saveKwh)}kWh`, `연 절감전력량: ${num(saveKwh*12)}kWh`, `월 절감금액: ${won(saveMoney)}`, `연 절감금액: ${won(saveMoney*12)}`];
    }

    $('energyResult').innerHTML = `
      <h3>${title}</h3>
      <div class="resultGrid">${rows}</div>
      <div class="basis">${basis}</div>
      <button class="copyBtn" data-copy="${escapeHtml(copy.join('\n'))}">결과 복사하기</button>
    `;
    $('energyResult').classList.remove('hidden');
    bindCopyButtons();
  }catch(e){
    showEnergyError(e.message);
  }
}

function resetEnergy(){
  if($('tariffType')) $('tariffType').value = 'industrial_b_highA_1';
  if($('tariffMonth')) $('tariffMonth').value = String(new Date().getMonth()+1);
  if($('savingType')) $('savingType').value = 'time';
  ['contractKw','loadKwTime','beforeKw','afterKw'].forEach(id=>{ if($(id)) $(id).value=''; });
  if($('energyDays')) $('energyDays').value = '30';
  ['oldLightHours','oldMidHours','oldPeakHours','newLightHours','newMidHours','newPeakHours','saveLightHours','saveMidHours','savePeakHours'].forEach(id=>{ if($(id)) $(id).value='0'; });
  if($('climateRate')) $('climateRate').value = '9';
  if($('fuelRate')) $('fuelRate').value = '5';
  updateTariffInputs();
  $('energyResult').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  if($('tariffMonth')) $('tariffMonth').value = String(new Date().getMonth()+1);
  ['tariffMonth','tariffType','savingType','energyDays','contractKw','loadKwTime','oldLightHours','oldMidHours','oldPeakHours','newLightHours','newMidHours','newPeakHours','beforeKw','afterKw','saveLightHours','saveMidHours','savePeakHours'].forEach(id=>{
    const el = $(id);
    if(el) el.addEventListener('input', updateTariffInputs);
    if(el) el.addEventListener('change', updateTariffInputs);
  });
  updateTariffInputs();
});
