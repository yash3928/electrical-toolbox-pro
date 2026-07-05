const $ = id => document.getElementById(id);
const qsa = sel => Array.from(document.querySelectorAll(sel));
const seasonsKo = {summer:'여름철', springAutumn:'봄·가을철', winter:'겨울철'};
const loadKo = {light:'경부하', mid:'중간부하', peak:'최대부하'};
let equipmentItems = [];

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
    $('matResult').innerHTML = `<div class="card"><h3>추천 결과</h3><div class="kpi"><div class="box"><div class="k">IB 설계전류</div><div class="v">${num(ib,2)}A</div></div><div class="box"><div class="k">In 차단기 정격</div><div class="v">${at}A</div></div><div class="box"><div class="k">Iz 전선 허용전류</div><div class="v">${cable.iz}A</div></div></div><div class="table-wrap"><table class="report-table"><tbody><tr><th>MCCB</th><td>3P ${frame}AF / ${at}AT</td></tr><tr><th>ELB</th><td>3P ${frame}AF / ${at}AT</td></tr><tr><th>케이블</th><td>CV 4C × ${cable.sq}SQ</td></tr><tr><th>터미널</th><td>${cable.terminal}</td></tr><tr><th>전선관</th><td>${conduitType}${conduitSize}</td></tr><tr><th>부속</th><td>${fit.connector}, ${fit.insert}, ${fit.saddle}</td></tr><tr><th>홀커터</th><td>${HOLE_CUTTERS[conduitSize]}</td></tr></tbody></table></div><div class="basis">KEC 검토: IB(설계전류) ≤ In(차단기 정격전류) ≤ Iz(전선 허용전류)를 우선 확인합니다. 실제 현장 적용 전 포설방법, 주위온도, 집합보정, 전압강하, 단락전류를 확인하세요.</div></div>`;
    $('matResult').classList.remove('hidden');
  }catch(e){alert(e.message)}
}

// ===== Accessories =====
function initConduit(){ $('conduitType').addEventListener('change', renderConduitSizes); $('conduitBtn').addEventListener('click', recommendConduit); renderConduitSizes(); }
function renderConduitSizes(){const t=$('conduitType').value; $('conduitSize').innerHTML=CONDUIT_ACCESSORIES[t].sizes.map(s=>`<option value="${s}">${t}${s}</option>`).join('');}
function recommendConduit(){const t=$('conduitType').value, s=$('conduitSize').value, f=CONDUIT_ACCESSORIES[t].fittings(s); $('conduitResult').innerHTML=`<div class="card"><h3>${t}${s} 부속</h3><table class="report-table"><tbody><tr><th>커넥터</th><td>${f.connector}</td></tr><tr><th>인서트/부싱</th><td>${f.insert}</td></tr><tr><th>새들</th><td>${f.saddle}</td></tr><tr><th>홀커터</th><td>${HOLE_CUTTERS[s]}</td></tr></tbody></table></div>`; $('conduitResult').classList.remove('hidden');}
function initCable(){ $('cableSq').innerHTML=CABLE_ACCESSORY_DB.map(c=>`<option value="${c.sq}">${c.sq}SQ</option>`).join(''); $('cableBtn').addEventListener('click', recommendCable); }
function recommendCable(){const sq=Number($('cableSq').value), d=CABLE_ACCESSORY_DB.find(c=>c.sq===sq), info=CABLE_TYPE_INFO[$('cableType').value]; $('cableResult').innerHTML=`<div class="card"><h3>케이블 자재 추천</h3><table class="report-table"><tbody><tr><th>케이블</th><td>${info.label} × ${sq}SQ</td></tr><tr><th>추천 터미널</th><td>${d.terminal}</td></tr><tr><th>비고</th><td>${info.note}</td></tr></tbody></table></div>`; $('cableResult').classList.remove('hidden');}
function initTerminalBlock(){ $('tbAmp').innerHTML=TERMINAL_BLOCK_DB.map(t=>`<option value="${t.amp}">${t.amp}A 단자대</option>`).join(''); $('tbSq').innerHTML=CABLE_ACCESSORY_DB.map(c=>`<option value="${c.sq}">${c.sq}SQ</option>`).join(''); $('tbAmp').addEventListener('change',()=>{const b=TERMINAL_BLOCK_DB.find(x=>x.amp===Number($('tbAmp').value)); if(b) $('tbSq').value=b.defaultSq;}); $('tbBtn').addEventListener('click', recommendTerminalBlock); $('tbAmp').dispatchEvent(new Event('change'));}
function recommendTerminalBlock(){const amp=Number($('tbAmp').value), sq=Number($('tbSq').value), b=TERMINAL_BLOCK_DB.find(x=>x.amp===amp), c=CABLE_ACCESSORY_DB.find(x=>x.sq===sq); $('tbResult').innerHTML=`<div class="card"><h3>단자대·터미널 선정</h3><table class="report-table"><tbody><tr><th>단자대</th><td>${amp}A ${$('tbPole').value}</td></tr><tr><th>케이블 범위</th><td>${b.cableRange}</td></tr><tr><th>선택 케이블</th><td>${sq}SQ</td></tr><tr><th>추천 터미널</th><td>${c?c.terminal:'제조사 확인'}</td></tr></tbody></table></div>`; $('tbResult').classList.remove('hidden');}

