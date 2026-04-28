/* ============================================================
   DOM REFERENCES
   ============================================================ */
const contentEl = document.getElementById("content");
const timeEl = document.getElementById("time");
const locationBtn = document.getElementById("locationBtn");
const weatherBtn = document.getElementById("weatherBtn");
const customModeBtn = document.getElementById("customModeBtn");
const dropdown = document.getElementById("weatherDropdown");
const cityInput = document.getElementById("cityInput");
const cityField = document.getElementById("cityField");
const citySuggestions = document.getElementById("citySuggestions");
const customTextField = document.getElementById("customTextField");
const addCustomTextBtn = document.getElementById("addCustomTextBtn");
const tempBtn  = document.getElementById("tempBtn");
const aboutBtn = document.getElementById("aboutBtn");
const aboutCard = document.getElementById("aboutCard");
const customControls = document.getElementById("customControls");
const weatherTypeSlider = document.getElementById("weatherTypeSlider");
const weatherTypeValue = document.getElementById("weatherTypeValue");
const weatherLevelSlider = document.getElementById("weatherLevelSlider");
const weatherLevelValue = document.getElementById("weatherLevelValue");
const timeSlider = document.getElementById("timeSlider");
const timeSliderValue = document.getElementById("timeSliderValue");
const tempSlider = document.getElementById("tempSlider");
const tempSliderValue = document.getElementById("tempSliderValue");
const moonEl = document.getElementById("moon");
const customHideBtn = document.getElementById("customHideBtn");

/* ============================================================
   STATE
   ============================================================ */
const world = { width: 0, height: 0 };
const CELL = 10;
let groundHeights = [];
let currentTimezone = "America/New_York";
let currentAnimatedWeather = null;
let animationFrameId = null;
let phraseObjects = [];
let lastSpawnTime = 0;
let activeFrozen = null;
let customPhrases = [];
let suggestionResults = [];
let suggestionDebounceId = null;
let isTouchDevice = window.matchMedia("(hover: none)").matches;
let mode = "api";
let latestApiContext = null;
let defaultLocation = null;

/* simulatedMinutes: null = 使用真实时间; 0–1439 = custom mode 时间覆盖 */
let simulatedMinutes = null;

/* simulatedTempC: null = 使用 API 温度; number = custom mode 温度覆盖 */
let simulatedTempC = null;

/* temperature state */
let currentTempC = null;      /* raw °C value from API */
let tempUnitIsCelsius = true;  /* toggle on click */

/* ============================================================
   AUTOCOMPLETE FALLBACK
   ============================================================ */
const fallbackAutocomplete = [
  { label: "China", query: "China" },
  { label: "Chile", query: "Chile" },
  { label: "Chicago / United States", query: "Chicago" },
  { label: "Chengdu / China", query: "Chengdu" },
  { label: "Chongqing / China", query: "Chongqing" }
];

/* ============================================================
   WEATHER CONTENT
   如需增删短语，在对应的 phrases 数组里修改
   ============================================================ */
const weatherContent = {
  Rain: {
    light:  { label: "Light Rain",   phrases: [{ text: "take an umbrella and step outside", weight: 1.1 }, { text: "walk slowly through the streets", weight: 1.0 }, { text: "visit a friend nearby", weight: 1.2 }, { text: "notice the small puddles", weight: 0.9 }] },
    medium: { label: "Medium Rain",  phrases: [{ text: "stay in a little longer", weight: 1.2 }, { text: "listen to the rain by the window", weight: 0.9 }, { text: "call someone you've been thinking of", weight: 1.0 }, { text: "make something warm to drink", weight: 1.1 }] },
    heavy:  { label: "Heavy Rain",   phrases: [{ text: "change your sheets", weight: 1.3 }, { text: "tidy up your space", weight: 1.1 }, { text: "light a candle", weight: 0.8 }, { text: "watch something you've been saving", weight: 1.0 }] }
  },
  Clear: {
    /* light = 清晨/傍晚 Clear, medium = 上午/下午 Clear Sky, heavy = 正午 Sunny */
    light:  { label: "Clear",      phrases: [{ text: "open the curtains", weight: 0.8 }, { text: "the light is gentle", weight: 0.7 }, { text: "a quiet moment outside", weight: 1.0 }, { text: "step outside for a moment", weight: 0.9 }] },
    medium: { label: "Clear Sky",  phrases: [{ text: "go for a walk", weight: 1.0 }, { text: "spend some time in the park", weight: 1.1 }, { text: "call a friend to join you", weight: 1.0 }, { text: "stay in the warmth a little longer", weight: 0.9 }] },
    heavy:  { label: "Sunny",      phrases: [{ text: "wear a color you love", weight: 1.0 }, { text: "let the light in", weight: 0.9 }, { text: "the sun is high", weight: 0.8 }, { text: "find some shade", weight: 1.1 }] }
  },
  Wind: {
    light:  { label: "Light Wind",  phrases: [{ text: "go out for a walk", weight: 0.9 }, { text: "feel the direction of the wind", weight: 0.8 }, { text: "wear something that moves", weight: 0.7 }, { text: "stay outside a little longer", weight: 1.0 }] },
    medium: { label: "Medium Wind", phrases: [{ text: "add a layer before you leave", weight: 1.1 }, { text: "watch the trees shift", weight: 0.8 }, { text: "keep moving", weight: 1.0 }, { text: "follow where the air takes you", weight: 0.9 }] },
    heavy:  { label: "Strong Wind", phrases: [{ text: "stay in if you can", weight: 1.3 }, { text: "close the windows", weight: 1.2 }, { text: "make your space comfortable", weight: 1.0 }, { text: "return to something quiet", weight: 1.1 }] }
  },
  Snow: {
    light:  { label: "Light Snow",  phrases: [{ text: "catch a snowflake in your hand", weight: 0.7 }, { text: "walk slowly outside", weight: 1.0 }, { text: "leave soft footprints", weight: 0.8 }, { text: "make something warm", weight: 1.1 }] },
    medium: { label: "Medium Snow", phrases: [{ text: "build something in the snow", weight: 1.2 }, { text: "draw on the ground with your steps", weight: 1.0 }, { text: "stay out just a little longer", weight: 0.9 }, { text: "come back in for warmth", weight: 1.1 }] },
    heavy:  { label: "Heavy Snow",  phrases: [{ text: "stay inside", weight: 1.3 }, { text: "make tea", weight: 1.0 }, { text: "watch the snow fall", weight: 0.8 }, { text: "wrap yourself in something warm", weight: 1.1 }] }
  },
  Cloudy: {
    light:  { label: "Light Cloud", phrases: [{ text: "the sky is thinking", weight: 1.0 }, { text: "a soft day to be outside", weight: 0.9 }, { text: "the light is gentle today", weight: 0.8 }, { text: "take the longer way home", weight: 1.0 }] },
    medium: { label: "Cloudy",      phrases: [{ text: "a good day to stay indoors", weight: 1.1 }, { text: "the clouds are moving slowly", weight: 0.9 }, { text: "find a window to sit by", weight: 1.0 }, { text: "let your mind wander", weight: 0.8 }] },
    heavy:  { label: "Overcast",    phrases: [{ text: "draw the curtains open anyway", weight: 1.2 }, { text: "light feels different today", weight: 1.0 }, { text: "wear something comfortable", weight: 0.9 }, { text: "it might clear up later", weight: 1.1 }] }
  },
  /* 夜间专用 — 无雨雪风时的夜晚 */
  Night: {
    light:  { label: "Night", phrases: [{ text: "the city is quieter now", weight: 1.0 }, { text: "leave the window open a little", weight: 0.9 }, { text: "let the night air in", weight: 0.8 }, { text: "rest soon", weight: 1.1 }] },
    medium: { label: "Night", phrases: [{ text: "the city is quieter now", weight: 1.0 }, { text: "leave the window open a little", weight: 0.9 }, { text: "let the night air in", weight: 0.8 }, { text: "rest soon", weight: 1.1 }] },
    heavy:  { label: "Night", phrases: [{ text: "the city is quieter now", weight: 1.0 }, { text: "leave the window open a little", weight: 0.9 }, { text: "let the night air in", weight: 0.8 }, { text: "rest soon", weight: 1.1 }] }
  }
};

/* ============================================================
   WEATHER TYPE ORDER — Custom Mode type slider
   如需增减，同步修改 HTML weatherTypeSlider 的 max 值
   ============================================================ */
const weatherTypeOrder = [
  { label: "Clear", type: "Clear",  level: "medium", modeType: "sunny" },
  { label: "Wind",          type: "Wind",   level: "medium", modeType: "wind"  },
  { label: "Rain",          type: "Rain",   level: "medium", modeType: "rain"  },
  { label: "Snow",          type: "Snow",   level: "medium", modeType: "snow"  }
];

