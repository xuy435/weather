/* =========================
   GET ELEMENTS
========================= */

const contentEl = document.getElementById("content");
const weatherEl = document.getElementById("weather");
const timeEl = document.getElementById("time");

const locationBtn = document.getElementById("locationBtn");
const weatherBtn = document.getElementById("weatherBtn");
const dropdown = document.getElementById("weatherDropdown");
const cityInput = document.getElementById("cityInput");
const cityField = document.getElementById("cityField");

/* =========================
   WORLD
========================= */

let world = {
  width: 0,
  height: 0
};

const CELL = 10;
let groundHeights = [];

function resetGround() {
  const cols = Math.max(1, Math.ceil(world.width / CELL));
  groundHeights = new Array(cols).fill(world.height);
}

function updateWorldSize() {
  if (!contentEl) return;
  const rect = contentEl.getBoundingClientRect();
  world.width = rect.width;
  world.height = rect.height;
  resetGround();
}

window.addEventListener("resize", () => {
  updateWorldSize();
});

/* =========================
   WEATHER CONTENT SYSTEM
========================= */

const weatherContent = {
  Rain: {
    light: {
      label: "Light Rain",
      phrases: [
        { text: "take an umbrella and step outside", weight: 1.1 },
        { text: "walk slowly through the streets", weight: 1.0 },
        { text: "visit a friend nearby", weight: 1.2 },
        { text: "notice the small puddles", weight: 0.9 }
      ]
    },
    medium: {
      label: "Medium Rain",
      phrases: [
        { text: "stay in a little longer", weight: 1.2 },
        { text: "listen to the rain by the window", weight: 0.9 },
        { text: "call someone you’ve been thinking of", weight: 1.0 },
        { text: "make something warm to drink", weight: 1.1 }
      ]
    },
    heavy: {
      label: "Heavy Rain",
      phrases: [
        { text: "change your sheets", weight: 1.3 },
        { text: "tidy up your space", weight: 1.1 },
        { text: "light a candle", weight: 0.8 },
        { text: "watch something you’ve been saving", weight: 1.0 },
        { text: "cook something you’ve been craving", weight: 1.2 },
        { text: "bring out something you haven’t touched in a while", weight: 1.4 }
      ]
    }
  },

  Clear: {
    light: {
      label: "Light Sun",
      phrases: [
        { text: "open the curtains", weight: 0.8 },
        { text: "let the light in", weight: 0.7 },
        { text: "wear a color you love", weight: 1.0 },
        { text: "step outside for a moment", weight: 0.9 }
      ]
    },
    medium: {
      label: "Medium Sun",
      phrases: [
        { text: "go for a walk", weight: 1.0 },
        { text: "spend some time in the park", weight: 1.1 },
        { text: "call a friend to join you", weight: 1.0 },
        { text: "stay in the warmth a little longer", weight: 0.9 }
      ]
    },
    heavy: {
      label: "Strong Sun",
      phrases: [
        { text: "don’t forget your SPF", weight: 1.0 },
        { text: "find a place with shade", weight: 1.1 },
        { text: "slow down in the heat", weight: 1.2 },
        { text: "carry something cold with you", weight: 1.0 }
      ]
    }
  },

  Wind: {
    light: {
      label: "Light Wind",
      phrases: [
        { text: "go out for a walk", weight: 0.9 },
        { text: "feel the direction of the wind", weight: 0.8 },
        { text: "wear something that moves", weight: 0.7 },
        { text: "stay outside a little longer", weight: 1.0 }
      ]
    },
    medium: {
      label: "Medium Wind",
      phrases: [
        { text: "add a layer before you leave", weight: 1.1 },
        { text: "watch the trees shift", weight: 0.8 },
        { text: "keep moving", weight: 1.0 },
        { text: "follow where the air takes you", weight: 0.9 }
      ]
    },
    heavy: {
      label: "Strong Wind",
      phrases: [
        { text: "stay in if you can", weight: 1.3 },
        { text: "close the windows", weight: 1.2 },
        { text: "make your space comfortable", weight: 1.0 },
        { text: "light a candle", weight: 0.8 },
        { text: "return to something quiet", weight: 1.1 }
      ]
    }
  },

  Clouds: {
    light: {
      label: "Light Cloudy",
      phrases: [
        { text: "take it easy", weight: 0.9 },
        { text: "stay somewhere in between", weight: 1.0 },
        { text: "go for a quiet walk", weight: 1.0 },
        { text: "listen to something soft", weight: 0.8 }
      ]
    },
    medium: {
      label: "Medium Cloudy",
      phrases: [
        { text: "write something down", weight: 1.0 },
        { text: "organize your space", weight: 1.1 },
        { text: "play a film in the background", weight: 0.9 },
        { text: "let the day unfold slowly", weight: 1.0 }
      ]
    },
    heavy: {
      label: "Strong Cloudy",
      phrases: [
        { text: "stay in and rest", weight: 1.1 },
        { text: "dim the lights", weight: 0.8 },
        { text: "play music", weight: 0.9 },
        { text: "reach out to someone", weight: 1.0 }
      ]
    }
  },

  Snow: {
    light: {
      label: "Light Snow",
      phrases: [
        { text: "catch a snowflake in your hand", weight: 0.7 },
        { text: "walk slowly outside", weight: 1.0 },
        { text: "leave soft footprints", weight: 0.8 },
        { text: "make something warm", weight: 1.1 }
      ]
    },
    medium: {
      label: "Medium Snow",
      phrases: [
        { text: "build something in the snow", weight: 1.2 },
        { text: "draw on the ground with your steps", weight: 1.0 },
        { text: "stay out just a little longer", weight: 0.9 },
        { text: "come back in for warmth", weight: 1.1 }
      ]
    },
    heavy: {
      label: "Heavy Snow",
      phrases: [
        { text: "stay inside", weight: 1.3 },
        { text: "make tea", weight: 1.0 },
        { text: "watch the snow fall", weight: 0.8 },
        { text: "wrap yourself in something warm", weight: 1.1 },
        { text: "let the world slow down", weight: 0.9 }
      ]
    }
  }
};

