/*
  Electrical Toolbox Pro - database.js
  Ver 1.0: 3상 380V 모터 실무 자재 추천기

  기본 전제
  - 3상 380V 유도전동기
  - 직입기동(DOL) 기준의 간편 검토
  - CV 0.6/1kV 동케이블, 4C 기준
  - 일반적인 실내 배선/단거리 배선 기준
  - 실제 설계·시공 전에는 현장 포설방법, 주위온도, 집합보정, 기동방식, 전압강하, 차단용량을 반드시 확인
*/

const MOTOR_DB = [
  { hp: 1, kw: 0.75, current: 2.1 },
  { hp: 2, kw: 1.5, current: 3.8 },
  { hp: 3, kw: 2.2, current: 5.4 },
  { hp: 5, kw: 3.7, current: 8.8 },
  { hp: 7.5, kw: 5.5, current: 12.5 },
  { hp: 10, kw: 7.5, current: 17.0 },
  { hp: 15, kw: 11, current: 24.0 },
  { hp: 20, kw: 15, current: 32.0 },
  { hp: 25, kw: 18.5, current: 39.0 },
  { hp: 30, kw: 22, current: 46.0 },
  { hp: 40, kw: 30, current: 61.0 },
  { hp: 50, kw: 37, current: 75.0 },
  { hp: 60, kw: 45, current: 91.0 },
  { hp: 75, kw: 55, current: 110.0 },
  { hp: 100, kw: 75, current: 150.0 }
];

const BREAKER_STANDARDS = [10, 15, 20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 225, 250, 300, 350, 400];

// 간편 허용전류표: CV 4C, 동선, 일반 조건 기준의 보수적 참고값
// 실제 적용 시 KEC 표, 포설방법, 주위온도, 집합보정에 따라 변경 필요
const CABLE_DB = [
  { sq: 2.5, ampacity: 25, cable: 'CV 4C × 2.5SQ', terminal: 'R2-4', conduit: 'CD16 / PF16' },
  { sq: 4, ampacity: 34, cable: 'CV 4C × 4SQ', terminal: 'R3.5-4 또는 R5.5-5', conduit: 'CD22 / PF22' },
  { sq: 6, ampacity: 43, cable: 'CV 4C × 6SQ', terminal: 'R5.5-5', conduit: 'CD22 / PF22' },
  { sq: 10, ampacity: 60, cable: 'CV 4C × 10SQ', terminal: 'R8-6 또는 R14-6', conduit: 'CD28 / PF28' },
  { sq: 16, ampacity: 80, cable: 'CV 4C × 16SQ', terminal: 'R14-8 또는 R22-8', conduit: 'CD36 / PF36' },
  { sq: 25, ampacity: 105, cable: 'CV 4C × 25SQ', terminal: 'R22-8 또는 R38-8', conduit: 'CD42 / PF42' },
  { sq: 35, ampacity: 130, cable: 'CV 4C × 35SQ', terminal: 'R38-10', conduit: 'CD54 / PF54' },
  { sq: 50, ampacity: 160, cable: 'CV 4C × 50SQ', terminal: 'R60-10', conduit: 'CD70 / PF70' },
  { sq: 70, ampacity: 200, cable: 'CV 4C × 70SQ', terminal: 'R70-10 또는 R80-10', conduit: '별도 검토' },
  { sq: 95, ampacity: 245, cable: 'CV 4C × 95SQ', terminal: 'R100-12', conduit: '별도 검토' },
  { sq: 120, ampacity: 285, cable: 'CV 4C × 120SQ', terminal: 'R150-12', conduit: '별도 검토' }
];
