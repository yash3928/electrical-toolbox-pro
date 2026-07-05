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
        <div class="item full">
          <div class="k">IB · In · Iz 의미</div>
          <div class="kecGlossary">
            <div><b>IB</b><span>설계전류<br><em>${designCurrent.toFixed(1)}A</em></span></div>
            <div><b>In</b><span>차단기 정격전류<br><em>${at}A</em></span></div>
            <div><b>Iz</b><span>전선 허용전류<br><em>${cable.iz}A</em></span></div>
          </div>
        </div>
      </div>
      <div class="basis">※ KEC 검토는 회로 설계전류(IB), 보호장치 정격전류(In), 전선 허용전류(Iz)의 관계를 우선 확인합니다. 일반 부하는 IB 이상에서 표준 정격을 선택하고, 모터 부하는 기동·연속운전 여유를 위해 IB×125% 이상에서 표준 정격을 선택했습니다. 실제 적용 전 기동방식, EOCR/과부하계전기, 전압강하, 차단용량, 포설조건을 확인하세요.</div>
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

/* Ver 4.3 overrides: 복수 시간범위 입력, 인버터 Hz 부하 산정, 케이블 접속목적 제거 */
function parseTimeRanges(text){
  if(!text) return [];
  return String(text)
    .replace(/~/g,'-').replace(/–|—/g,'-')
    .split(/[,;\n]+/)
    .map(s=>s.trim())
    .filter(Boolean)
    .map(part=>{
      const m = part.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
      if(!m) throw new Error(`시간 범위 형식이 올바르지 않습니다: ${part}`);
      return {start:m[1], end:m[2], raw:part};
    });
}

function classifyTimeRangesText(text, season){
  const ranges = parseTimeRanges(text);
  const total = {light:0, mid:0, peak:0};
  for(const r of ranges){
    const h = classifyTimeRange(r.start, r.end, season);
    if(h){ total.light += h.light; total.mid += h.mid; total.peak += h.peak; }
  }
  total.light = Math.round(total.light * 10) / 10;
  total.mid = Math.round(total.mid * 10) / 10;
  total.peak = Math.round(total.peak * 10) / 10;
  return total;
}

function setHoursFromText(prefix, text, season){
  const h = classifyTimeRangesText(text, season);
  setHourInputs(prefix, h);
  return h;
}

function formatRangeBreakdown(label, text, season){
  if(!text) return `${label}: 입력 없음`;
  const h = classifyTimeRangesText(text, season);
  return `${label} ${text} → 경 ${num(h.light,1)}h/일 · 중 ${num(h.mid,1)}h/일 · 최 ${num(h.peak,1)}h/일`;
}

function applyTimeRangeInputs(){
  const season = getSeasonFromMonth(Number($('tariffMonth')?.value || new Date().getMonth()+1));
  if($('oldRunRanges')) setHoursFromText('old', $('oldRunRanges').value, season);
  if($('newRunRanges')) setHoursFromText('new', $('newRunRanges').value, season);
  if($('saveRunRanges')) setHoursFromText('save', $('saveRunRanges').value, season);
}

function calcInverterKw(){
  if(!$('inverterMode')?.checked) return null;
  const baseKw = getVal('invBaseKw');
  const baseHz = getVal('invBaseHz') || 60;
  const runHz = getVal('invRunHz');
  const exp = Number($('invExponent')?.value || 3);
  if(baseKw <= 0) throw new Error('인버터 기준 부하(kW)를 입력하세요.');
  if(baseHz <= 0) throw new Error('인버터 기준 주파수(Hz)를 입력하세요.');
  if(runHz < 0) throw new Error('운전 주파수(Hz)를 확인하세요.');
  return baseKw * Math.pow(runHz / baseHz, exp);
}

function updateInverterUi(){
  const on = !!$('inverterMode')?.checked;
  document.querySelectorAll('.inverter-field').forEach(el=>el.classList.toggle('hidden', !on));
  if(on && $('invBaseKw') && $('loadKwTime') && !$('invBaseKw').value && $('loadKwTime').value) $('invBaseKw').value = $('loadKwTime').value;
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
  updateSavingMode();
  const guide = getTouTimeGuide(season);
  if($('touTimeInfo')) $('touTimeInfo').value = `${getSeasonFullLabel(season)} 시간대 기준\n${guide.light}\n${guide.mid}\n${guide.peak}\n\n가동 시간은 08:00-11:00, 13:00-15:00처럼 여러 구간 입력 가능`;
}

function recommendCable(){
  const typeKey = $('cableType').value;
  const sq = parseFloat($('cableSq').value);
  const typeInfo = CABLE_TYPE_INFO[typeKey];
  const data = CABLE_ACCESSORY_DB.find(c=>Number(c.sq) === Number(sq));
  if(!data){ toast('케이블 굵기 데이터를 찾을 수 없습니다.'); return; }
  const cableName = `${typeInfo.label} × ${sq}SQ`;
  const terminalText = formatTerminal(data);
  const copyText = [`■ 케이블 터미널 추천`,`케이블: ${cableName}`,`추천 터미널: ${terminalText}`,`기준: 국내 표준 자재 규격 대표값`].join('\n');
  $('cableResult').innerHTML = `
    <h3>케이블 터미널 추천</h3>
    <div class="resultGrid">
      <div class="item"><div class="k">케이블</div><div class="v">${cableName}</div></div>
      <div class="item full"><div class="k">추천 터미널</div><div class="v strong">${terminalText}</div></div>
      <div class="item full"><div class="k">기준</div><div class="v">국내 표준 자재 규격 대표값</div></div>
    </div>
    <div class="basis">※ 접속 목적 선택은 제거했습니다. 터미널은 전선 SQ와 접속기기 구멍 지름이 핵심이며, 프로그램은 혼동 방지를 위해 국내 실무에서 많이 쓰는 대표값 1개만 표시합니다.</div>
    <button class="copyBtn" data-copy="${escapeHtml(copyText)}">결과 복사하기</button>`;
  $('cableResult').classList.remove('hidden');
  bindCopyButtons();
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
    let title='', rows='', copy=[], basis='';
    if(savingType === 'time'){
      let kw = calcInverterKw();
      const inverterNote = kw !== null ? `인버터 산정 부하 ${num(kw,3)}kW = 기준 ${num(getVal('invBaseKw'),3)}kW × (${num(getVal('invRunHz'),1)}Hz/${num(getVal('invBaseHz')||60,1)}Hz)^${$('invExponent')?.value || 3}` : '';
      if(kw === null) kw = getVal('loadKwTime');
      if(kw <= 0) throw new Error('부하용량(kW)을 입력하세요.');
      const oldText = $('oldRunRanges')?.value || '';
      const newText = $('newRunRanges')?.value || '';
      if(!oldText) throw new Error('기존 가동 시간을 입력하세요. 예: 08:00-11:00, 13:00-15:00');
      if(!newText) throw new Error('변경 가동 시간을 입력하세요.');
      const oldHours = classifyTimeRangesText(oldText, season);
      const newHours = classifyTimeRangesText(newText, season);
      validateHours(oldHours, '기존 가동 시간'); validateHours(newHours, '변경 가동 시간');
      const before = calcByTouHours(kw, days, oldHours, rates);
      const after = calcByTouHours(kw, days, newHours, rates);
      const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
      const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
      const saveKwh = before.kwh - after.kwh;
      const saveMoney = beforeFee.total - afterFee.total;
      const saveRate = before.kwh > 0 ? saveKwh / before.kwh * 100 : 0;
      title='운전시간 개선 절감효과';
      rows = `
        <div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}</div></div>
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
        <div class="item full"><div class="k">가동 시간 자동분류</div><div class="v">${formatRangeBreakdown('기존', oldText, season)}<br>${formatRangeBreakdown('변경', newText, season)}</div></div>
        ${$('oldStopRanges')?.value || $('newStopRanges')?.value ? `<div class="item full"><div class="k">정지 시간 참고</div><div class="v">기존: ${$('oldStopRanges')?.value || '-'}<br>변경: ${$('newStopRanges')?.value || '-'}</div></div>` : ''}
        ${inverterNote ? `<div class="item full"><div class="k">인버터 부하 산정</div><div class="v">${inverterNote}</div></div>` : ''}`;
      basis = '운전시간 개선: 입력한 복수 가동 시간 범위를 계절별 경부하·중간부하·최대부하로 자동 배분한 뒤, 부하용량×시간×월 운전일수로 사용량을 산정합니다.';
      copy = ['■ 운전시간 개선 절감효과',`계약종별: ${tariff.label}`,`부하용량: ${num(kw,3)}kW`,`월 절감전력량: ${num(saveKwh)}kWh`,`연 절감전력량: ${num(saveKwh*12)}kWh`,`월 절감금액: ${won(saveMoney)}`,`연 절감금액: ${won(saveMoney*12)}`];
    } else {
      const beforeKw = getVal('beforeKw'), afterKw = getVal('afterKw');
      if(beforeKw <= 0) throw new Error('기존전력(kW)을 입력하세요.');
      if(afterKw < 0) throw new Error('개선후 전력(kW)을 입력하세요.');
      if(afterKw > beforeKw) throw new Error('개선후 전력이 기존전력보다 큽니다.');
      const runText = $('saveRunRanges')?.value || '';
      if(!runText) throw new Error('가동 시간을 입력하세요. 예: 08:00-11:00, 13:00-15:00');
      const hours = classifyTimeRangesText(runText, season);
      validateHours(hours, '가동 시간');
      const before = calcByTouHours(beforeKw, days, hours, rates);
      const after = calcByTouHours(afterKw, days, hours, rates);
      const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
      const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
      const saveKw = beforeKw - afterKw, saveKwh = before.kwh - after.kwh, saveMoney = beforeFee.total - afterFee.total, saveRate = saveKw / beforeKw * 100;
      title='전력량 절감효과';
      rows = `
        <div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}</div></div>
        <div class="item"><div class="k">기존전력</div><div class="v">${num(beforeKw,3)} kW</div></div>
        <div class="item"><div class="k">개선후 전력</div><div class="v">${num(afterKw,3)} kW</div></div>
        <div class="item"><div class="k">절감전력</div><div class="v">${num(saveKw,3)} kW</div></div>
        <div class="item"><div class="k">절감률</div><div class="v">${num(saveRate,1)}%</div></div>
        <div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saveKwh)} kWh</div></div>
        <div class="item"><div class="k">연 절감전력량</div><div class="v">${num(saveKwh*12)} kWh</div></div>
        <div class="item"><div class="k">월 절감금액</div><div class="v">${won(saveMoney)}</div></div>
        <div class="item"><div class="k">연 절감금액</div><div class="v">${won(saveMoney*12)}</div></div>
        <div class="item full"><div class="k">가동 시간 자동분류</div><div class="v">${formatRangeBreakdown('가동', runText, season)}</div></div>`;
      basis='전력량 절감: 기존전력과 개선후 전력 차이를 시간대별 가동 시간에 적용해 절감전력량과 절감금액을 계산합니다.';
      copy=['■ 전력량 절감효과',`계약종별: ${tariff.label}`,`절감전력: ${num(saveKw,3)}kW`,`월 절감전력량: ${num(saveKwh)}kWh`,`연 절감전력량: ${num(saveKwh*12)}kWh`,`월 절감금액: ${won(saveMoney)}`,`연 절감금액: ${won(saveMoney*12)}`];
    }
    $('energyResult').innerHTML = `<h3>${title}</h3><div class="resultGrid">${rows}</div><div class="basis">${basis}</div><button class="copyBtn" data-copy="${escapeHtml(copy.join('\n'))}">결과 복사하기</button>`;
    $('energyResult').classList.remove('hidden'); bindCopyButtons();
  }catch(e){ showEnergyError(e.message); }
}

function resetEnergy(){
  if($('tariffType')) $('tariffType').value = 'industrial_b_highA_1';
  if($('tariffMonth')) $('tariffMonth').value = String(new Date().getMonth()+1);
  if($('savingType')) $('savingType').value = 'time';
  ['contractKw','loadKwTime','beforeKw','afterKw','oldRunRanges','newRunRanges','oldStopRanges','newStopRanges','saveRunRanges','invBaseKw','invRunHz'].forEach(id=>{ if($(id)) $(id).value=''; });
  if($('energyDays')) $('energyDays').value = '30';
  if($('invBaseHz')) $('invBaseHz').value = '60';
  if($('invExponent')) $('invExponent').value = '3';
  if($('inverterMode')) $('inverterMode').checked = false;
  ['oldLightHours','oldMidHours','oldPeakHours','newLightHours','newMidHours','newPeakHours','saveLightHours','saveMidHours','savePeakHours'].forEach(id=>{ if($(id)) $(id).value='0'; });
  updateInverterUi(); updateTariffInputs(); $('energyResult')?.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded',()=>{
  ['oldRunRanges','newRunRanges','oldStopRanges','newStopRanges','saveRunRanges','inverterMode','invBaseKw','invBaseHz','invRunHz','invExponent'].forEach(id=>{
    const el=$(id); if(el){ el.addEventListener('input', updateTariffInputs); el.addEventListener('change', ()=>{ updateInverterUi(); updateTariffInputs(); }); }
  });
  updateInverterUi();
});

/* Ver 4.4 overrides: 인버터 기능 제거, 정지시간 분 입력, 클릭형 시간범위 선택 */
function hourToClock(h){
  h = Math.round(h * 60) / 60;
  if(h >= 24) return '24:00';
  if(h < 0) h = 0;
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return String(hh).padStart(2,'0') + ':' + String(mm).padStart(2,'0');
}

function splitRangeDetails(text, season){
  const ranges = parseTimeRanges(text);
  const periods = touPeriods(season);
  const detail = {
    light:{hours:0, ranges:[]},
    mid:{hours:0, ranges:[]},
    peak:{hours:0, ranges:[]}
  };
  for(const r of ranges){
    const start = timeToHour(r.start), end = timeToHour(r.end);
    if(start === null || end === null) continue;
    const segs = makeSegments(start, end);
    for(const seg of segs){
      for(const key of ['light','mid','peak']){
        for(const [ps, pe] of periods[key]){
          const s = Math.max(seg.start, ps);
          const e = Math.min(seg.end, pe);
          if(e > s){
            detail[key].hours += e - s;
            detail[key].ranges.push(`${hourToClock(s)}~${hourToClock(e)}`);
          }
        }
      }
    }
  }
  for(const key of ['light','mid','peak']) detail[key].hours = Math.round(detail[key].hours * 10) / 10;
  return detail;
}

function formatPeriodLine(name, info){
  const list = info.ranges.length ? ` (${info.ranges.join(', ')})` : '';
  return `${name} ${num(info.hours,1)}h/일${list}`;
}

function formatRangeBreakdown(label, text, season){
  if(!text) return `${label}: 입력 없음`;
  const d = splitRangeDetails(text, season);
  return `${label}<br>${formatPeriodLine('경부하', d.light)}<br>${formatPeriodLine('중간부하', d.mid)}<br>${formatPeriodLine('최대부하', d.peak)}`;
}