/* =========================
   CLASSIFY WEATHER
========================= */

function classifyWeather(code, windSpeed, windDirection = 0, temperature = 20) {
  // precipitation first
  if (code >= 51 && code <= 55) {
    return { type: "Rain", level: "light", label: "Light Rain", windSpeed, windDirection, temperature };
  }
  if ((code >= 56 && code <= 67) || (code >= 80 && code <= 81)) {
    return { type: "Rain", level: "medium", label: "Medium Rain", windSpeed, windDirection, temperature };
  }
  if (code === 82 || code >= 95) {
    return { type: "Rain", level: "heavy", label: "Heavy Rain", windSpeed, windDirection, temperature };
  }

  if (code >= 71 && code <= 73) {
    return { type: "Snow", level: "light", label: "Light Snow", windSpeed, windDirection, temperature };
  }
  if (code === 75) {
    return { type: "Snow", level: "medium", label: "Medium Snow", windSpeed, windDirection, temperature };
  }
  if (code >= 76 && code <= 77) {
    return { type: "Snow", level: "heavy", label: "Heavy Snow", windSpeed, windDirection, temperature };
  }

  // clouds / clear
  if (code === 0) {
    if (windSpeed >= 12) {
      return { type: "Wind", level: "heavy", label: "Strong Wind", windSpeed, windDirection, temperature };
    }
    if (windSpeed >= 7) {
      return { type: "Wind", level: "medium", label: "Medium Wind", windSpeed, windDirection, temperature };
    }
    if (windSpeed >= 3.5) {
      return { type: "Wind", level: "light", label: "Light Wind", windSpeed, windDirection, temperature };
    }

    if (temperature >= 30) {
      return { type: "Clear", level: "heavy", label: "Strong Sun", windSpeed, windDirection, temperature };
    }
    if (temperature >= 20) {
      return { type: "Clear", level: "medium", label: "Medium Sun", windSpeed, windDirection, temperature };
    }
    return { type: "Clear", level: "light", label: "Light Sun", windSpeed, windDirection, temperature };
  }

  if (code === 1) {
    if (windSpeed >= 12) {
      return { type: "Wind", level: "heavy", label: "Strong Wind", windSpeed, windDirection, temperature };
    }
    if (windSpeed >= 7) {
      return { type: "Wind", level: "medium", label: "Medium Wind", windSpeed, windDirection, temperature };
    }
    if (windSpeed >= 3.5) {
      return { type: "Wind", level: "light", label: "Light Wind", windSpeed, windDirection, temperature };
    }
    return { type: "Clouds", level: "light", label: "Light Cloudy", windSpeed, windDirection, temperature };
  }

  if (code === 2) {
    if (windSpeed >= 12) {
      return { type: "Wind", level: "heavy", label: "Strong Wind", windSpeed, windDirection, temperature };
    }
    if (windSpeed >= 7) {
      return { type: "Wind", level: "medium", label: "Medium Wind", windSpeed, windDirection, temperature };
    }
    if (windSpeed >= 3.5) {
      return { type: "Wind", level: "light", label: "Light Wind", windSpeed, windDirection, temperature };
    }
    return { type: "Clouds", level: "medium", label: "Medium Cloudy", windSpeed, windDirection, temperature };
  }

  if (code === 3 || code === 45 || code === 48) {
    if (windSpeed >= 12) {
      return { type: "Wind", level: "heavy", label: "Strong Wind", windSpeed, windDirection, temperature };
    }
    if (windSpeed >= 7) {
      return { type: "Wind", level: "medium", label: "Medium Wind", windSpeed, windDirection, temperature };
    }
    if (windSpeed >= 3.5) {
      return { type: "Wind", level: "light", label: "Light Wind", windSpeed, windDirection, temperature };
    }
    return { type: "Clouds", level: "heavy", label: "Strong Cloudy", windSpeed, windDirection, temperature };
  }

  return { type: "Clear", level: "medium", label: "Medium Sun", windSpeed, windDirection, temperature };
}

