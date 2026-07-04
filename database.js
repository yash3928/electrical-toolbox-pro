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