/* ============================================================
   COLOR MAP
   如需调整颜色，在这里改 hex 值
   ============================================================ */
/* Two accent hues (as [h, s] for HSL) — lightness adjusted dynamically for contrast
   Clear/Sunny uses warm pale yellow; all others use a cooler blue-teal hue */
const typeAccentHSL = {
  sunny:   [48,  85],   /* warm yellow */
  wind:    [48,  85],   /* same yellow — only two colours site-wide */
  rain:    [48,  85],
  snow:    [48,  85],
  cloudy:  [48,  85],
  night:   [48,  85],
  default: [48,  85],
};

const levelNames = { light: "Light", medium: "Medium", heavy: "Heavy" };

/* ============================================================
   ALL STATES — weather dropdown 15 个选项
   ============================================================ */
const allStates = [
  { type: "Clear",  level: "light",  display: "Clear (Light)"   },
  { type: "Clear",  level: "medium", display: "Clear (Medium)"  },
  { type: "Clear",  level: "heavy",  display: "Sunny (Heavy)"   },
  { type: "Cloudy", level: "light",  display: "Cloudy (Light)"  },
  { type: "Cloudy", level: "medium", display: "Cloudy (Medium)" },
  { type: "Cloudy", level: "heavy",  display: "Cloudy (Heavy)"  },
  { type: "Wind",   level: "light",  display: "Wind (Light)"    },
  { type: "Wind",   level: "medium", display: "Wind (Medium)"   },
  { type: "Wind",   level: "heavy",  display: "Wind (Heavy)"    },
  { type: "Rain",   level: "light",  display: "Rain (Light)"    },
  { type: "Rain",   level: "medium", display: "Rain (Medium)"   },
  { type: "Rain",   level: "heavy",  display: "Rain (Heavy)"    },
  { type: "Snow",   level: "light",  display: "Snow (Light)"    },
  { type: "Snow",   level: "medium", display: "Snow (Medium)"   },
  { type: "Snow",   level: "heavy",  display: "Snow (Heavy)"    },
];

const candidateCities = ["Singapore","Mumbai","Bangkok","Jakarta","Manila","Seattle","Vancouver","London","Helsinki","Reykjavik","Oslo","Anchorage","Beijing","Shanghai","Tokyo","Seoul","Delhi","Dubai","Paris","Berlin","Rome","Madrid","Cairo","Cape Town","Nairobi","Lagos","New York","Los Angeles","Chicago","San Francisco","Boston","Toronto","Montreal","Mexico City","Buenos Aires","Sao Paulo","Sydney","Melbourne","Brisbane","Auckland","Kuala Lumpur","Johannesburg","Moscow","Stockholm","Zurich","Amsterdam","Lisbon","Athens","Istanbul","Karachi"];

/* ============================================================
   TIME & DAYLIGHT HELPERS
   ============================================================ */
function clamp01(v) { return Math.max(0, Math.min(1, v)); }

/* 返回当前（或模拟）时间的分钟数 0–1439 */
function getCurrentMinutes() {
  if (simulatedMinutes !== null) return simulatedMinutes;
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: currentTimezone }));
  return now.getHours() * 60 + now.getMinutes();
}

/* 日出/日落时间（分钟）
   如需接入真实 sunrise/sunset API，替换这两个常量 */
const SUNRISE_MIN = 6 * 60;   /* 06:00 */
const SUNSET_MIN  = 20 * 60;  /* 20:00 */

function isNight(minutes) {
  const m = minutes ?? getCurrentMinutes();
  return m < SUNRISE_MIN || m > SUNSET_MIN;
}

/* 日光强度 0（夜/黎明/黄昏）→ 1（正午） */
function getDaylightFactor(minutes) {
  const m = minutes ?? getCurrentMinutes();
  if (m <= SUNRISE_MIN || m >= SUNSET_MIN) return 0;
  return Math.sin(((m - SUNRISE_MIN) / (SUNSET_MIN - SUNRISE_MIN)) * Math.PI);
}

/* Clear 的 level 由时间决定 */
function getClearLevelByTime(minutes) {
  const f = getDaylightFactor(minutes ?? getCurrentMinutes());
  if (f > 0.75) return "heavy";   /* Sunny */
  if (f > 0.35) return "medium";  /* Clear Sky */
  return "light";                 /* Clear */
}

/* ============================================================
   TEMPERATURE → BACKGROUND COLOR
   参考图调色板（只白天）：
   ≥ 35°C  深橙    rgb(210, 120, 50)
   28°C    暖橙    rgb(220, 155, 80)
   22°C    暖黄白  rgb(225, 205, 160)
   16°C    浅暖白  rgb(220, 215, 200)
   10°C    浅冷白  rgb(210, 215, 220)
    4°C    冷灰蓝  rgb(185, 200, 215)
  ≤ −2°C  冷蓝白  rgb(170, 190, 215)
   夜间：在此基础上向 rgb(10,18,35) 混合，nightFactor 越大越深
   ============================================================ */
function getTempBg(tempC) {
  /* clamp */
  const t = Math.max(-10, Math.min(40, tempC ?? 20));
  /* 关键帧 [tempC, r, g, b] */
  const stops = [
    [-10, 160, 185, 220],
    [  4, 185, 200, 215],
    [ 10, 210, 215, 220],
    [ 16, 220, 215, 200],
    [ 22, 225, 205, 160],
    [ 28, 220, 155,  80],
    [ 35, 210, 120,  50],
    [ 40, 200,  90,  35],
  ];
  let i = 0;
  for (let k = 0; k < stops.length - 1; k++) {
    if (t >= stops[k][0] && t <= stops[k+1][0]) { i = k; break; }
    if (t > stops[stops.length-1][0]) { i = stops.length - 2; break; }
  }
  const a = stops[i], b = stops[i+1];
  const f = (t - a[0]) / (b[0] - a[0]);
  return [
    Math.round(a[1] + (b[1]-a[1]) * f),
    Math.round(a[2] + (b[2]-a[2]) * f),
    Math.round(a[3] + (b[3]-a[3]) * f),
  ];
}

