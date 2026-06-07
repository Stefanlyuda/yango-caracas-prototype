// Caracas transport data
// Source: Caracas bus routes PDF (Metrobús, SITSSA, TransChacao, Bus Vargas, UCAMS, Bus Caracas)

// Approximate coordinates for key stops/areas (for prototype map)
const STOP_COORDS = {
  'Chacao': [10.4972, -66.8597],
  'Chacaíto': [10.4969, -66.8703],
  'Altamira': [10.4955, -66.8482],
  'Plaza Venezuela': [10.4972, -66.8911],
  'Bellas Artes': [10.5036, -66.9056],
  'El Silencio': [10.5054, -66.9183],
  'Sabana Grande': [10.4953, -66.8773],
  'Las Mercedes': [10.4828, -66.8639],
  'Petare': [10.4761, -66.8077],
  'Palo Verde': [10.4925, -66.7872],
  'La California': [10.4861, -66.8261],
  'Macaracuay': [10.4661, -66.8133],
  'San Francisco': [10.4836, -66.8233],
  'Río de Janeiro': [10.4842, -66.8211],
  'Teo Capriles': [10.4781, -66.8205],
  'San Antonio': [10.4738, -66.8154],
  'Cumanagoto': [10.4732, -66.8141],
  'Terepaima': [10.4880, -66.8410],
  'El Llanito': [10.4869, -66.8136],
  'El Marqués': [10.4889, -66.8278],
  'La Urbina': [10.4894, -66.8094],
  'Guarenas': [10.4719, -66.6217],
  'Guatire': [10.4778, -66.5417],
  'Catia': [10.5114, -66.9514],
  'Propatria': [10.5161, -66.9531],
  'Antímano': [10.4769, -66.9786],
  'Montalbán': [10.4778, -66.9522],
  'La Paz': [10.4625, -66.9486],
  'Coche': [10.4500, -66.9400],
  'La Rinconada': [10.4517, -66.9344],
  'Los Teques': [10.3478, -67.0419],
  'El Cafetal': [10.4561, -66.8408],
  'El Hatillo': [10.4256, -66.8261],
  'La Trinidad': [10.4344, -66.8506],
  'Baruta': [10.4322, -66.8731],
  'Caricuao': [10.4439, -66.9806],
  'San Bernardino': [10.5158, -66.8978],
  'Los Dos Caminos': [10.4922, -66.8392],
  'Sebucán': [10.5008, -66.8350],
  'Los Cortijos': [10.4961, -66.8175],
  'Boleita': [10.4969, -66.8244],
  'La Florida': [10.5036, -66.8856],
  'Las Palmas': [10.5089, -66.8964],
  'Colinas de Bello Monte': [10.4806, -66.8631],
  'Sarría': [10.5119, -66.8919],
  'Hospital Militar': [10.4925, -66.9181],
  'Maternidad': [10.5050, -66.9239],
  'Eucaliptos': [10.4983, -66.9211],
  'San Agustín': [10.4925, -66.9036],
  'Nuevo Circo': [10.5003, -66.9136],
  'Bello Monte': [10.4836, -66.8675],
  'Chuao': [10.4811, -66.8569],
  'Ruíz Pineda': [10.4406, -66.9794],
  'Zoológico': [10.4636, -66.9633],
  'La Yaguara': [10.4794, -66.9594],
  'Cacique Tiuna': [10.4456, -66.9367],
  'Ciudad Universitaria': [10.4900, -66.8911],
  'Santa Mónica': [10.4806, -66.8758],
  'Aeropuerto de Maiquetía': [10.6033, -66.9928],
  'Hotel Alba Caracas': [10.5042, -66.9061],
  'Catia La Mar': [10.6050, -67.0297],
  'La Guaira': [10.5994, -66.9344],
  'Pedregal': [10.5042, -66.8489],
  'Bucaral': [10.5008, -66.8428],
  'La Floresta': [10.4992, -66.8478],
  'Los Palos Grandes': [10.5028, -66.8525],
  'El Rosal': [10.4853, -66.8581],
  'La Castellana': [10.5031, -66.8567],
  'Bello Campo': [10.4983, -66.8597],
  'CCCT': [10.4753, -66.8636],
  'Caribe': [10.6147, -66.8742],
  'Naiguatá': [10.6128, -66.7378],
  'Maiquetía': [10.6022, -66.9669],
  'Las Flores': [10.5008, -66.8364],
  'Los Ilustres': [10.4844, -66.8881],
};

