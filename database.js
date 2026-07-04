const MOTOR_SIZES = [
  {hp:1, kw:0.75},{hp:2, kw:1.5},{hp:3, kw:2.2},{hp:5, kw:3.7},{hp:7.5, kw:5.5},
  {hp:10, kw:7.5},{hp:15, kw:11},{hp:20, kw:15},{hp:25, kw:18.5},{hp:30, kw:22},
  {hp:40, kw:30},{hp:50, kw:37},{hp:60, kw:45},{hp:75, kw:55},{hp:100, kw:75}
];

const BREAKER_RATINGS = [5,10,15,20,30,40,50,60,75,100,125,150,175,200,225,250,300,350,400];
const BREAKER_FRAMES = [
  {max:30, frame:30},{max:60, frame:60},{max:100, frame:100},{max:225, frame:225},{max:400, frame:400}
];

// 실무 간편 CV 케이블 허용전류 DB. 실제 적용 전 KEC 포설조건/보정계수로 재검토.
const CABLES = [
  {sq:2.5, iz:28, terminal:'R2-4', cableOD:13.5},
  {sq:4, iz:37, terminal:'R3.5-4', cableOD:15.2},
  {sq:6, iz:47, terminal:'R5.5-5', cableOD:17.0},
  {sq:10, iz:65, terminal:'R8-5', cableOD:20.5},
  {sq:16, iz:87, terminal:'R14-6', cableOD:24.0},
  {sq:25, iz:115, terminal:'R22-8', cableOD:29.0},
  {sq:35, iz:142, terminal:'R38-8', cableOD:33.0},
  {sq:50, iz:175, terminal:'R60-10', cableOD:39.0},
  {sq:70, iz:220, terminal:'R70-10', cableOD:45.0},
  {sq:95, iz:270, terminal:'R100-12', cableOD:52.0}
];

const CONDUIT_ACCESSORIES = {
  CD: {
    name:'CD관',
    sizes:[16,22,28,36,42,54],
    fittings:(s)=>({connector:`CD${s} 커넥터`, insert:`CD${s} 인서트`, saddle:`CD${s} 새들`, note:'실내 매입/은폐 배관용 간편 추천'})
  },
  GW: {
    name:'GW 방수후렉시블관',
    sizes:[16,22,28,36,42,54],
    fittings:(s)=>({connector:`GW${s} 방수커넥터`, insert:`GW${s} 로크너트/부싱`, saddle:`GW${s} 새들`, note:'옥외·습기·기계 진동부 접속용 간편 추천'})
  }
};

const HOLE_CUTTERS = {
  16:'22mm', 22:'28mm', 28:'35mm', 36:'45mm', 42:'51mm', 54:'65mm'
};

const LOCATION_RULES = {
  indoorHidden:{label:'실내 매입/은폐', conduitType:'CD'},
  indoorExposed:{label:'실내 노출/기계 주변', conduitType:'GW'},
  outdoorWet:{label:'옥외/습기 우려', conduitType:'GW'}
};

// 케이블 굵기별 접속 자재 간편 DB. 터미널은 제조사 단자대 볼트 규격에 따라 최종 확인.
const CABLE_ACCESSORY_DB = [
  {sq:1.5, terminal:'R1.5-4', yTerminal:'Y1.5-4', heatShrink:'φ4~6mm', tie:'소형 케이블타이 100~150mm', lugBolt:'M4', strip:'약 8~10mm'},
  {sq:2.5, terminal:'R2-4', yTerminal:'Y2-4', heatShrink:'φ5~8mm', tie:'소형 케이블타이 150mm', lugBolt:'M4', strip:'약 9~11mm'},
  {sq:4, terminal:'R3.5-4', yTerminal:'Y3.5-4', heatShrink:'φ6~10mm', tie:'소형/중형 케이블타이 150~200mm', lugBolt:'M4', strip:'약 10~12mm'},
  {sq:6, terminal:'R5.5-5', yTerminal:'Y5.5-5', heatShrink:'φ8~12mm', tie:'중형 케이블타이 200mm', lugBolt:'M5', strip:'약 11~13mm'},
  {sq:10, terminal:'R8-5', yTerminal:'Y8-5', heatShrink:'φ10~16mm', tie:'중형 케이블타이 200~250mm', lugBolt:'M5', strip:'약 12~15mm'},
  {sq:16, terminal:'R14-6', yTerminal:'Y14-6', heatShrink:'φ14~20mm', tie:'중형/대형 케이블타이 250mm', lugBolt:'M6', strip:'약 15~18mm'},
  {sq:25, terminal:'R22-8', yTerminal:'Y22-8', heatShrink:'φ18~25mm', tie:'대형 케이블타이 300mm', lugBolt:'M8', strip:'약 18~22mm'},
  {sq:35, terminal:'R38-8', yTerminal:'Y38-8', heatShrink:'φ22~30mm', tie:'대형 케이블타이 300~370mm', lugBolt:'M8', strip:'약 20~25mm'},
  {sq:50, terminal:'R60-10', yTerminal:'-', heatShrink:'φ30~40mm', tie:'대형 케이블타이 370mm', lugBolt:'M10', strip:'약 24~30mm'},
  {sq:70, terminal:'R70-10', yTerminal:'-', heatShrink:'φ35~50mm', tie:'대형 케이블타이 370~450mm', lugBolt:'M10', strip:'약 28~35mm'},
  {sq:95, terminal:'R100-12', yTerminal:'-', heatShrink:'φ45~60mm', tie:'대형 케이블타이 450mm 이상', lugBolt:'M12', strip:'약 32~40mm'}
];

