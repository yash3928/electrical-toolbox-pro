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
  initIssues();
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

function timeToHour(value){
  if(!value) return null;
  const parts = String(value).split(':').map(Number);
  if(parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return parts[0] + parts[1] / 60;
}

function makeSegments(start, end){
  if(start === null || end === null) return [];
  if(Math.abs(start - end) < 0.0001) return [{start:0, end:24}];
  if(end > start) return [{start, end}];
  return [{start, end:24}, {start:0, end}];
}

function overlapHours(aStart, aEnd, bStart, bEnd){
  const start = Math.max(aStart, bStart);
  const end = Math.min(aEnd, bEnd);
  return Math.max(0, end - start);
}

function touPeriods(season){
  if(season === 'winter'){
    return {
      light:[[22,24],[0,8]],
      mid:[[8,9],[12,16],[19,22]],
      peak:[[9,12],[16,19]]
    };
  }
  return {
    light:[[22,24],[0,8]],
    mid:[[8,15],[21,22]],
    peak:[[15,21]]
  };
}

function classifyTimeRange(startValue, endValue, season){
  const start = timeToHour(startValue);
  const end = timeToHour(endValue);
  if(start === null || end === null) return null;
  const segments = makeSegments(start, end);
  const periods = touPeriods(season);
  const result = {light:0, mid:0, peak:0};
  for(const seg of segments){
    for(const key of ['light','mid','peak']){
      for(const [pStart, pEnd] of periods[key]){
        result[key] += overlapHours(seg.start, seg.end, pStart, pEnd);
      }
    }
  }
  result.light = Math.round(result.light * 10) / 10;
  result.mid = Math.round(result.mid * 10) / 10;
  result.peak = Math.round(result.peak * 10) / 10;
  return result;
}

function setHourInputs(prefix, hours){
  if(!hours) return;
  const map = prefix === 'old'
    ? {light:'oldLightHours', mid:'oldMidHours', peak:'oldPeakHours'}
    : prefix === 'new'
      ? {light:'newLightHours', mid:'newMidHours', peak:'newPeakHours'}
      : {light:'saveLightHours', mid:'saveMidHours', peak:'savePeakHours'};
  if($(map.light)) $(map.light).value = hours.light;
  if($(map.mid)) $(map.mid).value = hours.mid;
  if($(map.peak)) $(map.peak).value = hours.peak;
}

function applyTimeRangeInputs(){
  const season = getSeasonFromMonth(Number($('tariffMonth')?.value || new Date().getMonth()+1));
  const oldHours = classifyTimeRange($('oldStartTime')?.value, $('oldEndTime')?.value, season);
  const newHours = classifyTimeRange($('newStartTime')?.value, $('newEndTime')?.value, season);
  const saveHours = classifyTimeRange($('saveStartTime')?.value, $('saveEndTime')?.value, season);
  setHourInputs('old', oldHours);
  setHourInputs('new', newHours);
  setHourInputs('save', saveHours);
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


function rangeText(label, startId, endId, season){
  const start = $(startId)?.value;
  const end = $(endId)?.value;
  const h = classifyTimeRange(start, end, season);
  if(!h) return '';
  return `${label} ${start}~${end} → 경 ${h.light}h/일 · 중 ${h.mid}h/일 · 최 ${h.peak}h/일`;
}

function buildRangeNote(season){
  const lines = [
    rangeText('기존', 'oldStartTime', 'oldEndTime', season),
    rangeText('변경', 'newStartTime', 'newEndTime', season),
    rangeText('운전', 'saveStartTime', 'saveEndTime', season)
  ].filter(Boolean);
  return lines.length ? `\n\n시간 범위 자동분류\n${lines.join('\n')}` : '';
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

// ===== Ver3.3 power-saving module with time-range input =====
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


function rangeText(label, startId, endId, season){
  const start = $(startId)?.value;
  const end = $(endId)?.value;
  const h = classifyTimeRange(start, end, season);
  if(!h) return '';
  return `${label} ${start}~${end} → 경 ${h.light}h/일 · 중 ${h.mid}h/일 · 최 ${h.peak}h/일`;
}

function buildRangeNote(season){
  const lines = [
    rangeText('기존', 'oldStartTime', 'oldEndTime', season),
    rangeText('변경', 'newStartTime', 'newEndTime', season),
    rangeText('운전', 'saveStartTime', 'saveEndTime', season)
  ].filter(Boolean);
  return lines.length ? `\n\n시간 범위 자동분류\n${lines.join('\n')}` : '';
}

function updateTariffInputs(){
  if(!$('tariffType')) return;
  const tariff = getTariff();
  const month = Number($('tariffMonth')?.value || new Date().getMonth()+1);
  const season = getSeasonFromMonth(month);
  if($('tariffSeason')) $('tariffSeason').value = season;
  if($('seasonView')) $('seasonView').value = getSeasonFullLabel(season);
  if($('basicRate')) $('basicRate').value = tariff?.basic || 0;

  applyTimeRangeInputs();
  const guide = getTouTimeGuide(season);
  const rangeNote = buildRangeNote(season);
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
    applyTimeRangeInputs();
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
        <div class="item full"><div class="k">시간 범위 참고</div><div class="v">${rangeText('기존', 'oldStartTime', 'oldEndTime', season) || '기존: 수동 시간 입력'}<br>${rangeText('변경', 'newStartTime', 'newEndTime', season) || '변경: 수동 시간 입력'}</div></div>
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
        <div class="item full"><div class="k">시간 범위 참고</div><div class="v">${rangeText('운전', 'saveStartTime', 'saveEndTime', season) || '수동 시간 입력'}</div></div>
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
  ['oldStartTime','oldEndTime','newStartTime','newEndTime','saveStartTime','saveEndTime'].forEach(id=>{ if($(id)) $(id).value=''; });
  if($('climateRate')) $('climateRate').value = '9';
  if($('fuelRate')) $('fuelRate').value = '5';
  updateTariffInputs();
  $('energyResult').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  if($('tariffMonth')) $('tariffMonth').value = String(new Date().getMonth()+1);
  ['tariffMonth','tariffType','savingType','energyDays','contractKw','loadKwTime','oldStartTime','oldEndTime','newStartTime','newEndTime','oldLightHours','oldMidHours','oldPeakHours','newLightHours','newMidHours','newPeakHours','beforeKw','afterKw','saveStartTime','saveEndTime','saveLightHours','saveMidHours','savePeakHours'].forEach(id=>{
    const el = $(id);
    if(el) el.addEventListener('input', updateTariffInputs);
    if(el) el.addEventListener('change', updateTariffInputs);
  });
  updateTariffInputs();
});

/* =========================
   기흥레스피아 전기설비 특이사항
   - Google Apps Script URL이 있으면 공유 저장
   - URL이 없으면 현재 기기(localStorage)에 임시 저장
========================= */
const ISSUE_LOCAL_KEY = 'etp_giheung_issues_v1';
const ISSUE_API_KEY = 'etp_issue_api_url';
let issueJsonpSeq = 0;

function initIssues(){
  if(!$('issueList')) return;
  const savedUrl = localStorage.getItem(ISSUE_API_KEY) || '';
  $('issueApiUrl').value = savedUrl;
  $('issueSaveApiBtn').addEventListener('click', saveIssueApiUrl);
  $('issueAddBtn').addEventListener('click', addIssue);
  $('issueReloadBtn').addEventListener('click', loadIssues);
  loadIssues();
}

function saveIssueApiUrl(){
  const url = ($('issueApiUrl').value || '').trim();
  localStorage.setItem(ISSUE_API_KEY, url);
  toast(url ? 'Google Sheets 연동 URL 저장 완료' : '연동 URL을 비웠습니다. 현재 기기 저장 모드로 전환됩니다.');
  loadIssues();
}

function getIssueApiUrl(){
  return (localStorage.getItem(ISSUE_API_KEY) || $('issueApiUrl')?.value || '').trim();
}

function issueJsonp(params){
  const base = getIssueApiUrl();
  if(!base) return Promise.reject(new Error('NO_API_URL'));
  return new Promise((resolve, reject)=>{
    const callback = `__etpIssueCallback_${Date.now()}_${issueJsonpSeq++}`;
    const qs = new URLSearchParams({...params, callback, _: Date.now()});
    const script = document.createElement('script');
    const sep = base.includes('?') ? '&' : '?';
    script.src = base + sep + qs.toString();
    const timer = setTimeout(()=>{
      cleanup();
      reject(new Error('Google Sheets 응답 시간 초과'));
    }, 12000);
    function cleanup(){
      clearTimeout(timer);
      script.remove();
      try{ delete window[callback]; }catch(e){ window[callback] = undefined; }
    }
    window[callback] = (data)=>{
      cleanup();
      if(data && data.ok) resolve(data);
      else reject(new Error(data?.error || 'Google Sheets 처리 실패'));
    };
    script.onerror = ()=>{
      cleanup();
      reject(new Error('Google Apps Script URL을 확인하세요.'));
    };
    document.body.appendChild(script);
  });
}

function getLocalIssues(){
  try{ return JSON.parse(localStorage.getItem(ISSUE_LOCAL_KEY) || '[]'); }
  catch(e){ return []; }
}

function setLocalIssues(list){
  localStorage.setItem(ISSUE_LOCAL_KEY, JSON.stringify(list));
}

function issuePayloadFromForm(){
  const equipment = ($('issueEquipment').value || '').trim();
  const location = ($('issueLocation').value || '').trim();
  const reporter = ($('issueReporter').value || '').trim();
  const status = $('issueStatus').value;
  const content = ($('issueContent').value || '').trim();
  const action = ($('issueAction').value || '').trim();
  if(!equipment) throw new Error('설비명을 입력하세요.');
  if(!content) throw new Error('특이사항을 입력하세요.');
  return {equipment, location, reporter, status, content, action};
}

async function addIssue(){
  try{
    const item = issuePayloadFromForm();
    if(getIssueApiUrl()){
      await issueJsonp({action:'add', ...item});
    }else{
      const list = getLocalIssues();
      list.unshift({id:String(Date.now()), createdAt:new Date().toLocaleString('ko-KR'), updatedAt:'', ...item});
      setLocalIssues(list);
    }
    ['issueEquipment','issueLocation','issueContent','issueAction'].forEach(id=>$(id).value='');
    $('issueStatus').value = '미조치';
    toast('특이사항 등록 완료');
    loadIssues();
  }catch(e){ toast(e.message); }
}

async function loadIssues(){
  if(!$('issueList')) return;
  $('issueList').innerHTML = '<div class="muted">불러오는 중...</div>';
  try{
    let list;
    if(getIssueApiUrl()){
      const data = await issueJsonp({action:'list'});
      list = data.items || [];
    }else{
      list = getLocalIssues();
    }
    renderIssues(list);
  }catch(e){
    $('issueList').innerHTML = `<div class="item full error">${escapeHtml(e.message)}<br>연동 URL이 불안정하면 URL을 비우고 현재 기기 저장 모드로 테스트하세요.</div>`;
  }
}

function statusClass(status){
  if(status === '조치완료') return 'done';
  if(status === '조치중') return 'working';
  return 'open';
}

function renderIssues(list){
  const active = list.filter(x=>x.status !== '조치완료');
  const counts = {
    total:list.length,
    open:list.filter(x=>x.status === '미조치').length,
    working:list.filter(x=>x.status === '조치중').length,
    done:list.filter(x=>x.status === '조치완료').length
  };
  $('issueSummary').innerHTML = `
    <div class="issueStat"><span>전체</span><b>${counts.total}</b></div>
    <div class="issueStat"><span>미조치</span><b>${counts.open}</b></div>
    <div class="issueStat"><span>조치중</span><b>${counts.working}</b></div>
    <div class="issueStat"><span>완료</span><b>${counts.done}</b></div>
  `;
  const show = active.length ? active : list;
  if(!show.length){
    $('issueList').innerHTML = '<div class="muted">등록된 특이사항이 없습니다.</div>';
    return;
  }
  $('issueList').innerHTML = show.map(item=>`
    <article class="issueCard">
      <div class="issueTop">
        <div>
          <div class="issueTitle">${escapeHtml(item.equipment || '-')}</div>
          <div class="issueMeta">${escapeHtml(item.location || '위치 미입력')} · 등록자 ${escapeHtml(item.reporter || '-')} · ${escapeHtml(item.createdAt || '')}</div>
        </div>
        <span class="issueBadge ${statusClass(item.status)}">${escapeHtml(item.status || '미조치')}</span>
      </div>
      <div class="issueContent"><b>특이사항</b><br>${escapeHtml(item.content || '')}</div>
      ${item.action ? `<div class="issueContent"><b>조치내용</b><br>${escapeHtml(item.action || '')}</div>` : ''}
      <div class="issueActions">
        <button class="issueWorking" onclick="updateIssueStatus('${escapeHtml(String(item.id))}','조치중')">조치중</button>
        <button class="issueDone" onclick="updateIssueStatus('${escapeHtml(String(item.id))}','조치완료')">조치완료</button>
        <button class="issueDelete" onclick="deleteIssue('${escapeHtml(String(item.id))}')">삭제</button>
      </div>
    </article>
  `).join('');
}

async function updateIssueStatus(id, status){
  try{
    if(getIssueApiUrl()){
      await issueJsonp({action:'status', id, status});
    }else{
      const list = getLocalIssues().map(x=>x.id===id ? {...x, status, updatedAt:new Date().toLocaleString('ko-KR')} : x);
      setLocalIssues(list);
    }
    toast('상태 변경 완료');
    loadIssues();
  }catch(e){ toast(e.message); }
}

async function deleteIssue(id){
  if(!confirm('이 특이사항을 삭제할까요?')) return;
  try{
    if(getIssueApiUrl()){
      await issueJsonp({action:'delete', id});
    }else{
      setLocalIssues(getLocalIssues().filter(x=>x.id!==id));
    }
    toast('삭제 완료');
    loadIssues();
  }catch(e){ toast(e.message); }
}
