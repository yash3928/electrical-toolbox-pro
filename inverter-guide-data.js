// inverter-guide-data.js
// Electrical Toolbox Pro - 인버터 실무 가이드 V3
// 모델: iG5A, H100, G100, iS7, FP5, N700E, N300
// 주의: 현장 보조용 데이터입니다. 최종 설정 전 제조사 최신 매뉴얼과 설비 인터록을 확인하세요.

const INVERTER_GUIDE_DB = [
  {
    id: 'ig5a',
    maker: 'LS',
    model: 'iG5A',
    title: 'LS SV-iG5A',
    capacity: '0.4~22kW, 200V/400V급',
    summary: '소형·범용 인버터. 로더, 단자대, 통신 운전 선택 가능. P1~P8 다기능 입력, AM 아날로그 출력, RS-485 지원.',
    keywords: ['ig5a','iG5A','SV-iG5A','LS','소형','범용','P1','P8','AM','RS485'],
    safety: [
      '전원 차단 후 10분 이상 대기하고 DC 링크 전압 방전을 확인한 뒤 작업하세요.',
      '입력 R/S/T와 출력 U/V/W 오결선 시 인버터 파손 위험이 있습니다.',
      '출력측에는 진상콘덴서, 써지킬러, 라디오 노이즈 필터를 연결하지 마세요.'
    ],
    quick: [
      {name:'주파수 설정', value:'운전 그룹에서 주파수 표시 → ENT → 자리 이동/증감 → ENT 점멸 → ENT 확정'},
      {name:'운전 방식', value:'로더 / 단자대 / 통신 / 리모트 로더 중 선택'},
      {name:'다기능 입력', value:'P1~P8: 정/역방향, 리셋, 조그, 다단속, 외부트립, PID 절체 등 설정 가능'},
      {name:'아날로그 출력', value:'I50: AM 출력 항목 선택, I51: AM 출력 레벨 조정'},
      {name:'통신', value:'RS-485, 최대 31대, 권장 700m 이내'}
    ],
    params: [
      {code:'F21', name:'최대 주파수', use:'상한 주파수 기준. 설비 허용속도 확인 후 변경'},
      {code:'H60', name:'자기진단 기능 선택', use:'IGBT, 출력단락, 출력개방, 지락 점검 보조'},
      {code:'I17~I24', name:'P1~P8 기능 선택', use:'다기능 입력 단자 기능 지정'},
      {code:'I50', name:'아날로그 출력 항목 선택', use:'AM 단자 출력 주파수/전류/전압/DC전압 선택'},
      {code:'I51', name:'아날로그 출력 레벨 조정', use:'계기 입력 규격에 맞게 10~200% 조정'}
    ],
    terminals: [
      {name:'R/S/T', desc:'입력 전원'}, {name:'U/V/W', desc:'모터 출력'},
      {name:'P1~P8', desc:'다기능 입력'}, {name:'CM', desc:'입력 공통'},
      {name:'AM/CM', desc:'0~10V 아날로그 출력'}, {name:'S+/S-', desc:'RS-485 통신'}
    ],
    faults: [
      {code:'OC', name:'과전류', cause:'급가속, 모터 구속, 출력 단락, 부하 과대', check:'모터 절연/출력 U,V,W 단락/가속시간/기계부하 확인', action:'가속시간 증가, 부하 제거, 케이블·모터 점검'},
      {code:'OV', name:'과전압', cause:'급감속, 회생부하, 입력전압 상승', check:'감속시간, 제동저항, DC 링크 전압 확인', action:'감속시간 증가, 제동저항 적용 검토'},
      {code:'OH', name:'과열', cause:'팬 불량, 환기 불량, 주위온도 과다', check:'냉각팬/방열판/판넬 환기 확인', action:'팬 교체, 먼지 청소, 환기 개선'},
      {code:'GF', name:'지락', cause:'모터 또는 출력 케이블 지락', check:'메거 측정, U/V/W-접지 절연 확인', action:'케이블·모터 교체 또는 건조'}
    ]
  },
  {
    id: 'h100',
    maker: 'LS',
    model: 'H100',
    title: 'LS LSLV-H100',
    capacity: '0.75~18.5kW(200V), 0.75~500kW(400V)',
    summary: '팬·펌프 전용 드라이브. PID, 수면/절전, 통신, 부품수명 진단 기능에 강점.',
    keywords: ['H100','LSLV-H100','팬','펌프','PID','COM','CNF','DRV','BAS','AP1','AP2'],
    safety: [
      '전원 차단 후 10분 이상 대기하고 DC 링크 전압 방전 확인 후 작업하세요.',
      '제품과 모터는 반드시 접지하세요.',
      '커버 개방 상태 운전 및 젖은 손 조작을 금지하세요.'
    ],
    quick: [
      {name:'통신선', value:'S+/S-/SG 연결, 차폐 연선 사용 권장'},
      {name:'통신 설정', value:'COM-01 국번, COM-02 프로토콜, COM-03 통신속도, COM-04 프레임, COM-05 응답지연'},
      {name:'파라미터 저장', value:'CNF-48 = 1(Yes) 또는 통신 0h03E0 0→1 설정'},
      {name:'가상 DI', value:'COM-70~77에 기능 지정 후 0h0385 비트 제어'},
      {name:'점검', value:'고장/경보 일람, 팬·메인콘덴서 수명 진단 메뉴 활용'}
    ],
    params: [
      {code:'COM-01', name:'내장형 통신 인버터 ID', use:'RS-485 국번 설정'},
      {code:'COM-02', name:'내장형 통신 프로토콜', use:'Modbus-RTU, LS INV 485 등 선택'},
      {code:'COM-03', name:'내장형 통신 속도', use:'통신 Baud Rate 설정'},
      {code:'CNF-48', name:'파라미터 저장', use:'통신/키패드 변경값 비휘발 저장'},
      {code:'COM-70~77', name:'통신 다기능 입력', use:'가상 다기능 입력 기능 지정'}
    ],
    terminals: [
      {name:'S+/S-/SG', desc:'RS-485 통신'}, {name:'P1~P5', desc:'다기능 입력'},
      {name:'VR/V1/I2', desc:'아날로그 주파수 입력'}, {name:'AO', desc:'아날로그 출력'},
      {name:'A1/B1/C1', desc:'릴레이 출력'}
    ],
    faults: [
      {code:'OC', name:'과전류', cause:'가속시간 부족, 모터 구속, 출력단락', check:'출력전류, 모터 절연, 기계부하', action:'가속시간 증가, 부하 점검'},
      {code:'OV', name:'과전압', cause:'감속 중 회생전압 상승', check:'감속시간, 제동장치, 입력전압', action:'감속시간 증가, 제동저항 검토'},
      {code:'FAN', name:'팬 이상', cause:'냉각팬 수명, 이물질', check:'팬 회전, FAN 수명 진단', action:'팬 청소 또는 교체'},
      {code:'BELT', name:'브로큰 벨트', cause:'펌프/팬 벨트 파손 또는 부하 상실', check:'전류 저하, 벨트 상태', action:'벨트 및 부하계통 점검'}
    ]
  },
  {
    id: 'g100',
    maker: 'LS',
    model: 'G100',
    title: 'LS LSLV-G100',
    capacity: '0.4~22kW급 범용 드라이브',
    summary: '범용 드라이브. 다기능 입력 P1~P5, 아날로그 V1/I2/AO, 통신 S+/S- 지원.',
    keywords: ['G100','LSLV-G100','CM','In','dr','bA','Ad','Cn','OU','Pr'],
    safety: [
      '전원 차단 후 10분 이상 지난 뒤 DC 전압 방전을 확인하세요.',
      '다기능 입력, 아날로그 입출력, 통신 단자도 보호 조치가 필요합니다.',
      '단상 모터 운전에 사용하지 마세요.'
    ],
    quick: [
      {name:'상황별 참조', value:'최근 트립/고장 이력 확인, PID, 다단속, 모터 파라미터 등 메뉴 구성 가능'},
      {name:'통신 공통영역', value:'0h0000~0h00FF는 iS5/iP5A/iV5/iG5A 호환 영역'},
      {name:'통신 운전', value:'0h0322: 0h0001 정방향, 0h0003 역방향, 0h0000 정지'},
      {name:'DriveView9', value:'파라미터 읽기/쓰기, 모니터링, 트렌드 기능 사용 가능'}
    ],
    params: [
      {code:'CM-01', name:'Int485 St ID', use:'내장형 통신 국번'},
      {code:'0h0005', name:'목표 주파수', use:'0.01Hz 스케일, R/W'},
      {code:'0h0006', name:'운전 지령', use:'정지/정방향/역방향/리셋 비트 제어'},
      {code:'0h000A', name:'출력 주파수', use:'0.01Hz 스케일, 모니터'},
      {code:'0h000C', name:'DC 링크 전압', use:'DC 링크 전압 모니터'}
    ],
    terminals: [
      {name:'P1~P5, CM', desc:'다기능 입력'}, {name:'VR, V1, I2, AO', desc:'아날로그 입출력'},
      {name:'24, A1/B1/C1, A2/C2', desc:'디지털/릴레이 출력'}, {name:'S+/S-', desc:'통신'}
    ],
    faults: [
      {code:'OC', name:'과전류', cause:'급가속, 출력단락, 부하과대', check:'전류/절연/가속시간 확인', action:'가속시간 조정 및 부하 점검'},
      {code:'OL', name:'과부하', cause:'모터 과부하, 전자써멀 설정 부적절', check:'모터전류와 정격전류 비교', action:'부하 저감, 모터정격 재설정'},
      {code:'OH', name:'과열', cause:'팬 이상, 환기 불량', check:'팬, 흡배기, 주위온도', action:'청소·환기·팬교체'},
      {code:'LV', name:'저전압', cause:'입력전압 저하, 순간정전', check:'입력전압, 전원계통', action:'전원 안정화, Ride-through 검토'}
    ]
  },
  {
    id: 'is7',
    maker: 'LS',
    model: 'iS7',
    title: 'LS iS7',
    capacity: '3상 200V 0.75~75kW, 3상 400V 0.75~375kW',
    summary: '고성능 표준형 드라이브. V/F, 슬립보상, 센서리스 벡터, 벡터제어 및 다양한 옵션 지원.',
    keywords: ['iS7','IS7','고성능','벡터','엔코더','키패드','IN','DRV','BAS','ADV','COM'],
    safety: [
      '용량·옵션에 따라 기능 코드가 달라질 수 있으므로 최종 매뉴얼 확인이 필요합니다.',
      '고성능 제어 사용 시 모터 정격값과 오토튜닝 상태를 확인하세요.',
      '엔코더/통신/확장 I/O 옵션 장착 여부를 확인하세요.'
    ],
    quick: [
      {name:'키패드', value:'Wide Graphic LCD Keypad 및 한글 키패드 지원'},
      {name:'제어방식', value:'V/F, V/F PG, 슬립보상, 센서리스 벡터, 벡터제어'},
      {name:'다단속', value:'Step Freq-1~15 등 다단속 주파수 설정'},
      {name:'입력단자', value:'IN 그룹에서 P1~P11 기능 설정'},
      {name:'PID/응용', value:'기능코드표에서 PID, 시퀀스, 점프주파수, 조그 등 확인'}
    ],
    params: [
      {code:'IN-65~75', name:'P1~P11 단자 기능', use:'다기능 입력 설정'},
      {code:'BAS-50~64', name:'Step Freq-1~15', use:'다단속 주파수 설정'},
      {code:'ADV-24~26', name:'주파수 제한', use:'상·하한 주파수 설정'},
      {code:'ADV-27~33', name:'점프 주파수', use:'공진 주파수 회피'},
      {code:'COM', name:'통신 기능', use:'통신 옵션, 가상 DI, 통신 파라미터'}
    ],
    terminals: [
      {name:'P1~P11', desc:'다기능 입력'}, {name:'AO', desc:'아날로그 출력'},
      {name:'Relay', desc:'고장 및 상태 출력'}, {name:'Option', desc:'통신/엔코더/PLC/확장 I/O'}
    ],
    faults: [
      {code:'OC', name:'과전류', cause:'부하 급변, 가속 부족, 출력단락', check:'출력전류, 모터/케이블 절연', action:'가속시간, 토크부스트, 부하 점검'},
      {code:'OV', name:'과전압', cause:'감속 회생, 입력전압 상승', check:'DC Link, 감속시간', action:'감속시간 증가, 제동저항 검토'},
      {code:'ETH', name:'전자써멀', cause:'모터 과부하, 정격전류 설정 오류', check:'모터정격, 냉각상태', action:'정격 재설정 및 부하 저감'},
      {code:'Encoder', name:'엔코더 이상', cause:'엔코더 배선, 옵션카드, 파라미터 오류', check:'A/B/Z상, 쉴드, 옵션카드', action:'배선 재확인 및 오토튜닝'}
    ]
  },
  {
    id: 'fp5',
    maker: 'LS/자료',
    model: 'FP5',
    title: 'FP5 / 관련 자료',
    capacity: '업로드 자료 기준 별도 확인 필요',
    summary: '업로드 자료명은 FP5로 판단하여 별도 모델로 구성. 세부 파라미터는 원문 대조 후 확장 필요.',
    keywords: ['FP5','F P5','DriveView9','통신','파라미터','자료'],
    safety: ['원문 매뉴얼 확인 후 실제 파라미터를 적용하세요.', '모델명이 유사한 경우 명판을 먼저 확인하세요.'],
    quick: [
      {name:'자료 상태', value:'현재는 식별/검색 메뉴를 먼저 구성하고, 파라미터 DB는 원문 대조 후 확장'},
      {name:'현장 사용', value:'모델 명판, 전압급, 용량, 키패드 표시를 먼저 확인'},
      {name:'통신/관리', value:'DriveView9 또는 관련 관리 소프트웨어 자료와 연결 가능'}
    ],
    params: [
      {code:'확인 필요', name:'FP5 파라미터', use:'원문 매뉴얼 대조 후 추가'},
      {code:'확인 필요', name:'에러코드', use:'원문 매뉴얼 대조 후 추가'}
    ],
    terminals: [{name:'확인 필요', desc:'원문 매뉴얼 기준으로 추가'}],
    faults: [
      {code:'공통', name:'트립 발생', cause:'모델별 코드 체계 확인 필요', check:'명판/키패드 표시/매뉴얼 원문 확인', action:'원문 기준으로 조치'}
    ]
  },
  {
    id: 'n700e',
    maker: 'HYUNDAI',
    model: 'N700E',
    title: '현대 N700E',
    capacity: '단상 220V, 3상 220V/440V 라인업',
    summary: '현대 인버터 N700E. 표준사양, 단자기능, 접속도, 조작, 보호기능, 기능일람 구성.',
    keywords: ['N700E','현대','HYUNDAI','Hirun','접속도','조작','보호기능'],
    safety: ['입력/출력 오결선 금지', '인버터 내부 방전 확인 후 작업', '출력측 콘덴서류 설치 금지'],
    quick: [
      {name:'메뉴얼 구성', value:'특징, 표준사양, 외형도, 단자기능, 접속도, 조작, 보호기능, 기능일람'},
      {name:'입력 타입', value:'SF 단상 220V, LF 3상 220V, HF 3상 440V'},
      {name:'단자/접속', value:'싱크/소스 타입과 PLC 접속도 확인 필요'},
      {name:'보호기능', value:'보호기능 메뉴에서 트립 코드와 원인 확인'}
    ],
    params: [
      {code:'A/F/H 그룹', name:'기능일람', use:'원문 기능일람표 기준 적용'},
      {code:'단자기능', name:'입력/출력 단자 기능', use:'제어단자 기능 설정'},
      {code:'보호기능', name:'트립/보호', use:'보호기능 장에서 코드 확인'}
    ],
    terminals: [
      {name:'P24/CM1', desc:'제어전원/공통'}, {name:'입력 1~6', desc:'다기능 입력'},
      {name:'J1/J3', desc:'싱크/소스 타입 전환 관련'}
    ],
    faults: [
      {code:'OC', name:'과전류', cause:'출력단락, 가속 부족, 부하과다', check:'모터/케이블 절연, 가속시간', action:'가속시간 조정, 부하 점검'},
      {code:'OV', name:'과전압', cause:'감속 회생, 입력전압 상승', check:'감속시간, 입력전압', action:'감속시간 증가'},
      {code:'OH', name:'과열', cause:'팬/환기/주위온도', check:'팬 회전, 방열판', action:'청소 및 팬 점검'}
    ]
  },
  {
    id: 'n300',
    maker: 'HYUNDAI',
    model: 'N300',
    title: '현대 N300',
    capacity: 'N300 벡터 인버터',
    summary: '현대 N300 벡터 인버터. 스캔 PDF 자료라 세부 검색은 이미지 기반 원문 대조가 필요.',
    keywords: ['N300','현대','HYUNDAI','벡터','인버터','취급설명서'],
    safety: [
      '취부·운전·보수·점검 전 취급설명서와 부속자료를 숙지하세요.',
      '접지선을 확실히 접속하고 배선작업은 전기공사 전문가가 수행하세요.',
      '입력전원 OFF 확인 후 배선하세요.'
    ],
    quick: [
      {name:'자료 상태', value:'스캔 PDF라 OCR 한계가 있으므로 자주 쓰는 항목부터 수동 DB화 권장'},
      {name:'우선 기능', value:'운전/정지, 주파수 설정, 트립코드, 단자결선, 초기화 순서부터 등록'},
      {name:'현장 확인', value:'키패드 표시 코드와 명판 모델을 같이 확인'}
    ],
    params: [
      {code:'확인 필요', name:'주파수 설정 파라미터', use:'원문 이미지 대조 후 추가'},
      {code:'확인 필요', name:'트립코드', use:'원문 이미지 대조 후 추가'}
    ],
    terminals: [{name:'확인 필요', desc:'원문 접속도 대조 후 추가'}],
    faults: [
      {code:'OC', name:'과전류', cause:'공통 원인: 단락/부하/가속', check:'전류, 절연, 부하', action:'부하 제거 및 배선 점검'},
      {code:'OV', name:'과전압', cause:'감속/회생', check:'입력전압, 감속시간', action:'감속시간 조정'}
    ]
  }
];