/* =========================
   ANIMATION STATE
========================= */

let phraseObjects = [];
let animationFrameId = null;
let lastSpawnTime = 0;
let currentAnimatedWeather = null;
let activeFrozen = null;

/* =========================
   INTERACTION
========================= */

function addInteraction(obj) {
  if (!obj.el) return;

  obj.paused = false;
  obj._hovering = false;
  obj._tapped = false;

  obj.el.addEventListener("mouseenter", () => {
    obj._hovering = true;
    obj.paused = true;
    activeFrozen = obj;

    if (obj.type === "phrase") {
      obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px) rotate(0deg)`;
    } else {
      obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
    }
  });

  obj.el.addEventListener("mouseleave", () => {
    obj._hovering = false;
    if (!obj._tapped) {
      obj.paused = false;
      if (activeFrozen === obj) activeFrozen = null;
    }
  });

  obj.el.addEventListener("click", (e) => {
    e.stopPropagation();
    obj._tapped = true;
    obj.paused = true;
    activeFrozen = obj;

    if (obj.type === "phrase") {
      obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px) rotate(0deg)`;
    } else {
      obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
    }
  });
}

document.addEventListener("click", () => {
  if (!activeFrozen) return;
  activeFrozen._tapped = false;
  if (!activeFrozen._hovering) {
    activeFrozen.paused = false;
    activeFrozen = null;
  }
});

/* =========================
   HELPERS
========================= */

function getCurrentBlock() {
  if (!currentAnimatedWeather) return null;
  return weatherContent[currentAnimatedWeather.type]?.[currentAnimatedWeather.level] || null;
}

function createPhraseObject(text, weight) {
  const el = document.createElement("div");
  el.className = "phrase";
  el.textContent = text;
  contentEl.appendChild(el);

  const obj = {
    el,
    text,
    weight,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    type: "phrase",
    broken: false,
    isLetter: false,
    paused: false,
    birth: Date.now(),
    width: 0,
    height: 0
  };

  addInteraction(obj);
  return obj;
}

function createLetterObject(char, x, y) {
  const el = document.createElement("div");
  el.className = "phrase";
  el.textContent = char === " " ? "\u00A0" : char;
  contentEl.appendChild(el);

  const obj = {
    el,
    text: char,
    weight: 0.5,
    x,
    y,
    vx: (Math.random() - 0.5) * 0.4,
    vy: 0,
    type: "letter",
    isLetter: true,
    paused: false,
    birth: Date.now(),
    width: 0,
    height: 0
  };

  addInteraction(obj);
  return obj;
}

function measureObject(obj) {
  const rect = obj.el.getBoundingClientRect();
  obj.width = rect.width || 20;
  obj.height = rect.height || 20;
}

function getSunOrigin() {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: currentTimezone }));
  const minutes = now.getHours() * 60 + now.getMinutes();
  const progress = ((minutes / 1440) + 0.5) % 1;
  const angle = progress * Math.PI * 2;

  const x = world.width * 0.5 + Math.sin(angle) * world.width * 0.42;
  const y = world.height * (0.5 - 0.5 * Math.cos(angle));

  return { x, y };
}