function calcStopMinuteNote(){
  const oldM = getVal('oldStopMinutes');
  const newM = getVal('newStopMinutes');
  if(oldM <= 0 && newM <= 0) return '';
  const diff = newM - oldM;
  const diffText = diff === 0 ? '변동 없음' : (diff > 0 ? `정지시간 ${num(diff,0)}분/일 증가` : `정지시간 ${num(Math.abs(diff),0)}분/일 감소`);
  return `<div class="item full"><div class="k">정지 시간 참고</div><div class="v">기존: ${num(oldM,0)}분/일 · 변경: ${num(newM,0)}분/일<br>${diffText}</div></div>`;
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
    let title='', rows='', copy=[], basis='';

    if(savingType === 'time'){
      const kw = getVal('loadKwTime');
      if(kw <= 0) throw new Error('부하용량(kW)을 입력하세요.');
      const oldText = $('oldRunRanges')?.value || '';
      const newText = $('newRunRanges')?.value || '';
      if(!oldText) throw new Error('기존 가동 시간을 입력하세요. 예: 08:00-11:00, 13:00-15:00');
      if(!newText) throw new Error('변경 가동 시간을 입력하세요.');
      const oldHours = classifyTimeRangesText(oldText, season);
      const newHours = classifyTimeRangesText(newText, season);
      validateHours(oldHours, '기존 가동 시간');
      validateHours(newHours, '변경 가동 시간');
      const before = calcByTouHours(kw, days, oldHours, rates);
      const after = calcByTouHours(kw, days, newHours, rates);
      const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
      const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
      const saveKwh = before.kwh - after.kwh;
      const saveMoney = beforeFee.total - afterFee.total;
      const saveRate = before.kwh > 0 ? saveKwh / before.kwh * 100 : 0;
      title='운전시간 개선 절감효과';
      rows = `
        <div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}</div></div>
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
        <div class="item full"><div class="k">가동 시간 자동분류</div><div class="v">${formatRangeBreakdown('기존', oldText, season)}<br><br>${formatRangeBreakdown('변경', newText, season)}</div></div>
        ${calcStopMinuteNote()}`;
      basis = '운전시간 개선: 클릭 또는 직접 입력한 복수 가동 시간 범위를 계절별 경부하·중간부하·최대부하로 자동 배분한 뒤, 부하용량×시간×월 운전일수로 사용량을 산정합니다.';
      copy = ['■ 운전시간 개선 절감효과',`계약종별: ${tariff.label}`,`부하용량: ${num(kw,3)}kW`,`월 절감전력량: ${num(saveKwh)}kWh`,`연 절감전력량: ${num(saveKwh*12)}kWh`,`월 절감금액: ${won(saveMoney)}`,`연 절감금액: ${won(saveMoney*12)}`];
    } else {
      const beforeKw = getVal('beforeKw'), afterKw = getVal('afterKw');
      if(beforeKw <= 0) throw new Error('기존전력(kW)을 입력하세요.');
      if(afterKw < 0) throw new Error('개선후 전력(kW)을 입력하세요.');
      if(afterKw > beforeKw) throw new Error('개선후 전력이 기존전력보다 큽니다.');
      const runText = $('saveRunRanges')?.value || '';
      if(!runText) throw new Error('가동 시간을 입력하세요. 예: 08:00-11:00, 13:00-15:00');
      const hours = classifyTimeRangesText(runText, season);
      validateHours(hours, '가동 시간');
      const before = calcByTouHours(beforeKw, days, hours, rates);
      const after = calcByTouHours(afterKw, days, hours, rates);
      const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
      const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
      const saveKw = beforeKw - afterKw;
      const saveKwh = before.kwh - after.kwh;
      const saveMoney = beforeFee.total - afterFee.total;
      const saveRate = saveKw / beforeKw * 100;
      title='전력량 절감효과';
      rows = `
        <div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}</div></div>
        <div class="item"><div class="k">기존전력</div><div class="v">${num(beforeKw,3)} kW</div></div>
        <div class="item"><div class="k">개선후 전력</div><div class="v">${num(afterKw,3)} kW</div></div>
        <div class="item"><div class="k">절감전력</div><div class="v">${num(saveKw,3)} kW</div></div>
        <div class="item"><div class="k">절감률</div><div class="v">${num(saveRate,1)}%</div></div>
        <div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saveKwh)} kWh</div></div>
        <div class="item"><div class="k">연 절감전력량</div><div class="v">${num(saveKwh*12)} kWh</div></div>
        <div class="item"><div class="k">월 절감금액</div><div class="v">${won(saveMoney)}</div></div>
        <div class="item"><div class="k">연 절감금액</div><div class="v">${won(saveMoney*12)}</div></div>
        <div class="item full"><div class="k">가동 시간 자동분류</div><div class="v">${formatRangeBreakdown('가동', runText, season)}</div></div>`;
      basis='전력량 절감: 기존전력과 개선후 전력 차이를 시간대별 가동 시간에 적용해 절감전력량과 절감금액을 계산합니다.';
      copy=['■ 전력량 절감효과',`계약종별: ${tariff.label}`,`절감전력: ${num(saveKw,3)}kW`,`월 절감전력량: ${num(saveKwh)}kWh`,`연 절감전력량: ${num(saveKwh*12)}kWh`,`월 절감금액: ${won(saveMoney)}`,`연 절감금액: ${won(saveMoney*12)}`];
    }
    $('energyResult').innerHTML = `<h3>${title}</h3><div class="resultGrid">${rows}</div><div class="basis">${basis}</div><button class="copyBtn" data-copy="${escapeHtml(copy.join('\n'))}">결과 복사하기</button>`;
    $('energyResult').classList.remove('hidden');
    bindCopyButtons();
  }catch(e){ showEnergyError(e.message); }
}

function resetEnergy(){
  if($('tariffType')) $('tariffType').value = 'industrial_b_highA_1';
  if($('tariffMonth')) $('tariffMonth').value = String(new Date().getMonth()+1);
  if($('savingType')) $('savingType').value = 'time';
  ['contractKw','loadKwTime','beforeKw','afterKw','oldRunRanges','newRunRanges','oldStopMinutes','newStopMinutes','saveRunRanges'].forEach(id=>{ if($(id)) $(id).value=''; });
  if($('energyDays')) $('energyDays').value = '30';
  ['oldLightHours','oldMidHours','oldPeakHours','newLightHours','newMidHours','newPeakHours','saveLightHours','saveMidHours','savePeakHours'].forEach(id=>{ if($(id)) $(id).value='0'; });
  updateTariffInputs();
  $('energyResult')?.classList.add('hidden');
}

let activeTimeTarget = null;
let pickerStart = null;
function buildTimeSlotGrid(){
  const grid = $('timeSlotGrid');
  if(!grid || grid.dataset.ready) return;
  for(let m=0; m<=24*60; m+=30){
    const hh = Math.floor(m/60);
    const mm = m % 60;
    if(hh === 24 && mm > 0) continue;
    const t = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'time-slot';
    b.textContent = t;
    b.dataset.time = t;
    b.addEventListener('click', () => pickTimeSlot(t, b));
    grid.appendChild(b);
  }
  grid.dataset.ready = '1';
}
function openTimePicker(targetId){
  activeTimeTarget = targetId;
  pickerStart = null;
  buildTimeSlotGrid();
  $('timeRangePicker')?.classList.remove('hidden');
  document.querySelectorAll('.time-slot').forEach(x=>x.classList.remove('selected'));
  const label = targetId === 'oldRunRanges' ? '기존 가동 시간' : targetId === 'newRunRanges' ? '변경 가동 시간' : '가동 시간';
  if($('pickerStatus')) $('pickerStatus').textContent = `${label}: 시작 시간을 선택하세요.`;
  $('timeRangePicker')?.scrollIntoView({behavior:'smooth', block:'nearest'});
}
function appendRangeToInput(targetId, range){
  const input = $(targetId);
  if(!input) return;
  const current = input.value.trim();
  input.value = current ? `${current}, ${range}` : range;
  input.dispatchEvent(new Event('input', {bubbles:true}));
}
function pickTimeSlot(time, btn){
  if(!activeTimeTarget){
    if($('pickerStatus')) $('pickerStatus').textContent = '먼저 시간 선택 버튼을 누르세요.';
    return;
  }
  if(!pickerStart){
    pickerStart = time;
    document.querySelectorAll('.time-slot').forEach(x=>x.classList.remove('selected'));
    btn.classList.add('selected');
    if($('pickerStatus')) $('pickerStatus').textContent = `시작 ${time} 선택됨. 종료 시간을 선택하세요.`;
    return;
  }
  if(time === pickerStart){
    if($('pickerStatus')) $('pickerStatus').textContent = '시작과 종료가 같습니다. 다른 종료 시간을 선택하세요.';
    return;
  }
  const range = `${pickerStart}-${time}`;
  appendRangeToInput(activeTimeTarget, range);
  if($('pickerStatus')) $('pickerStatus').textContent = `${range} 추가됨. 계속 추가하거나 닫기를 누르세요.`;
  pickerStart = null;
  document.querySelectorAll('.time-slot').forEach(x=>x.classList.remove('selected'));
}
function initTimePicker(){
  document.querySelectorAll('.time-pick-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>openTimePicker(btn.dataset.target));
  });
  $('timePickerClose')?.addEventListener('click', ()=>$('timeRangePicker')?.classList.add('hidden'));
  $('timePickerClear')?.addEventListener('click', ()=>{
    pickerStart = null;
    document.querySelectorAll('.time-slot').forEach(x=>x.classList.remove('selected'));
    if($('pickerStatus')) $('pickerStatus').textContent = activeTimeTarget ? '시작 시간을 선택하세요.' : '입력란을 선택하세요.';
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  ['oldRunRanges','newRunRanges','oldStopMinutes','newStopMinutes','saveRunRanges'].forEach(id=>{
    const el=$(id);
    if(el){ el.addEventListener('input', updateTariffInputs); el.addEventListener('change', updateTariffInputs); }
  });
  initTimePicker();
});

/* Ver 4.5 overrides: 24시간 기본 운전, 정지시간 반영, 0h 시간대 숨김 */
function hoursTotal(h){
  return (h.light || 0) + (h.mid || 0) + (h.peak || 0);
}

function defaultFullDayText(text){
  return String(text || '').trim() || '00:00-24:00';
}

function adjustHoursByStopMinutes(hours, stopMinutes){
  const total = hoursTotal(hours);
  const stopH = Math.max(0, Number(stopMinutes || 0)) / 60;
  if(total <= 0) return {light:0, mid:0, peak:0};
  const effective = Math.max(0, total - stopH);
  const ratio = effective / total;
  return {
    light: Math.round((hours.light || 0) * ratio * 100) / 100,
    mid: Math.round((hours.mid || 0) * ratio * 100) / 100,
    peak: Math.round((hours.peak || 0) * ratio * 100) / 100
  };
}

function classifiedHoursWithStop(text, season, stopMinutes){
  const baseText = defaultFullDayText(text);
  const raw = classifyTimeRangesText(baseText, season);
  return adjustHoursByStopMinutes(raw, stopMinutes);
}

function splitRangeDetailsWithStop(text, season, stopMinutes){
  const baseText = defaultFullDayText(text);
  const d = splitRangeDetails(baseText, season);
  const adjusted = adjustHoursByStopMinutes({light:d.light.hours, mid:d.mid.hours, peak:d.peak.hours}, stopMinutes);
  d.light.hours = adjusted.light;
  d.mid.hours = adjusted.mid;
  d.peak.hours = adjusted.peak;
  d.fullDay = !String(text || '').trim();
  return d;
}

function formatPeriodLineIfAny(name, info){
  if((info.hours || 0) <= 0.0001) return '';
  const list = info.ranges && info.ranges.length ? ` (${info.ranges.join(', ')})` : '';
  return `${name} ${num(info.hours,2)}h/일${list}`;
}

function formatRangeBreakdown(label, text, season, stopMinutes=0){
  const d = splitRangeDetailsWithStop(text, season, stopMinutes);
  const lines = [
    formatPeriodLineIfAny('경부하', d.light),
    formatPeriodLineIfAny('중간부하', d.mid),
    formatPeriodLineIfAny('최대부하', d.peak)
  ].filter(Boolean);
  const defaultNote = d.fullDay ? '24시간 연속운전 기준' : '';
  const stopNote = Number(stopMinutes || 0) > 0 ? `정지 ${num(stopMinutes,0)}분/일 반영` : '';
  const note = [defaultNote, stopNote].filter(Boolean).join(' · ');
  return `${label}${note ? ` <span class="muted">(${note})</span>` : ''}<br>${lines.join('<br>') || '운전시간 없음'}`;
}

function formatKwhBreakdown(obj){
  const rows = [];
  if((obj.lightKwh || 0) > 0.0001) rows.push(`경 ${num(obj.lightKwh)}kWh`);
  if((obj.midKwh || 0) > 0.0001) rows.push(`중 ${num(obj.midKwh)}kWh`);
  if((obj.peakKwh || 0) > 0.0001) rows.push(`최 ${num(obj.peakKwh)}kWh`);
  return rows.join(' · ') || '0kWh';
}