// ===== Saving =====
function initSaving(){
  $('saveTariff').innerHTML=TARIFFS.map(t=>`<option value="${t.id}">${t.label}</option>`).join(''); $('saveTariff').value='industrial_b_highA_1';
  renderTimeSelectors();
  $('allYear').addEventListener('change', updatePeriodUi);
  $('sameKw').addEventListener('change', syncSameInputs); $('sameCount').addEventListener('change', syncSameInputs);
  ['oldKw','oldCount'].forEach(id=>$(id).addEventListener('input', syncSameInputs));
  $('addEquip').addEventListener('click', addEquipment);
  $('clearEquipInput').addEventListener('click', clearEquipmentInput);
  $('calcSaving').addEventListener('click', renderSavingReport);
  $('resetSaving').addEventListener('click', ()=>{equipmentItems=[]; renderEquipmentList(); $('savingResult').classList.add('hidden'); clearEquipmentInput();});
  updatePeriodUi(); syncSameInputs();
}
function updatePeriodUi(){const on=$('allYear').checked; $('startDateWrap').classList.toggle('hidden',on); $('endDateWrap').classList.toggle('hidden',on);}
function syncSameInputs(){ if($('sameKw').checked){$('newKw').value=$('oldKw').value; $('newKw').readOnly=true;} else {$('newKw').readOnly=false;} if($('sameCount').checked){$('newCount').value=$('oldCount').value; $('newCount').readOnly=true;} else {$('newCount').readOnly=false;} }
function renderTimeSelectors(){
  const defs=[['oldNonWinter','기존 3~10월'],['newNonWinter','변경 3~10월'],['oldWinter','기존 11~2월'],['newWinter','변경 11~2월']];
  $('timeSelectors').innerHTML=defs.map(([key,title])=>timeCardHtml(key,title,key.startsWith('new'))).join('');
  defs.forEach(([key])=>selectAllHours(key));
  ['sameTimeNonWinter','sameTimeWinter'].forEach(id=>$(id)?.addEventListener('change', syncSameTimes)); syncSameTimes();
}
function timeCardHtml(key,title,isNew){return `<div class="time-card"><h4>${title}</h4>${isNew?`<label class="checkline"><input id="${key==='newNonWinter'?'sameTimeNonWinter':'sameTimeWinter'}" type="checkbox" checked /> 기존과 동일</label>`:''}<div class="time-tools"><button type="button" class="mini" onclick="selectAllHours('${key}')">24시간</button><button type="button" class="mini" onclick="selectDayHours('${key}')">주간 08~18</button><button type="button" class="mini" onclick="selectNightHours('${key}')">야간 22~08</button><button type="button" class="mini" onclick="clearHours('${key}')">선택 초기화</button></div><div class="time-grid" id="grid_${key}">${Array.from({length:24},(_,h)=>`<button type="button" class="hour-btn" data-key="${key}" data-hour="${h}" onclick="toggleHour('${key}',${h})">${String(h).padStart(2,'0')}~${String((h+1)%24).padStart(2,'0')}</button>`).join('')}</div></div>`}
function gridBtns(key){return qsa(`#grid_${key} .hour-btn`)}
function setHours(key,hours){const set=new Set(hours); gridBtns(key).forEach(b=>b.classList.toggle('on',set.has(Number(b.dataset.hour)))); syncSameTimes();}
function selectedHours(key){return gridBtns(key).filter(b=>b.classList.contains('on')).map(b=>Number(b.dataset.hour)).sort((a,b)=>a-b)}
function toggleHour(key,h){const b=document.querySelector(`#grid_${key} .hour-btn[data-hour="${h}"]`); if(b&&!b.disabled){b.classList.toggle('on'); syncSameTimes(false)}}
function selectAllHours(key){setHours(key,Array.from({length:24},(_,i)=>i))}
function clearHours(key){setHours(key,[])}
function selectDayHours(key){setHours(key,[8,9,10,11,12,13,14,15,16,17])}
function selectNightHours(key){setHours(key,[22,23,0,1,2,3,4,5,6,7])}
function syncSameTimes(){
  if($('sameTimeNonWinter')?.checked){setHoursSilent('newNonWinter',selectedHours('oldNonWinter')); setDisabled('newNonWinter',true)} else setDisabled('newNonWinter',false);
  if($('sameTimeWinter')?.checked){setHoursSilent('newWinter',selectedHours('oldWinter')); setDisabled('newWinter',true)} else setDisabled('newWinter',false);
}
function setHoursSilent(key,hours){const set=new Set(hours); gridBtns(key).forEach(b=>b.classList.toggle('on',set.has(Number(b.dataset.hour))))}
function setDisabled(key,dis){gridBtns(key).forEach(b=>b.disabled=dis)}

