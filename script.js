const $ = id => document.getElementById(id);
const qsa = sel => Array.from(document.querySelectorAll(sel));
const seasonsKo = {summer:'여름철(6월~8월)', springAutumn:'봄·가을철(3월~5월, 9월~10월)', winter:'겨울철(11월~2월)'};
const seasonsShortKo = {summer:'여름철', springAutumn:'봄·가을철', winter:'겨울철'};
const loadKo = {light:'경부하', mid:'중간부하', peak:'최대부하'};
let equipmentItems = [];
const timeRanges = {};

function init(){
  initTabs(); initMaterial(); initConduit(); initCable(); initTerminalBlock(); initSaving();
}
document.addEventListener('DOMContentLoaded', init);

function initTabs(){ qsa('.tab').forEach(btn=>btn.addEventListener('click',()=>{qsa('.tab').forEach(b=>b.classList.remove('active')); qsa('.panel').forEach(p=>p.classList.remove('active')); btn.classList.add('active'); $(btn.dataset.tab).classList.add('active');})); }
function won(n){return Math.round(Number(n)||0).toLocaleString('ko-KR')+'원'}
function num(n,d=1){return (Number(n)||0).toLocaleString('ko-KR',{maximumFractionDigits:d})}
function esc(s){return String(s??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));}

// ===== Material =====
function initMaterial(){
  $('matMotor').innerHTML = MOTOR_SIZES.map(m=>`<option value="${m.kw}">${m.kw}kW / ${m.hp}HP</option>`).join('');
  $('matMotor').value = '2.2';
  $('matInputMode').addEventListener('change', updateMatMode);
  $('matBtn').addEventListener('click', recommendMaterial);
  $('matReset').addEventListener('click', ()=>{$('matInputMode').value='direct';$('matKw').value='';$('matPhase').value='three';$('matPf').value='0.90';$('matEff').value='0.85';updateMatMode();$('matResult').classList.add('hidden');});
  updateMatMode();
}
function updateMatMode(){ const motor=$('matInputMode').value==='motor'; $('matDirectWrap').classList.toggle('hidden',motor); $('matMotorWrap').classList.toggle('hidden',!motor); $('matEff').readOnly=!motor; if(!motor) $('matEff').value='1.00'; else if(Number($('matEff').value)>=1) $('matEff').value='0.85'; }
function pickBreaker(a){return BREAKER_RATINGS.find(x=>x>=a) || BREAKER_RATINGS[BREAKER_RATINGS.length-1];}
function pickFrame(at){return (BREAKER_FRAMES.find(f=>at<=f.max)||BREAKER_FRAMES[BREAKER_FRAMES.length-1]).frame;}
function pickCable(inA){return CABLES.find(c=>c.iz>=inA) || CABLES[CABLES.length-1];}
function recommendMaterial(){
  try{
    const phase=$('matPhase').value, motor=$('matInputMode').value==='motor';
    const kw = motor ? Number($('matMotor').value) : Number($('matKw').value);
    if(!kw||kw<=0) throw new Error('부하용량을 입력하세요.');
    const pf=Number($('matPf').value)||0.9, eff=motor?(Number($('matEff').value)||0.85):1;
    const v = phase==='three'?380:220;
    const ib = phase==='three' ? (kw*1000/(Math.sqrt(3)*v*pf*eff)) : (kw*1000/(v*pf*eff));
    const demand = motor ? ib*1.25 : ib;
    const at = pickBreaker(demand); const frame=pickFrame(at); const cable=pickCable(at);
    const loc=LOCATION_RULES[$('matLocation').value]; const conduitType=loc.conduitType; const conduitSize=cable.sq<=4?22:cable.sq<=10?28:cable.sq<=25?36:cable.sq<=50?42:54;
    const fit=CONDUIT_ACCESSORIES[conduitType].fittings(conduitSize);
    $('matResult').innerHTML = `<div class="card"><h3>추천 결과</h3><div class="actions"><button class="secondary" onclick="copyElementText('matResult')">결과 복사</button></div><div class="table-wrap"><table class="report-table"><tbody><tr><th>전원 방식</th><td>${phase==='three'?'삼상 380V':'단상 220V'}</td></tr><tr><th>부하용량</th><td>${num(kw,2)}kW${motor?` (${(MOTOR_SIZES.find(m=>Number(m.kw)===kw)||{}).hp||''}HP)`:''}</td></tr><tr><th>설계전류</th><td>${num(ib,2)}A</td></tr></tbody></table></div><h4>추천 자재</h4><div class="table-wrap"><table class="report-table"><tbody><tr><th>MCCB</th><td>${phase==='three'?'3P':'2P'} ${frame}AF / ${at}AT</td></tr><tr><th>ELB</th><td>${phase==='three'?'3P':'2P'} ${frame}AF / ${at}AT</td></tr><tr><th>케이블</th><td>CV ${phase==='three'?'4C':'2C'} × ${cable.sq}SQ</td></tr><tr><th>터미널</th><td>${cable.terminal}</td></tr><tr><th>단자대</th><td>${at<=30?'30A':at<=60?'60A':at<=100?'100A':at<=200?'200A':'제조사 확인'} ${phase==='three'?'4P':'2P'}</td></tr><tr><th>전선관</th><td>${conduitType}${conduitSize}</td></tr><tr><th>부속</th><td>${fit.connector}, ${fit.insert}, ${fit.saddle}</td></tr><tr><th>홀커터</th><td>${HOLE_CUTTERS[conduitSize]}</td></tr></tbody></table></div><h4>KEC 검토</h4><div class="table-wrap"><table class="report-table"><thead><tr><th>기호</th><th>의미</th><th>값</th></tr></thead><tbody><tr><td>IB</td><td>설계전류</td><td class="right">${num(ib,2)}A</td></tr><tr><td>In</td><td>차단기 정격전류</td><td class="right">${at}A</td></tr><tr><td>Iz</td><td>전선 허용전류</td><td class="right">${cable.iz}A</td></tr></tbody></table></div><div class="basis">KEC 검토: IB ≤ In ≤ Iz 조건 ${ib<=at&&at<=cable.iz?'만족':'확인 필요'}. 실제 현장 적용 전 포설방법, 주위온도, 집합보정, 전압강하, 단락전류를 확인하세요.</div></div>`;
    $('matResult').classList.remove('hidden');
  }catch(e){alert(e.message)}
}

