// inverter-guide.js
// Electrical Toolbox Pro - 인버터 실무 가이드 V3

function inv$(id){ return document.getElementById(id); }
function invEsc(s){ return String(s ?? '').replace(/[&<>\"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m])); }

function initInverterGuide(){
  if(!window.INVERTER_GUIDE_DB && typeof INVERTER_GUIDE_DB === 'undefined') return;
  const select = inv$('invModel');
  if(!select) return;
  select.innerHTML = INVERTER_GUIDE_DB.map(m => `<option value="${m.id}">${m.maker} ${m.model}</option>`).join('');
  inv$('invSearchBtn')?.addEventListener('click', renderInverterGuide);
  inv$('invSearch')?.addEventListener('keydown', e => { if(e.key === 'Enter') renderInverterGuide(); });
  inv$('invModel')?.addEventListener('change', renderInverterGuide);
  inv$('invTopic')?.addEventListener('change', renderInverterGuide);
  renderInverterGuide();
}

document.addEventListener('DOMContentLoaded', initInverterGuide);

function getInvModel(){
  const id = inv$('invModel')?.value || 'ig5a';
  return INVERTER_GUIDE_DB.find(m => m.id === id) || INVERTER_GUIDE_DB[0];
}

function renderInverterGuide(){
  const model = getInvModel();
  const topic = inv$('invTopic')?.value || 'overview';
  const q = (inv$('invSearch')?.value || '').trim().toLowerCase();
  const box = inv$('invResult');
  if(!box) return;

  let html = `<div class="card inverter-card">
    <h3>${invEsc(model.title)}</h3>
    <div class="basis"><b>용량/전압</b>: ${invEsc(model.capacity)}<br><b>특징</b>: ${invEsc(model.summary)}</div>
    ${renderWarning()}
  `;

  if(q){
    html += renderSearchResult(model, q);
  }else if(topic === 'overview'){
    html += renderOverview(model);
  }else if(topic === 'fault'){
    html += renderFaults(model);
  }else if(topic === 'param'){
    html += renderParams(model);
  }else if(topic === 'terminal'){
    html += renderTerminals(model);
  }else if(topic === 'operation'){
    html += renderOperation(model);
  }else if(topic === 'common'){
    html += renderCommonGuide();
  }

  html += `</div>`;
  box.innerHTML = html;
  box.classList.remove('hidden');
}

function renderWarning(){
  return `<div class="basis"><b>주의</b> 본 기능은 현장 보조용입니다. 실제 운전·파라미터 변경 전 전원 차단, 방전 확인, 제조사 최신 매뉴얼, 설비 인터록, 안전절차를 반드시 확인하세요.</div>`;
}

function renderOverview(model){
  return `<h4>빠른 가이드</h4>${table(['항목','내용'], model.quick.map(x => [x.name, x.value]))}
  <h4>안전 확인</h4><ul class="guide-list">${model.safety.map(x => `<li>${invEsc(x)}</li>`).join('')}</ul>`;
}

function renderOperation(model){
  const common = INVERTER_COMMON_GUIDES.find(x => x.key === 'start');
  return `<h4>운전/시운전 기본 순서</h4><ol class="guide-list">${common.body.map(x => `<li>${invEsc(x)}</li>`).join('')}</ol>
  <h4>${invEsc(model.model)} 주요 조작 포인트</h4>${table(['항목','내용'], model.quick.map(x => [x.name, x.value]))}`;
}

function renderParams(model){
  return `<h4>주요 파라미터</h4>${table(['코드','명칭','용도'], model.params.map(x => [x.code, x.name, x.use]))}`;
}

function renderTerminals(model){
  return `<h4>주요 단자</h4>${table(['단자','용도'], model.terminals.map(x => [x.name, x.desc]))}`;
}

function renderFaults(model){
  return `<h4>에러/트립 빠른 진단</h4>${table(['코드','명칭','주요 원인','확인 순서','조치'], model.faults.map(x => [x.code, x.name, x.cause, x.check, x.action]))}
  <h4>공통 트립 점검 순서</h4><ol class="guide-list">${INVERTER_COMMON_GUIDES.find(x => x.key === 'trip').body.map(x => `<li>${invEsc(x)}</li>`).join('')}</ol>`;
}

function renderCommonGuide(){
  return INVERTER_COMMON_GUIDES.map(g => `<h4>${invEsc(g.title)}</h4><ol class="guide-list">${g.body.map(x => `<li>${invEsc(x)}</li>`).join('')}</ol>`).join('');
}

function renderSearchResult(model, q){
  const rows = [];
  const add = (type, title, body) => rows.push([type, title, body]);

  for(const p of model.params){
    const hay = `${p.code} ${p.name} ${p.use}`.toLowerCase();
    if(hay.includes(q)) add('파라미터', `${p.code} · ${p.name}`, p.use);
  }
  for(const f of model.faults){
    const hay = `${f.code} ${f.name} ${f.cause} ${f.check} ${f.action}`.toLowerCase();
    if(hay.includes(q)) add('에러', `${f.code} · ${f.name}`, `원인: ${f.cause}<br>확인: ${f.check}<br>조치: ${f.action}`);
  }
  for(const t of model.terminals){
    const hay = `${t.name} ${t.desc}`.toLowerCase();
    if(hay.includes(q)) add('단자', t.name, t.desc);
  }
  for(const item of model.quick){
    const hay = `${item.name} ${item.value}`.toLowerCase();
    if(hay.includes(q)) add('가이드', item.name, item.value);
  }
  for(const g of INVERTER_COMMON_GUIDES){
    const hay = `${g.title} ${g.body.join(' ')}`.toLowerCase();
    if(hay.includes(q)) add('공통', g.title, g.body.join('<br>'));
  }

  if(!rows.length){
    const allRows=[];
    for(const m of INVERTER_GUIDE_DB){
      const mHay = `${m.model} ${m.title} ${m.summary} ${m.keywords.join(' ')} ${m.quick.map(x=>x.name+' '+x.value).join(' ')} ${m.params.map(x=>x.code+' '+x.name+' '+x.use).join(' ')} ${m.faults.map(x=>x.code+' '+x.name+' '+x.cause).join(' ')}`.toLowerCase();
      if(mHay.includes(q)) allRows.push([m.model, m.summary]);
    }
    if(allRows.length) return `<h4>전체 모델 검색 결과</h4>${table(['모델','내용'], allRows)}`;
    return `<h4>검색 결과</h4><div class="basis">해당 모델에서 검색 결과가 없습니다. 예: OC, OV, PID, 통신, P1, 주파수, Auto, Reset, 팬</div>`;
  }

  return `<h4>검색 결과: ${invEsc(q)}</h4>${table(['구분','항목','내용'], rows)}`;
}

function table(headers, rows){
  return `<div class="table-wrap"><table class="report-table"><thead><tr>${headers.map(h => `<th>${invEsc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${String(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