const CABLE_TYPE_INFO = {
  CV_4C:{label:'CV 4C', cores:'4심', note:'삼상 모터/동력 부하에 주로 사용'},
  CV_3C:{label:'CV 3C', cores:'3심', note:'3선식 동력/단상 회로 등 현장 조건에 따라 사용'},
  CV_2C:{label:'CV 2C', cores:'2심', note:'단상 2선식 부하에 주로 사용'},
  HIV_SINGLE:{label:'HIV/IV 단심', cores:'단심', note:'제어반 내부 배선 또는 전선관 내 절연전선용'}
};

const COMMON_CABLE_TOOLS = {
  panel:['절연캡 또는 수축튜브', '상표시 마킹튜브/라벨', '케이블타이', '절연테이프', '압착공구'],
  motor:['절연캡 또는 수축튜브', '상표시 마킹튜브/라벨', '방수테이프(습기 우려 시)', '케이블타이', '압착공구'],
  junction:['직선슬리브 또는 압착슬리브', '수축튜브', '절연테이프', '방수테이프(습기 우려 시)', '압착공구']
};

// KEPCO 전기요금 간편 DB (공식 요금표 기준, 일부 주요 계약종별만 탑재)
// 단위: 기본요금 원/kW, 전력량요금 원/kWh
// season keys: summer, springAutumn, winter. load keys: light, mid, peak.
const TARIFFS = [
  {
    id:'general_a1_low', label:'일반용(갑)Ⅰ 저압전력', type:'flat', basic:5990,
    energy:{summer:102.9, springAutumn:64.1, winter:88.8},
    note:'계약전력 300kW 미만 일반용, 저압 단일요금'
  },
  {
    id:'general_a1_highA_1', label:'일반용(갑)Ⅰ 고압A 선택Ⅰ', type:'flat', basic:6990,
    energy:{summer:113.4, springAutumn:70.8, winter:100.0},
    note:'일반용(갑)Ⅰ 고압A 선택Ⅰ 단일요금'
  },
  {
    id:'general_b_highA_1', label:'일반용(을) 고압A 선택Ⅰ', type:'tou', basic:6990,
    energy:{
      summer:{light:59.1, mid:112.2, peak:192.5},
      springAutumn:{light:59.1, mid:82.4, peak:112.4},
      winter:{light:65.3, mid:110.4, peak:165.6}
    },
    note:'일반용(을) 고압A 선택Ⅰ 시간대별요금'
  },
  {
    id:'general_b_highA_2', label:'일반용(을) 고압A 선택Ⅱ', type:'tou', basic:8020,
    energy:{
      summer:{light:53.8, mid:106.9, peak:187.2},
      springAutumn:{light:53.8, mid:77.1, peak:107.1},
      winter:{light:60.0, mid:105.1, peak:160.3}
    },
    note:'일반용(을) 고압A 선택Ⅱ 시간대별요금'
  },
  {
    id:'industrial_a1_low', label:'산업용(갑)Ⅰ 저압전력', type:'flat', basic:5270,
    energy:{summer:76.8, springAutumn:57.9, winter:74.3},
    note:'산업용(갑)Ⅰ 저압 단일요금'
  },
  {
    id:'industrial_a1_highA_1', label:'산업용(갑)Ⅰ 고압A 선택Ⅰ', type:'flat', basic:6200,
    energy:{summer:84.5, springAutumn:63.9, winter:83.8},
    note:'산업용(갑)Ⅰ 고압A 선택Ⅰ 단일요금'
  },
  {
    id:'industrial_a2_highA_1', label:'산업용(갑)Ⅱ 고압A 선택Ⅰ', type:'tou', basic:6990,
    energy:{
      summer:{light:58.4, mid:83.9, peak:112.4},
      springAutumn:{light:58.4, mid:63.1, peak:78.9},
      winter:{light:65.3, mid:82.4, peak:105.7}
    },
    note:'산업용(갑)Ⅱ 고압A 선택Ⅰ 시간대별요금'
  },
  {
    id:'industrial_a2_highA_2', label:'산업용(갑)Ⅱ 고압A 선택Ⅱ', type:'tou', basic:7140,
    energy:{
      summer:{light:53.7, mid:79.2, peak:107.7},
      springAutumn:{light:53.7, mid:58.4, peak:74.2},
      winter:{light:60.6, mid:77.7, peak:101.0}
    },
    note:'산업용(갑)Ⅱ 고압A 선택Ⅱ 시간대별요금'
  },
  {
    id:'industrial_b_highA_1', label:'산업용(을) 고압A 선택Ⅰ', type:'tou', basic:6200,
    energy:{
      summer:{light:58.4, mid:83.9, peak:112.4},
      springAutumn:{light:58.4, mid:63.1, peak:78.9},
      winter:{light:65.3, mid:82.4, peak:105.7}
    },
    note:'산업용(을) 고압A 선택Ⅰ 시간대별요금'
  },
  {
    id:'industrial_b_highA_2', label:'산업용(을) 고압A 선택Ⅱ', type:'tou', basic:8050,
    energy:{
      summer:{light:53.8, mid:106.9, peak:187.2},
      springAutumn:{light:53.8, mid:77.1, peak:107.1},
      winter:{light:60.0, mid:105.1, peak:160.3}
    },
    note:'산업용(을) 고압A 선택Ⅱ 시간대별요금'
  },
  {
    id:'manual', label:'직접입력', type:'flat', basic:0,
    energy:{summer:0, springAutumn:0, winter:0},
    note:'직접 단가를 입력합니다.'
  }
];