// ===== Accessories =====
function initConduit(){ $('conduitType').addEventListener('change', renderConduitSizes); $('conduitBtn').addEventListener('click', recommendConduit); renderConduitSizes(); }
function renderConduitSizes(){const t=$('conduitType').value; $('conduitSize').innerHTML=CONDUIT_ACCESSORIES[t].sizes.map(s=>`<option value="${s}">${t}${s}</option>`).join('');}
function recommendConduit(){const t=$('conduitType').value, s=$('conduitSize').value, f=CONDUIT_ACCESSORIES[t].fittings(s); $('conduitResult').innerHTML=`<div class="card"><h3>${t}${s} 부속</h3><div class="actions"><button class="secondary" onclick="copyElementText('conduitResult')">결과 복사</button></div><table class="report-table"><tbody><tr><th>커넥터</th><td>${f.connector}</td></tr><tr><th>인서트/부싱</th><td>${f.insert}</td></tr><tr><th>새들</th><td>${f.saddle}</td></tr><tr><th>홀커터</th><td>${HOLE_CUTTERS[s]}</td></tr></tbody></table></div>`; $('conduitResult').classList.remove('hidden');}
function initCable(){ $('cableSq').innerHTML=CABLE_ACCESSORY_DB.map(c=>`<option value="${c.sq}">${c.sq}SQ</option>`).join(''); $('cableBtn').addEventListener('click', recommendCable); }
function recommendCable(){const sq=Number($('cableSq').value), d=CABLE_ACCESSORY_DB.find(c=>c.sq===sq), info=CABLE_TYPE_INFO[$('cableType').value]; $('cableResult').innerHTML=`<div class="card"><h3>케이블 자재 추천</h3><div class="actions"><button class="secondary" onclick="copyElementText('cableResult')">결과 복사</button></div><table class="report-table"><tbody><tr><th>케이블</th><td>${info.label} × ${sq}SQ</td></tr><tr><th>추천 터미널</th><td>${d.terminal}</td></tr><tr><th>비고</th><td>${info.note}</td></tr></tbody></table></div>`; $('cableResult').classList.remove('hidden');}
function initTerminalBlock(){ $('tbAmp').innerHTML=TERMINAL_BLOCK_DB.map(t=>`<option value="${t.amp}">${t.amp}A 단자대</option>`).join(''); $('tbSq').innerHTML=CABLE_ACCESSORY_DB.map(c=>`<option value="${c.sq}">${c.sq}SQ</option>`).join(''); $('tbAmp').addEventListener('change',()=>{const b=TERMINAL_BLOCK_DB.find(x=>x.amp===Number($('tbAmp').value)); if(b) $('tbSq').value=b.defaultSq;}); $('tbBtn').addEventListener('click', recommendTerminalBlock); $('tbAmp').dispatchEvent(new Event('change'));}
function recommendTerminalBlock(){const amp=Number($('tbAmp').value), sq=Number($('tbSq').value), b=TERMINAL_BLOCK_DB.find(x=>x.amp===amp), c=CABLE_ACCESSORY_DB.find(x=>x.sq===sq); $('tbResult').innerHTML=`<div class="card"><h3>단자대·터미널 선정</h3><div class="actions"><button class="secondary" onclick="copyElementText('tbResult')">결과 복사</button></div><table class="report-table"><tbody><tr><th>단자대</th><td>${amp}A ${$('tbPole').value}</td></tr><tr><th>케이블 범위</th><td>${b.cableRange}</td></tr><tr><th>선택 케이블</th><td>${sq}SQ</td></tr><tr><th>추천 터미널</th><td>${c?c.terminal:'제조사 확인'}</td></tr></tbody></table></div>`; $('tbResult').classList.remove('hidden');}