function addEquipment(){
  syncSameInputs(); syncSameTimes();
  const item={name:$('eqName').value.trim()||'설비', oldKw:Number($('oldKw').value), newKw:Number($('newKw').value), oldCount:Number($('oldCount').value), newCount:Number($('newCount').value), oldNonWinter:selectedHours('oldNonWinter'), newNonWinter:selectedHours('newNonWinter'), oldWinter:selectedHours('oldWinter'), newWinter:selectedHours('newWinter')};
  if(!item.oldKw||item.oldKw<=0) return alert('기존 부하를 입력하세요.');
  if(!item.newKw||item.newKw<=0) return alert('변경 부하를 입력하세요.');
  if(!item.oldCount||item.oldCount<=0||!item.newCount||item.newCount<=0) return alert('대수를 입력하세요.');
  equipmentItems.push(item); renderEquipmentList(); clearEquipmentInput();
}
function clearEquipmentInput(){ $('eqName').value=''; $('oldKw').value=''; $('newKw').value=''; $('oldCount').value='1'; $('newCount').value='1'; $('sameKw').checked=true; $('sameCount').checked=true; $('sameTimeNonWinter').checked=true; $('sameTimeWinter').checked=true; renderTimeSelectors(); syncSameInputs(); }
function renderEquipmentList(){
  const box=$('equipmentList'); if(!equipmentItems.length){box.classList.add('hidden'); box.innerHTML=''; return;}
  box.classList.remove('hidden'); box.innerHTML=`<h3>추가된 설비</h3>${equipmentItems.map((it,i)=>`<div class="equipment-item"><div><b>${i+1}. ${esc(it.name)}</b><div class="small">기존 ${num(it.oldKw,2)}kW × ${it.oldCount}대 → 변경 ${num(it.newKw,2)}kW × ${it.newCount}대 · ${classifyItem(it)}</div></div><button class="mini" onclick="removeEquipment(${i})">삭제</button></div>`).join('')}`;
}
function removeEquipment(i){equipmentItems.splice(i,1); renderEquipmentList();}
function hoursChanged(it){return it.oldNonWinter.join(',')!==it.newNonWinter.join(',') || it.oldWinter.join(',')!==it.newWinter.join(',')}
function powerChanged(it){return it.oldKw!==it.newKw || it.oldCount!==it.newCount}
function classifyItem(it){const p=powerChanged(it), h=hoursChanged(it); if(p&&h) return '복합 절감'; if(p) return '전력량 절감'; if(h) return '운전시간 변경'; return '변경 없음'}