/* 感知亮度 (0–255) */
function perceivedLightness(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/* ============================================================
   DAY/NIGHT VISUALS — 每帧调用
   背景色 = 温度色 × 时间暗度
   文字色 = 背景的动态对比色（保证可读）
   ============================================================ */
function updateDayNightVisuals() {
  const minutes = getCurrentMinutes();
  const night   = isNight(minutes);

  /* bgFactor: 0 = 最深夜, 1 = 正午白天
     用单一连续公式，消除日出/日落处的跳变：
     计算当前时刻距最近昼夜边界的有符号距离，
     白天内部为正，夜间为负，再 smoothstep 映射到 0–1 */
  const TRANSITION = 60;
  let _distToBoundary;
  if (minutes >= SUNRISE_MIN && minutes <= SUNSET_MIN) {
    _distToBoundary = Math.min(minutes - SUNRISE_MIN, SUNSET_MIN - minutes);
  } else if (minutes < SUNRISE_MIN) {
    _distToBoundary = -(SUNRISE_MIN - minutes);
  } else {
    _distToBoundary = -(minutes - SUNSET_MIN);
  }
  const _t = Math.max(0, Math.min(1, _distToBoundary / TRANSITION));
  const bgFactor = _t * _t * (3 - 2 * _t);  /* smoothstep */

  /* 当前有效温度 */
  const activeTemp = simulatedTempC !== null ? simulatedTempC : (currentTempC ?? 20);

  /* 白天温度色 */
  const [dr, dg, db] = getTempBg(activeTemp);

  /* 夜间底色（深蓝黑） */
  const nr = 10, ng = 18, nb = 35;

  /* 最终背景：白天色 × bgFactor 叠加夜间色 */
  const br = Math.round(nr + (dr - nr) * bgFactor);
  const bg = Math.round(ng + (dg - ng) * bgFactor);
  const bb = Math.round(nb + (db - nb) * bgFactor);
  document.body.style.background = `rgb(${br},${bg},${bb})`;

  /* ── TWO-COLOUR CONTRAST SYSTEM ──
     --text   : switches cleanly at lum=128 (no mid-tone blend = no grey mud)
                dark bg  → near-white cool  rgb(220,228,238)  lum≈227
                light bg → near-black warm  rgb(40,32,24)     lum≈33
     --accent : warm yellow, two fixed values chosen for contrast
                dark bg (lum<128) → bright yellow hsl(46,85%,72%) lum≈193
                light bg (lum≥128)→ dark  gold   hsl(46,80%,34%) lum≈87
     Both guarantee ≥65 perceived contrast units on any background. */
  const lum = perceivedLightness(br, bg, bb);
  /* --text: near-white on dark bg, near-black on light bg */
  const textColor = lum < 128 ? "rgb(220,228,238)" : "rgb(35,28,18)";
  /* --accent (animated phrases + weather label):
     dark bg (lum<100): bright warm yellow rgb(244,216,123) — clearly visible on any dark/cool bg
     light/mid bg (lum>=100): same near-black as text — yellow is unreadable on warm orange/beige */
  const accentColor = lum < 100 ? "rgb(244,216,123)" : "rgb(35,28,18)";

  const root = document.documentElement;
  root.style.setProperty('--text',   textColor);
  root.style.setProperty('--accent', accentColor);
  if (typeof weatherBtn !== 'undefined' && weatherBtn) weatherBtn.style.color = textColor;
  if (typeof tempBtn    !== 'undefined' && tempBtn)    tempBtn.style.color    = textColor;
  if (typeof contentEl  !== 'undefined' && contentEl)  contentEl.style.color  = accentColor;

  /* panel/input 也跟着背景走，保持与背景的对比 */
  /* panel 背景：白天略亮于页面（+12），夜间略暗（−6），在 bgFactor 之间平滑过渡，消除跳变 */
  const panelLift = Math.round(-6 + bgFactor * 18);   /* −6 (深夜) → +12 (正午) */
  const pbr = Math.min(255, Math.max(0, br + panelLift));
  const pbg = Math.min(255, Math.max(0, bg + panelLift));
  const pbb = Math.min(255, Math.max(0, bb + panelLift));
  root.style.setProperty('--panel-bg',    `rgb(${pbr},${pbg},${pbb})`);
  root.style.setProperty('--input-bg',    `rgb(${pbr},${pbg},${pbb})`);
  root.style.setProperty('--panel-text',  textColor);
  root.style.setProperty('--label-text',  textColor);
  root.style.setProperty('--input-text',  textColor);
  root.style.setProperty('--panel-border', lum < 128 ? 'rgba(220,228,238,0.30)' : 'rgba(40,32,24,0.30)');

  /* slider 轨道/滑块跟随文字色调 */
  root.style.setProperty('--slider-track', lum < 128 ? 'rgba(220,228,238,0.35)' : 'rgba(40,32,24,0.35)');
  root.style.setProperty('--slider-thumb', lum < 128 ? 'rgba(220,228,238,0.70)' : 'rgba(40,32,24,0.70)');

  /* 月亮 */
  if (moonEl) {
    if (!night && bgFactor > 0.95) {
      moonEl.style.display = "none";
    } else {
      moonEl.style.display = "block";
      const pos = getMoonPosition(minutes);
      moonEl.style.left    = pos.x + "px";
      moonEl.style.top     = pos.y + "px";
      moonEl.style.opacity = String(Math.max(0.1, 1 - bgFactor));
    }
  }
}

/* ============================================================
   SUN ORIGIN — Clear/Sunny 文字起始点
   日出 → 左下角, 正午 → 正上方, 日落 → 右下角, 午夜 → 屏幕外底部
   ============================================================ */
function getSunOrigin(minutesOverride) {
  const m = minutesOverride ?? getCurrentMinutes();
  const t = m / 1440;

  /* 关键点（t=时间比例, x/y=屏幕比例）*/
  const kp = [
    { t: 0.00, x: 0.5,  y: 1.15 },  /* 00:00 午夜：屏幕外底部 */
    { t: 0.25, x: 0.0,  y: 1.0  },  /* 06:00 日出：左下角 */
    { t: 0.50, x: 0.5,  y: -0.06 }, /* 12:00 正午：正上方中央 */
    { t: 0.75, x: 1.0,  y: 1.0  },  /* 18:00 日落：右下角 */
    { t: 1.00, x: 0.5,  y: 1.15 },  /* 24:00 循环 */
  ];

  let i = 0;
  for (let k = 0; k < kp.length - 1; k++) { if (t >= kp[k].t && t <= kp[k+1].t) { i = k; break; } }
  const a = kp[i], b = kp[i+1];
  const lt = (t - a.t) / (b.t - a.t);
  const s  = lt * lt * (3 - 2 * lt); /* smoothstep */
  return { x: (a.x + (b.x - a.x) * s) * world.width, y: (a.y + (b.y - a.y) * s) * world.height };
}

/* ============================================================
   MOON POSITION
   日落后从右下升起 → 正上方子夜 → 左下日出
   ============================================================ */
function getMoonPosition(minutesOverride) {
  const m = minutesOverride ?? getCurrentMinutes();
  const nightDuration = 1440 - (SUNSET_MIN - SUNRISE_MIN);
  let np; /* night progress 0→1 */
  if (m > SUNSET_MIN)      np = (m - SUNSET_MIN) / nightDuration;
  else if (m < SUNRISE_MIN) np = (1440 - SUNSET_MIN + m) / nightDuration;
  else                      np = 0.5;

  const mk = [
    { t: 0.0, x: 1.0,  y: 0.9 },
    { t: 0.5, x: 0.5,  y: 0.05 },
    { t: 1.0, x: 0.0,  y: 0.9 },
  ];
  let i2 = 0;
  for (let k = 0; k < mk.length - 1; k++) { if (np >= mk[k].t && np <= mk[k+1].t) { i2 = k; break; } }
  const ma = mk[i2], mb = mk[i2+1];
  const mt = (np - ma.t) / (mb.t - ma.t);
  const ms = mt * mt * (3 - 2 * mt);
  /* -20 以月亮中心定位（月亮宽40px）*/
  return { x: (ma.x + (mb.x - ma.x) * ms) * world.width - 20, y: (ma.y + (mb.y - ma.y) * ms) * world.height - 20 };
}

/* ============================================================
   WORLD / SCENE
   ============================================================ */
function resetGround() {
  const cols = Math.max(1, Math.ceil(world.width / CELL));
  groundHeights = new Array(cols).fill(world.height);
}

function updateWorldSize() {
  const rect = contentEl.getBoundingClientRect();
  world.width  = rect.width;
  world.height = rect.height;
  resetGround();
}

function measureObject(obj) {
  const rect = obj.el.getBoundingClientRect();
  obj.width  = rect.width  || 20;
  obj.height = rect.height || 20;
}

function getColorKey(weatherData) {
  if (isNight()) return "night";
  if (weatherData.type === "Clear")  return "sunny";
  if (weatherData.type === "Wind")   return "wind";
  if (weatherData.type === "Rain")   return "rain";
  if (weatherData.type === "Snow")   return "snow";
  if (weatherData.type === "Cloudy") return "cloudy";
  return "default";
}

/* ============================================================
   TWO-COLOUR SYSTEM
   The site uses exactly two colours at any time:
   1. --text : the base readable text colour (dark on light bg, light on dark bg)
   2. --accent: a pale warm yellow, lightness adjusted to stay readable on current bg
   Both are set here and in updateDayNightVisuals.
   ============================================================ */
function applyTypeColor(weatherData) {
  /* mirror the same logic as updateDayNightVisuals so there's no 1-frame lag */
  const bodyBg = document.body.style.background || "rgb(220,215,200)";
  const m = bodyBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  const bgLum = m ? perceivedLightness(+m[1],+m[2],+m[3]) : 180;
  const color = bgLum < 100 ? "rgb(244,216,123)" : "rgb(35,28,18)";
  contentEl.style.color = color;
  const bodyBg2 = document.body.style.background || 'rgb(220,215,200)';
  const m2 = bodyBg2.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  const bgLum2 = m2 ? perceivedLightness(+m2[1],+m2[2],+m2[3]) : 180;
  const topBarColor = bgLum2 < 128 ? 'rgb(220,228,238)' : 'rgb(35,28,18)';
  weatherBtn.style.color = topBarColor;
  if (tempBtn) tempBtn.style.color = topBarColor;
}

function makeReadable(obj) {
  obj.el.classList.add("readable");
  obj.el.style.transform = `translate(${obj.x}px, ${Math.max(10, Math.min(world.height - obj.height - 10, obj.y))}px) rotate(0deg)`;
  /* 风的 wavy spans 归零 */
  if (obj._wavyUnits) obj._wavyUnits.forEach(s => s.style.top = "0px");
  /* Clear dispersed spans 归位 */
  if (obj._clearUnits) obj._clearUnits.forEach(s => { s.style.transform = "none"; s.style.transition = "transform 0.3s ease"; });
}
function clearReadable(obj) {
  obj.el.classList.remove("readable");
  /* 离开后 wavy 会在下一帧自动恢复 */
}

function addInteraction(obj) {
  obj.paused = false; obj._hovering = false; obj._tapped = false;
  obj.el.addEventListener("mouseenter", () => {
    if (isTouchDevice) return;
    obj._hovering = true; obj.paused = true; activeFrozen = obj; makeReadable(obj);
  });
  obj.el.addEventListener("mouseleave", () => {
    if (isTouchDevice) return;
    obj._hovering = false;
    if (!obj._tapped) { obj.paused = false; clearReadable(obj); if (activeFrozen === obj) activeFrozen = null; }
  });
  obj.el.addEventListener("click", (e) => {
    e.stopPropagation(); obj._tapped = true; obj.paused = true; activeFrozen = obj; makeReadable(obj);
  });
}

document.addEventListener("click", () => {
  if (!activeFrozen) return;
  activeFrozen._tapped = false;
  if (!activeFrozen._hovering) { activeFrozen.paused = false; clearReadable(activeFrozen); activeFrozen = null; }
});

/* ============================================================
   PHRASE OBJECTS
   ============================================================ */
function createPhraseObject(text, weight) {
  const el = document.createElement("div");
  el.className = "phrase"; el.textContent = text;
  contentEl.appendChild(el);
  const obj = { el, text, weight, x: 0, y: 0, vx: 0, vy: 0, waveSeed: Math.random() * 1000, spreadAngle: 0, type: "phrase", paused: false, width: 0, height: 0 };
  addInteraction(obj);
  return obj;
}


/* ============================================================
   RAIN SPLASH — 文字落地后拆成字母弹起渐隐
   angle = 雨水倾斜角度，溅起方向相反
   ============================================================ */
function triggerRainSplash(obj, angle) {
  const letters = obj.text.split("");
  const baseX   = obj.x;
  const baseY   = world.height - 6;  /* 底部落点 */
  const color   = contentEl.style.color || "#188f77";

  letters.forEach((char, i) => {
    if (char === " ") return;
    const el = document.createElement("span");
    el.textContent = char;
    el.style.cssText = `
      position: fixed;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: ${color};
      pointer-events: none;
      z-index: 500;
      left: ${baseX + i * 10 + contentEl.getBoundingClientRect().left}px;
      top:  ${baseY  + contentEl.getBoundingClientRect().top}px;
      transition: none;
    `;
    document.body.appendChild(el);

    /* 每个字母随机弹起方向，大致向上 + 沿角度反向水平散开 */
    const spreadX = (Math.random() - 0.5) * 30 - Math.sin(angle * Math.PI / 180) * 20;
    const spreadY = -(18 + Math.random() * 22);  /* 向上弹起高度，可调 */
    const dur     = 320 + Math.random() * 180;   /* 动画时长 ms，可调 */
    const delay   = i * 12;                       /* 每个字母错开时间 */

    setTimeout(() => {
      el.style.transition = `transform ${dur}ms ease-out, opacity ${dur * 0.6}ms ease-in ${dur * 0.4}ms`;
      el.style.transform  = `translate(${spreadX}px, ${spreadY}px)`;
      el.style.opacity    = "0";
      setTimeout(() => el.remove(), dur + delay + 50);
    }, delay);
  });
}


/* ============================================================
   SNOW LETTER SPAWNER
   每次 spawn 一个字母，记住所属 phrase 供 hover 显示
   ============================================================ */
function spawnSnowLetter(weatherData) {
  const phrases = getPhraseSource(weatherData.type, weatherData.level);
  if (!phrases.length) return null;

  /* pick a random phrase, then a random non-space letter */
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  const letters = phrase.text.split("").filter(c => c !== " ");
  if (!letters.length) return null;
  const char = letters[Math.floor(Math.random() * letters.length)];

  const el = document.createElement("div");
  el.className = "phrase snow-letter";
  el.textContent = char;
  contentEl.appendChild(el);

  const obj = {
    el,
    text: char,
    _sourcePhrase: phrase.text,  /* for hover reveal */
    weight: phrase.weight || 1,
    x: Math.random() * Math.max(20, world.width - 20),
    y: -20 - Math.random() * 60,
    vx: 0, vy: 0,
    waveSeed: Math.random() * 1000,
    _snowSpeedOffset: Math.random() * 0.15, /* very small range: 0.9–1.05 */
    _snowFadeY: 0.80 + Math.random() * 0.10, /* fade starts 80–90% vh */
    type: "phrase", paused: false, width: 0, height: 0,
    _dead: false
  };

  /* hover: show full phrase */
  obj.el.addEventListener("mouseenter", () => {
    if (isTouchDevice) return;
    obj.paused = true;
    obj.el.textContent = obj._sourcePhrase;
    obj.el.classList.add("readable");
    activeFrozen = obj;
  });
  obj.el.addEventListener("mouseleave", () => {
    if (isTouchDevice) return;
    obj.paused = false;
    obj.el.textContent = char;
    obj.el.classList.remove("readable");
    if (activeFrozen === obj) activeFrozen = null;
  });
  obj.el.addEventListener("click", (e) => {
    e.stopPropagation();
    obj.paused = !obj.paused;
    if (obj.paused) {
      obj.el.textContent = obj._sourcePhrase;
      obj.el.classList.add("readable");
      activeFrozen = obj;
    } else {
      obj.el.textContent = char;
      obj.el.classList.remove("readable");
      if (activeFrozen === obj) activeFrozen = null;
    }
  });

  measureObject(obj);
  obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
  phraseObjects.push(obj);
  return obj;
}

function clearScene() {
  cancelAnimationFrame(animationFrameId);
  phraseObjects.forEach((obj) => obj.el?.remove());
  phraseObjects = []; contentEl.innerHTML = ""; activeFrozen = null; resetGround();
}

function getPhraseSource(type, level) {
  const block = weatherContent[type]?.[level];
  if (!block) return [];
  return [...block.phrases, ...customPhrases.map((text) => ({ text, weight: 1 }))];
}

function getDynamicDensity(weatherData) {
  /* Wind / Rain 完全靠 spawnDynamic 动态生成，初始只放少量
     其他类型维持原来的密度计算 */
  if (weatherData.type === "Wind" || weatherData.type === "Rain") return 1;
  const base = weatherData.level === "light" ? 0.8 : weatherData.level === "medium" ? 1.1 : 1.45;
  return base * (0.75 + (weatherData.intensity || 0.5) * 0.9);
}

function buildPhraseObjects(weatherData) {
  const phrases = getPhraseSource(weatherData.type, weatherData.level);
  const countMultiplier = Math.max(1, Math.ceil(getDynamicDensity(weatherData)));
  const objects = [];
  phrases.forEach((p) => { for (let i = 0; i < countMultiplier; i++) objects.push(createPhraseObject(p.text, p.weight)); });
  objects.forEach((obj, idx) => {
    measureObject(obj);
    if (weatherData.type === "Rain") {
      obj.rainAngle = 8 + Math.random() * 7;   /* 8–15° 更垂直，可调 */
      obj.x = Math.random() * Math.max(20, world.width - obj.width); obj.y = -Math.random() * 180;
    } else if (weatherData.type === "Snow") {
      /* Snow letters all spawned dynamically — skip init here */
      obj.x = 0; obj.y = -999;
    } else if (weatherData.type === "Wind") {
      obj.x = Math.random() * Math.max(20, world.width - obj.width);
      obj.y = 70 + Math.random() * Math.max(40, world.height - 160); obj.vx = 0.8 + Math.random() * 1.2;
    } else if (weatherData.type === "Clear") {
      /* 从屏幕四边随机位置飘入 */
      const edge = Math.floor(Math.random() * 4);
      if (edge === 0) { obj.x = Math.random() * world.width; obj.y = -30; }       /* 上 */
      else if (edge === 1) { obj.x = world.width + 30; obj.y = Math.random() * world.height; } /* 右 */
      else if (edge === 2) { obj.x = Math.random() * world.width; obj.y = world.height + 30; } /* 下 */
      else { obj.x = -30; obj.y = Math.random() * world.height; }                  /* 左 */
      /* 向屏幕中心方向漂移的角度 */
      const cx = world.width / 2, cy = world.height / 2;
      obj.spreadAngle = Math.atan2(cy - obj.y, cx - obj.x) + (Math.random() - 0.5) * 0.8;
    } else if (weatherData.type === "Cloudy") {
      const origin = getSunOrigin(simulatedMinutes);
      obj.x = origin.x + (Math.random() - 0.5) * 34; obj.y = origin.y + (Math.random() - 0.5) * 34;
    } else if (weatherData.type === "Night") {
      obj.x = Math.random() * Math.max(20, world.width - obj.width);
      obj.y = Math.random() * world.height;
    }
    obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
  });
  return objects;
}

function spawnDynamic(weatherData) {
  /* Snow has its own letter-based spawner */
  if (weatherData.type === "Snow") { spawnSnowLetter(weatherData); return; }

  const phrases = getPhraseSource(weatherData.type, weatherData.level);
  if (!phrases.length) return;
  const p = phrases[Math.floor(Math.random() * phrases.length)];
  const obj = createPhraseObject(p.text, p.weight);
  measureObject(obj);
  if (weatherData.type === "Rain") {
    obj.rainAngle = 25 + Math.random() * 15;
    obj.x = Math.random() * Math.max(20, world.width - obj.width); obj.y = -obj.height - 20;
  } else if (weatherData.type === "Snow") {
    obj.x = Math.random() * Math.max(20, world.width - obj.width); obj.y = -obj.height - 20;
  } else if (weatherData.type === "Wind") {
    /* 每个文字分配一条参数化弧线路径
       _windT   = 路径进度 0→1
       _windArc = 弧线参数集合 */
    const wlevel = weatherData.level;
    const speed  = wlevel === "light" ? 0.0016 : wlevel === "medium" ? 0.0036 : 0.0064;
    /* 弧线起点在屏幕左侧或上/下边缘 */
    const startSide = wlevel === "heavy" ? Math.floor(Math.random() * 3) : 0;
    let sx, sy;
    if (startSide === 0) { sx = -0.1; sy = 0.1 + Math.random() * 0.8; }
    else if (startSide === 1) { sx = Math.random(); sy = -0.05; }
    else { sx = Math.random(); sy = 1.05; }
    /* 控制点决定弧线弯曲方向和幅度 */
    const curvature = wlevel === "light" ? 0.15 : wlevel === "medium" ? 0.32 : 0.55;
    const cx1 = sx + 0.3 + (Math.random() - 0.5) * curvature;
    const cy1 = sy + (Math.random() - 0.5) * curvature * 2;
    const cx2 = sx + 0.65 + (Math.random() - 0.5) * curvature;
    const cy2 = 0.2 + Math.random() * 0.6 + (Math.random() - 0.5) * curvature;
    const ex  = 1.1 + Math.random() * 0.2; /* 终点在右侧外 */
    const ey  = 0.1 + Math.random() * 0.8;
    obj._windArc = { sx, sy, cx1, cy1, cx2, cy2, ex, ey, speed };
    obj._windT   = 0;
    obj._windRot = 0;
    obj._windRotV = (Math.random() - 0.5) * (wlevel === "heavy" ? 3 : wlevel === "medium" ? 1.2 : 0.3);
    /* initial position */
    obj.x = sx * world.width;
    obj.y = sy * world.height;
  } else if (weatherData.type === "Clear") {
    /* 从屏幕四边随机位置飘入 */
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0) { obj.x = Math.random() * world.width; obj.y = -30; }
    else if (edge === 1) { obj.x = world.width + 30; obj.y = Math.random() * world.height; }
    else if (edge === 2) { obj.x = Math.random() * world.width; obj.y = world.height + 30; }
    else { obj.x = -30; obj.y = Math.random() * world.height; }
    const cx = world.width / 2, cy = world.height / 2;
    obj.spreadAngle = Math.atan2(cy - obj.y, cx - obj.x) + (Math.random() - 0.5) * 0.8;
  } else if (weatherData.type === "Cloudy") {
    const origin = getSunOrigin(simulatedMinutes);
    obj.x = origin.x + (Math.random() - 0.5) * 25; obj.y = origin.y + (Math.random() - 0.5) * 25;
  } else if (weatherData.type === "Night") {
    obj.x = Math.random() * Math.max(20, world.width - obj.width); obj.y = -obj.height - 20;
  }
  obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
  phraseObjects.push(obj);
}

