const $ = (id) => document.getElementById(id);

function init(){
  initTabs();
  initMotorSelects();
  initConduitSelect();
  $('inputMode').addEventListener('change', updateInputMode);
  $('recommendBtn').addEventListener('click', recommendMotor);
  $('resetBtn').addEventListener('click', resetMotor);
  $('conduitType').addEventListener('change', initConduitSelect);
  $('conduitBtn').addEventListener('click', recommendConduit);
  updateInputMode();
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
