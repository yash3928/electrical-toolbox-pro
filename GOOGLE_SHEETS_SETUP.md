# Google Sheets 연동 설정 방법

## 1. 구글시트 만들기
1. Google Drive에서 새 Google Sheets를 만듭니다.
2. 파일명 예: `기흥레스피아 전기설비 특이사항`

## 2. Apps Script 붙여넣기
1. 구글시트 상단 메뉴에서 `확장 프로그램 > Apps Script`를 엽니다.
2. 기본 코드를 모두 지우고 `google-apps-script.gs` 파일 내용을 붙여넣습니다.
3. 저장합니다.

## 3. 웹 앱으로 배포
1. Apps Script 우측 상단 `배포 > 새 배포` 클릭
2. 유형 선택에서 `웹 앱` 선택
3. 실행 사용자: `나`
4. 액세스 권한: `링크가 있는 모든 사용자`
5. 배포 후 나오는 URL을 복사합니다.

## 4. Toolbox에 URL 입력
1. Electrical Toolbox Pro 접속
2. `기흥레스피아 전기설비 특이사항` 메뉴로 이동
3. `Google Apps Script 웹앱 URL` 칸에 URL 붙여넣기
4. `연동 URL 저장` 클릭

## 참고
- URL을 입력하지 않으면 현재 기기 브라우저에만 저장됩니다.
- Google Sheets 연동 후에는 여러 직원이 같은 내용을 볼 수 있습니다.
- 현재 방식은 링크를 아는 사람이 입력·삭제할 수 있는 간단 공유형입니다. 권한/로그인 기능은 추후 Firebase 또는 Google 계정 인증으로 확장할 수 있습니다.