// ===== Saving =====
function initSaving(){
  $('saveTariff').innerHTML=TARIFFS.map(t=>`<option value="${t.id}">${t.label}</option>`).join(''); $('saveTariff').value='industrial_b_highA_1';
  renderTimeSelectors();
  $('sameKw').addEventListener('change', syncSameInputs); $('sameCount').addEventListener('change', syncSameInputs); $('sameRunMin').addEventListener('change', syncSameInputs); $('eqAllYear').addEventListener('change', syncPeriodMode);
  ['oldKw','oldCount','oldRunMin'].forEach(id=>$(id).addEventListener('input', syncSameInputs));
  $('addEquip').addEventListener('click', addEquipment);
  $('clearEquipInput').addEventListener('click', clearEquipmentInput);
  $('calcSaving').addEventListener('click', renderSavingReport);
  $('resetSaving').addEventListener('click', ()=>{equipmentItems=[]; renderEquipmentList(); $('savingResult').classList.add('hidden'); clearEquipmentInput();});
  syncSameInputs(); syncPeriodMode();
}
function syncSameInputs(){
  if($('sameKw').checked){$('newKw').value=$('oldKw').value; $('newKwWrap').classList.add('hidden');} else {$('newKwWrap').classList.remove('hidden');}
  if($('sameCount').checked){$('newCount').value=$('oldCount').value; $('newCountWrap').classList.add('hidden');} else {$('newCountWrap').classList.remove('hidden');}
  if($('sameRunMin').checked){$('newRunMin').value=$('oldRunMin').value; $('newRunMinWrap').classList.add('hidden');} else {$('newRunMinWrap').classList.remove('hidden');}
}

