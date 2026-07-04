/* Electrical Toolbox Pro - Ver 1.0
   기준: 3상 380V 유도전동기, 직입기동(DOL), CV 4C 동케이블, 일반 실내 포설 간편 추천
   주의: 실제 설계/시공 전에는 KEC, 현장 포설조건, 주위온도, 집합보정, 전압강하, 차단용량, 제조사 사양을 반드시 확인하세요.
*/

const MOTOR_DB = [
  { hp: 1, kw: 0.75, current: 2.1, mccb: 'MCCB 3P 20AF / 10AT', elb: 'ELB 3P 20AF / 10AT / 30mA', cable: 'CV 4C × 2.5SQ', terminal: 'R2-4', conduit: 'CD/PF 16', iz: 24 },
  { hp: 2, kw: 1.5, current: 3.8, mccb: 'MCCB 3P 20AF / 15AT', elb: 'ELB 3P 20AF / 15AT / 30mA', cable: 'CV 4C × 2.5SQ', terminal: 'R2-4', conduit: 'CD/PF 16', iz: 24 },
  { hp: 3, kw: 2.2, current: 5.6, mccb: 'MCCB 3P 20AF / 15AT', elb: 'ELB 3P 20AF / 15AT / 30mA', cable: 'CV 4C × 2.5SQ', terminal: 'R2-4', conduit: 'CD/PF 16', iz: 24 },
  { hp: 5, kw: 3.7, current: 9.0, mccb: 'MCCB 3P 30AF / 20AT', elb: 'ELB 3P 30AF / 20AT / 30mA', cable: 'CV 4C × 4SQ', terminal: 'R3.5-4', conduit: 'CD/PF 22', iz: 32 },
  { hp: 7.5, kw: 5.5, current: 13.0, mccb: 'MCCB 3P 30AF / 30AT', elb: 'ELB 3P 30AF / 30AT / 30mA', cable: 'CV 4C × 4SQ', terminal: 'R5.5-5', conduit: 'CD/PF 22', iz: 32 },
  { hp: 10, kw: 7.5, current: 17.5, mccb: 'MCCB 3P 50AF / 40AT', elb: 'ELB 3P 50AF / 40AT / 30mA', cable: 'CV 4C × 6SQ', terminal: 'R5.5-5', conduit: 'CD/PF 28', iz: 41 },
  { hp: 15, kw: 11, current: 25.0, mccb: 'MCCB 3P 50AF / 50AT', elb: 'ELB 3P 50AF / 50AT / 30mA', cable: 'CV 4C × 10SQ', terminal: 'R8-6', conduit: 'CD/PF 28', iz: 57 },
  { hp: 20, kw: 15, current: 34.0, mccb: 'MCCB 3P 100AF / 75AT', elb: 'ELB 3P 100AF / 75AT / 100mA', cable: 'CV 4C × 16SQ', terminal: 'R14-6', conduit: 'CD/PF 36', iz: 76 },
  { hp: 25, kw: 18.5, current: 41.0, mccb: 'MCCB 3P 100AF / 75AT', elb: 'ELB 3P 100AF / 75AT / 100mA', cable: 'CV 4C × 16SQ', terminal: 'R14-6', conduit: 'CD/PF 36', iz: 76 },
  { hp: 30, kw: 22, current: 48.0, mccb: 'MCCB 3P 100AF / 100AT', elb: 'ELB 3P 100AF / 100AT / 100mA', cable: 'CV 4C × 25SQ', terminal: 'R22-8', conduit: 'CD/PF 42', iz: 101 },
  { hp: 40, kw: 30, current: 65.0, mccb: 'MCCB 3P 125AF / 125AT', elb: 'ELB 3P 125AF / 125AT / 100mA', cable: 'CV 4C × 35SQ', terminal: 'R38-8', conduit: 'CD/PF 54', iz: 125 },
  { hp: 50, kw: 37, current: 80.0, mccb: 'MCCB 3P 150AF / 150AT', elb: 'ELB 3P 150AF / 150AT / 100mA', cable: 'CV 4C × 50SQ', terminal: 'R60-10', conduit: 'CD/PF 54', iz: 151 },
  { hp: 60, kw: 45, current: 96.0, mccb: 'MCCB 3P 225AF / 175AT', elb: 'ELB 3P 225AF / 175AT / 100mA', cable: 'CV 4C × 70SQ', terminal: 'R70-10', conduit: '후강전선관 또는 HI/PF 별도 검토', iz: 192 },
  { hp: 75, kw: 55, current: 115.0, mccb: 'MCCB 3P 225AF / 200AT', elb: 'ELB 3P 225AF / 200AT / 100mA', cable: 'CV 4C × 95SQ', terminal: 'R95-12', conduit: '후강전선관 또는 HI/PF 별도 검토', iz: 232 },
  { hp: 100, kw: 75, current: 155.0, mccb: 'MCCB 3P 400AF / 300AT', elb: 'ELB 3P 400AF / 300AT / 100mA', cable: 'CV 4C × 150SQ', terminal: 'R150-12', conduit: '후강전선관 또는 HI/PF 별도 검토', iz: 309 }
];

const APP_STANDARD = {
  voltage: '3상 380V',
  startMethod: '직입기동(DOL) 간편 기준',
  cableType: 'CV 4C 동케이블',
  principle: 'KEC 간편 검토: 부하전류 Ib ≤ 차단기 정격 In ≤ 전선 허용전류 Iz'
};