function calcStopMinuteNote(){
  const oldM = getVal('oldStopMinutes');
  const newM = getVal('newStopMinutes');
  if(oldM <= 0 && newM <= 0) return '';
  const diff = newM - oldM;
  const diffText = diff === 0 ? '변동 없음' : (diff > 0 ? `정지시간 ${num(diff,0)}분/일 증가 → 가동시간 ${num(diff,0)}분/일 감소` : `정지시간 ${num(Math.abs(diff),0)}분/일 감소 → 가동시간 ${num(Math.abs(diff),0)}분/일 증가`);
  return `<div class="item full"><div class="k">정지 시간 반영</div><div class="v">기존: ${num(oldM,0)}분/일 · 변경: ${num(newM,0)}분/일<br>${diffText}</div></div>`;
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
    let title='', rows='', copy=[], basis='';

    if(savingType === 'time'){
      const kw = getVal('loadKwTime');
      if(kw <= 0) throw new Error('부하용량(kW)을 입력하세요.');
      const oldText = $('oldRunRanges')?.value || '';
      const newText = $('newRunRanges')?.value || '';
      const oldStop = getVal('oldStopMinutes');
      const newStop = getVal('newStopMinutes');
      const oldHours = classifiedHoursWithStop(oldText, season, oldStop);
      const newHours = classifiedHoursWithStop(newText, season, newStop);
      validateHours(oldHours, '기존 가동 시간');
      validateHours(newHours, '변경 가동 시간');
      const before = calcByTouHours(kw, days, oldHours, rates);
      const after = calcByTouHours(kw, days, newHours, rates);
      const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
      const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
      const saveKwh = before.kwh - after.kwh;
      const saveMoney = beforeFee.total - afterFee.total;
      const saveRate = before.kwh > 0 ? saveKwh / before.kwh * 100 : 0;
      title='운전시간 개선 절감효과';
      rows = `
        <div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}</div></div>
        <div class="item"><div class="k">부하용량</div><div class="v">${num(kw,3)} kW</div></div>
        <div class="item"><div class="k">기본요금 참고</div><div class="v">${won(basicCharge)}</div></div>
        <div class="item"><div class="k">기존 월 사용량</div><div class="v">${num(before.kwh)} kWh</div></div>
        <div class="item"><div class="k">변경 월 사용량</div><div class="v">${num(after.kwh)} kWh</div></div>
        <div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saveKwh)} kWh</div></div>
        <div class="item"><div class="k">연 절감전력량</div><div class="v">${num(saveKwh*12)} kWh</div></div>
        <div class="item"><div class="k">절감률</div><div class="v">${num(saveRate,1)}%</div></div>
        <div class="item"><div class="k">월 절감금액</div><div class="v">${won(saveMoney)}</div></div>
        <div class="item"><div class="k">연 절감금액</div><div class="v">${won(saveMoney*12)}</div></div>
        <div class="item full"><div class="k">기존 시간대별 사용량</div><div class="v">${formatKwhBreakdown(before)}</div></div>
        <div class="item full"><div class="k">변경 시간대별 사용량</div><div class="v">${formatKwhBreakdown(after)}</div></div>
        <div class="item full"><div class="k">가동 시간 자동분류</div><div class="v">${formatRangeBreakdown('기존', oldText, season, oldStop)}<br><br>${formatRangeBreakdown('변경', newText, season, newStop)}</div></div>
        ${calcStopMinuteNote()}`;
      basis = '운전시간 개선: 가동 시간 입력이 없으면 24시간 연속운전으로 보고, 정지시간(분/일)을 차감해 실제 가동시간에 반영합니다. 입력한 가동 시간 범위는 계절별 경부하·중간부하·최대부하로 자동 배분합니다.';
      copy = ['■ 운전시간 개선 절감효과',`계약종별: ${tariff.label}`,`부하용량: ${num(kw,3)}kW`,`월 절감전력량: ${num(saveKwh)}kWh`,`연 절감전력량: ${num(saveKwh*12)}kWh`,`월 절감금액: ${won(saveMoney)}`,`연 절감금액: ${won(saveMoney*12)}`];
    } else {
      const beforeKw = getVal('beforeKw'), afterKw = getVal('afterKw');
      if(beforeKw <= 0) throw new Error('기존전력(kW)을 입력하세요.');
      if(afterKw < 0) throw new Error('개선후 전력(kW)을 입력하세요.');
      if(afterKw > beforeKw) throw new Error('개선후 전력이 기존전력보다 큽니다.');
      const runText = $('saveRunRanges')?.value || '';
      const hours = classifiedHoursWithStop(runText, season, 0);
      validateHours(hours, '가동 시간');
      const before = calcByTouHours(beforeKw, days, hours, rates);
      const after = calcByTouHours(afterKw, days, hours, rates);
      const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
      const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
      const saveKw = beforeKw - afterKw;
      const saveKwh = before.kwh - after.kwh;
      const saveMoney = beforeFee.total - afterFee.total;
      const saveRate = saveKw / beforeKw * 100;
      title='전력량 절감효과';
      rows = `
        <div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}</div></div>
        <div class="item"><div class="k">기존전력</div><div class="v">${num(beforeKw,3)} kW</div></div>
        <div class="item"><div class="k">개선후 전력</div><div class="v">${num(afterKw,3)} kW</div></div>
        <div class="item"><div class="k">절감전력</div><div class="v">${num(saveKw,3)} kW</div></div>
        <div class="item"><div class="k">절감률</div><div class="v">${num(saveRate,1)}%</div></div>
        <div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saveKwh)} kWh</div></div>
        <div class="item"><div class="k">연 절감전력량</div><div class="v">${num(saveKwh*12)} kWh</div></div>
        <div class="item"><div class="k">월 절감금액</div><div class="v">${won(saveMoney)}</div></div>
        <div class="item"><div class="k">연 절감금액</div><div class="v">${won(saveMoney*12)}</div></div>
        <div class="item full"><div class="k">가동 시간 자동분류</div><div class="v">${formatRangeBreakdown('가동', runText, season, 0)}</div></div>`;
      basis='전력량 절감: 가동 시간 입력이 없으면 24시간 연속운전으로 보고, 기존전력과 개선후 전력 차이를 시간대별 가동 시간에 적용해 절감전력량과 절감금액을 계산합니다.';
      copy=['■ 전력량 절감효과',`계약종별: ${tariff.label}`,`절감전력: ${num(saveKw,3)}kW`,`월 절감전력량: ${num(saveKwh)}kWh`,`연 절감전력량: ${num(saveKwh*12)}kWh`,`월 절감금액: ${won(saveMoney)}`,`연 절감금액: ${won(saveMoney*12)}`];
    }
    $('energyResult').innerHTML = `<h3>${title}</h3><div class="resultGrid">${rows}</div><div class="basis">${basis}</div><button class="copyBtn" data-copy="${escapeHtml(copy.join('\n'))}">결과 복사하기</button>`;
    $('energyResult').classList.remove('hidden');
    bindCopyButtons();
  }catch(e){ showEnergyError(e.message); }
}

/* ===== Ver 5.0 overrides: 부하별/설비별 전력절감, 보고형식, 정지시간 분/시간 ===== */
let ETP_EQUIPMENT_ITEMS = [];

function updateSavingScopeUi(){
  const scope = $('savingScope')?.value || 'load';
  const savingType = $('savingType')?.value || 'time';
  const isEquipment = scope === 'equipment';
  $('equipmentBox')?.classList.toggle('hidden', !isEquipment);
  $('loadNameWrap')?.classList.toggle('hidden', isEquipment);
  $('loadKwTimeWrap')?.classList.toggle('hidden', isEquipment && savingType === 'time');
}

function addEquipmentItem(){
  const name = ($('equipmentName')?.value || '').trim();
  const kw = Number($('equipmentKw')?.value || 0);
  const count = Math.max(1, Math.round(Number($('equipmentCount')?.value || 1)));
  if(!name){ alert('설비명을 입력하세요.'); return; }
  if(!isFinite(kw) || kw <= 0){ alert('부하용량(kW/대)을 입력하세요.'); return; }
  ETP_EQUIPMENT_ITEMS.push({name, kw, count});
  $('equipmentName').value = '';
  $('equipmentKw').value = '';
  $('equipmentCount').value = '1';
  renderEquipmentItems();
}

function removeEquipmentItem(index){
  ETP_EQUIPMENT_ITEMS.splice(index, 1);
  renderEquipmentItems();
}

function getEquipmentTotalKw(){
  return ETP_EQUIPMENT_ITEMS.reduce((sum, item)=>sum + Number(item.kw || 0) * Number(item.count || 0), 0);
}

function renderEquipmentItems(){
  const box = $('equipmentList');
  if(!box) return;
  if(!ETP_EQUIPMENT_ITEMS.length){
    box.innerHTML = '등록된 설비가 없습니다.';
    return;
  }
  const rows = ETP_EQUIPMENT_ITEMS.map((item, idx)=>{
    const total = Number(item.kw || 0) * Number(item.count || 0);
    return `<div class="equipment-row"><div><strong>${escapeHtml(item.name)}</strong><br>${num(item.kw,3)}kW × ${item.count}대 = <b>${num(total,3)}kW</b></div><button type="button" class="secondary" onclick="removeEquipmentItem(${idx})">삭제</button></div>`;
  }).join('');
  const totalKw = getEquipmentTotalKw();
  box.innerHTML = rows + `<div class="equipment-row"><div><strong>총 부하용량</strong><br><b>${num(totalKw,3)}kW</b></div></div>`;
}

function equipmentInstallHtml(){
  if(!ETP_EQUIPMENT_ITEMS.length) return '';
  const lis = ETP_EQUIPMENT_ITEMS.map(item=>`<li>${escapeHtml(item.name)} : ${num(item.kw,3)}kW × ${item.count}대 = ${num(item.kw*item.count,3)}kW</li>`).join('');
  return `<ol>${lis}</ol><div class="calc">총 부하용량 = ${ETP_EQUIPMENT_ITEMS.map(i=>`${num(i.kw,3)}×${i.count}`).join(' + ')} = <b>${num(getEquipmentTotalKw(),3)}kW</b></div>`;
}

function equipmentInstallText(){
  if(!ETP_EQUIPMENT_ITEMS.length) return '';
  return ETP_EQUIPMENT_ITEMS.map(item=>`- ${item.name} : ${num(item.kw,3)}kW × ${item.count}대 = ${num(item.kw*item.count,3)}kW`).join('\n') + `\n- 총 부하용량 : ${num(getEquipmentTotalKw(),3)}kW`;
}

// 정지시간은 분/시간 기준: 30분/시간이면 해당 시간의 실제 가동률 50%
function adjustHoursByStopMinutes(hours, stopMinutes){
  const stop = Math.max(0, Math.min(59, Number(stopMinutes || 0)));
  const ratio = Math.max(0, (60 - stop) / 60);
  return {
    light: Math.round((hours.light || 0) * ratio * 100) / 100,
    mid: Math.round((hours.mid || 0) * ratio * 100) / 100,
    peak: Math.round((hours.peak || 0) * ratio * 100) / 100
  };
}

function formatRangeBreakdown(label, text, season, stopMinutes=0){
  const d = splitRangeDetailsWithStop(text, season, stopMinutes);
  const lines = [
    formatPeriodLineIfAny('경부하', d.light),
    formatPeriodLineIfAny('중간부하', d.mid),
    formatPeriodLineIfAny('최대부하', d.peak)
  ].filter(Boolean);
  const defaultNote = d.fullDay ? '24시간 연속운전 기준' : '';
  const stopNote = Number(stopMinutes || 0) > 0 ? `정지 ${num(stopMinutes,0)}분/시간 반영` : '';
  const note = [defaultNote, stopNote].filter(Boolean).join(' · ');
  return `${label}${note ? ` <span class="muted">(${note})</span>` : ''}<br>${lines.join('<br>') || '운전시간 없음'}`;
}

function calcStopMinuteNote(){
  const oldM = getVal('oldStopMinutes');
  const newM = getVal('newStopMinutes');
  if(oldM <= 0 && newM <= 0) return '';
  const oldRatio = (60 - Math.max(0, Math.min(59, oldM))) / 60;
  const newRatio = (60 - Math.max(0, Math.min(59, newM))) / 60;
  const diff = newM - oldM;
  const diffText = diff === 0 ? '정지시간 변동 없음' : (diff > 0 ? `정지시간 ${num(diff,0)}분/시간 증가 → 같은 운전범위에서 실제 가동률 감소` : `정지시간 ${num(Math.abs(diff),0)}분/시간 감소 → 같은 운전범위에서 실제 가동률 증가`);
  return `<div class="item full"><div class="k">정지 시간 반영</div><div class="v">기존: ${num(oldM,0)}분/시간, 실제 가동률 ${num(oldRatio*100,1)}%<br>변경: ${num(newM,0)}분/시간, 실제 가동률 ${num(newRatio*100,1)}%<br>${diffText}</div></div>`;
}

function annualSeasonalSavingTime(kw, days, oldText, newText, oldStop, newStop, tariff, climateRate, fuelRate){
  const seasonMonths = {summer:3, springAutumn:5, winter:4};
  const detail = [];
  let annualKwh = 0;
  let annualMoney = 0;
  Object.entries(seasonMonths).forEach(([season, months])=>{
    const rates = getTouRates(tariff, season);
    const oldHours = classifiedHoursWithStop(oldText, season, oldStop);
    const newHours = classifiedHoursWithStop(newText, season, newStop);
    const before = calcByTouHours(kw, days, oldHours, rates);
    const after = calcByTouHours(kw, days, newHours, rates);
    const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
    const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
    const saveKwh = before.kwh - after.kwh;
    const saveMoney = beforeFee.total - afterFee.total;
    annualKwh += saveKwh * months;
    annualMoney += saveMoney * months;
    detail.push({season, months, saveKwh, saveMoney});
  });
  return {annualKwh, annualMoney, detail};
}

function annualSeasonalSavingPower(beforeKw, afterKw, days, runText, tariff, climateRate, fuelRate){
  const seasonMonths = {summer:3, springAutumn:5, winter:4};
  const detail = [];
  let annualKwh = 0;
  let annualMoney = 0;
  Object.entries(seasonMonths).forEach(([season, months])=>{
    const rates = getTouRates(tariff, season);
    const hours = classifiedHoursWithStop(runText, season, 0);
    const before = calcByTouHours(beforeKw, days, hours, rates);
    const after = calcByTouHours(afterKw, days, hours, rates);
    const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
    const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
    const saveKwh = before.kwh - after.kwh;
    const saveMoney = beforeFee.total - afterFee.total;
    annualKwh += saveKwh * months;
    annualMoney += saveMoney * months;
    detail.push({season, months, saveKwh, saveMoney});
  });
  return {annualKwh, annualMoney, detail};
}

function seasonDetailHtml(annual){
  return annual.detail.map(d=>`${getSeasonFullLabel(d.season)} ${d.months}개월: ${num(d.saveKwh)}kWh/월 × ${d.months} = ${num(d.saveKwh*d.months)}kWh, ${won(d.saveMoney*d.months)}`).join('<br>');
}