function resetGroundForCurrentWeather() {
  resetGround();
}

function getStackY(x, width, height) {
  const start = Math.max(0, Math.floor(x / CELL));
  const end = Math.min(groundHeights.length - 1, Math.floor((x + width) / CELL));
  let topY = world.height - height;

  for (let i = start; i <= end; i++) {
    topY = Math.min(topY, groundHeights[i] - height);
  }

  return { topY, start, end };
}

function stampGround(start, end, topY) {
  for (let i = start; i <= end; i++) {
    groundHeights[i] = Math.min(groundHeights[i], topY);
  }
}

function clearScene() {
  cancelAnimationFrame(animationFrameId);
  phraseObjects.forEach(obj => {
    if (obj.el && obj.el.parentNode) obj.el.remove();
  });
  phraseObjects = [];
  contentEl.innerHTML = "";
  activeFrozen = null;
  resetGroundForCurrentWeather();
}

function getDensity(level) {
  if (level === "light") return 0.7;
  if (level === "medium") return 1;
  return 1.6;
}

/* =========================
   INITIAL PHRASE OBJECTS
========================= */

function buildPhraseObjects(weatherData) {
  const block = weatherContent[weatherData.type]?.[weatherData.level];
  if (!block) return [];

  const objects = [];
  const density = getDensity(weatherData.level);
  const countMultiplier = Math.max(1, Math.ceil(density));

  block.phrases.forEach((p) => {
    for (let i = 0; i < countMultiplier; i++) {
      const obj = createPhraseObject(p.text, p.weight);
      objects.push(obj);
    }
  });

  objects.forEach((obj, index) => {
    measureObject(obj);

    if (weatherData.type === "Rain" || weatherData.type === "Snow") {
      obj.x = Math.random() * Math.max(20, world.width - obj.width);
      obj.y = -Math.random() * 120 - (index * 18);
    } else if (weatherData.type === "Wind") {
      obj.x = Math.random() * Math.max(20, world.width - obj.width);
      obj.y = 50 + Math.random() * Math.max(40, world.height - 140);
    } else if (weatherData.type === "Clear") {
      const origin = getSunOrigin();
      obj.x = origin.x + (Math.random() - 0.5) * 30;
      obj.y = origin.y + (Math.random() - 0.5) * 30;
    } else if (weatherData.type === "Clouds") {
      obj.x = Math.random() * Math.max(20, world.width - obj.width);
      obj.y = 80 + Math.random() * Math.max(40, world.height - 220);
    }

    obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
  });

  return objects;
}

function spawnDynamic(weatherData) {
  const block = weatherContent[weatherData.type]?.[weatherData.level];
  if (!block) return;

  const p = block.phrases[Math.floor(Math.random() * block.phrases.length)];
  const obj = createPhraseObject(p.text, p.weight);
  measureObject(obj);

  if (weatherData.type === "Rain" || weatherData.type === "Snow") {
    obj.x = Math.random() * Math.max(20, world.width - obj.width);
    obj.y = -60;
  } else if (weatherData.type === "Clear") {
    const origin = getSunOrigin();
    obj.x = origin.x + (Math.random() - 0.5) * 20;
    obj.y = origin.y + (Math.random() - 0.5) * 20;
  } else if (weatherData.type === "Clouds") {
    obj.x = Math.random() * Math.max(20, world.width - obj.width);
    obj.y = 80 + Math.random() * Math.max(40, world.height - 220);
  }

  obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
  phraseObjects.push(obj);
  return obj;
}

/* =========================
   BREAK INTO LETTERS
========================= */

function breakIntoLetters(obj) {
  obj.broken = true;
  if (obj.el && obj.el.parentNode) obj.el.remove();

  let cursorX = obj.x;

  obj.text.split("").forEach((char) => {
    const letter = createLetterObject(char, cursorX, obj.y);
    measureObject(letter);
    cursorX += Math.max(6, letter.width * 0.9);

    phraseObjects.push(letter);
  });
}

/* =========================
   WEATHER ANIMATION LOOP
========================= */