/* ============================================================
   PHYSICS LOOP
   ============================================================ */
function stepPhysics() {
  if (!currentAnimatedWeather) { animationFrameId = requestAnimationFrame(stepPhysics); return; }
  const now = Date.now();
  const { type, level } = currentAnimatedWeather;
  const intensity    = currentAnimatedWeather.intensity || 0.5;
  const rainForce    = 0.7 + intensity * 1.4;
  const windForce    = 0.65 + intensity * 1.8;
  const snowForce    = 0.7 + intensity * 1.1;
  const clearSpeed   = 0.5 + intensity * 0.8;  /* Clear 文字扩散速度，可调 */

  let spawnInterval = null;
  /* Rain spawn 间隔：floor 提高，防止中等雨累积过密
     light=500ms, medium=350ms, heavy=220ms  可在这里调 */
  if (type === "Rain")   spawnInterval = Math.max(220, (level === "light" ? 500 : level === "medium" ? 350 : 220) / rainForce);
  /* Snow: 每次 spawn 一个字母（不是整行），密度由 level 控制
     light=2000ms, medium=800ms, heavy=350ms */
  if (type === "Snow")   spawnInterval = level === "light" ? 500 : level === "medium" ? 200 : 88;
  if (type === "Clear")  spawnInterval = Math.max(400, 1200 - intensity * 600);
  if (type === "Cloudy") spawnInterval = Math.max(320, 840  - intensity * 420);
  if (type === "Wind")   spawnInterval = Math.max(260, 1020 - intensity * 680);
  if (type === "Night")  spawnInterval = Math.max(600, 1400 - intensity * 400);
  if (spawnInterval && now - lastSpawnTime > spawnInterval) { spawnDynamic(currentAnimatedWeather); lastSpawnTime = now; }

  updateDayNightVisuals();
  /* 清理已飞出屏幕的 Wind 对象，防止累积 */
  phraseObjects = phraseObjects.filter(o => !o._dead);

  phraseObjects.forEach((obj) => {
    if (!obj.el || obj.paused) return;
    if (!obj.width || !obj.height) measureObject(obj);

    if (type === "Rain") {
      /* 雨水角度 25–40°，运动方向沿角度斜落
         rainAngle 在 spawnDynamic/buildPhraseObjects 时设定，这里直接用 */
      const angle = obj.rainAngle || 30;
      const rad   = angle * Math.PI / 180;
      obj.vy += 0.07 * rainForce * obj.weight;
      obj.vx  = Math.sin(rad) * obj.vy * 0.3;   /* 水平分量，角度小时更垂直 */
      obj.x  += obj.vx; obj.y += obj.vy;
      obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px) rotate(${angle}deg)`;

      /* 落地溅起：文字碰到底部时触发 splash，然后删除 */
      if (obj.y + obj.height >= world.height - 4 && !obj._splashing) {
        obj._splashing = true;
        triggerRainSplash(obj, angle);
        obj.el.style.opacity = "0";
        setTimeout(() => { obj.el?.remove(); obj._dead = true; }, 80);
        return;
      }
      /* 飞出屏幕侧边时直接删除 */
      if (obj.x > world.width + 60 || obj.x < -obj.width - 60) {
        obj.el.remove(); obj._dead = true; return;
      }

    } else if (type === "Wind") {
      if (!obj._windArc) { obj.el.remove(); obj._dead = true; return; }
      const arc = obj._windArc;
      /* Advance along path — heavier wind moves faster */
      const speedMult = level === "light" ? 1.0 : level === "medium" ? 1.0 : 1.0;
      obj._windT += arc.speed * speedMult;

      /* Cubic bezier: B(t) = (1-t)³P0 + 3(1-t)²tP1 + 3(1-t)t²P2 + t³P3 */
      const t  = Math.min(obj._windT, 1);
      const mt = 1 - t;
      const bx = mt*mt*mt*arc.sx + 3*mt*mt*t*arc.cx1 + 3*mt*t*t*arc.cx2 + t*t*t*arc.ex;
      const by = mt*mt*mt*arc.sy + 3*mt*mt*t*arc.cy1 + 3*mt*t*t*arc.cy2 + t*t*t*arc.ey;

      /* tangent for rotation: derivative of bezier */
      const dt = 0.01;
      const t2 = Math.min(t + dt, 1), mt2 = 1 - t2;
      const bx2 = mt2*mt2*mt2*arc.sx + 3*mt2*mt2*t2*arc.cx1 + 3*mt2*t2*t2*arc.cx2 + t2*t2*t2*arc.ex;
      const by2 = mt2*mt2*mt2*arc.sy + 3*mt2*mt2*t2*arc.cy1 + 3*mt2*t2*t2*arc.cy2 + t2*t2*t2*arc.ey;
      const tangentAngle = Math.atan2(by2 - by, bx2 - bx) * 180 / Math.PI;

      /* extra wobble for heavy wind */
      const wobble = level === "heavy"
        ? Math.sin(now * 0.003 + obj.waveSeed) * 12
        : level === "medium" ? Math.sin(now * 0.002 + obj.waveSeed) * 4 : 0;

      obj.x = bx * world.width;
      obj.y = by * world.height;

      /* done: past end of path → delete */
      if (obj._windT >= 1) { obj.el.remove(); obj._dead = true; return; }

      /* rotation follows path tangent */
      const rot = level === "heavy"
        ? tangentAngle + wobble
        : level === "medium" ? tangentAngle * 0.5 + wobble
        : tangentAngle * 0.2;

      obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px) rotate(${rot}deg)`;

      /* ── Wavy text: ALL levels use per-letter spans with organic randomness ──
         Each letter gets its own random amplitude, frequency, phase, and horizontal drift
         light: subtle scatter | medium: letters break apart | heavy: chaotic */
      if (!obj._wavyInit) {
        obj._wavyInit = true;
        const chars = obj.el.textContent;
        obj.el.innerHTML = chars.split("").map((c, i) =>
          c === " " ? "&nbsp;" : `<span class="wind-char" data-i="${i}" style="display:inline-block;position:relative">${c}</span>`
        ).join("");
        obj._wavyUnits = obj.el.querySelectorAll(".wind-char");
        /* per-letter randomised params for organic feel */
        obj._wavyParams = Array.from(obj._wavyUnits).map(() => ({
          vAmp:  (level === "heavy" ? 10 : level === "medium" ? 6 : 3) + Math.random() * (level === "heavy" ? 12 : level === "medium" ? 6 : 3),
          vFreq: 0.0006 + Math.random() * (level === "heavy" ? 0.005 : level === "medium" ? 0.003 : 0.0015),
          vPhase: Math.random() * Math.PI * 2,
          hAmp:  level === "heavy" ? 0 : (level === "medium" ? 2 : 1) + Math.random() * (level === "medium" ? 4 : 2),
          hFreq: 0.0004 + Math.random() * 0.0012,
          hPhase: Math.random() * Math.PI * 2,
        }));
      }

      if (obj._wavyUnits && obj._wavyParams) {
        obj._wavyUnits.forEach((span, i) => {
          const p = obj._wavyParams[i];
          const vOff = Math.sin(now * p.vFreq + p.vPhase) * p.vAmp;
          const hOff = Math.sin(now * p.hFreq + p.hPhase) * p.hAmp;
          span.style.top  = `${vOff}px`;
          span.style.left = `${hOff}px`;
        });
      }

    } else if (type === "Snow") {
      /* Uniform slow fall — no speed variance
         Gentle horizontal sway via sine wave */
      const fallSpeed = 0.9 + obj._snowSpeedOffset; /* 可调：提高这个数字加快速度 */
      obj.y += fallSpeed;
      obj.x += Math.sin(now / 1800 + obj.waveSeed * 6.28) * 0.25;

      /* Fade out between 80–90% vh (each letter has its own fade start) */
      const fadeStart = obj._snowFadeY * world.height;
      if (obj.y > fadeStart) {
        const fadeRange = world.height * 0.1;
        const opacity = Math.max(0, 1 - (obj.y - fadeStart) / fadeRange);
        obj.el.style.opacity = String(opacity);
        if (opacity <= 0) { obj.el.remove(); obj._dead = true; return; }
      }

      obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;

    } else if (type === "Clear") {
      const origin = getSunOrigin(simulatedMinutes);

      if (level === "light") {
        /* ── Light: 保持原有波浪游动 ── */
        const waveAmp   = 8 + intensity * 12;
        const waveFreq  = 0.0025 + intensity * 0.002;
        const perpAngle = obj.spreadAngle + Math.PI / 2;
        obj.x += Math.cos(obj.spreadAngle) * clearSpeed;
        obj.y += Math.sin(obj.spreadAngle) * clearSpeed;
        const wave = Math.sin(now * waveFreq + obj.waveSeed) * waveAmp;
        const dispX = obj.x + Math.cos(perpAngle) * wave;
        const dispY = obj.y + Math.sin(perpAngle) * wave;
        if (dispX < -80 || dispX > world.width + 80 || dispY < -80 || dispY > world.height + 80) {
          obj.x = origin.x + (Math.random() - 0.5) * 16;
          obj.y = origin.y + (Math.random() - 0.5) * 16;
          obj.spreadAngle = Math.random() * Math.PI * 2;
          obj.waveSeed = Math.random() * 1000;
        }
        obj.el.style.transform = `translate(${dispX}px, ${dispY}px)`;

      } else {
        /* ── Medium / Heavy: 出现 → 3s 后散开 → fade ──
           _clearSpawnTime = 出现时间戳
           _clearPhase: "whole" | "dispersing" | "fading"
           _clearUnits: word 或 letter spans
        */
        if (!obj._clearSpawnTime) obj._clearSpawnTime = now;
        const age = now - obj._clearSpawnTime;

        /* 第一帧：拆分成 spans */
        if (!obj._clearUnits) {
          const splitBy = level === "heavy" ? "" : " ";  /* heavy=字母, medium=单词 */
          let parts, joinStr;
          if (level === "heavy") {
            /* Split into chars but keep spaces as literal space between spans */
            parts = obj.text.split("");
            joinStr = "";
          } else {
            parts = obj.text.split(" ");
            joinStr = " ";
          }
          obj.el.innerHTML = parts.map((p, i) =>
            p === " "
              ? " "
              : `<span class="clear-unit" data-i="${i}" style="display:inline-block;position:relative;transition:none">${p}</span>`
          ).join(joinStr);
          obj._clearUnits = Array.from(obj.el.querySelectorAll(".clear-unit"));
          /* 每个 unit 的散开向量（随机方向） */
          obj._clearVectors = obj._clearUnits.map(() => {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.4 + Math.random() * 0.6;
            return { dx: 0, dy: 0, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, origDx: 0, origDy: 0 };
          });
          obj._clearPhase = "whole";
        }

        /* 散开时间：3000ms 后开始 */
        const disperseDelay = 3000;   /* 3s 后开始散开 */
        /* 消失时间：8-12s 随机（每个 phrase 不同）
           _clearFadeDelay 在第一帧设定，后续复用 */
        if (!obj._clearFadeDelay) obj._clearFadeDelay = 8000 + Math.random() * 4000;
        const fadeDelay = obj._clearFadeDelay;

        if (age > disperseDelay && obj._clearPhase === "whole") {
          obj._clearPhase = "dispersing";
          obj._disperseStart = now;
        }

        if (obj._clearPhase === "dispersing" || obj._clearPhase === "fading") {
          const dAge = now - obj._disperseStart;
          /* units 各自飘走 */
          obj._clearVectors.forEach((v, i) => {
            v.dx += v.vx * 0.5;
            v.dy += v.vy * 0.5;
            obj._clearUnits[i].style.transform = `translate(${v.dx}px, ${v.dy}px)`;
          });
          /* fade 开始 */
          if (age > fadeDelay) {
            const fadeRange = 2000; /* 2s 渐隐 */
            const opacity = Math.max(0, 1 - (age - fadeDelay) / fadeRange);
            obj.el.style.opacity = String(opacity);
            if (opacity <= 0) { obj.el.remove(); obj._dead = true; return; }
          }
        }

        /* 整体仍保持从 origin 向外游动 */
        obj.x += Math.cos(obj.spreadAngle) * clearSpeed * 0.5;
        obj.y += Math.sin(obj.spreadAngle) * clearSpeed * 0.5;
        const waveAmp  = 5;
        const perpA    = obj.spreadAngle + Math.PI / 2;
        const wave2    = Math.sin(now * 0.002 + obj.waveSeed) * waveAmp;
        const dispX    = obj.x + Math.cos(perpA) * wave2;
        const dispY    = obj.y + Math.sin(perpA) * wave2;
        if (dispX < -120 || dispX > world.width + 120 || dispY < -120 || dispY > world.height + 120) {
          obj.el.remove(); obj._dead = true; return;
        }
        obj.el.style.transform = `translate(${dispX}px, ${dispY}px)`;
      }

    } else if (type === "Cloudy") {
      const origin = getSunOrigin(simulatedMinutes);
      const dx = obj.x - origin.x, dy = obj.y - origin.y;
      const sf = 0.7 + intensity * 1.0;
      obj.x += dx * 0.004 * sf + (Math.random() - 0.5) * 0.04;
      obj.y += dy * 0.004 * sf + Math.sin(now / 380 + obj.x * 0.02) * (0.1 + intensity * 0.2);
      obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;

    } else if (type === "Night") {
      /* 缓慢星光漂浮 */
      obj.x += Math.sin(now / 3000 + obj.waveSeed) * 0.2;
      obj.y += Math.cos(now / 2500 + obj.waveSeed * 1.3) * 0.15;
      if (obj.x < -obj.width)        obj.x = world.width + 10;
      if (obj.x > world.width + 10)  obj.x = -obj.width;
      if (obj.y < -obj.height)       obj.y = world.height + 10;
      if (obj.y > world.height + 10) obj.y = -obj.height;
      obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
    }
  });
  animationFrameId = requestAnimationFrame(stepPhysics);
}