function syncPeriodMode(){
  const allYear = $('eqAllYear')?.checked;
  $('eqPeriodCustom')?.classList.toggle('hidden', !!allYear);
}
function renderTimeSelectors(){
  const defs=[
    ['oldNonWinter','기존 가동시간 (봄·가을철·여름철 / 3월~10월)',false],
    ['newNonWinter','변경 가동시간 (봄·가을철·여름철 / 3월~10월)',true],
    ['oldWinter','기존 가동시간 (겨울철 / 11월~2월)',false],
    ['newWinter','변경 가동시간 (겨울철 / 11월~2월)',true]
  ];
  defs.forEach(([key])=>{ if(!timeRanges[key]) timeRanges[key]=[]; });
  $('timeSelectors').innerHTML=defs.map(([key,title,isNew])=>timeCardHtml(key,title,isNew)).join('') + kepcoTimeGuideHtml();
  defs.forEach(([key])=>renderRangeList(key));
  ['sameTimeNonWinter','sameTimeWinter'].forEach(id=>$(id)?.addEventListener('change', syncSameTimes));
  syncSameTimes();
}
function hourOptions(selected){return Array.from({length:25},(_,h)=>`<option value="${h}" ${h===selected?'selected':''}>${String(h).padStart(2,'0')}:00</option>`).join('')}
function timeCardHtml(key,title,isNew){return `<div class="time-card"><h4>${title}${isNew?` <span class="same-inline"><input id="${key==='newNonWinter'?'sameTimeNonWinter':'sameTimeWinter'}" type="checkbox" checked /> 기존과 동일</span>`:''}</h4><div id="body_${key}"><div class="range-row"><label>시작<select id="start_${key}">${hourOptions(0)}</select></label><label>종료<select id="end_${key}">${hourOptions(24)}</select></label><button type="button" class="mini" onclick="addTimeRange('${key}')">구간 추가</button></div><div class="time-tools"><button type="button" class="mini" onclick="clearHours('${key}')">선택 초기화</button></div><div id="ranges_${key}" class="range-list"></div><p class="small">예: 05:00~07:00</p></div></div>`}
function kepcoTimeGuideHtml(){return `<div class="time-guide full"><h4>한전 계절별 부하 시간대 참고</h4><div class="table-wrap"><table class="report-table"><thead><tr><th>계절</th><th>적용기간</th><th>경부하</th><th>중간부하</th><th>최대부하</th></tr></thead><tbody><tr><td>봄·가을철</td><td>3월~5월, 9월~10월</td><td>22:00~08:00</td><td>08:00~15:00, 21:00~22:00</td><td>15:00~21:00</td></tr><tr><td>여름철</td><td>6월~8월</td><td>22:00~08:00</td><td>08:00~15:00, 21:00~22:00</td><td>15:00~21:00</td></tr><tr><td>겨울철</td><td>11월~2월</td><td>22:00~08:00</td><td>08:00~09:00, 12:00~16:00, 19:00~22:00</td><td>09:00~12:00, 16:00~19:00</td></tr></tbody></table></div></div>`}
function selectedHoursRaw(key){return (timeRanges[key]||[]).flatMap(r=>Array.from({length:r.end-r.start},(_,i)=>r.start+i)).filter((v,i,a)=>a.indexOf(v)===i).sort((a,b)=>a-b)}
function selectedHours(key){const v=selectedHoursRaw(key); return v.length ? v : Array.from({length:24},(_,i)=>i)}
function addTimeRange(key){const start=Number($('start_'+key).value), end=Number($('end_'+key).value); if(end<=start) return alert('종료시간은 시작시간보다 커야 합니다.'); if(start<0||end>24) return alert('시간 범위를 확인하세요.'); timeRanges[key].push({start,end}); mergeRanges(key); renderRangeList(key); syncSameTimes(false)}
function mergeRanges(key){const arr=(timeRanges[key]||[]).sort((a,b)=>a.start-b.start); const out=[]; arr.forEach(r=>{const last=out[out.length-1]; if(last&&r.start<=last.end) last.end=Math.max(last.end,r.end); else out.push({...r});}); timeRanges[key]=out;}
function rangeLabel(r){return `${String(r.start).padStart(2,'0')}:00~${String(r.end).padStart(2,'0')}:00`}
function renderRangeList(key){const el=$('ranges_'+key); if(!el) return; const arr=timeRanges[key]||[]; el.innerHTML=arr.length ? arr.map((r,i)=>`<span class="range-chip">${rangeLabel(r)} <button type="button" onclick="removeTimeRange('${key}',${i})">×</button></span>`).join('') : '<span class="small">-</span>'}
function removeTimeRange(key,i){timeRanges[key].splice(i,1); renderRangeList(key); syncSameTimes(false)}
function selectAllHours(key){timeRanges[key]=[{start:0,end:24}]; renderRangeList(key); syncSameTimes();}
function clearHours(key){timeRanges[key]=[]; renderRangeList(key); syncSameTimes();}
function syncSameTimes(){
  if($('sameTimeNonWinter')?.checked){timeRanges.newNonWinter=(timeRanges.oldNonWinter||[]).map(r=>({...r})); renderRangeList('newNonWinter'); $('body_newNonWinter').classList.add('hidden')} else {$('body_newNonWinter').classList.remove('hidden')}
  if($('sameTimeWinter')?.checked){timeRanges.newWinter=(timeRanges.oldWinter||[]).map(r=>({...r})); renderRangeList('newWinter'); $('body_newWinter').classList.add('hidden')} else {$('body_newWinter').classList.remove('hidden')}
}