function stepPhysics() {
  if (!currentAnimatedWeather) {
    animationFrameId = requestAnimationFrame(stepPhysics);
    return;
  }

  const now = Date.now();
  const type = currentAnimatedWeather.type;
  const level = currentAnimatedWeather.level;

  // spawn intervals
  let spawnInterval = null;
  if (type === "Rain") {
    spawnInterval = level === "light" ? 320 : level === "medium" ? 180 : 100;
  } else if (type === "Snow") {
    spawnInterval = level === "light" ? 520 : level === "medium" ? 380 : 260;
  } else if (type === "Clear") {
    spawnInterval = 700;
  } else if (type === "Clouds") {
    spawnInterval = 1600;
  }

  if (spawnInterval && now - lastSpawnTime > spawnInterval) {
    spawnDynamic(currentAnimatedWeather);
    lastSpawnTime = now;
  }

  phraseObjects.forEach((obj) => {
    if (!obj.el || obj.paused) return;

    // keep measurements fresh for styled changes
    if (!obj.width || !obj.height) {
      measureObject(obj);
    }

    if (type === "Rain") {
      if (obj.type === "phrase" && !obj.broken) {
        obj.vy += 0.08 * obj.weight;
        obj.vx += (Math.random() - 0.5) * 0.01;
        obj.x += obj.vx;
        obj.y += obj.vy;

        obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px) rotate(70deg)`;

        if (obj.y > world.height - obj.height - 10) {
          breakIntoLetters(obj);
        }
      } else if (obj.type === "letter") {
        obj.vy += 0.12;
        obj.y += obj.vy;

        const stack = getStackY(obj.x, obj.width, obj.height);
        if (obj.y >= stack.topY) {
          obj.y = stack.topY;
          obj.vy = 0;
          stampGround(stack.start, stack.end, obj.y);
        }

        obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
      }
    }

    else if (type === "Wind") {
      if (obj.type === "phrase" && !obj.broken) {
        obj.broken = true;
        const originalText = obj.text;
        const baseX = obj.x;
        const baseY = obj.y;
        if (obj.el && obj.el.parentNode) obj.el.remove();

        originalText.split("").forEach((char, i) => {
          const letter = createLetterObject(char, baseX + i * 10, baseY + i * 6);
          letter.vx = level === "heavy" ? 3.2 : level === "medium" ? 2.2 : 1.3;
          letter.vy = (Math.random() - 0.5) * 0.25;
          letter.windSourceText = originalText;
          letter.windSpawnedClone = false;
          measureObject(letter);
          phraseObjects.push(letter);
        });
      } else if (obj.type === "letter") {
        obj.x += obj.vx;
        obj.y += obj.vy;
        obj.vy += (Math.random() - 0.5) * 0.04;

        if (obj._hovering || obj._tapped) {
          obj.vx = 0;
          obj.vy = 0;

          if (!obj.windSpawnedClone && obj.windSourceText) {
            obj.windSpawnedClone = true;
            const clone = createPhraseObject(obj.windSourceText, 1);
            measureObject(clone);
            clone.x = -clone.width - 20;
            clone.y = 60 + Math.random() * Math.max(50, world.height - 160);
            clone.el.style.transform = `translate(${clone.x}px, ${clone.y}px) rotate(0deg)`;
            phraseObjects.push(clone);
          }
        }

        if (obj.x > world.width + 40) obj.x = -40;
        if (obj.x < -40) obj.x = world.width + 20;
        if (obj.y < 20) obj.y = 20;
        if (obj.y > world.height - 20) obj.y = world.height - 20;

        obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
      }
    }

    else if (type === "Snow") {
      if (obj.type === "phrase" && !obj.broken) {
        obj.vy += level === "heavy" ? 0.055 * obj.weight : 0.035 * obj.weight;
        obj.x += Math.sin(now / 450 + obj.x * 0.02) * 0.35;
        obj.y += obj.vy;

        obj.el.style.borderRadius = "999px";
        obj.el.style.padding = obj.weight > 1.05 ? "8px 12px" : "6px 10px";
        obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;

        measureObject(obj);

        if (obj.y > world.height - obj.height - 10) {
          breakIntoLetters(obj);
        }
      } else if (obj.type === "letter") {
        obj.vy += 0.08;
        obj.y += obj.vy;

        const stack = getStackY(obj.x, obj.width, obj.height);
        if (obj.y >= stack.topY) {
          obj.y = stack.topY;
          obj.vy = 0;
          stampGround(stack.start, stack.end, obj.y);
        }

        obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px)`;
      }
    }

    else if (type === "Clear") {
      if (obj.type === "phrase") {
        const origin = getSunOrigin();
        const dx = obj.x - origin.x;
        const dy = obj.y - origin.y;

        obj.x += dx * 0.008 + (Math.random() - 0.5) * 0.08;
        obj.y += dy * 0.008 + Math.sin(now / 300 + obj.x * 0.02) * 0.4;

        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px) rotate(${angle}deg)`;
      }
    }

    else if (type === "Clouds") {
      if (obj.type === "phrase") {
        obj.x += Math.sin(now / 1200 + obj.y * 0.01) * 0.08;
        obj.y += Math.sin(now / 900 + obj.x * 0.01) * 0.03;
        obj.el.style.transform = `translate(${obj.x}px, ${obj.y}px) rotate(0deg)`;
      }
    }
  });

  animationFrameId = requestAnimationFrame(stepPhysics);
}

/* =========================
   UPDATE UI
========================= */

function updateUI(weatherData) {
  const block = weatherContent[weatherData.type]?.[weatherData.level];

  weatherBtn.textContent = block?.label || "Weather";
  currentAnimatedWeather = weatherData;

  clearScene();
  updateWorldSize();

  phraseObjects = buildPhraseObjects(weatherData);
  lastSpawnTime = Date.now();

  animationFrameId = requestAnimationFrame(stepPhysics);
}

/* =========================
   TIME SYSTEM
========================= */

let currentTimezone = "America/New_York";

function getTimezoneLabel(tz) {
  const map = {
    "America/New_York": "EST",
    "Europe/London": "GMT",
    "Asia/Shanghai": "CST",
    "Asia/Tokyo": "JST",
    "Asia/Singapore": "SGT",
    "Asia/Bangkok": "ICT",
    "America/Los_Angeles": "PST",
    "America/Chicago": "CST",
    "Europe/Paris": "CET"
  };

  return map[tz] || tz.split("/")[1];
}

function formatTimeWithZone(date, timezone) {
  const time = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  const short = getTimezoneLabel(timezone);

  return `${short} ${time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })}`;
}

function updateTime() {
  const now = new Date();
  timeEl.textContent = formatTimeWithZone(now, currentTimezone);
}

updateTime();
setInterval(updateTime, 1000);

/* =========================
   FETCH WEATHER
========================= */

async function fetchWeather(lat, lon, cityName) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`;

  const res = await fetch(url);
  const data = await res.json();

  const current = data.current_weather;

  const weatherData = classifyWeather(
    current.weathercode,
    current.windspeed,
    current.winddirection || 0,
    current.temperature ?? 20
  );

  currentTimezone = data.timezone || currentTimezone;

  locationBtn.textContent = cityName;
  weatherBtn.textContent = weatherData.label;

  updateUI(weatherData);
}