/* ============================================================
   WEATHER CLASSIFICATION
   ============================================================ */
function classifyWeather(data) {
  const code   = Number(data.weather_code   ?? 0);
  const wind   = Number(data.wind_speed_10m ?? 0);
  const gust   = Number(data.wind_gusts_10m ?? wind);
  const temp   = Number(data.temperature_2m ?? 20);
  const rain   = Number(data.rain           ?? 0);
  const snow   = Number(data.snowfall       ?? 0);
  const precip = Number(data.precipitation  ?? 0);
  const cloud  = Number(data.cloud_cover    ?? 0);
  const storm  = code >= 95;

  if (snow > 0 || (code >= 71 && code <= 77) || code === 85 || code === 86) {
    if (snow >= 2  || code === 86) return { type: "Snow", level: "heavy",  intensity: Math.max(0.7, clamp01(snow / 3)) };
    if (snow >= 0.7|| code === 75) return { type: "Snow", level: "medium", intensity: Math.max(0.4, clamp01(snow / 3)) };
    return { type: "Snow", level: "light", intensity: Math.max(0.2, clamp01(snow / 3)) };
  }
  if (rain > 0 || precip > 0 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || storm) {
    if (storm || rain >= 8 || precip >= 10 || code === 82 || code >= 95) return { type: "Rain", level: "heavy",  intensity: Math.max(0.7, clamp01(rain / 10)) };
    if (rain >= 2 || precip >= 3 || code >= 63 || code >= 80)            return { type: "Rain", level: "medium", intensity: Math.max(0.4, clamp01(rain / 10)) };
    return { type: "Rain", level: "light", intensity: Math.max(0.2, clamp01(rain / 10)) };
  }
  if (gust >= 45 || wind >= 30) return { type: "Wind", level: "heavy",  intensity: clamp01(Math.max(gust / 65, wind / 42)) };
  if (gust >= 28 || wind >= 20) return { type: "Wind", level: "medium", intensity: clamp01(Math.max(gust / 55, wind / 35)) };
  if (gust >= 18 || wind >= 12) return { type: "Wind", level: "light",  intensity: clamp01(Math.max(gust / 45, wind / 28)) };
  if (cloud > 60) {
    if (cloud > 85) return { type: "Cloudy", level: "heavy",  intensity: clamp01(cloud / 100) };
    return { type: "Cloudy", level: "medium", intensity: clamp01(cloud / 100) };
  }
  if (cloud > 30) return { type: "Cloudy", level: "light", intensity: clamp01(cloud / 100) };
  /* Clear/Sunny — level 由当前时间决定 */
  return { type: "Clear", level: getClearLevelByTime(), intensity: Math.max(0.3, getDaylightFactor()) };
}