function buildReportHtmlForTime(scope, name, kw, oldText, newText, oldStop, newStop, days, before, after, saveKwh, saveMoney, annual){
  const scopeTitle = scope === 'equipment' ? '설비별 전력절감' : '부하별 전력절감';
  const install = scope === 'equipment'
    ? equipmentInstallHtml()
    : `<ol><li>부하명 : ${escapeHtml(name || '개별 부하')}</li><li>부하용량 : ${num(kw,3)}kW</li></ol>`;
  const oldTotalH = hoursTotal(classifiedHoursWithStop(oldText, $('tariffSeason').value, oldStop));
  const newTotalH = hoursTotal(classifiedHoursWithStop(newText, $('tariffSeason').value, newStop));
  return `<div class="report-box"><h4>보고 형식 요약</h4><ol>
    <li><b>설치 현황</b>${install}</li>
    <li><b>기존 운전 조건</b><br>운전범위 : ${escapeHtml(defaultFullDayText(oldText))}<br>정지시간 : ${num(oldStop,0)}분/시간<br>실제 가동시간 : ${num(oldTotalH,2)}h/일</li>
    <li><b>개선 운전 조건</b><br>운전범위 : ${escapeHtml(defaultFullDayText(newText))}<br>정지시간 : ${num(newStop,0)}분/시간<br>실제 가동시간 : ${num(newTotalH,2)}h/일</li>
    <li><b>절감 효과</b><br>월 절감전력량 : ${num(saveKwh)}kWh/월<br>연 절감전력량 : ${num(annual.annualKwh)}kWh/년<br>월 절감금액 : ${won(saveMoney)}<br>연 절감금액 : ${won(annual.annualMoney)}</li>
  </ol><div class="calc"><b>계산식</b><br>실제 가동시간 = 운전범위 시간 × (60 - 정지분/시간) ÷ 60<br>월 사용량 = 부하용량 × 실제 가동시간 × 월 운전일수<br>절감량 = 기존 사용량 - 개선 사용량<br>연 절감금액 = 계절별 절감금액을 여름 3개월, 봄·가을 5개월, 겨울 4개월로 합산</div></div>`;
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
    const scope = $('savingScope')?.value || 'load';
    if(days <= 0) throw new Error('월 운전일수를 입력하세요.');
    let title='', rows='', copy=[], basis='', report='';

    if(savingType === 'time'){
      let kw = scope === 'equipment' ? getEquipmentTotalKw() : getVal('loadKwTime');
      if(scope === 'equipment' && kw <= 0) throw new Error('설비별 전력절감은 설비를 1개 이상 추가하세요.');
      if(kw <= 0) throw new Error('부하용량(kW)을 입력하세요.');
      const loadName = $('loadName')?.value || '';
      const oldText = $('oldRunRanges')?.value || '';
      const newText = $('newRunRanges')?.value || '';
      const oldStop = getVal('oldStopMinutes');
      const newStop = getVal('newStopMinutes');
      const oldHours = classifiedHoursWithStop(oldText, season, oldStop);
      const newHours = classifiedHoursWithStop(newText, season, newStop);
      validateHours(oldHours, '기존 가동 시간');
      validateHours(newHours, '변경 가동 시간');
      const before = calcByTouHours(kw, days, oldHours, rates);
      const after = calcByTouHours(kw, days, newHours, rates);
      const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
      const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
      const saveKwh = before.kwh - after.kwh;
      const saveMoney = beforeFee.total - afterFee.total;
      const saveRate = before.kwh > 0 ? saveKwh / before.kwh * 100 : 0;
      const annual = annualSeasonalSavingTime(kw, days, oldText, newText, oldStop, newStop, tariff, climateRate, fuelRate);
      title = scope === 'equipment' ? '설비별 운전시간 개선 절감효과' : '부하별 운전시간 개선 절감효과';
      report = buildReportHtmlForTime(scope, loadName, kw, oldText, newText, oldStop, newStop, days, before, after, saveKwh, saveMoney, annual);
      rows = `
        <div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}</div></div>
        <div class="item"><div class="k">총 부하용량</div><div class="v">${num(kw,3)} kW</div></div>
        <div class="item"><div class="k">기본요금 참고</div><div class="v">${won(basicCharge)}</div></div>
        <div class="item"><div class="k">기존 월 사용량</div><div class="v">${num(before.kwh)} kWh</div></div>
        <div class="item"><div class="k">변경 월 사용량</div><div class="v">${num(after.kwh)} kWh</div></div>
        <div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saveKwh)} kWh</div></div>
        <div class="item"><div class="k">연 절감전력량</div><div class="v">${num(annual.annualKwh)} kWh</div></div>
        <div class="item"><div class="k">절감률</div><div class="v">${num(saveRate,1)}%</div></div>
        <div class="item"><div class="k">월 절감금액</div><div class="v">${won(saveMoney)}</div></div>
        <div class="item"><div class="k">연 절감금액</div><div class="v">${won(annual.annualMoney)}</div></div>
        <div class="item full"><div class="k">기존 시간대별 사용량</div><div class="v">${formatKwhBreakdown(before)}</div></div>
        <div class="item full"><div class="k">변경 시간대별 사용량</div><div class="v">${formatKwhBreakdown(after)}</div></div>
        <div class="item full"><div class="k">가동 시간 자동분류</div><div class="v">${formatRangeBreakdown('기존', oldText, season, oldStop)}<br><br>${formatRangeBreakdown('변경', newText, season, newStop)}</div></div>
        <div class="item full"><div class="k">계절별 연간 계산</div><div class="v">${seasonDetailHtml(annual)}</div></div>
        ${calcStopMinuteNote()}`;
      basis = '운전시간 개선: 가동시간을 계절별 경부하·중간부하·최대부하로 자동 배분하고, 정지시간은 분/시간 기준으로 실제 가동률에 반영합니다.';
      copy = ['■ '+title, scope === 'equipment' ? equipmentInstallText() : `- 부하명: ${loadName || '개별 부하'}\n- 부하용량: ${num(kw,3)}kW`, `월 절감전력량: ${num(saveKwh)}kWh`, `연 절감전력량: ${num(annual.annualKwh)}kWh`, `월 절감금액: ${won(saveMoney)}`, `연 절감금액: ${won(annual.annualMoney)}`];
    } else {
      const beforeKw = getVal('beforeKw'), afterKw = getVal('afterKw');
      if(beforeKw <= 0) throw new Error('기존전력(kW)을 입력하세요.');
      if(afterKw < 0) throw new Error('개선후 전력(kW)을 입력하세요.');
      if(afterKw > beforeKw) throw new Error('개선후 전력이 기존전력보다 큽니다.');
      const runText = $('saveRunRanges')?.value || '';
      const hours = classifiedHoursWithStop(runText, season, 0);
      validateHours(hours, '가동 시간');
      const before = calcByTouHours(beforeKw, days, hours, rates);
      const after = calcByTouHours(afterKw, days, hours, rates);
      const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
      const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
      const saveKw = beforeKw - afterKw;
      const saveKwh = before.kwh - after.kwh;
      const saveMoney = beforeFee.total - afterFee.total;
      const saveRate = saveKw / beforeKw * 100;
      const annual = annualSeasonalSavingPower(beforeKw, afterKw, days, runText, tariff, climateRate, fuelRate);
      title='전력량 절감효과';
      rows = `
        <div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}</div></div>
        <div class="item"><div class="k">기존전력</div><div class="v">${num(beforeKw,3)} kW</div></div>
        <div class="item"><div class="k">개선후 전력</div><div class="v">${num(afterKw,3)} kW</div></div>
        <div class="item"><div class="k">절감전력</div><div class="v">${num(saveKw,3)} kW</div></div>
        <div class="item"><div class="k">절감률</div><div class="v">${num(saveRate,1)}%</div></div>
        <div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saveKwh)} kWh</div></div>
        <div class="item"><div class="k">연 절감전력량</div><div class="v">${num(annual.annualKwh)} kWh</div></div>
        <div class="item"><div class="k">월 절감금액</div><div class="v">${won(saveMoney)}</div></div>
        <div class="item"><div class="k">연 절감금액</div><div class="v">${won(annual.annualMoney)}</div></div>
        <div class="item full"><div class="k">가동 시간 자동분류</div><div class="v">${formatRangeBreakdown('가동', runText, season, 0)}</div></div>
        <div class="item full"><div class="k">계절별 연간 계산</div><div class="v">${seasonDetailHtml(annual)}</div></div>`;
      basis='전력량 절감: 가동 시간 입력이 없으면 24시간 연속운전으로 보고, 기존전력과 개선후 전력 차이를 시간대별 가동 시간에 적용합니다.';
      report = `<div class="report-box"><h4>보고 형식 요약</h4><ol><li><b>개선 개요</b><br>기존전력 ${num(beforeKw,3)}kW → 개선후 전력 ${num(afterKw,3)}kW</li><li><b>절감 효과</b><br>절감전력 ${num(saveKw,3)}kW, 절감률 ${num(saveRate,1)}%</li><li><b>연간 효과</b><br>연 절감전력량 ${num(annual.annualKwh)}kWh/년, 연 절감금액 ${won(annual.annualMoney)}</li></ol><div class="calc"><b>계산식</b><br>절감전력 = 기존전력 - 개선후 전력<br>월 절감전력량 = 절감전력 × 실제 가동시간 × 월 운전일수<br>연 절감금액 = 계절별 절감금액을 합산</div></div>`;
      copy=['■ 전력량 절감효과',`절감전력: ${num(saveKw,3)}kW`,`월 절감전력량: ${num(saveKwh)}kWh`,`연 절감전력량: ${num(annual.annualKwh)}kWh`,`월 절감금액: ${won(saveMoney)}`,`연 절감금액: ${won(annual.annualMoney)}`];
    }
    $('energyResult').innerHTML = `<h3>${title}</h3><div class="resultGrid">${rows}</div>${report}<div class="basis">${basis}</div><button class="copyBtn" data-copy="${escapeHtml(copy.join('\n'))}">결과 복사하기</button>`;
    $('energyResult').classList.remove('hidden');
    bindCopyButtons();
  }catch(e){ showEnergyError(e.message); }
}

function resetEnergy(){
  if($('savingType')) $('savingType').value = 'time';
  if($('savingScope')) $('savingScope').value = 'load';
  ['contractKw','loadKwTime','loadName','beforeKw','afterKw','oldRunRanges','newRunRanges','oldStopMinutes','newStopMinutes','saveRunRanges','equipmentName','equipmentKw'].forEach(id=>{ if($(id)) $(id).value=''; });
  if($('equipmentCount')) $('equipmentCount').value='1';
  ETP_EQUIPMENT_ITEMS = [];
  renderEquipmentItems();
  updateSavingMode();
  updateSavingScopeUi();
  $('energyResult')?.classList.add('hidden');
  updateTariffInputs();
}

document.addEventListener('DOMContentLoaded',()=>{
  $('equipmentAddBtn')?.addEventListener('click', addEquipmentItem);
  ['savingScope','savingType'].forEach(id=>$(id)?.addEventListener('change', updateSavingScopeUi));
  updateSavingScopeUi();
  renderEquipmentItems();
});