/* =========================
   GEOCODING
========================= */

async function getCoordsFromCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`;

  const res = await fetch(url);
  const data = await res.json();

  const place = data.results?.[0];
  if (!place) return null;

  return {
    lat: place.latitude,
    lon: place.longitude,
    name: place.name
  };
}

/* =========================
   DROPDOWN
========================= */

const candidateCities = [
  "Singapore","Mumbai","Bangkok","Jakarta","Manila","Seattle","Vancouver","London",
  "Helsinki","Reykjavik","Oslo","Anchorage",
  "Beijing","Shanghai","Tokyo","Seoul","Delhi","Kuala Lumpur",
  "Dubai","Riyadh","Doha","Tel Aviv","Tehran",
  "Paris","Berlin","Rome","Madrid","Amsterdam","Brussels","Vienna","Prague","Zurich","Stockholm","Copenhagen","Warsaw","Budapest","Athens","Lisbon","Dublin",
  "Cairo","Cape Town","Nairobi","Lagos","Casablanca",
  "New York","Los Angeles","Chicago","San Francisco","Boston","Toronto","Montreal","Mexico City",
  "Buenos Aires","Sao Paulo","Rio de Janeiro","Lima","Santiago","Bogota",
  "Sydney","Melbourne","Brisbane","Perth","Auckland","Wellington",
  "Fairbanks","Edmonton","Calgary","Winnipeg","Quebec","Ulaanbaatar","ChangZhou"
];

const allStates = [
  { type: "Rain", level: "light" },
  { type: "Rain", level: "medium" },
  { type: "Rain", level: "heavy" },
  { type: "Clear", level: "light" },
  { type: "Clear", level: "medium" },
  { type: "Clear", level: "heavy" },
  { type: "Wind", level: "light" },
  { type: "Wind", level: "medium" },
  { type: "Wind", level: "heavy" },
  { type: "Clouds", level: "light" },
  { type: "Clouds", level: "medium" },
  { type: "Clouds", level: "heavy" },
  { type: "Snow", level: "light" },
  { type: "Snow", level: "medium" },
  { type: "Snow", level: "heavy" }
];

async function getWeatherForCity(city) {
  const coords = await getCoordsFromCity(city);
  if (!coords) return null;

  const query = city + ", China";
  getCoordsFromCity(query);

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&timezone=auto`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const current = data.current_weather;

    const weatherData = classifyWeather(
      current.weathercode,
      current.windspeed,
      current.winddirection || 0,
      current.temperature ?? 20
    );

    return {
      city: coords.name,
      lat: coords.lat,
      lon: coords.lon,
      timezone: data.timezone,
      weatherData
    };
  } catch {
    return null;
  }
}