/* ============================================================
   APPLY WEATHER
   夜间 Clear/Cloudy → 自动覆盖为 Night
   ============================================================ */
function applyWeather(weatherData, cityName) {
  let effectiveData = weatherData;
  /* Custom mode 时不覆盖天气类型，让用户自由选择 */
  if (mode !== "custom" && isNight() && (weatherData.type === "Clear" || weatherData.type === "Cloudy")) {
    effectiveData = { type: "Night", level: weatherData.level || "medium", intensity: 0.4 };
  }
  currentAnimatedWeather = effectiveData;
  applyTypeColor(effectiveData);
  const label = weatherContent[effectiveData.type]?.[effectiveData.level]?.label || effectiveData.type;
  weatherBtn.textContent = label;
  if (mode === "custom") locationBtn.textContent = "Custom Mode";
  else if (cityName) locationBtn.textContent = cityName;
  clearScene();
  updateWorldSize();
  phraseObjects = buildPhraseObjects(effectiveData);
  lastSpawnTime = Date.now();
  animationFrameId = requestAnimationFrame(stepPhysics);
}

/* ============================================================
   API
   ============================================================ */
async function fetchWeather(lat, lon, cityName) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m,precipitation,rain,snowfall,cloud_cover&timezone=auto`;
  const res  = await fetch(url);
  const data = await res.json();
  currentTimezone = data.timezone || currentTimezone;
  const weatherData = classifyWeather(data.current || {});
  /* store temperature */
  const rawTemp = data.current?.temperature_2m;
  if (rawTemp !== undefined && rawTemp !== null) {
    currentTempC = Number(rawTemp);
    renderTemp();
    if (tempBtn) tempBtn.classList.remove("hidden");
    updateDayNightVisuals(); /* 背景色随新温度更新 */
  }
  latestApiContext = { lat, lon, cityName, weatherData };
  if (mode === "api") applyWeather(weatherData, cityName);
}

async function getCoordsFromCity(city) {
  if (!city) return null;
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=6&language=en&format=json`;
  const res  = await fetch(url);
  const data = await res.json();
  const place = data.results?.[0];
  if (!place) return null;
  return { lat: place.latitude, lon: place.longitude, name: `${place.name}${place.country ? `, ${place.country}` : ""}` };
}