function addEquipment(){
  syncSameInputs(); syncSameTimes();
  const item={
    name:$('eqName').value.trim()||'설비',
    oldKw:Number($('oldKw').value), newKw:Number($('newKw').value),
    oldCount:Number($('oldCount').value), newCount:Number($('newCount').value),
    oldRunMin:Math.min(60,Math.max(0,Number($('oldRunMin').value)||0)), newRunMin:Math.min(60,Math.max(0,Number($('newRunMin').value)||0)),
    oldNonWinter:selectedHoursRaw('oldNonWinter'), newNonWinter:selectedHoursRaw('newNonWinter'), oldWinter:selectedHoursRaw('oldWinter'), newWinter:selectedHoursRaw('newWinter'),
    allYear: !!$('eqAllYear')?.checked, calcDays:Math.max(1,Math.floor(Number($('eqCalcDays').value)||365)), season:$('eqSeason').value,
    note:$('eqNote') ? $('eqNote').value.trim() : ''
  };
  if(!item.oldKw||item.oldKw<=0) return alert('기존 부하를 입력하세요.');
  if(!item.newKw||item.newKw<=0) return alert('변경 부하를 입력하세요.');
  if(!item.oldCount||item.oldCount<=0||!item.newCount||item.newCount<=0) return alert('대수를 입력하세요.');
  equipmentItems.push(item); renderEquipmentList(); clearEquipmentInput();
}
function clearEquipmentInput(){ $('eqName').value=''; $('oldKw').value=''; $('newKw').value=''; $('oldCount').value='1'; $('newCount').value='1'; $('oldRunMin').value='60'; $('newRunMin').value='60'; $('sameKw').checked=true; $('sameCount').checked=true; $('sameRunMin').checked=true; $('sameTimeNonWinter').checked=true; $('sameTimeWinter').checked=true; $('eqAllYear').checked=true; $('eqCalcDays').value='90'; $('eqSeason').value='springAutumn'; if($('eqNote')) $('eqNote').value=''; ['oldNonWinter','newNonWinter','oldWinter','newWinter'].forEach(k=>timeRanges[k]=[]); renderTimeSelectors(); syncSameInputs(); syncPeriodMode(); }
function renderEquipmentList(){
  const box=$('equipmentList'); if(!equipmentItems.length){box.classList.add('hidden'); box.innerHTML=''; return;}
  box.classList.remove('hidden'); box.innerHTML=`<h3>추가된 설비</h3>${equipmentItems.map((it,i)=>`<div class="equipment-item"><div><b>${i+1}. ${esc(it.name)}</b><div class="small">기존 ${num(it.oldKw,2)}kW × ${it.oldCount}대 → 변경 ${powerChanged(it)?`${num(it.newKw,2)}kW × ${it.newCount}대`:'기존과 동일'} · ${classifyItem(it)} · ${periodLabel(it)}${it.note?' · '+esc(it.note):''}</div></div><button class="mini" onclick="removeEquipment(${i})">삭제</button></div>`).join('')}`;
}
function removeEquipment(i){equipmentItems.splice(i,1); renderEquipmentList();}
function hoursChanged(it){return selectedComparable(it.oldNonWinter)!==selectedComparable(it.newNonWinter) || selectedComparable(it.oldWinter)!==selectedComparable(it.newWinter) || it.oldRunMin!==it.newRunMin}
function selectedComparable(arr){return (arr && arr.length ? arr : []).join(',')}
function powerChanged(it){return it.oldKw!==it.newKw || it.oldCount!==it.newCount}
function classifyItem(it){const p=powerChanged(it), h=hoursChanged(it); if(p&&h) return '복합 절감'; if(p) return '전력량 절감'; if(h) return '운전시간 변경'; return '변경 없음'}