const INVERTER_COMMON_GUIDES = [
  {key:'start', title:'인버터 시운전 기본 순서', body:['명판 확인: 모델, 입력전압, 용량, 정격전류','입력 R/S/T와 출력 U/V/W 오결선 확인','접지 확인','모터 정격전류/전압/주파수 파라미터 입력','운전 지령 소스와 주파수 지령 소스 확인','무부하 또는 저속 시운전 후 부하 운전']},
  {key:'trip', title:'트립 발생 시 공통 점검 순서', body:['트립코드와 발생시점 기록','출력주파수, 출력전류, DC 링크 전압 확인','전원 차단 후 방전 대기','모터 절연저항 및 케이블 단락/지락 확인','기계적 구속, 펌프 막힘, 팬 벨트 확인','가감속 시간과 보호 파라미터 확인']},
  {key:'pid', title:'PID 설정 공통 흐름', body:['제어대상 확인: 수위/압력/유량/DO 등','피드백 신호 확인: 0~10V 또는 4~20mA','운전 지령과 주파수 지령 소스 설정','PID 사용 파라미터 ON','P/I/D 게인 및 출력 상하한 설정','수동 운전 후 자동 PID 전환']},
  {key:'comm', title:'RS-485/Modbus 공통 주의', body:['S+/S- 극성 및 SG 연결 확인','차폐 연선 사용, 동력선과 분리','국번, Baud Rate, Parity, Stop Bit 일치','통신으로 변경한 값은 저장 파라미터를 별도 실행해야 유지되는 모델이 있음','운전 지령을 통신으로 줄 경우 현장 비상정지 회로를 별도 확보']}
];