async function buildDropdownOptions() {
  const cityResults = await Promise.all(candidateCities.map(city => getWeatherForCity(city)));
  const validResults = cityResults.filter(Boolean);
  const matched = [];

  for (const state of allStates) {
    const found = validResults.find(item =>
      item.weatherData.type === state.type && item.weatherData.level === state.level
    );

    matched.push({
      type: state.type,
      level: state.level,
      label: weatherContent[state.type][state.level].label,
      city: found?.city || "No city found right now",
      lat: found?.lat ?? null,
      lon: found?.lon ?? null
    });
  }

  return matched;
}

weatherBtn.onclick = async () => {
  dropdown.classList.toggle("hidden");

  if (dropdown.classList.contains("hidden")) return;

  dropdown.innerHTML = `<div>Loading weather states...</div>`;

  const options = await buildDropdownOptions();

  dropdown.innerHTML = options.map(item => `
    <div 
      data-lat="${item.lat ?? ""}" 
      data-lon="${item.lon ?? ""}" 
      data-city="${item.city}"
      class="${item.lat === null ? "disabled-option" : ""}"
    >
      ${item.label} in ${item.city}
    </div>
  `).join("");
};

dropdown.onclick = async (e) => {
  const item = e.target.closest("div[data-city]");
  if (!item) return;

  const lat = item.dataset.lat;
  const lon = item.dataset.lon;
  const city = item.dataset.city;

  if (!lat || !lon) return;

  await fetchWeather(Number(lat), Number(lon), city);
  dropdown.classList.add("hidden");
};

/* =========================
   LOCATION INPUT
========================= */

locationBtn.onclick = () => {
  cityInput.classList.toggle("hidden");
  cityField.focus();
};

cityField.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const coords = await getCoordsFromCity(cityField.value);
    if (!coords) return;

    fetchWeather(coords.lat, coords.lon, coords.name);
    cityInput.classList.add("hidden");
    cityField.value = "";
  }
});

/* =========================
   CLICK OUTSIDE CLOSE
========================= */

document.addEventListener("click", (e) => {
  if (!dropdown.contains(e.target) && e.target !== weatherBtn) {
    dropdown.classList.add("hidden");
  }

  if (!cityInput.contains(e.target) && e.target !== locationBtn) {
    cityInput.classList.add("hidden");
  }
});

/* =========================
   INITIAL LOAD
========================= */

function start() {
  updateWorldSize();
  cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(stepPhysics);
}

getCoordsFromCity("New York").then(coords => {
  if (!coords) return;
  fetchWeather(coords.lat, coords.lon, coords.name);
});



/* =========================
   about card
========================= */


const aboutBtn = document.getElementById("aboutBtn");
const aboutCard = document.getElementById("aboutCard");

/* OPEN */

aboutBtn.addEventListener("click", (e) => {
  e.stopPropagation();

  aboutCard.classList.remove("hidden");

  requestAnimationFrame(() => {
    aboutCard.classList.add("show");
  });
});

/* CLOSE（点击任意地方） */

document.addEventListener("click", () => {
  if (aboutCard.classList.contains("show")) {
    aboutCard.classList.remove("show");

    setTimeout(() => {
      aboutCard.classList.add("hidden");
    }, 400); // match transition
  }
});

/* 防止点卡片 itself 关闭 */

aboutCard.addEventListener("click", (e) => {
  e.stopPropagation();
});