function seasonOfDate(d){const m=d.getMonth()+1; if([6,7,8].includes(m)) return 'summer'; if([3,4,5,9,10].includes(m)) return 'springAutumn'; return 'winter'}
function opGroupOfSeason(season){return season==='winter'?'winter':'nonWinter'}
const ANNUAL_DAYS = {summer:92, springAutumn:153, winter:120};
function getItemDays(item){return item.allYear ? 365 : Math.max(1,Math.floor(Number(item.calcDays)||365))}
function itemSeasonDays(item){return item.allYear ? {...ANNUAL_DAYS} : {summer:0, springAutumn:0, winter:0, [item.season]:getItemDays(item)}}
function periodLabel(item){return item.allYear ? '연중운전 365일' : `${seasonsShortKo[item.season]} ${getItemDays(item)}일`}
function touKind(season,h){ if(h>=22||h<8) return 'light'; if(season==='winter'){ if((h>=9&&h<12)||(h>=16&&h<19)) return 'peak'; return 'mid'; } if(h>=15&&h<21) return 'peak'; return 'mid'; }
function tariffById(){return TARIFFS.find(t=>t.id===$('saveTariff').value)||TARIFFS[0]}
function rateFor(tariff,season,kind){ if(tariff.type==='tou') return tariff.energy[season][kind]; return tariff.energy[season]; }
function itemHours(item,changed,opGroup){const raw=changed?(opGroup==='winter'?item.newWinter:item.newNonWinter):(opGroup==='winter'?item.oldWinter:item.oldNonWinter); return raw && raw.length ? raw : []}
function itemRunFactor(item,changed){const min=changed?item.newRunMin:item.oldRunMin; return (Number(min)||0)/60}
function kwhBySeasonAndKind(item,changed,season,opGroup){ const hours=itemHours(item,changed,opGroup); const kw=(changed?item.newKw:item.oldKw)*(changed?item.newCount:item.oldCount); const f=itemRunFactor(item,changed); const out={light:0,mid:0,peak:0,total:0}; hours.forEach(h=>{const kind=touKind(season,h); out[kind]+=kw*f; out.total+=kw*f;}); return out; }
function calcItem(item,tariff){
  const r={oldKwh:0,newKwh:0,oldMoney:0,newMoney:0,bySeason:{summer:0,springAutumn:0,winter:0}};
  const daysBySeason=itemSeasonDays(item);
  Object.entries(daysBySeason).forEach(([season,days])=>{
    if(!days) return;
    const opGroup=opGroupOfSeason(season);
    const old=kwhBySeasonAndKind(item,false,season,opGroup), neu=kwhBySeasonAndKind(item,true,season,opGroup);
    ['light','mid','peak'].forEach(k=>{r.oldMoney+=old[k]*rateFor(tariff,season,k)*days; r.newMoney+=neu[k]*rateFor(tariff,season,k)*days});
    r.oldKwh+=old.total*days; r.newKwh+=neu.total*days; r.bySeason[season]+=days;
  });
  r.saveKwh=r.oldKwh-r.newKwh; r.saveMoney=r.oldMoney-r.newMoney; r.saveRate=r.oldKwh>0?r.saveKwh/r.oldKwh*100:0; return r;
}
function renderSavingReport(){
  try{
    if(!equipmentItems.length) throw new Error('설비를 먼저 추가하세요.');
    const tariff=tariffById();
    const results=equipmentItems.map(it=>({item:it, calc:calcItem(it,tariff)}));
    const total=results.reduce((a,x)=>{a.oldKwh+=x.calc.oldKwh; a.newKwh+=x.calc.newKwh; a.saveKwh+=x.calc.saveKwh; a.saveMoney+=x.calc.saveMoney; return a},{oldKwh:0,newKwh:0,saveKwh:0,saveMoney:0});
    total.saveRate=total.oldKwh?total.saveKwh/total.oldKwh*100:0;
    $('savingResult').innerHTML=`<div class="card" id="savingReport"><h3>전력절감 검토 결과</h3><div class="actions report-actions"><button class="secondary" onclick="copyElementText('savingReport')">전체 결과 복사</button><button class="secondary" onclick="printSavingReport()">PDF로 열기/저장</button><button class="secondary" onclick="exportSavingExcel()">엑셀로 저장</button></div><div class="basis">계약종별: ${esc(tariff.label)} · 설비별 산정기간 적용</div>${rateTable(tariff)}${installTable(results)}${conditionTable(results)}${effectTable(results,total)}${basisDetails(results)}</div>`;
    $('savingResult').classList.remove('hidden');
  }catch(e){alert(e.message)}
}
function conditionText(kw,count){return `${num(kw,2)}kW × ${count}대 = ${num(kw*count,2)}kW`}
function installTable(results){return `<h4>1. 설치현황</h4><div class="table-wrap"><table class="report-table"><thead><tr><th>No</th><th>설비명</th><th>산정기간</th><th>기존 조건</th><th>변경 조건</th><th>절감 구분</th><th>비고</th></tr></thead><tbody>${results.map((x,i)=>{const same=!powerChanged(x.item); const oldTxt=conditionText(x.item.oldKw,x.item.oldCount); const newTxt=same?'기존과 동일':conditionText(x.item.newKw,x.item.newCount); return `<tr><td class="center">${i+1}</td><td>${esc(x.item.name)}</td><td>${periodLabel(x.item)}</td><td class="right">${oldTxt}</td><td class="right">${newTxt}</td><td>${classifyItem(x.item)}</td><td>${x.item.note?esc(x.item.note):'-'}</td></tr>`}).join('')}</tbody></table></div>`}
function operationText(item,group,changed,season){const hours=itemHours(item,changed,group); const f=itemRunFactor(item,changed); const by={light:[],mid:[],peak:[]}; hours.forEach(h=>by[touKind(season,h)].push(h)); const lines=['light','mid','peak'].filter(k=>by[k].length).map(k=>`${loadKo[k]} ${num(by[k].length*f,2)}h/일 (${compressHours(by[k])})`); const runMin=changed?item.newRunMin:item.oldRunMin; if(Number(runMin)<60) lines.push(`가동 ${runMin}분 / 정지 ${60-runMin}분`); return lines.join('<br>') || '가동시간 없음'}
function actualRunHours(item,group,changed){return itemHours(item,changed,group).length*itemRunFactor(item,changed)}
function conditionTable(results){
  const rows=[];
  results.forEach((x,i)=>{
    const it=x.item;
    const groups = it.allYear ? [
      {label:'봄·가을철·여름철 기준(3월~10월)', season:'springAutumn', group:'nonWinter'},
      {label:'겨울철 기준(11월~2월)', season:'winter', group:'winter'}
    ] : [{label:seasonsKo[it.season], season:it.season, group:opGroupOfSeason(it.season)}];
    groups.forEach((g,idx)=>{
      const oldPower = conditionText(it.oldKw,it.oldCount);
      const newPower = powerChanged(it) ? conditionText(it.newKw,it.newCount) : '기존과 동일';
      const oldOp = operationText(it,g.group,false,g.season);
      const newOp = hoursChanged(it) ? operationText(it,g.group,true,g.season) : '기존과 동일';
      const dec = actualRunHours(it,g.group,false)-actualRunHours(it,g.group,true);
      rows.push(`<tr>${idx===0?`<td rowspan="${groups.length}">${i+1}</td><td rowspan="${groups.length}">${esc(it.name)}</td><td rowspan="${groups.length}">${classifyItem(it)}</td>`:''}<td>${g.label}</td><td>${oldPower}<br>${oldOp}</td><td>${newPower}<br>${newOp}</td><td>${hoursChanged(it)?`${num(dec,2)}h/일`:'-'}</td>${idx===0?`<td rowspan="${groups.length}">${it.note?esc(it.note):'-'}</td>`:''}</tr>`);
    });
  });
  return `<h4>2. 절감 조건</h4><div class="table-wrap"><table class="report-table"><thead><tr><th>No</th><th>설비명</th><th>절감 구분</th><th>기간/기준</th><th>기존 조건</th><th>변경 조건</th><th>가동시간 감소</th><th>비고</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`
}
function effectTable(results,total){return `<h4>3. 절감효과</h4><div class="table-wrap"><table class="report-table"><thead><tr><th>설비명</th><th>기존 전력</th><th>변경 전력</th><th>연 절감전력</th><th>절감률</th><th>연 절감금액</th></tr></thead><tbody>${results.map(x=>`<tr><td>${esc(x.item.name)}</td><td>${num(x.item.oldKw*x.item.oldCount,2)}kW</td><td>${num(x.item.newKw*x.item.newCount,2)}kW</td><td class="bold">${num(x.calc.saveKwh,0)}kWh</td><td>${num(x.calc.saveRate,1)}%</td><td class="bold">${won(x.calc.saveMoney)}</td></tr>`).join('')}<tr><th>합계</th><th>-</th><th>-</th><th>${num(total.saveKwh,0)}kWh</th><th>${num(total.saveRate,1)}%</th><th>${won(total.saveMoney)}</th></tr></tbody></table></div>`}
function seasonPeriod(s){return s==='summer'?'6월~8월':s==='springAutumn'?'3월~5월, 9월~10월':'11월~2월'}
function rateTable(tariff){const rows=['summer','springAutumn','winter'].map(s=>{if(tariff.type==='tou'){const e=tariff.energy[s]; return `<tr><td>${seasonsShortKo[s]}</td><td>${seasonPeriod(s)}</td><td>${e.light}</td><td>${e.mid}</td><td>${e.peak}</td></tr>`} return `<tr><td>${seasonsShortKo[s]}</td><td>${seasonPeriod(s)}</td><td colspan="3">${tariff.energy[s]}</td></tr>`}).join(''); return `<h4>적용 전력량 요금 단가</h4><div class="table-wrap"><table class="report-table"><thead><tr><th>계절</th><th>적용기간</th><th>경부하</th><th>중간부하</th><th>최대부하</th></tr></thead><tbody>${rows}</tbody></table></div>`}
function basisDetails(results){const basisRows=results.map(x=>`<tr><td>${esc(x.item.name)}</td><td>${periodLabel(x.item)}</td><td>${classifyItem(x.item)}</td><td>${x.item.note?esc(x.item.note):'-'}</td><td>부하(kW) × 대수 × 가동시간(h) × 가동분/60 × 산정일수</td></tr>`).join(''); return `<details><summary>계산근거 및 산정기준 보기</summary><div class="table-wrap"><table class="report-table"><thead><tr><th>설비명</th><th>산정기준</th><th>절감 구분</th><th>비고</th><th>계산식</th></tr></thead><tbody>${basisRows}</tbody></table></div><div class="basis">연 절감전력 = 기존 사용량 - 변경 사용량<br>연 절감금액 = 시간대별 절감전력량 × 한전 전력량요금 단가</div></details>`}
function compressHours(hours){ if(!hours.length) return ''; const sorted=[...hours].sort((a,b)=>a-b); const ranges=[]; let start=sorted[0], prev=sorted[0]; for(let i=1;i<=sorted.length;i++){ if(sorted[i]===prev+1){prev=sorted[i]; continue;} ranges.push(`${String(start).padStart(2,'0')}:00~${String((prev+1)%24).padStart(2,'0')}:00`); start=prev=sorted[i]; } return ranges.join(', '); }

function copyElementText(id){const el=$(id); if(!el) return; navigator.clipboard?.writeText(el.innerText).then(()=>alert('복사했습니다.')).catch(()=>alert('복사에 실패했습니다.'));}
function copySection(btn){const h=btn.closest('h4'); let txt=h.innerText.replace('복사','').trim(); let next=h.nextElementSibling; if(next) txt+='\n'+next.innerText; navigator.clipboard?.writeText(txt).then(()=>alert('복사했습니다.')).catch(()=>alert('복사에 실패했습니다.'));}
function printSavingReport(){window.print();}
function exportSavingExcel(){const report=$('savingReport'); if(!report) return alert('먼저 결과를 산출하세요.'); const html=`<html><head><meta charset="utf-8"></head><body>${report.innerHTML}</body></html>`; const blob=new Blob([html],{type:'application/vnd.ms-excel'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='전력절감_검토보고서.xls'; a.click(); URL.revokeObjectURL(a.href);}