// Color palette — every line gets its own distinct color via deterministic hash
// 30 visually distinct colors so neighbouring IDs don't collide
const LINE_PALETTE = [
  '#E74C3C', '#E67E22', '#F39C12', '#F1C40F', '#7CB342',
  '#27AE60', '#16A085', '#00BCD4', '#1ABC9C', '#3498DB',
  '#2980B9', '#5C6BC0', '#9B59B6', '#8E44AD', '#EC407A',
  '#FF5252', '#FF6F00', '#FFB300', '#558B2F', '#00897B',
  '#00ACC1', '#0277BD', '#3949AB', '#6A1B9A', '#AD1457',
  '#795548', '#5D4037', '#37474F', '#546E7A', '#C2185B'
];

// Fallback per-operator color (used only if a line has no id — should never happen)
const OP_COLORS = {
  'Metrobús':    '#E67E22',
  'SITSSA':      '#2E86C1',
  'TransChacao': '#27AE60',
  'Bus Vargas':  '#C0392B',
  'UCAMS':       '#7D3C98',
  'Bus Caracas': '#16A085',
};

// 10 representative lines (subset of the full Caracas system) — chosen to cover
// all operators and key corridors, all with detailed stop lists.
const LINES = [
  { id: '001', op: 'Metrobús', name: 'La California — Macaracuay',
    fwd: ['La California','San Francisco','Río de Janeiro','Teo Capriles','Macaracuay','San Antonio','Cumanagoto','Terepaima','Chacao'],
    bwd: ['Chacao','Terepaima','Cumanagoto','San Antonio','Macaracuay','Teo Capriles','Río de Janeiro','San Francisco','La California'] },
  { id: '011', op: 'Metrobús', name: 'Petare — Guarenas',
    fwd: ['Petare','Palo Verde','Guarenas'], bwd: ['Guarenas','Palo Verde','Petare'] },
  { id: '201', op: 'Metrobús', name: 'Altamira — Cafetal',
    fwd: ['Altamira','Chacaíto','Las Mercedes','El Cafetal'], bwd: ['El Cafetal','Las Mercedes','Chacaíto','Altamira'] },
  { id: '202', op: 'Metrobús', name: 'Altamira — El Hatillo',
    fwd: ['Altamira','Chacaíto','La Trinidad','El Hatillo'], bwd: ['El Hatillo','La Trinidad','Chacaíto','Altamira'] },
  { id: '315', op: 'Metrobús', name: 'Plaza Venezuela — Colinas de Bello Monte',
    fwd: ['Plaza Venezuela','Sabana Grande','Bello Monte','Colinas de Bello Monte'], bwd: ['Colinas de Bello Monte','Bello Monte','Sabana Grande','Plaza Venezuela'] },
  { id: '421', op: 'Metrobús', name: 'Bellas Artes — San Bernardino',
    fwd: ['Bellas Artes','San Bernardino'], bwd: ['San Bernardino','Bellas Artes'] },
  { id: '821', op: 'Metrobús', name: 'Coche — Los Teques',
    fwd: ['Coche','La Rinconada','IVIC','Universidad','Colegio Miranda','Avenida Sucre','Montaña Alta','UNEFA','Independencia','Los Teques'],
    bwd: ['Los Teques','Independencia','UNEFA','Montaña Alta','Avenida Sucre','Colegio Miranda','Universidad','IVIC','La Rinconada','Coche'] },
  { id: 'S001', op: 'SITSSA', name: 'Maiquetía Airport — Hotel Alba Caracas',
    fwd: ['Aeropuerto de Maiquetía','Hotel Alba Caracas'], bwd: ['Hotel Alba Caracas','Aeropuerto de Maiquetía'] },
  { id: 'TC5', op: 'TransChacao', name: 'El Rosal — Country — La Castellana',
    fwd: ['El Rosal','Bello Campo','La Castellana'], bwd: ['La Castellana','Bello Campo','El Rosal'] },
  { id: 'V001', op: 'Bus Vargas', name: 'Caracas — Catia La Mar',
    fwd: ['Bellas Artes','Catia La Mar'], bwd: ['Catia La Mar','Bellas Artes'] },
];