function seasonOfDate(d){const m=d.getMonth()+1; if([6,7,8].includes(m)) return 'summer'; if([3,4,5,9,10].includes(m)) return 'springAutumn'; return 'winter'}
function opGroupOfDate(d){const m=d.getMonth()+1; return [11,12,1,2].includes(m)?'winter':'nonWinter'}
function getOperationDates(){
  if($('allYear').checked) return buildDateRange(new Date('2026-01-01T00:00:00'), new Date('2026-12-31T00:00:00'));
  const s=new Date($('startDate').value+'T00:00:00'), e=new Date($('endDate').value+'T00:00:00'); if(isNaN(s)||isNaN(e)||e<s) throw new Error('운영기간을 확인하세요.'); return buildDateRange(s,e);
}
function buildDateRange(s,e){const arr=[]; for(let d=new Date(s); d<=e; d.setDate(d.getDate()+1)) arr.push(new Date(d)); return arr}
function touKind(season,h){ if(h>=22||h<8) return 'light'; if(season==='winter'){ if((h>=9&&h<12)||(h>=16&&h<19)) return 'peak'; return 'mid'; } if(h>=15&&h<21) return 'peak'; return 'mid'; }
function tariffById(){return TARIFFS.find(t=>t.id===$('saveTariff').value)||TARIFFS[0]}
function rateFor(tariff,season,kind){ if(tariff.type==='tou') return tariff.energy[season][kind]; return tariff.energy[season]; }
function kwhBySeasonAndKind(item,changed,season,opGroup){ const hours=changed?(opGroup==='winter'?item.newWinter:item.newNonWinter):(opGroup==='winter'?item.oldWinter:item.oldNonWinter); const kw=(changed?item.newKw:item.oldKw)*(changed?item.newCount:item.oldCount); const out={light:0,mid:0,peak:0,total:0}; hours.forEach(h=>{const kind=touKind(season,h); out[kind]+=kw; out.total+=kw;}); return out; }
function calcItem(item,dates,tariff){
  const r={oldKwh:0,newKwh:0,oldMoney:0,newMoney:0,bySeason:{summer:0,springAutumn:0,winter:0}};
  dates.forEach(d=>{const season=seasonOfDate(d), opGroup=opGroupOfDate(d); const old=kwhBySeasonAndKind(item,false,season,opGroup), neu=kwhBySeasonAndKind(item,true,season,opGroup); ['light','mid','peak'].forEach(k=>{r.oldMoney+=old[k]*rateFor(tariff,season,k); r.newMoney+=neu[k]*rateFor(tariff,season,k)}); r.oldKwh+=old.total; r.newKwh+=neu.total; r.bySeason[season]++;});
  r.saveKwh=r.oldKwh-r.newKwh; r.saveMoney=r.oldMoney-r.newMoney; r.saveRate=r.oldKwh>0?r.saveKwh/r.oldKwh*100:0; return r;
}
function renderSavingReport(){
  try{
    if(!equipmentItems.length) throw new Error('설비를 먼저 추가하세요.');
    const dates=getOperationDates(); const tariff=tariffById(); const results=equipmentItems.map(it=>({item:it,calc:calcItem(it,dates,tariff)}));
    const total=results.reduce((a,x)=>{a.oldKwh+=x.calc.oldKwh; a.newKwh+=x.calc.newKwh; a.saveKwh+=x.calc.saveKwh; a.saveMoney+=x.calc.saveMoney; return a},{oldKwh:0,newKwh:0,saveKwh:0,saveMoney:0}); total.saveRate=total.oldKwh?total.saveKwh/total.oldKwh*100:0;
    const seasonDays={summer:0,springAutumn:0,winter:0}; dates.forEach(d=>seasonDays[seasonOfDate(d)]++);
    $('savingResult').innerHTML=`<div class="card"><h3>전력절감 검토 결과</h3><div class="basis">계약종별: ${esc(tariff.label)} · 산정기간: ${dates[0].toISOString().slice(0,10)} ~ ${dates[dates.length-1].toISOString().slice(0,10)} · 산정일수: ${dates.length}일</div><div class="kpi"><div class="box"><div class="k">기존 사용량</div><div class="v">${num(total.oldKwh,0)}kWh</div></div><div class="box"><div class="k">변경 사용량</div><div class="v">${num(total.newKwh,0)}kWh</div></div><div class="box"><div class="k">절감량</div><div class="v">${num(total.saveKwh,0)}kWh</div></div></div>${installTable(results)}${operationTable(results)}${effectTable(results,total)}${rateTable(tariff)}${basisDetails(results,dates,seasonDays)}</div>`;
    $('savingResult').classList.remove('hidden');
  }catch(e){alert(e.message)}
}
function installTable(results){return `<h4>1. 설치현황</h4><div class="table-wrap"><table class="report-table"><thead><tr><th>No</th><th>설비명</th><th>기존 부하</th><th>변경 부하</th><th>기존 대수</th><th>변경 대수</th><th>기존 총부하</th><th>변경 총부하</th><th>개선 방식</th></tr></thead><tbody>${results.map((x,i)=>`<tr><td class="center">${i+1}</td><td>${esc(x.item.name)}</td><td class="right">${num(x.item.oldKw,2)}kW</td><td class="right">${num(x.item.newKw,2)}kW</td><td class="right">${x.item.oldCount}대</td><td class="right">${x.item.newCount}대</td><td class="right">${num(x.item.oldKw*x.item.oldCount,2)}kW</td><td class="right">${num(x.item.newKw*x.item.newCount,2)}kW</td><td>${classifyItem(x.item)}</td></tr>`).join('')}</tbody></table></div>`}
function operationText(item,group,changed,season){const hours=(changed?(group==='winter'?item.newWinter:item.newNonWinter):(group==='winter'?item.oldWinter:item.oldNonWinter)); const by={light:[],mid:[],peak:[]}; hours.forEach(h=>by[touKind(season,h)].push(h)); const lines=['light','mid','peak'].filter(k=>by[k].length).map(k=>`${loadKo[k]} ${by[k].length}h (${compressHours(by[k])})`); return lines.join('<br>') || '가동시간 없음'}
function operationTable(results){const rows=[]; results.forEach((x,i)=>{if(!hoursChanged(x.item)) return; const row1=`<tr><td class="center" rowspan="2">${i+1}</td><td rowspan="2">${esc(x.item.name)}</td><td>봄·여름·가을(3~10월)</td><td>${operationText(x.item,'nonWinter',false,'springAutumn')}</td><td>${operationText(x.item,'nonWinter',true,'springAutumn')}</td><td class="right">${num(x.item.oldNonWinter.length-x.item.newNonWinter.length,1)}h/일</td></tr>`; const row2=`<tr><td>겨울철(11~2월)</td><td>${operationText(x.item,'winter',false,'winter')}</td><td>${operationText(x.item,'winter',true,'winter')}</td><td class="right">${num(x.item.oldWinter.length-x.item.newWinter.length,1)}h/일</td></tr>`; rows.push(row1+row2);}); if(!rows.length) return ''; return `<h4>2. 운전시간 변경 조건</h4><div class="table-wrap"><table class="report-table"><thead><tr><th>No</th><th>설비명</th><th>구분</th><th>기존 조건</th><th>변경 조건</th><th>가동시간 감소</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`}
function effectTable(results,total){return `<h4>3. 절감효과</h4><div class="table-wrap"><table class="report-table"><thead><tr><th>설비명</th><th>기존 사용량</th><th>변경 사용량</th><th>절감량</th><th>절감률</th><th>절감금액</th></tr></thead><tbody>${results.map(x=>`<tr><td>${esc(x.item.name)}</td><td class="right">${num(x.calc.oldKwh,0)}kWh</td><td class="right">${num(x.calc.newKwh,0)}kWh</td><td class="right bold">${num(x.calc.saveKwh,0)}kWh</td><td class="right">${num(x.calc.saveRate,1)}%</td><td class="right bold">${won(x.calc.saveMoney)}</td></tr>`).join('')}<tr><th>합계</th><th class="right">${num(total.oldKwh,0)}kWh</th><th class="right">${num(total.newKwh,0)}kWh</th><th class="right">${num(total.saveKwh,0)}kWh</th><th class="right">${num(total.saveRate,1)}%</th><th class="right">${won(total.saveMoney)}</th></tr></tbody></table></div>`}
function rateTable(tariff){const rows=['summer','springAutumn','winter'].map(s=>{if(tariff.type==='tou'){const e=tariff.energy[s]; return `<tr><td>${seasonsKo[s]}</td><td class="right">${e.light}</td><td class="right">${e.mid}</td><td class="right">${e.peak}</td></tr>`} return `<tr><td>${seasonsKo[s]}</td><td colspan="3" class="right">${tariff.energy[s]}</td></tr>`}).join(''); return `<h4>4. 적용 전력량 요금 단가</h4><div class="table-wrap"><table class="report-table"><thead><tr><th>계절</th><th>경부하</th><th>중간부하</th><th>최대부하</th></tr></thead><tbody>${rows}</tbody></table></div>`}
function basisDetails(results,dates,seasonDays){return `<details><summary>계산근거 보기</summary><div class="basis">운영기간 일수: 여름 ${seasonDays.summer}일, 봄·가을 ${seasonDays.springAutumn}일, 겨울 ${seasonDays.winter}일<br>사용량 = 부하(kW) × 대수 × 선택 가동시간(h)<br>절감량 = 기존 사용량 - 변경 사용량<br>절감금액 = 시간대별 절감전력량 × 한전 전력량요금 단가</div></details>`}
function compressHours(hours){ if(!hours.length) return ''; const sorted=[...hours].sort((a,b)=>a-b); const ranges=[]; let start=sorted[0], prev=sorted[0]; for(let i=1;i<=sorted.length;i++){ if(sorted[i]===prev+1){prev=sorted[i]; continue;} ranges.push(`${String(start).padStart(2,'0')}:00~${String((prev+1)%24).padStart(2,'0')}:00`); start=prev=sorted[i]; } return ranges.join(', '); }
