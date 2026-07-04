/*
  Electrical Toolbox Pro - 기흥레스피아 전기설비 특이사항 Google Sheets 연동 스크립트

  사용 방법
  1) Google Sheets 새 파일 생성
  2) 확장 프로그램 > Apps Script 열기
  3) 이 코드 전체 붙여넣기
  4) 배포 > 새 배포 > 웹 앱
     - 실행 사용자: 나
     - 액세스 권한: 링크가 있는 모든 사용자
  5) 배포 URL을 Electrical Toolbox Pro의 특이사항 메뉴에 입력
*/

const SHEET_NAME = '특이사항';
const HEADERS = ['id', 'createdAt', 'updatedAt', 'equipment', 'location', 'content', 'action', 'reporter', 'status'];

function doGet(e) {
  const p = e.parameter || {};
  const callback = p.callback || '';
  let result;
  try {
    const action = p.action || 'list';
    if (action === 'list') result = { ok: true, items: listItems_() };
    else if (action === 'add') result = addItem_(p);
    else if (action === 'status') result = updateStatus_(p.id, p.status);
    else if (action === 'delete') result = deleteItem_(p.id);
    else result = { ok: false, error: 'unknown action: ' + action };
  } catch (err) {
    result = { ok: false, error: String(err && err.message ? err.message : err) };
  }

  const json = JSON.stringify(result);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeader = firstRow.join('') === '' || firstRow[0] !== 'id';
  if (needsHeader) {
    sheet.clear();
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function listItems_() {
  const sheet = getSheet_();
  const last = sheet.getLastRow();
  if (last < 2) return [];
  const values = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  return values
    .filter(row => row[0])
    .map(row => objectFromRow_(row))
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function addItem_(p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = getSheet_();
    const now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
    const id = String(Date.now());
    const row = [
      id,
      now,
      '',
      clean_(p.equipment),
      clean_(p.location),
      clean_(p.content),
      clean_(p.action),
      clean_(p.reporter),
      clean_(p.status || '미조치')
    ];
    sheet.appendRow(row);
    return { ok: true, id };
  } finally {
    lock.releaseLock();
  }
}

function updateStatus_(id, status) {
  if (!id) throw new Error('id가 없습니다.');
  const sheet = getSheet_();
  const rowNo = findRowById_(sheet, id);
  if (!rowNo) throw new Error('대상 항목을 찾을 수 없습니다.');
  const now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  sheet.getRange(rowNo, HEADERS.indexOf('updatedAt') + 1).setValue(now);
  sheet.getRange(rowNo, HEADERS.indexOf('status') + 1).setValue(clean_(status || '조치중'));
  return { ok: true };
}

function deleteItem_(id) {
  if (!id) throw new Error('id가 없습니다.');
  const sheet = getSheet_();
  const rowNo = findRowById_(sheet, id);
  if (!rowNo) throw new Error('대상 항목을 찾을 수 없습니다.');
  sheet.deleteRow(rowNo);
  return { ok: true };
}

function findRowById_(sheet, id) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  const ids = sheet.getRange(2, 1, last - 1, 1).getValues().flat().map(String);
  const idx = ids.indexOf(String(id));
  return idx >= 0 ? idx + 2 : 0;
}

function objectFromRow_(row) {
  const obj = {};
  HEADERS.forEach((h, i) => obj[h] = row[i]);
  return obj;
}

function clean_(v) {
  return String(v == null ? '' : v).trim();
}