// Transfer nodes (from PDF section 8)
const HUBS = [
  { name: 'Redoma La India',         coord: [10.5033, -66.9192], routes: ['Chacao','Chacaíto','Plaza Venezuela','Catia','Antímano'] },
  { name: 'Plaza Miranda / El Silencio', coord: [10.5054, -66.9183], routes: ['El Silencio — Petare'] },
  { name: 'Metrocenter / Centro',    coord: [10.5025, -66.9092], routes: ['La Rinconada','El Valle','Coche'] },
  { name: 'Avenida Baralt',          coord: [10.5078, -66.9156], routes: ['El Paraíso — La India'] },
  { name: 'Zona Rental',             coord: [10.4892, -66.8961], routes: ['La Vega','La Yaguara','Antímano','Caricuao'] },
  { name: 'Chacaíto',                coord: [10.4969, -66.8703], routes: ['La Trinidad','El Cafetal','El Hatillo'] },
  { name: 'Parque Miranda',          coord: [10.4889, -66.8203], routes: ['Guarenas','Guatire','Mariches'] },
  { name: 'Petare / Puente Baloa',   coord: [10.4761, -66.8077], routes: ['Petare — El Silencio','Macaracuay'] },
];

// Nearby stops simulation — used when user picks "Current location" (Plaza Venezuela area)
// Line chips reference IDs that exist in LINES above.
const NEARBY_FROM = {
  name: 'Plaza Venezuela',
  coord: [10.4972, -66.8911],
  stops: [
    { id: '20104', name: 'Plaza Venezuela',  dist: 84,  lines: ['315'] },
    { id: '20211', name: 'Sabana Grande',    dist: 156, lines: ['315'] },
    { id: '20408', name: 'Bellas Artes',     dist: 421, lines: ['421','V001'] },
    { id: '20512', name: 'Las Mercedes',     dist: 587, lines: ['201'] },
    { id: '20619', name: 'Chacaíto',         dist: 743, lines: ['201','202'] },
    { id: '20704', name: 'Bello Monte',      dist: 812, lines: ['315'] },
    { id: '20811', name: 'Altamira',         dist: 956, lines: ['201','202'] },
    { id: '20912', name: 'Petare',           dist: 1240,lines: ['011'] },
  ]
};

// Schedule generation (procedural — every 8-15 min between 5:00 and 23:00)
function generateSchedule(lineId) {
  const hash = lineId.split('').reduce((a,c)=>a + c.charCodeAt(0), 0);
  const interval = 8 + (hash % 8); // 8..15 min
  const offset = hash % interval;
  const out = { weekday: [], saturday: [], sunday: [] };
  for (let h = 5; h < 23; h++) {
    for (let m = offset; m < 60; m += interval) {
      const t = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
      out.weekday.push(t);
      if (h >= 6) out.saturday.push(t);
      if (h >= 7 && h <= 21 && m % (interval*2) === offset) out.sunday.push(t);
    }
  }
  return out;
}

// Helpers
// djb2-style hash for line id+operator → palette index. Gives every line a distinct color
// while keeping the assignment deterministic across reloads.
function colorForLine(line) {
  if (!line || !line.id) return '#5D6D7E';
  const s = line.id + '|' + (line.op || '');
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return LINE_PALETTE[Math.abs(h) % LINE_PALETTE.length];
}
function getLine(id) {
  return LINES.find(l => l.id === id);
}
function coordOf(stopName) {
  return STOP_COORDS[stopName] || null;
}