async function fetchCitySuggestions(query) {
  if (!query || query.length < 2) return [];
  const normalized = query.toLowerCase();
  const localMatches = fallbackAutocomplete.filter((item) => item.label.toLowerCase().includes(normalized)).map((item) => ({ label: item.label, query: item.query, lat: null, lon: null }));
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
    const res  = await fetch(url);
    const data = await res.json();
    const remoteMatches = (data.results || []).map((p) => ({ label: `${p.name}${p.country ? ` / ${p.country}` : ""}`, query: p.name, lat: p.latitude, lon: p.longitude }));
    const merged = [...localMatches, ...remoteMatches];
    const seen = new Set();
    return merged.filter((item) => { const key = item.label.toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; }).slice(0, 8);
  } catch { return localMatches; }
}

/* ============================================================
   WEATHER DROPDOWN
   ============================================================ */
async function getWeatherForCity(city) {
  const coords = await getCoordsFromCity(city);
  if (!coords) return null;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,weather_code,wind_speed_10m,wind_gusts_10m,precipitation,rain,snowfall,cloud_cover&timezone=auto`;
    const res  = await fetch(url);
    const data = await res.json();
    return { city: coords.name, lat: coords.lat, lon: coords.lon, weatherData: classifyWeather(data.current || {}) };
  } catch { return null; }
}

weatherBtn.onclick = async (e) => {
  e.stopPropagation();
  dropdown.classList.toggle("hidden");
  if (dropdown.classList.contains("hidden")) return;
  positionDropdownUnder(weatherBtn, dropdown);
  dropdown.innerHTML = "<div style='color:#aaa;padding:6px 10px;'>Finding cities...</div>";
  const cityResults = (await Promise.all(candidateCities.map((city) => getWeatherForCity(city)))).filter(Boolean);
  const options = allStates.map((state) => {
    const found = cityResults.find((item) => item.weatherData.type === state.type && item.weatherData.level === state.level);
    return { display: state.display, city: found?.city || null, lat: found?.lat, lon: found?.lon };
  });
  dropdown.innerHTML = options.map((item) =>
    item.city
      ? `<div data-lat="${item.lat}" data-lon="${item.lon}" data-city="${item.city}">${item.display} — ${item.city}</div>`
      : `<div style="color:var(--panel-border);cursor:default;opacity:0.45">${item.display} — no city found</div>`
  ).join("");
};

dropdown.onclick = async (e) => {
  const item = e.target.closest("div[data-city]");
  if (!item?.dataset.lat || !item?.dataset.lon) return;
  setCustomMode(false);
  await fetchWeather(Number(item.dataset.lat), Number(item.dataset.lon), item.dataset.city);
  dropdown.classList.add("hidden");
};

/* ============================================================
   CITY INPUT PANEL
   ============================================================ */
locationBtn.onclick = (e) => {
  e.stopPropagation();
  const isHidden = cityInput.classList.contains("hidden");
  cityInput.classList.toggle("hidden");
  if (isHidden) { positionDropdownUnder(locationBtn, cityInput); cityField.focus(); }
};

function positionDropdownUnder(triggerEl, panelEl) {
  const rect = triggerEl.getBoundingClientRect();
  panelEl.style.top = (rect.bottom + 8) + "px";
  panelEl.style.transform = "none";
  if (triggerEl === weatherBtn) {
    /* weather dropdown: right edge aligns to right edge of weatherBtn */
    panelEl.style.left  = "auto";
    panelEl.style.right = (window.innerWidth - rect.right) + "px";
  } else {
    /* location dropdown: left edge aligns to left edge of locationBtn */
    panelEl.style.right = "auto";
    panelEl.style.left  = rect.left + "px";
  }
}

cityField.addEventListener("input", () => {
  const query = cityField.value.trim();
  clearTimeout(suggestionDebounceId);
  suggestionDebounceId = setTimeout(async () => renderSuggestions(await fetchCitySuggestions(query)), 180);
});

cityField.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;
  const value = cityField.value.trim();
  const suggested = suggestionResults.find((s) => s.label.toLowerCase().includes(value.toLowerCase()));
  setCustomMode(false);
  if (suggested?.lat != null) await fetchWeather(suggested.lat, suggested.lon, suggested.label);
  else { const coords = await getCoordsFromCity(suggested?.query || value); if (!coords) return; await fetchWeather(coords.lat, coords.lon, coords.name); }
  cityInput.classList.add("hidden"); citySuggestions.classList.add("hidden"); cityField.value = "";
});

citySuggestions.addEventListener("click", async (e) => {
  const node = e.target.closest(".suggestion-item");
  if (!node) return;
  const selected = suggestionResults[Number(node.dataset.index)];
  if (!selected) return;
  setCustomMode(false);
  if (selected.lat != null) await fetchWeather(selected.lat, selected.lon, selected.label);
  else { const coords = await getCoordsFromCity(selected.query); if (!coords) return; await fetchWeather(coords.lat, coords.lon, coords.name); }
  cityInput.classList.add("hidden"); citySuggestions.classList.add("hidden");
});

function renderSuggestions(items) {
  suggestionResults = items;
  if (!items.length) { citySuggestions.classList.add("hidden"); citySuggestions.innerHTML = ""; return; }
  citySuggestions.innerHTML = items.map((item, idx) => `<div class="suggestion-item" data-index="${idx}">${item.label}</div>`).join("");
  citySuggestions.classList.remove("hidden");
}

/* ============================================================
   CUSTOM TEXT
   ============================================================ */
addCustomTextBtn.addEventListener("click", () => {
  const text = customTextField.value.trim();
  if (!text) return;
  customPhrases.unshift(text); customPhrases = customPhrases.slice(0, 20); customTextField.value = "";
  if (currentAnimatedWeather) applyWeather(currentAnimatedWeather, locationBtn.textContent);
});
customTextField.addEventListener("keydown", (e) => { if (e.key === "Enter") addCustomTextBtn.click(); });

/* ============================================================
   CUSTOM MODE
   打开时保留当前天气状态，不强制切换
   ============================================================ */
function setCustomMode(enabled) {
  mode = enabled ? "custom" : "api";
  customControls.classList.toggle("hidden", !enabled);
  customModeBtn.style.display = enabled ? "none" : "";
  if (!enabled) {
    simulatedMinutes = null;
    simulatedTempC = null;
    if (latestApiContext) applyWeather(latestApiContext.weatherData, latestApiContext.cityName);
  } else {
    /* 进入 custom mode 时，把 temp slider 初始化到当前真实温度 */
    if (tempSlider && currentTempC !== null) {
      const clamped = Math.max(-10, Math.min(40, Math.round(currentTempC)));
      tempSlider.value = String(clamped);
      simulatedTempC = clamped;
    }
    syncCustomSliderDisplay();
  }
}

function syncCustomSliderDisplay() {
  weatherTypeValue.textContent = weatherTypeOrder[Number(weatherTypeSlider.value)].label;
  const levelNum = Number(weatherLevelSlider.value);
  weatherLevelValue.textContent = levelNames[levelNum === 1 ? "light" : levelNum === 2 ? "medium" : "heavy"];
  if (timeSlider && timeSliderValue) {
    const mins = Number(timeSlider.value);
    timeSliderValue.textContent = `${String(Math.floor(mins/60)).padStart(2,"0")}:${String(mins%60).padStart(2,"0")}`;
  }
  if (tempSlider && tempSliderValue) {
    tempSliderValue.textContent = `${tempSlider.value}°C`;
  }
}

function buildCustomWeather() {
  const typeChoice = weatherTypeOrder[Number(weatherTypeSlider.value)];
  const levelNum   = Number(weatherLevelSlider.value);
  const level      = levelNum === 1 ? "light" : levelNum === 2 ? "medium" : "heavy";
  const intensity  = levelNum === 1 ? 0.3 : levelNum === 2 ? 0.6 : 0.9;
  return { type: typeChoice.type, level, intensity };
}

function applyCustomWeatherSelection() {
  weatherTypeValue.textContent = weatherTypeOrder[Number(weatherTypeSlider.value)].label;
  const w = buildCustomWeather();
  weatherLevelValue.textContent = levelNames[w.level];
  applyWeather(w, "Custom Mode");
}

customModeBtn.addEventListener("click", () => setCustomMode(mode !== "custom"));
if (customHideBtn) customHideBtn.addEventListener("click", () => setCustomMode(false));
weatherTypeSlider.addEventListener("input", () => { if (mode === "custom") applyCustomWeatherSelection(); });
weatherLevelSlider.addEventListener("input", () => { if (mode === "custom") applyCustomWeatherSelection(); });

/* ============================================================
   TIME SLIDER — custom mode 专用
   拖动时只更新背景/月亮/太阳起始点，不重建场景
   ============================================================ */
if (timeSlider) {
  timeSlider.addEventListener("input", () => {
    if (mode !== "custom") return;
    simulatedMinutes = Number(timeSlider.value);
    const h = String(Math.floor(simulatedMinutes/60)).padStart(2,"0");
    const m = String(simulatedMinutes%60).padStart(2,"0");
    if (timeSliderValue) timeSliderValue.textContent = `${h}:${m}`;
    updateDayNightVisuals();
  });
}

/* Temp slider — custom mode 温度覆盖 */
if (tempSlider) {
  tempSlider.addEventListener("input", () => {
    if (mode !== "custom") return;
    simulatedTempC = Number(tempSlider.value);
    if (tempSliderValue) tempSliderValue.textContent = `${simulatedTempC}°C`;
    updateDayNightVisuals();
    /* 重新计算 accent 对比色 */
    if (currentAnimatedWeather) applyTypeColor(currentAnimatedWeather);
  });
}

/* ============================================================
   ABOUT
   ============================================================ */
aboutBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  aboutCard.classList.remove("hidden");
  requestAnimationFrame(() => aboutCard.classList.add("show"));
  aboutBtn.classList.add("hidden-when-open");
});
aboutCard.addEventListener("click", (e) => e.stopPropagation());

document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target)  && e.target !== weatherBtn)  dropdown.classList.add("hidden");
  if (!cityInput.contains(e.target) && e.target !== locationBtn) { cityInput.classList.add("hidden"); citySuggestions.classList.add("hidden"); }
  if (aboutCard.classList.contains("show") && !aboutCard.contains(e.target)) {
    aboutCard.classList.remove("show");
    setTimeout(() => aboutCard.classList.add("hidden"), 400);
    aboutBtn.classList.remove("hidden-when-open");
  }
});

/* ============================================================
   TEMPERATURE DISPLAY
   ============================================================ */
function renderTemp() {
  if (currentTempC === null || !tempBtn) return;
  if (tempUnitIsCelsius) {
    tempBtn.textContent = `${Math.round(currentTempC)}°C`;
  } else {
    tempBtn.textContent = `${Math.round(currentTempC * 9/5 + 32)}°F`;
  }
}

if (tempBtn) {
  tempBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    tempUnitIsCelsius = !tempUnitIsCelsius;
    renderTemp();
  });
}

/* ============================================================
   TIME DISPLAY
   ============================================================ */
function getTimezoneLabel(tz) {
  const map = { "America/New_York": "EST","Europe/London": "GMT","Asia/Shanghai": "CST","Asia/Tokyo": "JST","Asia/Singapore": "SGT","America/Los_Angeles": "PST","America/Chicago": "CST","Europe/Paris": "CET" };
  return map[tz] || tz.split("/")[1] || tz;
}

function updateTime() {
  const now = new Date();
  const localTime = new Date(now.toLocaleString("en-US", { timeZone: currentTimezone }));
  timeEl.textContent = `${getTimezoneLabel(currentTimezone)} ${localTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
}

/* ============================================================
   INIT
   ============================================================ */
async function loadDefaultCity() {
  const coords = await getCoordsFromCity("New York");
  if (!coords) return;
  defaultLocation = coords;
  await fetchWeather(coords.lat, coords.lon, coords.name);
}

function locateUserAndLoad() {
  if (!navigator.geolocation) return loadDefaultCity();
  /* 先加载纽约作为占位，获取到真实位置后替换
     enableHighAccuracy: false 更快触发（手机网络定位），
     timeout: 15000 给足够时间让用户授权 */
  loadDefaultCity();
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const revGeo = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}&language=en&format=json`);
        const revData = await revGeo.json();
        const place = revData.results?.[0];
        const cityName = place ? `${place.name}${place.country ? `, ${place.country}` : ""}` : "My Location";
        defaultLocation = { lat: latitude, lon: longitude, name: cityName };
        await fetchWeather(latitude, longitude, cityName);
      } catch { /* 已有纽约作为 fallback，静默失败 */ }
    },
    () => { /* 用户拒绝或失败，保持纽约 */ },
    { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
  );
}

window.addEventListener("resize", updateWorldSize);
window.addEventListener("pointerdown", () => { isTouchDevice = window.matchMedia("(hover: none)").matches; });

updateWorldSize();
updateDayNightVisuals();
updateTime();
setInterval(updateTime, 1000);
animationFrameId = requestAnimationFrame(stepPhysics);
locateUserAndLoad();