/* ===== Ver 6.0 overrides: 설비별 개별 조건, 계절별 시간 입력, 365일 연산 ===== */
function v51SeasonDays(){ return {summer:92, springAutumn:153, winter:120}; }
function v51SeasonLabel(season){ return getSeasonFullLabel(season).replace(/\(.+?\)/g,''); }
function v51PickRange(item, prefix, season){
  const key = prefix + (season==='summer'?'Summer':season==='springAutumn'?'Spring':'Winter');
  return (item && item[key] && String(item[key]).trim()) ? item[key] : (item && item[prefix]) || '';
}
function v51RangeOrFull(text){ return String(text||'').trim() || '00:00-24:00'; }
function v51Input(id){ return document.getElementById(id); }
function v51Number(id){ return Number((v51Input(id)?.value || 0)); }
function v51Text(id){ return (v51Input(id)?.value || '').trim(); }
function v51WireTimePickerForDynamic(){
  document.querySelectorAll('.time-pick-btn').forEach(btn=>{
    if(btn.dataset.v51Bound) return;
    btn.dataset.v51Bound = '1';
    btn.addEventListener('click', ()=>openTimePicker(btn.dataset.target));
  });
}
function v51SeasonTimeInputs(prefix, title){
  return `<details class="season-time-box"><summary>${title} 계절별 시간대 별도 입력(선택)</summary>
    <p class="help small">비워두면 위 공통 가동 시간을 사용합니다. 계절별 운전시간이 다른 경우에만 입력하세요.</p>
    <div class="grid">
      <label>여름철(6~8월)<input id="${prefix}Summer" type="text" placeholder="예: 15:00-21:00"/><button type="button" class="mini time-pick-btn" data-target="${prefix}Summer">시간 선택</button></label>
      <label>봄·가을철(3~5월,9~10월)<input id="${prefix}Spring" type="text" placeholder="예: 08:00-11:00, 13:00-15:00"/><button type="button" class="mini time-pick-btn" data-target="${prefix}Spring">시간 선택</button></label>
      <label>겨울철(11~2월)<input id="${prefix}Winter" type="text" placeholder="예: 09:00-12:00, 16:00-19:00"/><button type="button" class="mini time-pick-btn" data-target="${prefix}Winter">시간 선택</button></label>
    </div>
  </details>`;
}
function v51BuildEquipmentBox(){
  const box = v51Input('equipmentBox');
  if(!box) return;
  box.innerHTML = `
    <h3>설비 설치현황 및 개선 조건</h3>
    <p class="help small">설비별로 부하용량, 대수, 가동시간을 직접 확인해 입력합니다. 설비를 추가하면 입력란은 자동 초기화됩니다.</p>
    <div class="grid">
      <label>설비명<input id="equipmentName" type="text" placeholder="예: 유량조정조 교반기" /></label>
      <label>부하용량(kW/대)<input id="equipmentKw" type="number" step="0.001" min="0" placeholder="예: 5.5" /></label>
      <label>대수<input id="equipmentCount" type="number" step="1" min="1" value="1" /></label>
    </div>
    <div id="equipTimeFields">
      <h4>운전시간 개선 조건</h4>
      <div class="grid">
        <label>기존 가동 시간<input id="equipOldRun" type="text" placeholder="미입력 시 24시간"/><button type="button" class="mini time-pick-btn" data-target="equipOldRun">시간 선택</button></label>
        <label>변경 가동 시간<input id="equipNewRun" type="text" placeholder="미입력 시 24시간"/><button type="button" class="mini time-pick-btn" data-target="equipNewRun">시간 선택</button></label>
        <label>기존 정지 시간(분/시간, 선택)<input id="equipOldStop" type="number" step="1" min="0" max="59" placeholder="예: 30" /></label>
        <label>변경 정지 시간(분/시간, 선택)<input id="equipNewStop" type="number" step="1" min="0" max="59" placeholder="예: 40" /></label>
      </div>
      ${v51SeasonTimeInputs('equipOldRun','기존')}
      ${v51SeasonTimeInputs('equipNewRun','변경')}
    </div>
    <div id="equipPowerFields" class="hidden">
      <h4>전력량 절감 조건</h4>
      <div class="grid">
        <label>기존전력(kW/대)<input id="equipBeforeKw" type="number" step="0.001" min="0" placeholder="예: 5.5" /></label>
        <label>개선후 전력(kW/대)<input id="equipAfterKw" type="number" step="0.001" min="0" placeholder="예: 4.0" /></label>
        <label>가동 시간<input id="equipSaveRun" type="text" placeholder="미입력 시 24시간"/><button type="button" class="mini time-pick-btn" data-target="equipSaveRun">시간 선택</button></label>
      </div>
      ${v51SeasonTimeInputs('equipSaveRun','전력량 절감')}
    </div>
    <div class="actions compact"><button type="button" id="equipmentAddBtn" class="secondary">설비 추가</button></div>
    <div id="equipmentList" class="equipment-list muted">등록된 설비가 없습니다.</div>`;
  v51Input('equipmentAddBtn')?.addEventListener('click', addEquipmentItem);
  v51WireTimePickerForDynamic();
}
function updateSavingScopeUi(){
  const scope = v51Input('savingScope')?.value || 'load';
  const savingType = v51Input('savingType')?.value || 'time';
  const isEquipment = scope === 'equipment';
  v51Input('equipmentBox')?.classList.toggle('hidden', !isEquipment);
  v51Input('loadNameWrap')?.classList.toggle('hidden', isEquipment);
  v51Input('loadKwTimeWrap')?.classList.toggle('hidden', isEquipment && savingType === 'time');
  v51Input('timeSavingBox')?.classList.toggle('hidden', savingType !== 'time');
  v51Input('powerSavingBox')?.classList.toggle('hidden', savingType !== 'power');
  v51Input('equipTimeFields')?.classList.toggle('hidden', savingType !== 'time');
  v51Input('equipPowerFields')?.classList.toggle('hidden', savingType !== 'power');
}
function v51ClearEquipmentInputs(){
  ['equipmentName','equipmentKw','equipmentCount','equipOldRun','equipNewRun','equipOldStop','equipNewStop','equipOldRunSummer','equipOldRunSpring','equipOldRunWinter','equipNewRunSummer','equipNewRunSpring','equipNewRunWinter','equipBeforeKw','equipAfterKw','equipSaveRun','equipSaveRunSummer','equipSaveRunSpring','equipSaveRunWinter'].forEach(id=>{ const el=v51Input(id); if(el) el.value=''; });
  if(v51Input('equipmentCount')) v51Input('equipmentCount').value='1';
}
function addEquipmentItem(){
  const savingType = v51Input('savingType')?.value || 'time';
  const name = v51Text('equipmentName');
  const kw = v51Number('equipmentKw');
  const count = Math.max(1, Math.round(v51Number('equipmentCount') || 1));
  if(!name){ alert('설비명을 입력하세요.'); return; }
  if(!isFinite(kw) || kw <= 0){ alert('부하용량(kW/대)을 입력하세요.'); return; }
  const item = {type:savingType, name, kw, count};
  if(savingType === 'time'){
    Object.assign(item, {
      oldRun:v51Text('equipOldRun'), newRun:v51Text('equipNewRun'), oldStop:v51Number('equipOldStop'), newStop:v51Number('equipNewStop'),
      oldRunSummer:v51Text('equipOldRunSummer'), oldRunSpring:v51Text('equipOldRunSpring'), oldRunWinter:v51Text('equipOldRunWinter'),
      newRunSummer:v51Text('equipNewRunSummer'), newRunSpring:v51Text('equipNewRunSpring'), newRunWinter:v51Text('equipNewRunWinter')
    });
  }else{
    const beforeKw = v51Number('equipBeforeKw');
    const afterKw = v51Number('equipAfterKw');
    if(beforeKw <= 0){ alert('기존전력(kW/대)을 입력하세요.'); return; }
    if(afterKw < 0 || afterKw > beforeKw){ alert('개선후 전력은 0 이상, 기존전력 이하로 입력하세요.'); return; }
    Object.assign(item, {
      beforeKw, afterKw, saveRun:v51Text('equipSaveRun'),
      saveRunSummer:v51Text('equipSaveRunSummer'), saveRunSpring:v51Text('equipSaveRunSpring'), saveRunWinter:v51Text('equipSaveRunWinter')
    });
  }
  ETP_EQUIPMENT_ITEMS.push(item);
  v51ClearEquipmentInputs();
  renderEquipmentItems();
}
function renderEquipmentItems(){
  const box = v51Input('equipmentList');
  if(!box) return;
  if(!ETP_EQUIPMENT_ITEMS.length){ box.innerHTML = '등록된 설비가 없습니다.'; return; }
  const rows = ETP_EQUIPMENT_ITEMS.map((item, idx)=>{
    const total = Number(item.kw || 0) * Number(item.count || 0);
    const sub = item.type === 'power' ? `전력량 절감 · 기존 ${num(item.beforeKw,3)}kW/대 → 개선 ${num(item.afterKw,3)}kW/대` : `운전시간 개선 · ${num(item.kw,3)}kW × ${item.count}대 = ${num(total,3)}kW`;
    return `<div class="equipment-row"><div><strong>${escapeHtml(item.name)}</strong><br>${sub}</div><button type="button" class="secondary" onclick="removeEquipmentItem(${idx})">삭제</button></div>`;
  }).join('');
  const totalKw = getEquipmentTotalKw();
  box.innerHTML = rows + `<div class="equipment-row"><div><strong>총 설치 부하용량</strong><br><b>${num(totalKw,3)}kW</b></div></div>`;
}
function equipmentInstallHtml(){
  if(!ETP_EQUIPMENT_ITEMS.length) return '';
  const lis = ETP_EQUIPMENT_ITEMS.map(item=>`<li>${escapeHtml(item.name)} : ${num(item.kw,3)}kW × ${item.count}대 = ${num(item.kw*item.count,3)}kW</li>`).join('');
  return `<ol>${lis}</ol><div class="calc">총 설치 부하용량 = ${ETP_EQUIPMENT_ITEMS.map(i=>`${num(i.kw,3)}×${i.count}`).join(' + ')} = <b>${num(getEquipmentTotalKw(),3)}kW</b></div>`;
}
function v51CalcItemMonthTime(item, season, days, tariff, climateRate, fuelRate){
  const rates = getTouRates(tariff, season);
  const kw = Number(item.kw||0) * Number(item.count||0);
  const oldText = v51PickRange(item,'oldRun',season);
  const newText = v51PickRange(item,'newRun',season);
  const oldHours = classifiedHoursWithStop(oldText, season, item.oldStop||0);
  const newHours = classifiedHoursWithStop(newText, season, item.newStop||0);
  const before = calcByTouHours(kw, days, oldHours, rates);
  const after = calcByTouHours(kw, days, newHours, rates);
  const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
  const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
  return {item, kw, oldText, newText, oldHours, newHours, before, after, saveKwh: before.kwh-after.kwh, saveMoney: beforeFee.total-afterFee.total};
}
function v51CalcItemMonthPower(item, season, days, tariff, climateRate, fuelRate){
  const rates = getTouRates(tariff, season);
  const beforeKw = Number(item.beforeKw||0) * Number(item.count||0);
  const afterKw = Number(item.afterKw||0) * Number(item.count||0);
  const runText = v51PickRange(item,'saveRun',season);
  const hours = classifiedHoursWithStop(runText, season, 0);
  const before = calcByTouHours(beforeKw, days, hours, rates);
  const after = calcByTouHours(afterKw, days, hours, rates);
  const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
  const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
  return {item, beforeKw, afterKw, runText, hours, before, after, saveKwh: before.kwh-after.kwh, saveMoney: beforeFee.total-afterFee.total};
}
function v51AnnualForItems(items, mode, tariff, climateRate, fuelRate){
  const sd = v51SeasonDays();
  const detail=[]; let annualKwh=0, annualMoney=0;
  Object.entries(sd).forEach(([season, days])=>{
    let saveKwh=0, saveMoney=0;
    items.forEach(item=>{
      const r = mode==='time' ? v51CalcItemMonthTime(item, season, 1, tariff, climateRate, fuelRate) : v51CalcItemMonthPower(item, season, 1, tariff, climateRate, fuelRate);
      saveKwh += r.saveKwh * days;
      saveMoney += r.saveMoney * days;
    });
    annualKwh += saveKwh; annualMoney += saveMoney; detail.push({season, days, saveKwh, saveMoney});
  });
  return {annualKwh, annualMoney, detail};
}
function seasonDetailHtml(annual){
  return annual.detail.map(d=>`${getSeasonFullLabel(d.season)} ${d.days}일: ${num(d.saveKwh)}kWh, ${won(d.saveMoney)}`).join('<br>');
}
function v51SumResults(results){
  const sum = {kwh:0, energyCharge:0, lightKwh:0, midKwh:0, peakKwh:0};
  results.forEach(r=>{ sum.kwh+=r.kwh||0; sum.energyCharge+=r.energyCharge||0; sum.lightKwh+=r.lightKwh||0; sum.midKwh+=r.midKwh||0; sum.peakKwh+=r.peakKwh||0; });
  return sum;
}
function v51EquipmentTimeRows(monthResults, annual, season){
  const lines = monthResults.map(r=>`<li><b>${escapeHtml(r.item.name)}</b> ${num(r.kw,3)}kW<br>기존: ${formatRangeBreakdown('', r.oldText, season, r.item.oldStop||0).replace(/^<br>/,'')}<br>변경: ${formatRangeBreakdown('', r.newText, season, r.item.newStop||0).replace(/^<br>/,'')}<br>월 절감 ${num(r.saveKwh)}kWh, ${won(r.saveMoney)}</li>`).join('');
  return `<div class="report-box"><h4>보고 형식 요약</h4><ol><li><b>설치 현황</b>${equipmentInstallHtml()}</li><li><b>설비별 운전 조건 및 절감량</b><ol>${lines}</ol></li><li><b>절감 효과</b><br>연 절감전력량 : ${num(annual.annualKwh)}kWh/년<br>연 절감금액 : ${won(annual.annualMoney)}</li></ol><div class="calc"><b>계산식</b><br>실제 가동시간 = 운전범위 시간 × (60 - 정지분/시간) ÷ 60<br>일 사용량 = 부하용량 × 실제 가동시간<br>연 절감량 = 계절별 일 절감량 × 계절별 일수(여름 92일, 봄·가을 153일, 겨울 120일)</div></div>`;
}
function v51EquipmentPowerRows(monthResults, annual, season){
  const lines = monthResults.map(r=>`<li><b>${escapeHtml(r.item.name)}</b> ${num(r.item.kw,3)}kW × ${r.item.count}대<br>기존전력 ${num(r.beforeKw,3)}kW → 개선후 ${num(r.afterKw,3)}kW<br>${formatRangeBreakdown('가동', r.runText, season, 0)}<br>월 절감 ${num(r.saveKwh)}kWh, ${won(r.saveMoney)}</li>`).join('');
  return `<div class="report-box"><h4>보고 형식 요약</h4><ol><li><b>설치 현황</b>${equipmentInstallHtml()}</li><li><b>설비별 전력량 절감 조건</b><ol>${lines}</ol></li><li><b>절감 효과</b><br>연 절감전력량 : ${num(annual.annualKwh)}kWh/년<br>연 절감금액 : ${won(annual.annualMoney)}</li></ol><div class="calc"><b>계산식</b><br>절감전력 = 기존전력 - 개선후 전력<br>일 절감량 = 절감전력 × 가동시간<br>연 절감량 = 계절별 일 절감량 × 계절별 일수</div></div>`;
}
function v51ReportCommon(title, rows, report, basis, copy){
  v51Input('energyResult').innerHTML = `<h3>${title}</h3><div class="resultGrid">${rows}</div>${report}<div class="basis">${basis}</div><button class="copyBtn" data-copy="${escapeHtml(copy.join('\n'))}">결과 복사하기</button>`;
  v51Input('energyResult').classList.remove('hidden'); bindCopyButtons();
}
function calculateEnergy(){
  try{
    updateTariffInputs();
    const tariff = getTariff(); const season = v51Input('tariffSeason').value; const rates = getTouRates(tariff, season);
    const days = getVal('energyDays'); const contractKw = getVal('contractKw'); const climateRate = getVal('climateRate'); const fuelRate = getVal('fuelRate');
    const basicCharge = contractKw * (tariff.basic || 0);
    const savingType = v51Input('savingType')?.value || 'time'; const scope = v51Input('savingScope')?.value || 'load';
    if(days <= 0) throw new Error('월 운전일수를 입력하세요.');
    if(scope === 'equipment'){
      const items = ETP_EQUIPMENT_ITEMS.filter(i=>i.type===savingType);
      if(!items.length) throw new Error('현재 절감 방식에 해당하는 설비를 1개 이상 추가하세요.');
      if(savingType === 'time'){
        const m = items.map(i=>v51CalcItemMonthTime(i, season, days, tariff, climateRate, fuelRate));
        const before = v51SumResults(m.map(x=>x.before)); const after = v51SumResults(m.map(x=>x.after));
        const saveKwh = m.reduce((a,b)=>a+b.saveKwh,0); const saveMoney = m.reduce((a,b)=>a+b.saveMoney,0);
        const saveRate = before.kwh>0 ? saveKwh/before.kwh*100 : 0; const annual = v51AnnualForItems(items,'time',tariff,climateRate,fuelRate);
        const rows = `<div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}</div></div>
        <div class="item"><div class="k">총 설치 부하용량</div><div class="v">${num(getEquipmentTotalKw(),3)} kW</div></div><div class="item"><div class="k">기본요금 참고</div><div class="v">${won(basicCharge)}</div></div>
        <div class="item"><div class="k">기존 월 사용량</div><div class="v">${num(before.kwh)} kWh</div></div><div class="item"><div class="k">변경 월 사용량</div><div class="v">${num(after.kwh)} kWh</div></div>
        <div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saveKwh)} kWh</div></div><div class="item"><div class="k">연 절감전력량</div><div class="v">${num(annual.annualKwh)} kWh</div></div>
        <div class="item"><div class="k">절감률</div><div class="v">${num(saveRate,1)}%</div></div><div class="item"><div class="k">월 절감금액</div><div class="v">${won(saveMoney)}</div></div><div class="item"><div class="k">연 절감금액</div><div class="v">${won(annual.annualMoney)}</div></div>
        <div class="item full"><div class="k">기존 시간대별 사용량</div><div class="v">${formatKwhBreakdown(before)}</div></div><div class="item full"><div class="k">변경 시간대별 사용량</div><div class="v">${formatKwhBreakdown(after)}</div></div><div class="item full"><div class="k">계절별 연간 계산</div><div class="v">${seasonDetailHtml(annual)}</div></div>`;
        v51ReportCommon('설비별 운전시간 개선 절감효과', rows, v51EquipmentTimeRows(m, annual, season), '설비별 운전시간 개선: 설비마다 입력한 운전범위와 정지시간을 개별 적용한 뒤 합산합니다.', ['■ 설비별 운전시간 개선 절감효과',equipmentInstallText(),`연 절감전력량: ${num(annual.annualKwh)}kWh`,`연 절감금액: ${won(annual.annualMoney)}`]);
      }else{
        const m = items.map(i=>v51CalcItemMonthPower(i, season, days, tariff, climateRate, fuelRate));
        const before = v51SumResults(m.map(x=>x.before)); const after = v51SumResults(m.map(x=>x.after));
        const saveKwh = m.reduce((a,b)=>a+b.saveKwh,0); const saveMoney = m.reduce((a,b)=>a+b.saveMoney,0); const annual = v51AnnualForItems(items,'power',tariff,climateRate,fuelRate);
        const beforeKw = m.reduce((a,b)=>a+b.beforeKw,0), afterKw = m.reduce((a,b)=>a+b.afterKw,0); const saveKw = beforeKw-afterKw; const saveRate = beforeKw>0?saveKw/beforeKw*100:0;
        const rows = `<div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}</div></div>
        <div class="item"><div class="k">기존전력 합계</div><div class="v">${num(beforeKw,3)} kW</div></div><div class="item"><div class="k">개선후 전력 합계</div><div class="v">${num(afterKw,3)} kW</div></div><div class="item"><div class="k">절감전력</div><div class="v">${num(saveKw,3)} kW</div></div><div class="item"><div class="k">절감률</div><div class="v">${num(saveRate,1)}%</div></div>
        <div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saveKwh)} kWh</div></div><div class="item"><div class="k">연 절감전력량</div><div class="v">${num(annual.annualKwh)} kWh</div></div><div class="item"><div class="k">월 절감금액</div><div class="v">${won(saveMoney)}</div></div><div class="item"><div class="k">연 절감금액</div><div class="v">${won(annual.annualMoney)}</div></div><div class="item full"><div class="k">계절별 연간 계산</div><div class="v">${seasonDetailHtml(annual)}</div></div>`;
        v51ReportCommon('설비별 전력량 절감효과', rows, v51EquipmentPowerRows(m, annual, season), '설비별 전력량 절감: 설비마다 기존전력과 개선후 전력을 개별 입력해 합산합니다.', ['■ 설비별 전력량 절감효과',equipmentInstallText(),`연 절감전력량: ${num(annual.annualKwh)}kWh`,`연 절감금액: ${won(annual.annualMoney)}`]);
      }
      return;
    }
    /* 부하별은 기존 입력 구조를 유지하되 연간은 365일 계절별 자동계산 */
    if(savingType === 'time'){
      const kw=getVal('loadKwTime'); if(kw<=0) throw new Error('부하용량(kW)을 입력하세요.');
      const oldText=v51Text('oldRunRanges'), newText=v51Text('newRunRanges'), oldStop=getVal('oldStopMinutes'), newStop=getVal('newStopMinutes');
      const oldHours=classifiedHoursWithStop(oldText,season,oldStop), newHours=classifiedHoursWithStop(newText,season,newStop); validateHours(oldHours,'기존 가동 시간'); validateHours(newHours,'변경 가동 시간');
      const before=calcByTouHours(kw,days,oldHours,rates), after=calcByTouHours(kw,days,newHours,rates); const beforeFee=calcVariableTotal(before.energyCharge,before.kwh,climateRate,fuelRate), afterFee=calcVariableTotal(after.energyCharge,after.kwh,climateRate,fuelRate);
      const saveKwh=before.kwh-after.kwh, saveMoney=beforeFee.total-afterFee.total, saveRate=before.kwh>0?saveKwh/before.kwh*100:0;
      const annual=v51AnnualForItems([{type:'time',name:v51Text('loadName')||'개별 부하',kw,count:1,oldRun:oldText,newRun:newText,oldStop,newStop}], 'time', tariff, climateRate, fuelRate);
      const rows=`<div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}</div></div><div class="item"><div class="k">부하용량</div><div class="v">${num(kw,3)} kW</div></div><div class="item"><div class="k">기본요금 참고</div><div class="v">${won(basicCharge)}</div></div><div class="item"><div class="k">기존 월 사용량</div><div class="v">${num(before.kwh)} kWh</div></div><div class="item"><div class="k">변경 월 사용량</div><div class="v">${num(after.kwh)} kWh</div></div><div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saveKwh)} kWh</div></div><div class="item"><div class="k">연 절감전력량</div><div class="v">${num(annual.annualKwh)} kWh</div></div><div class="item"><div class="k">절감률</div><div class="v">${num(saveRate,1)}%</div></div><div class="item"><div class="k">월 절감금액</div><div class="v">${won(saveMoney)}</div></div><div class="item"><div class="k">연 절감금액</div><div class="v">${won(annual.annualMoney)}</div></div><div class="item full"><div class="k">가동 시간 자동분류</div><div class="v">${formatRangeBreakdown('기존',oldText,season,oldStop)}<br><br>${formatRangeBreakdown('변경',newText,season,newStop)}</div></div><div class="item full"><div class="k">계절별 연간 계산</div><div class="v">${seasonDetailHtml(annual)}</div></div>`;
      const report=buildReportHtmlForTime('load',v51Text('loadName'),kw,oldText,newText,oldStop,newStop,days,before,after,saveKwh,saveMoney,annual).replace(/정지시간 : 0분\/시간<br>/g,'');
      v51ReportCommon('부하별 운전시간 개선 절감효과', rows, report, '부하별 운전시간 개선: 입력한 운전범위와 정지시간을 반영합니다. 연간은 365일 기준으로 산정합니다.', ['■ 부하별 운전시간 개선 절감효과',`부하용량: ${num(kw,3)}kW`,`연 절감전력량: ${num(annual.annualKwh)}kWh`,`연 절감금액: ${won(annual.annualMoney)}`]);
    }else{
      const beforeKw=getVal('beforeKw'), afterKw=getVal('afterKw'); if(beforeKw<=0) throw new Error('기존전력(kW)을 입력하세요.'); if(afterKw<0 || afterKw>beforeKw) throw new Error('개선후 전력은 기존전력 이하로 입력하세요.');
      const runText=v51Text('saveRunRanges'); const hours=classifiedHoursWithStop(runText,season,0); validateHours(hours,'가동 시간');
      const before=calcByTouHours(beforeKw,days,hours,rates), after=calcByTouHours(afterKw,days,hours,rates); const beforeFee=calcVariableTotal(before.energyCharge,before.kwh,climateRate,fuelRate), afterFee=calcVariableTotal(after.energyCharge,after.kwh,climateRate,fuelRate);
      const saveKw=beforeKw-afterKw, saveKwh=before.kwh-after.kwh, saveMoney=beforeFee.total-afterFee.total, saveRate=saveKw/beforeKw*100; const annual=v51AnnualForItems([{type:'power',name:'개별 부하',kw:beforeKw,count:1,beforeKw,afterKw,saveRun:runText}], 'power', tariff, climateRate, fuelRate);
      const rows=`<div class="item full"><div class="k">적용 단가</div><div class="v">${tariff.label}<br>${getSeasonFullLabel(season)} · ${rateSummary(tariff, season, rates)}</div></div><div class="item"><div class="k">기존전력</div><div class="v">${num(beforeKw,3)} kW</div></div><div class="item"><div class="k">개선후 전력</div><div class="v">${num(afterKw,3)} kW</div></div><div class="item"><div class="k">절감전력</div><div class="v">${num(saveKw,3)} kW</div></div><div class="item"><div class="k">절감률</div><div class="v">${num(saveRate,1)}%</div></div><div class="item"><div class="k">월 절감전력량</div><div class="v">${num(saveKwh)} kWh</div></div><div class="item"><div class="k">연 절감전력량</div><div class="v">${num(annual.annualKwh)} kWh</div></div><div class="item"><div class="k">월 절감금액</div><div class="v">${won(saveMoney)}</div></div><div class="item"><div class="k">연 절감금액</div><div class="v">${won(annual.annualMoney)}</div></div><div class="item full"><div class="k">가동 시간 자동분류</div><div class="v">${formatRangeBreakdown('가동',runText,season,0)}</div></div><div class="item full"><div class="k">계절별 연간 계산</div><div class="v">${seasonDetailHtml(annual)}</div></div>`;
      const report=`<div class="report-box"><h4>보고 형식 요약</h4><ol><li><b>개선 개요</b><br>기존전력 ${num(beforeKw,3)}kW → 개선후 전력 ${num(afterKw,3)}kW</li><li><b>절감 효과</b><br>절감전력 ${num(saveKw,3)}kW, 절감률 ${num(saveRate,1)}%</li><li><b>연간 효과</b><br>연 절감전력량 ${num(annual.annualKwh)}kWh/년, 연 절감금액 ${won(annual.annualMoney)}</li></ol><div class="calc"><b>계산식</b><br>절감전력 = 기존전력 - 개선후 전력<br>일 절감량 = 절감전력 × 가동시간<br>연 절감량 = 계절별 일 절감량 × 계절별 일수</div></div>`;
      v51ReportCommon('부하별 전력량 절감효과', rows, report, '부하별 전력량 절감: 기존전력과 개선후 전력 차이를 가동시간에 적용합니다. 연간은 365일 기준으로 산정합니다.', ['■ 부하별 전력량 절감효과',`절감전력: ${num(saveKw,3)}kW`,`연 절감전력량: ${num(annual.annualKwh)}kWh`,`연 절감금액: ${won(annual.annualMoney)}`]);
    }
  }catch(e){ showEnergyError(e.message); }
}
function resetEnergy(){
  if(v51Input('savingType')) v51Input('savingType').value='time'; if(v51Input('savingScope')) v51Input('savingScope').value='load';
  ['contractKw','loadKwTime','loadName','beforeKw','afterKw','oldRunRanges','newRunRanges','oldStopMinutes','newStopMinutes','saveRunRanges'].forEach(id=>{ const el=v51Input(id); if(el) el.value=''; });
  ETP_EQUIPMENT_ITEMS=[]; v51ClearEquipmentInputs(); renderEquipmentItems(); updateSavingMode(); updateSavingScopeUi(); v51Input('energyResult')?.classList.add('hidden'); updateTariffInputs();
}
document.addEventListener('DOMContentLoaded',()=>{
  const v = document.querySelector('.version'); if(v) v.textContent='Ver 6.0';
  v51BuildEquipmentBox(); updateSavingScopeUi(); renderEquipmentItems();
  ['savingScope','savingType'].forEach(id=>v51Input(id)?.addEventListener('change', updateSavingScopeUi));
});

