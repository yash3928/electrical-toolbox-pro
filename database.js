/* Electrical Toolbox Pro - Ver 1.2
   기준: 모터 부하 간편 자재 추천
   - 삼상: 380V, CV 4C 동케이블 기준
   - 단상: 220V, CV 3C 동케이블 기준
   - 전선관: 설치상황에 따라 CD관 또는 GW 방수후렉시블관 추천
   - 보호조건 간편 검토: Ib ≤ In ≤ Iz
   주의: 실제 설계/시공 전에는 KEC, 현장 포설조건, 주위온도, 집합보정, 전압강하, 차단용량, 제조사 명판전류를 확인하세요.
*/

const MOTOR_SIZES = [
  { hp: 0.5, kw: 0.4 },
  { hp: 1, kw: 0.75 },
  { hp: 2, kw: 1.5 },
  { hp: 3, kw: 2.2 },
  { hp: 5, kw: 3.7 },
  { hp: 7.5, kw: 5.5 },
  { hp: 10, kw: 7.5 },
  { hp: 15, kw: 11 },
  { hp: 20, kw: 15 },
  { hp: 25, kw: 18.5 },
  { hp: 30, kw: 22 },
  { hp: 40, kw: 30 },
  { hp: 50, kw: 37 },
  { hp: 60, kw: 45 },
  { hp: 75, kw: 55 },
  { hp: 100, kw: 75 }
];

const BREAKER_AT = [10, 15, 20, 30, 40, 50, 60, 75, 100, 125, 150, 175, 200, 225, 250, 300, 350, 400, 500, 600];

const BREAKER_FRAMES = [
  { max: 20, af: 20 },
  { max: 30, af: 30 },
  { max: 50, af: 50 },
  { max: 100, af: 100 },
  { max: 125, af: 125 },
  { max: 150, af: 150 },
  { max: 225, af: 225 },
  { max: 400, af: 400 },
  { max: 600, af: 600 }
];

// 간편 허용전류표. 현장 포설조건에 따라 반드시 보정 필요.
const CABLE_TABLE = [
  { sq: 2.5, iz: 24, terminal: 'R2-4', conduit3cSize: 16, conduit4cSize: 16 },
  { sq: 4, iz: 32, terminal: 'R3.5-4', conduit3cSize: 22, conduit4cSize: 22 },
  { sq: 6, iz: 41, terminal: 'R5.5-5', conduit3cSize: 22, conduit4cSize: 28 },
  { sq: 10, iz: 57, terminal: 'R8-6', conduit3cSize: 28, conduit4cSize: 28 },
  { sq: 16, iz: 76, terminal: 'R14-6', conduit3cSize: 36, conduit4cSize: 36 },
  { sq: 25, iz: 101, terminal: 'R22-8', conduit3cSize: 42, conduit4cSize: 42 },
  { sq: 35, iz: 125, terminal: 'R38-8', conduit3cSize: 42, conduit4cSize: 54 },
  { sq: 50, iz: 151, terminal: 'R60-10', conduit3cSize: 54, conduit4cSize: 54 },
  { sq: 70, iz: 192, terminal: 'R70-10', conduit3cSize: 70, conduit4cSize: 70 },
  { sq: 95, iz: 232, terminal: 'R95-12', conduit3cSize: 82, conduit4cSize: 82 },
  { sq: 120, iz: 269, terminal: 'R120-12', conduit3cSize: 92, conduit4cSize: 92 },
  { sq: 150, iz: 309, terminal: 'R150-12', conduit3cSize: 104, conduit4cSize: 104 },
  { sq: 185, iz: 353, terminal: 'R185-12', conduit3cSize: 104, conduit4cSize: 104 },
  { sq: 240, iz: 415, terminal: 'R240-16', conduit3cSize: 125, conduit4cSize: 125 }
];

const APP_STANDARD = {
  three: {
    label: '삼상 380V',
    voltage: 380,
    poles: '3P',
    cableCore: '4C',
    cablePrefix: 'CV 4C',
    conduitSizeKey: 'conduit4cSize',
    mccbName: 'MCCB',
    elbName: 'ELB'
  },
  single: {
    label: '단상 220V',
    voltage: 220,
    poles: '2P',
    cableCore: '3C',
    cablePrefix: 'CV 3C',
    conduitSizeKey: 'conduit3cSize',
    mccbName: 'MCCB',
    elbName: 'ELB'
  }
};

const INSTALL_STANDARDS = {
  indoor: {
    label: '실내 매입/은폐',
    conduitType: 'CD관',
    accessoryPrefix: 'CD',
    accessoryNote: 'CD 커넥터, CD 인서트, CD 새들'
  },
  exposed: {
    label: '실내 노출/기계 주변',
    conduitType: 'GW 방수후렉시블관',
    accessoryPrefix: 'GW',
    accessoryNote: 'GW 방수커넥터, 로크너트, 부싱, 새들'
  },
  outdoor: {
    label: '옥외/습기 우려',
    conduitType: 'GW 방수후렉시블관',
    accessoryPrefix: 'GW',
    accessoryNote: 'GW 방수커넥터, 로크너트, 부싱, 새들'
  }
};

// 제조사별 커넥터 실제 외경/노크아웃 치수가 다를 수 있으므로 참고값으로 표시합니다.
const HOLE_CUTTER_TABLE = {
  16: { cutter: '22mm', note: '16관용, 제품별 21~22mm 확인' },
  22: { cutter: '28mm', note: '22관용, 제품별 27~28mm 확인' },
  28: { cutter: '35mm', note: '28관용, 제품별 34~35mm 확인' },
  36: { cutter: '45mm', note: '36관용, 제품별 44~45mm 확인' },
  42: { cutter: '51mm', note: '42관용, 제품별 50~51mm 확인' },
  54: { cutter: '65mm', note: '54관용, 제품별 64~65mm 확인' },
  70: { cutter: '별도 검토', note: '대구경은 박스/커넥터 실측 후 천공' },
  82: { cutter: '별도 검토', note: '대구경은 박스/커넥터 실측 후 천공' },
  92: { cutter: '별도 검토', note: '대구경은 박스/커넥터 실측 후 천공' },
  104: { cutter: '별도 검토', note: '대구경은 박스/커넥터 실측 후 천공' },
  125: { cutter: '별도 검토', note: '대구경은 박스/커넥터 실측 후 천공' }
};