/* ===== Ver 6.0 override: 통합 전력절감 검토 + 표 형식 보고서 ===== */
const V6_SEASON_DAYS = {summer:92, springAutumn:153, winter:120};
let V6_ITEMS = [];

function v6SeasonLabel(s){return {annual:'연간 자동 산정',summer:'여름철',springAutumn:'봄·가을철',winter:'겨울철'}[s]||s;}
function v6ModeLabel(m){return m==='power'?'전력량 절감':'운전시간 개선';}
function v6E(id){return document.getElementById(id);}
function v6Val(id){return Number(v6E(id)?.value || 0);}
function v6Text(id){return (v6E(id)?.value || '').trim();}
function v6DefaultRange(t){return String(t||'').trim() || '00:00-24:00';}
function v6HideZeroRows(html){return html || '-';}
function v6StopLabel(min){return Number(min||0)>0 ? `${num(min,0)}분/시간` : '-';}
function v6BriefBreakdown(text, season, stop){
  const d = splitRangeDetailsWithStop(text, season, stop);
  const rows = [formatPeriodLineIfAny('경부하', d.light), formatPeriodLineIfAny('중간부하', d.mid), formatPeriodLineIfAny('최대부하', d.peak)].filter(Boolean);
  const note = Number(stop||0)>0 ? ` <span class="muted">(정지 ${num(stop,0)}분/시간 반영)</span>` : '';
  return (rows.join('<br>') || '-') + note;
}
function v6HoursTotalFor(text, season, stop){ return hoursTotal(classifiedHoursWithStop(text, season, stop)); }
function v6CalcItemDay(item, season, tariff, climateRate, fuelRate){
  const rates = getTouRates(tariff, season);
  if(item.mode === 'power'){
    const beforeKw = Number(item.beforeKw||0) * Number(item.count||0);
    const afterKw = Number(item.afterKw||0) * Number(item.count||0);
    const h = classifiedHoursWithStop(item.runRange, season, 0);
    const before = calcByTouHours(beforeKw, 1, h, rates);
    const after = calcByTouHours(afterKw, 1, h, rates);
    const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
    const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
    return {item, season, before, after, saveKwh:before.kwh-after.kwh, saveMoney:beforeFee.total-afterFee.total, beforeKw, afterKw, hours:h};
  }
  const kw = Number(item.kw||0) * Number(item.count||0);
  const oldH = classifiedHoursWithStop(item.oldRange, season, item.oldStop);
  const newH = classifiedHoursWithStop(item.newRange, season, item.newStop);
  const before = calcByTouHours(kw, 1, oldH, rates);
  const after = calcByTouHours(kw, 1, newH, rates);
  const beforeFee = calcVariableTotal(before.energyCharge, before.kwh, climateRate, fuelRate);
  const afterFee = calcVariableTotal(after.energyCharge, after.kwh, climateRate, fuelRate);
  return {item, season, before, after, saveKwh:before.kwh-after.kwh, saveMoney:beforeFee.total-afterFee.total, kw, oldH, newH};
}
function v6AnnualCalc(items, basis, tariff, climateRate, fuelRate){
  const seasons = basis === 'annual' ? Object.keys(V6_SEASON_DAYS) : [basis];
  const dayMap = basis === 'annual' ? V6_SEASON_DAYS : {[basis]:365};
  let annualKwh=0, annualMoney=0, beforeKwh=0, afterKwh=0;
  const seasonRows=[];
  const itemTotals = items.map(item=>({item,beforeKwh:0,afterKwh:0,saveKwh:0,saveMoney:0, detail:{}}));
  seasons.forEach(season=>{
    let sBefore=0, sAfter=0, sSave=0, sMoney=0;
    items.forEach((item, idx)=>{
      const r = v6CalcItemDay(item, season, tariff, climateRate, fuelRate);
      const days = dayMap[season];
      const b = r.before.kwh * days, a = r.after.kwh * days, sk = r.saveKwh * days, sm = r.saveMoney * days;
      itemTotals[idx].beforeKwh += b; itemTotals[idx].afterKwh += a; itemTotals[idx].saveKwh += sk; itemTotals[idx].saveMoney += sm; itemTotals[idx].detail[season]=r;
      sBefore += b; sAfter += a; sSave += sk; sMoney += sm;
    });
    beforeKwh += sBefore; afterKwh += sAfter; annualKwh += sSave; annualMoney += sMoney;
    seasonRows.push({season, days:dayMap[season], beforeKwh:sBefore, afterKwh:sAfter, saveKwh:sSave, saveMoney:sMoney});
  });
  return {basis, beforeKwh, afterKwh, annualKwh, annualMoney, itemTotals, seasonRows};
}
function v6RenderItems(){
  const box = v6E('v6ItemList'); if(!box) return;
  if(!V6_ITEMS.length){ box.innerHTML = '<p class="muted">등록된 설비가 없습니다.</p>'; return; }
  box.innerHTML = V6_ITEMS.map((it,i)=>{
    const total = Number(it.kw||it.beforeKw||0) * Number(it.count||0);
    const desc = it.mode==='power'
      ? `전력량 절감 · 기존 ${num(it.beforeKw,3)}kW/대 → 개선 ${num(it.afterKw,3)}kW/대 · ${it.count}대 · 가동 ${escapeHtml(v6DefaultRange(it.runRange))}`
      : `운전시간 개선 · ${num(it.kw,3)}kW/대 × ${it.count}대 = ${num(total,3)}kW · 기존 ${escapeHtml(v6DefaultRange(it.oldRange))} → 개선 ${escapeHtml(v6DefaultRange(it.newRange))}`;
    return `<div class="equip-card"><strong>${i+1}. ${escapeHtml(it.name)}</strong><div class="meta">${desc}</div><div class="actions compact"><button type="button" class="secondary" onclick="v6RemoveItem(${i})">삭제</button></div></div>`;
  }).join('');
}
function v6RemoveItem(i){ V6_ITEMS.splice(i,1); v6RenderItems(); }
function v6ClearInputs(){
  ['v6Name','v6Kw','v6Count','v6OldRange','v6NewRange','v6OldStop','v6NewStop','v6BeforeKw','v6AfterKw','v6RunRange'].forEach(id=>{const e=v6E(id); if(e) e.value='';});
  if(v6E('v6Count')) v6E('v6Count').value='1';
}
function v6UpdateMode(){
  const m = v6E('v6Mode')?.value || 'time';
  v6E('v6TimeFields')?.classList.toggle('hidden', m!=='time');
  v6E('v6PowerFields')?.classList.toggle('hidden', m!=='power');
  const kw = v6E('v6KwWrap'); if(kw) kw.classList.toggle('hidden', m==='power');
}
function v6AddItem(){
  const mode = v6E('v6Mode').value;
  const name = v6Text('v6Name');
  const count = Math.max(1, Math.round(v6Val('v6Count')||1));
  if(!name){alert('설비명을 입력하세요.');return;}
  if(mode==='power'){
    const beforeKw=v6Val('v6BeforeKw'), afterKw=v6Val('v6AfterKw');
    if(beforeKw<=0){alert('기존전력(kW/대)을 입력하세요.');return;}
    if(afterKw<0 || afterKw>beforeKw){alert('개선후 전력은 0 이상, 기존전력 이하로 입력하세요.');return;}
    V6_ITEMS.push({mode,name,count,kw:beforeKw,beforeKw,afterKw,runRange:v6Text('v6RunRange')});
  }else{
    const kw=v6Val('v6Kw');
    if(kw<=0){alert('부하용량(kW/대)을 입력하세요.');return;}
    V6_ITEMS.push({mode,name,count,kw,oldRange:v6Text('v6OldRange'),newRange:v6Text('v6NewRange'),oldStop:v6Val('v6OldStop'),newStop:v6Val('v6NewStop')});
  }
  v6ClearInputs(); v6RenderItems();
}
function v6InstallTable(items){
  const rows = items.map((it,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(it.name)}</td><td>${v6ModeLabel(it.mode)}</td><td class="num">${num(it.kw||it.beforeKw,3)}</td><td class="num">${it.count}</td><td class="num">${num((it.kw||it.beforeKw)*it.count,3)}</td></tr>`).join('');
  const total = items.reduce((s,it)=>s+(Number(it.kw||it.beforeKw||0)*Number(it.count||0)),0);
  return `<h4>1. 설치 현황</h4><div class="report-table-wrap"><table class="report-table"><thead><tr><th>No</th><th>설비명</th><th>개선구분</th><th class="num">부하(kW/대)</th><th class="num">대수</th><th class="num">총부하(kW)</th></tr></thead><tbody>${rows}<tr class="total-row"><td colspan="5">합계</td><td class="num">${num(total,3)}</td></tr></tbody></table></div>`;
}
function v6ConditionTable(items, basis){
  const season = basis==='annual'?'springAutumn':basis;
  const rows = items.map((it,i)=>{
    if(it.mode==='power'){
      return `<tr><td>${i+1}</td><td>${escapeHtml(it.name)}</td><td>전력량 절감</td><td>기존 ${num(it.beforeKw,3)}kW/대</td><td>개선 ${num(it.afterKw,3)}kW/대</td><td>${v6BriefBreakdown(it.runRange, season, 0)}</td></tr>`;
    }
    return `<tr><td>${i+1}</td><td>${escapeHtml(it.name)}</td><td>운전시간 개선</td><td>기존: ${v6BriefBreakdown(it.oldRange, season, it.oldStop)}${Number(it.oldStop||0)>0?`<br>정지 ${num(it.oldStop,0)}분/시간`:''}</td><td>개선: ${v6BriefBreakdown(it.newRange, season, it.newStop)}${Number(it.newStop||0)>0?`<br>정지 ${num(it.newStop,0)}분/시간`:''}</td><td>-</td></tr>`;
  }).join('');
  return `<h4>2. 설비별 운전 조건</h4><p class="muted">연간 자동 산정 시 표의 시간대 구분은 봄·가을철 기준으로 표시하고, 금액 산정은 여름·봄가을·겨울 기준을 각각 적용합니다.</p><div class="report-table-wrap"><table class="report-table"><thead><tr><th>No</th><th>설비명</th><th>구분</th><th>기존 조건</th><th>개선 조건</th><th>가동 시간</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function v6SavingTable(calc){
  const rows = calc.itemTotals.map((r,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(r.item.name)}</td><td>${v6ModeLabel(r.item.mode)}</td><td class="num">${num(r.beforeKwh)}</td><td class="num">${num(r.afterKwh)}</td><td class="num"><b>${num(r.saveKwh)}</b></td><td class="num"><b>${won(r.saveMoney)}</b></td></tr>`).join('');
  return `<h4>3. 설비별 절감 효과</h4><div class="report-table-wrap"><table class="report-table"><thead><tr><th>No</th><th>설비명</th><th>구분</th><th class="num">기존 사용량(kWh/년)</th><th class="num">개선 사용량(kWh/년)</th><th class="num">절감전력량(kWh/년)</th><th class="num">절감금액(원/년)</th></tr></thead><tbody>${rows}<tr class="total-row"><td colspan="3">합계</td><td class="num">${num(calc.beforeKwh)}</td><td class="num">${num(calc.afterKwh)}</td><td class="num">${num(calc.annualKwh)}</td><td class="num">${won(calc.annualMoney)}</td></tr></tbody></table></div>`;
}
function v6SeasonTable(calc){
  const rows = calc.seasonRows.map(r=>`<tr><td>${v6SeasonLabel(r.season)}</td><td class="num">${r.days}</td><td class="num">${num(r.beforeKwh)}</td><td class="num">${num(r.afterKwh)}</td><td class="num">${num(r.saveKwh)}</td><td class="num">${won(r.saveMoney)}</td></tr>`).join('');
  return `<h4>4. 계절별 산정 내역</h4><div class="report-table-wrap"><table class="report-table"><thead><tr><th>구분</th><th class="num">적용일수</th><th class="num">기존(kWh)</th><th class="num">개선(kWh)</th><th class="num">절감(kWh)</th><th class="num">절감금액</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function v6Formula(calc){
  return `<details class="basis" open><summary><b>계산식 보기</b></summary><br>① 실제 가동시간 = 운전범위 시간 × (60 - 정지분/시간) ÷ 60<br>② 일 사용량 = 부하용량(kW) × 실제 가동시간(h/일)<br>③ 전력량 절감 = (기존전력 - 개선후전력) × 가동시간<br>④ 연 절감량 = 계절별 일 절감량 × 계절별 일수 합산<br>⑤ 절감금액 = 시간대별 절감전력량 × 한전 시간대별 전력량요금 + 기후환경요금 + 연료비조정요금</details>`;
}
function v6Calculate(){
  try{
    if(!V6_ITEMS.length) throw new Error('설비를 1개 이상 추가하세요.');
    const tariff = getTariff();
    const climateRate = Number(v6E('climateRate')?.value || 9);
    const fuelRate = Number(v6E('fuelRate')?.value || 5);
    const basis = v6E('v6Basis')?.value || 'annual';
    const calc = v6AnnualCalc(V6_ITEMS, basis, tariff, climateRate, fuelRate);
    const rateText = basis==='annual' ? '연간 자동 산정(여름 92일, 봄·가을 153일, 겨울 120일)' : `${v6SeasonLabel(basis)} 기준 365일 환산`;
    const summary = `<div class="report-summary"><div class="report-sentence">전력절감 검토 결과, 연간 약 ${num(calc.annualKwh)}kWh의 전력 절감과 약 ${won(calc.annualMoney)}의 전기요금 절감이 예상됩니다.</div><div class="muted">계약종별: ${tariff.label} · 산정기준: ${rateText}</div></div>`;
    const html = `<h3>전력절감 검토 보고서</h3>${summary}${v6InstallTable(V6_ITEMS)}${v6ConditionTable(V6_ITEMS,basis)}${v6SavingTable(calc)}${v6SeasonTable(calc)}${v6Formula(calc)}<button class="copyBtn" data-copy="${escapeHtml('전력절감 검토 결과\n연 절감전력량: '+num(calc.annualKwh)+'kWh/년\n연 절감금액: '+won(calc.annualMoney))}">결과 복사하기</button>`;
    const out = v6E('energyResult'); out.innerHTML = html; out.classList.remove('hidden'); bindCopyButtons();
  }catch(e){ showEnergyError(e.message); }
}
function v6Reset(){ V6_ITEMS=[]; v6ClearInputs(); v6RenderItems(); const out=v6E('energyResult'); if(out) out.classList.add('hidden'); }
function v6BuildEnergyUi(){
  const card = document.querySelector('#energy .card'); if(!card) return;
  card.innerHTML = `
    <h2>전력절감 검토</h2>
    <p class="help">설비별 실제 확인값을 입력하면 계절별 한전 시간대 요금을 자동 반영해 보고서 표 형식으로 출력합니다.</p>
    <input type="hidden" id="tariffSeason" value="springAutumn" />
    <input type="hidden" id="tariffLoadMode" value="tou" />
    <input type="hidden" id="energyMode" value="saving" />
    <input type="hidden" id="basicRate" value="0" />
    <input type="hidden" id="energyRate" value="0" />
    <select id="touAutoMode" class="hidden"><option value="manualKwh">직접입력</option></select>
    <input type="hidden" id="lightHours" value="0" />
    <input type="hidden" id="midHours" value="0" />
    <input type="hidden" id="peakHours" value="0" />
    <input type="hidden" id="lightKwh" value="0" />
    <input type="hidden" id="midKwh" value="0" />
    <input type="hidden" id="peakKwh" value="0" />
    <input type="hidden" id="climateRate" value="9" />
    <input type="hidden" id="fuelRate" value="5" />
    <div class="grid">
      <label>계약종별<select id="tariffType"></select></label>
      <label>산정 기준<select id="v6Basis"><option value="annual" selected>연간 자동 산정</option><option value="summer">여름철 기준</option><option value="springAutumn">봄·가을철 기준</option><option value="winter">겨울철 기준</option></select></label>
      <label>개선 구분<select id="v6Mode"><option value="time" selected>운전시간 개선</option><option value="power">전력량 절감</option></select></label>
    </div>
    <div class="card soft" style="margin-top:14px">
      <h3>설비 입력</h3>
      <div class="grid">
        <label>설비명<input id="v6Name" type="text" placeholder="예: 유량조정조 교반기" /></label>
        <label id="v6KwWrap">부하용량(kW/대)<input id="v6Kw" type="number" step="0.001" min="0" placeholder="예: 5.5" /></label>
        <label>대수<input id="v6Count" type="number" step="1" min="1" value="1" /></label>
      </div>
      <div id="v6TimeFields" class="compact-grid" style="margin-top:10px">
        <label>기존 가동 시간<input id="v6OldRange" type="text" placeholder="미입력 시 24시간"/><button type="button" class="mini time-pick-btn" data-target="v6OldRange">시간 선택</button></label>
        <label>개선 가동 시간<input id="v6NewRange" type="text" placeholder="미입력 시 24시간"/><button type="button" class="mini time-pick-btn" data-target="v6NewRange">시간 선택</button></label>
        <label>기존 정지 시간(분/시간, 선택)<input id="v6OldStop" type="number" step="1" min="0" max="59" placeholder="예: 30" /></label>
        <label>개선 정지 시간(분/시간, 선택)<input id="v6NewStop" type="number" step="1" min="0" max="59" placeholder="예: 40" /></label>
      </div>
      <div id="v6PowerFields" class="compact-grid hidden" style="margin-top:10px">
        <label>기존전력(kW/대)<input id="v6BeforeKw" type="number" step="0.001" min="0" placeholder="예: 64" /></label>
        <label>개선후 전력(kW/대)<input id="v6AfterKw" type="number" step="0.001" min="0" placeholder="예: 30" /></label>
        <label>가동 시간<input id="v6RunRange" type="text" placeholder="미입력 시 24시간"/><button type="button" class="mini time-pick-btn" data-target="v6RunRange">시간 선택</button></label>
      </div>
      <div class="actions compact"><button type="button" id="v6AddBtn" class="secondary">설비 추가</button></div>
      <div id="v6ItemList"></div>
    </div>
    <div id="timeRangePicker" class="time-picker hidden"><div class="time-picker-head"><div><strong>가동 시간 클릭 선택</strong><p class="help small">시작 시간을 누른 뒤 종료 시간을 누르면 입력란에 자동 추가됩니다.</p></div><button type="button" id="timePickerClose" class="mini secondary">닫기</button></div><div class="picker-status" id="pickerStatus">입력란을 선택하세요.</div><div class="time-grid" id="timeSlotGrid"></div><div class="actions compact"><button type="button" id="timePickerClear" class="secondary">선택 초기화</button></div></div>
    <label class="full">시간대 기준 안내<textarea id="touTimeInfo" readonly rows="5"></textarea></label>
    <div class="actions"><button id="energyBtn" class="primary">보고서 계산</button><button id="energyResetBtn" class="secondary">초기화</button></div>`;
  initTariffSelect();
  v6E('v6Mode')?.addEventListener('change', v6UpdateMode);
  v6E('v6AddBtn')?.addEventListener('click', v6AddItem);
  v6E('energyBtn')?.addEventListener('click', v6Calculate);
  v6E('energyResetBtn')?.addEventListener('click', v6Reset);
  v6E('v6Basis')?.addEventListener('change', ()=>{ const b=v6E('v6Basis').value; if(b!=='annual' && v6E('tariffSeason')) v6E('tariffSeason').value=b; updateTariffInputs(); });
  v6E('tariffType')?.addEventListener('change', updateTariffInputs);
  initTimePicker(); v51WireTimePickerForDynamic(); v6UpdateMode(); v6RenderItems(); updateTariffInputs();
}
document.addEventListener('DOMContentLoaded',()=>{
  const eye = document.querySelector('.eyebrow'); if(eye) eye.textContent='KEC Edition · Ver 6.0';
  const foot = document.querySelector('.notice'); if(foot) foot.innerHTML='<strong>주의</strong> 본 프로그램은 KEC 기준과 2026년 6월 1일 시행 한전 요금표 기반의 실무 보조도구입니다. Ver 6.0은 전력절감 검토를 통합 입력 및 보고서 표 형식으로 개선한 버전입니다. 실제 적용 전 현장 운전조건과 최신 요금 기준을 최종 확인하세요.';
  v6BuildEnergyUi();
});

/* Ver 6.2 overrides: 입력 단순화, 계절별 일수 산정, 표 형식 정리 */
function v62SeasonDaysLabel(s){
  return s === 'annual' ? '365일' : `${V6_SEASON_DAYS[s]}일`;
}
function v62BasisLabel(s){
  return {annual:'연간 자동 산정', summer:'여름철만 검토', springAutumn:'봄·가을철만 검토', winter:'겨울철만 검토'}[s] || s;
}
function v62StopRunLine(stop){
  const m = Number(stop || 0);
  if(m <= 0) return '';
  return `<br><span class="muted">- 가동 ${num(60-m,0)}분 / 정지 ${num(m,0)}분</span>`;
}
function v62BriefBreakdown(text, season, stop){
  const d = splitRangeDetailsWithStop(text, season, stop);
  const rows = [formatPeriodLineIfAny('경부하', d.light), formatPeriodLineIfAny('중간부하', d.mid), formatPeriodLineIfAny('최대부하', d.peak)].filter(Boolean);
  return (rows.join('<br>') || '-') + v62StopRunLine(stop);
}
function v62AnnualBreakdown(text, stop){
  return ['summer','springAutumn','winter'].map(s=>`<b>${getSeasonFullLabel(s)}</b><br>${v62BriefBreakdown(text, s, stop)}`).join('<br><br>');
}
function v6AnnualCalc(items, basis, tariff, climateRate, fuelRate){
  const seasons = basis === 'annual' ? Object.keys(V6_SEASON_DAYS) : [basis];
  const dayMap = basis === 'annual' ? V6_SEASON_DAYS : {[basis]: V6_SEASON_DAYS[basis]};
  let annualKwh=0, annualMoney=0, beforeKwh=0, afterKwh=0;
  const seasonRows=[];
  const itemTotals = items.map(item=>({item,beforeKwh:0,afterKwh:0,saveKwh:0,saveMoney:0, detail:{}}));
  seasons.forEach(season=>{
    let sBefore=0, sAfter=0, sSave=0, sMoney=0;
    items.forEach((item, idx)=>{
      const r = v6CalcItemDay(item, season, tariff, climateRate, fuelRate);
      const days = dayMap[season];
      const b = r.before.kwh * days, a = r.after.kwh * days, sk = r.saveKwh * days, sm = r.saveMoney * days;
      itemTotals[idx].beforeKwh += b; itemTotals[idx].afterKwh += a; itemTotals[idx].saveKwh += sk; itemTotals[idx].saveMoney += sm; itemTotals[idx].detail[season]=r;
      sBefore += b; sAfter += a; sSave += sk; sMoney += sm;
    });
    beforeKwh += sBefore; afterKwh += sAfter; annualKwh += sSave; annualMoney += sMoney;
    seasonRows.push({season, days:dayMap[season], beforeKwh:sBefore, afterKwh:sAfter, saveKwh:sSave, saveMoney:sMoney});
  });
  return {basis, beforeKwh, afterKwh, annualKwh, annualMoney, itemTotals, seasonRows};
}
function v6RenderItems(){
  const box = v6E('v6ItemList'); if(!box) return;
  if(!V6_ITEMS.length){ box.innerHTML = '<p class="muted">등록된 설비가 없습니다.</p>'; return; }
  box.innerHTML = V6_ITEMS.map((it,i)=>{
    const total = Number(it.kw||it.beforeKw||0) * Number(it.count||0);
    const desc = it.mode==='power'
      ? `전력량 절감 · 기존 ${num(it.beforeKw,3)}kW → 개선 ${num(it.afterKw,3)}kW · ${it.count}대`
      : `운전시간 개선 · ${num(it.kw,3)}kW × ${it.count}대 = ${num(total,3)}kW · 기존 ${escapeHtml(v6DefaultRange(it.oldRange))} → 개선 ${escapeHtml(v6DefaultRange(it.newRange))}`;
    return `<div class="equip-card"><strong>${i+1}. ${escapeHtml(it.name)}</strong><div class="meta">${desc}</div><div class="actions compact"><button type="button" class="secondary" onclick="v6RemoveItem(${i})">삭제</button></div></div>`;
  }).join('');
}
function v6AddItem(){
  const mode = v6E('v6Mode').value;
  const name = v6Text('v6Name');
  const count = Math.max(1, Math.round(v6Val('v6Count')||1));
  if(!name){alert('설비명을 입력하세요.');return;}
  if(mode==='power'){
    const beforeKw=v6Val('v6BeforeKw'), afterKw=v6Val('v6AfterKw');
    if(beforeKw<=0){alert('기존전력(kW)을 입력하세요.');return;}
    if(afterKw<0 || afterKw>beforeKw){alert('개선후 전력은 0 이상, 기존전력 이하로 입력하세요.');return;}
    V6_ITEMS.push({mode,name,count,kw:beforeKw,beforeKw,afterKw,runRange:'00:00-24:00'});
  }else{
    const kw=v6Val('v6Kw');
    if(kw<=0){alert('부하용량(kW)을 입력하세요.');return;}
    V6_ITEMS.push({mode,name,count,kw,oldRange:v6Text('v6OldRange'),newRange:v6Text('v6NewRange'),oldStop:v6Val('v6OldStop'),newStop:v6Val('v6NewStop')});
  }
  v6ClearInputs(); v6RenderItems();
}
function v6InstallTable(items){
  const rows = items.map((it,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(it.name)}</td><td>${v6ModeLabel(it.mode)}</td><td class="num">${num(it.kw||it.beforeKw,3)}</td><td class="num">${it.count}</td><td class="num">${num((it.kw||it.beforeKw)*it.count,3)}</td></tr>`).join('');
  const total = items.reduce((s,it)=>s+(Number(it.kw||it.beforeKw||0)*Number(it.count||0)),0);
  return `<h4>1. 설치 현황</h4><div class="report-table-wrap"><table class="report-table"><thead><tr><th>No</th><th>설비명</th><th>개선구분</th><th class="num">부하(kW)</th><th class="num">대수</th><th class="num">총부하(kW)</th></tr></thead><tbody>${rows}<tr class="total-row"><td colspan="5">합계</td><td class="num">${num(total,3)}</td></tr></tbody></table></div>`;
}
function v6ConditionTable(items, basis){
  const timeItems = items.filter(it=>it.mode==='time');
  if(!timeItems.length) return '';
  const rows = timeItems.map((it,idx)=>{
    const baseOld = basis==='annual' ? v62AnnualBreakdown(it.oldRange, it.oldStop) : v62BriefBreakdown(it.oldRange, basis, it.oldStop);
    const baseNew = basis==='annual' ? v62AnnualBreakdown(it.newRange, it.newStop) : v62BriefBreakdown(it.newRange, basis, it.newStop);
    return `<tr><td>${idx+1}</td><td>${escapeHtml(it.name)}</td><td>${baseOld}</td><td>${baseNew}</td></tr>`;
  }).join('');
  const note = basis==='annual' ? '연간 자동 산정은 여름철·봄가을철·겨울철 시간대를 각각 적용합니다.' : `${v62BasisLabel(basis)} 기준으로 시간대를 분류합니다.`;
  return `<h4>2. 설비별 운전 조건</h4><p class="muted">${note}</p><div class="report-table-wrap"><table class="report-table"><thead><tr><th>No</th><th>설비명</th><th>기존 조건</th><th>개선 조건</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function v6SeasonTable(calc){
  const rows = calc.seasonRows.map(r=>`<tr><td>${v6SeasonLabel(r.season)}</td><td class="num">${r.days}</td><td class="num">${num(r.beforeKwh)}</td><td class="num">${num(r.afterKwh)}</td><td class="num">${num(r.saveKwh)}</td><td class="num">${won(r.saveMoney)}</td></tr>`).join('');
  return `<h4>4. 계절별 산정 내역</h4><div class="report-table-wrap"><table class="report-table"><thead><tr><th>구분</th><th class="num">적용일수</th><th class="num">기존(kWh)</th><th class="num">개선(kWh)</th><th class="num">절감(kWh)</th><th class="num">절감금액</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
function v62TimeGuideTable(){
  const rows = [
    ['여름철(6~8월)', '22:00~08:00', '08:00~15:00<br>21:00~22:00', '15:00~21:00'],
    ['봄·가을철(3~5월, 9~10월)', '22:00~08:00', '08:00~15:00<br>21:00~22:00', '15:00~21:00'],
    ['겨울철(11~2월)', '22:00~08:00', '08:00~09:00<br>12:00~16:00<br>19:00~22:00', '09:00~12:00<br>16:00~19:00']
  ].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('');
  return `<h3>시간대 기준 안내</h3><div class="report-table-wrap"><table class="report-table"><thead><tr><th>구분</th><th>경부하</th><th>중간부하</th><th>최대부하</th></tr></thead><tbody>${rows}</tbody></table></div><p class="help small">입력한 운전시간은 산정 기준에 따라 위 시간대로 자동 분류됩니다.</p>`;
}
function v62UpdateTimeGuide(){
  const el = v6E('touTimeInfo');
  if(el) el.innerHTML = v62TimeGuideTable();
}


/* ===== Ver 6.3 overrides: 전력절감 검토 보고서 내보내기 ===== */
function v63ReportDocumentHtml(title='전력절감 검토 보고서'){
  const src = document.getElementById('energyResult');
  if(!src || src.classList.contains('hidden')) throw new Error('먼저 전력절감 검토 계산을 실행하세요.');
  const clone = src.cloneNode(true);
  clone.querySelectorAll('button,.actions,.copyBtn,.exportBtn,.export-actions').forEach(el=>el.remove());
  const now = new Date();
  const dateText = `${now.getFullYear()}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}`;
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${title}</title>
  <style>
    body{font-family:Arial,'Noto Sans KR',sans-serif;color:#111827;margin:28px;line-height:1.55;font-size:13px}
    h1{font-size:20px;margin:0 0 6px} h3{font-size:18px;margin:0 0 14px} h4{font-size:15px;margin:22px 0 8px}
    .doc-meta{font-size:12px;color:#667085;margin-bottom:18px;border-bottom:1px solid #d1d5db;padding-bottom:10px}
    .report-summary{border:1px solid #d1d5db;border-radius:8px;padding:10px;margin:10px 0 14px;background:#fff}
    .muted,.help{color:#4b5563;font-size:12px}.report-sentence{font-weight:700}
    table{width:100%;border-collapse:collapse;margin:8px 0 14px;font-size:12px} th,td{border:1px solid #d1d5db;padding:7px 8px;text-align:left;vertical-align:top}
    th{background:#f3f4f6;font-weight:700}.num{text-align:right;white-space:nowrap}.total-row td{font-weight:700;background:#f9fafb}
    details{border-top:1px solid #d1d5db;margin-top:12px;padding-top:8px}
    @page{size:A4;margin:16mm}
  </style></head><body><h1>${title}</h1><div class="doc-meta">Electrical Toolbox Pro · KEC 기반 전기 실무 보조 툴 · 출력일 ${dateText}</div>${clone.innerHTML}</body></html>`;
}
function v63Download(name, mime, content){
  const blob = new Blob([content], {type:mime});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url), 800);
}
function v63ExportPdf(){
  try{
    const html = v63ReportDocumentHtml();
    const w = window.open('', '_blank');
    if(!w){ alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도하세요.'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(()=>{ w.focus(); w.print(); }, 400);
  }catch(e){ alert(e.message); }
}
function v63ExportExcel(){
  try{
    const html = v63ReportDocumentHtml('전력절감 검토 보고서');
    const excelHtml = html.replace('<html lang="ko">','<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" lang="ko">');
    v63Download('전력절감_검토_보고서.xls','application/vnd.ms-excel;charset=utf-8','\ufeff'+excelHtml);
  }catch(e){ alert(e.message); }
}
function v63ExportDoc(){
  try{
    const html = v63ReportDocumentHtml('전력절감 검토 보고서');
    v63Download('전력절감_검토_보고서.doc','application/msword;charset=utf-8','\ufeff'+html);
  }catch(e){ alert(e.message); }
}
function v63ExportActions(){
  return `<div class="actions compact export-actions"><button type="button" class="secondary exportBtn" onclick="v63ExportPdf()">PDF로 열기/저장</button><button type="button" class="secondary exportBtn" onclick="v63ExportExcel()">엑셀로 저장</button></div><p class="help small">※ 보고용은 PDF, 추가 편집·분석은 엑셀 파일을 활용하세요.</p>`;
}

function v6Calculate(){
  try{
    if(!V6_ITEMS.length) throw new Error('설비를 1개 이상 추가하세요.');
    const tariff = getTariff();
    const climateRate = Number(v6E('climateRate')?.value || 9);
    const fuelRate = Number(v6E('fuelRate')?.value || 5);
    const basis = v6E('v6Basis')?.value || 'annual';
    const calc = v6AnnualCalc(V6_ITEMS, basis, tariff, climateRate, fuelRate);
    const rateText = basis==='annual' ? '연간 자동 산정(여름 92일, 봄·가을 153일, 겨울 120일)' : `${v62BasisLabel(basis)}(${v62SeasonDaysLabel(basis)})`;
    const summary = `<div class="report-summary"><div class="report-sentence">전력절감 검토 결과, ${basis==='annual'?'연간':'해당 기간'} 약 ${num(calc.annualKwh)}kWh의 전력 절감과 약 ${won(calc.annualMoney)}의 전기요금 절감이 예상됩니다.</div><div class="muted">계약종별: ${tariff.label} · 산정기준: ${rateText}</div></div>`;
    const html = `<h3>전력절감 검토 보고서</h3>${summary}${v6InstallTable(V6_ITEMS)}${v6ConditionTable(V6_ITEMS,basis)}${v6SavingTable(calc)}${v6SeasonTable(calc)}${v6Formula(calc)}${v63ExportActions()}<button class="copyBtn" data-copy="${escapeHtml('전력절감 검토 결과\n절감전력량: '+num(calc.annualKwh)+'kWh\n절감금액: '+won(calc.annualMoney))}">결과 복사하기</button>`;
    const out = v6E('energyResult'); out.innerHTML = html; out.classList.remove('hidden'); bindCopyButtons();
  }catch(e){ showEnergyError(e.message); }
}
function v6BuildEnergyUi(){
  const card = document.querySelector('#energy .card'); if(!card) return;
  card.innerHTML = `
    <h2>전력절감 검토</h2>
    <p class="help">설비별 확인값을 입력하면 한전 시간대 요금을 자동 반영해 보고서 표 형식으로 출력합니다.</p>
    <input type="hidden" id="tariffSeason" value="springAutumn" />
    <input type="hidden" id="tariffLoadMode" value="tou" />
    <input type="hidden" id="energyMode" value="saving" />
    <input type="hidden" id="basicRate" value="0" />
    <input type="hidden" id="energyRate" value="0" />
    <select id="touAutoMode" class="hidden"><option value="manualKwh">직접입력</option></select>
    <input type="hidden" id="lightHours" value="0" /><input type="hidden" id="midHours" value="0" /><input type="hidden" id="peakHours" value="0" />
    <input type="hidden" id="lightKwh" value="0" /><input type="hidden" id="midKwh" value="0" /><input type="hidden" id="peakKwh" value="0" />
    <input type="hidden" id="climateRate" value="9" /><input type="hidden" id="fuelRate" value="5" />
    <div class="grid">
      <label>계약종별<select id="tariffType"></select></label>
      <label>산정 기준<select id="v6Basis"><option value="annual" selected>연간 자동 산정</option><option value="summer">여름철만 검토</option><option value="springAutumn">봄·가을철만 검토</option><option value="winter">겨울철만 검토</option></select></label>
      <label>개선 구분<select id="v6Mode"><option value="time" selected>운전시간 개선</option><option value="power">전력량 절감</option></select></label>
    </div>
    <div class="card soft" style="margin-top:14px">
      <h3>설비 입력</h3>
      <div class="grid">
        <label>설비명<input id="v6Name" type="text" placeholder="예: 유량조정조 교반기" /></label>
        <label id="v6KwWrap">부하용량(kW)<input id="v6Kw" type="number" step="0.001" min="0" placeholder="예: 5.5" /></label>
        <label>대수<input id="v6Count" type="number" step="1" min="1" value="1" /></label>
      </div>
      <div id="v6TimeFields" class="compact-grid" style="margin-top:10px">
        <label>기존 가동 시간<input id="v6OldRange" type="text" placeholder="미입력 시 24시간"/><button type="button" class="mini time-pick-btn" data-target="v6OldRange">시간 선택</button></label>
        <label>개선 가동 시간<input id="v6NewRange" type="text" placeholder="미입력 시 24시간"/><button type="button" class="mini time-pick-btn" data-target="v6NewRange">시간 선택</button></label>
        <label>기존 정지 시간(분/시간)<input id="v6OldStop" type="number" step="1" min="0" max="59" placeholder="예: 30" /></label>
        <label>개선 정지 시간(분/시간)<input id="v6NewStop" type="number" step="1" min="0" max="59" placeholder="예: 40" /></label>
      </div>
      <div id="v6PowerFields" class="compact-grid hidden" style="margin-top:10px">
        <label>기존전력(kW)<input id="v6BeforeKw" type="number" step="0.001" min="0" placeholder="예: 64" /></label>
        <label>개선후 전력(kW)<input id="v6AfterKw" type="number" step="0.001" min="0" placeholder="예: 30" /></label>
      </div>
      <div class="actions compact"><button type="button" id="v6AddBtn" class="secondary">설비 추가</button></div>
      <div id="v6ItemList"></div>
    </div>
    <div id="timeRangePicker" class="time-picker hidden"><div class="time-picker-head"><div><strong>가동 시간 클릭 선택</strong><p class="help small">시작 시간을 누른 뒤 종료 시간을 누르면 입력란에 자동 추가됩니다.</p></div><button type="button" id="timePickerClose" class="mini secondary">닫기</button></div><div class="picker-status" id="pickerStatus">입력란을 선택하세요.</div><div class="time-grid" id="timeSlotGrid"></div><div class="actions compact"><button type="button" id="timePickerClear" class="secondary">선택 초기화</button></div></div>
    <div id="touTimeInfo" class="full"></div>
    <div class="actions"><button id="energyBtn" class="primary">보고서 계산</button><button id="energyResetBtn" class="secondary">초기화</button></div>`;
  initTariffSelect();
  v6E('v6Mode')?.addEventListener('change', v6UpdateMode);
  v6E('v6AddBtn')?.addEventListener('click', v6AddItem);
  v6E('energyBtn')?.addEventListener('click', v6Calculate);
  v6E('energyResetBtn')?.addEventListener('click', v6Reset);
  v6E('v6Basis')?.addEventListener('change', ()=>{ const b=v6E('v6Basis').value; if(b!=='annual' && v6E('tariffSeason')) v6E('tariffSeason').value=b; v62UpdateTimeGuide(); updateTariffInputs(); });
  v6E('tariffType')?.addEventListener('change', ()=>{ updateTariffInputs(); v62UpdateTimeGuide(); });
  initTimePicker(); v51WireTimePickerForDynamic(); v6UpdateMode(); v6RenderItems(); updateTariffInputs(); v62UpdateTimeGuide();
}
document.addEventListener('DOMContentLoaded',()=>{
  const eye = document.querySelector('.eyebrow'); if(eye) eye.textContent='KEC Edition · Ver 6.4';
  const foot = document.querySelector('.notice'); if(foot) foot.innerHTML='<strong>주의</strong> 본 프로그램은 KEC 기준과 2026년 6월 1일 시행 한전 요금표 기반의 실무 보조도구입니다. Ver 6.4는 전력절감 검토 보고서 출력을 PDF와 엑셀 중심으로 정리한 버전입니다. 실제 적용 전 현장 운전조건과 최신 요금 기준을 최종 확인하세요.';
});
