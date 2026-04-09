/* =========================
   GET ELEMENTS
========================= */

const poemNameEl = document.getElementById("poemName");
const contentEl = document.getElementById("content");
const weatherEl = document.getElementById("weather");
const timeEl = document.getElementById("time");
const locationEl = document.getElementById("location");


/* =========================
   POEM DATABASE
========================= */

const poemDatabase = {
  Clear: {
    name: "Sitting Outside - W. D. Snodgrass",
    text: "l"
  },
  Clouds: {
    name: "Drift",
    text: "cloud drifting cloud drifting"
  },
  Rain: {
    name: "Falling Language",
    text: "rain rain rain rain rain"
  },
  Snow: {
    name: "Silent Field",
    text: "soft white soft white"
  },
  Wind: {
    name: "A Crosstown Breeze, Henry Taylor",
    text: "A drift of wind when August wheeled brought back to mind an alfalfa field where green windrows bleached down to hay while storm clouds rose and rolled our way. With lighthearted strain in our pastoral agon we raced the rain with baler and wagon, driving each other to hold the turn out of the weather and into the barn. A nostalgic pause claims we saved it all, but I’ve known the loss of the lifelong haul; now gray concrete and electric light wear on my feet and dull my sight. So I keep asking, as I stand here, my cheek still basking in that trick of air, would I live that life if I had the chance, or is it enough to have been there once? "
  },
  
  Thunderstorm: {
    name: "Break",
    text: "flash break flash"
  },
  Fog: {
    name: "Blur",
    text: "unclear unclear"
  },
  Default: {
    name: "Poem name",
    text: "..."
  }
};


/* =========================
   TIME
========================= */

function updateTime() {
  const now = new Date();

  timeEl.textContent = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

updateTime();
setInterval(updateTime, 1000);


/* =========================
   WEATHER CODE → TYPE
========================= */

function mapWeatherCode(code, windSpeed) {

  if (windSpeed > 8) return "Wind";

  if (code === 0) return "Clear";
  if (code >= 1 && code <= 3) return "Clouds";
  if (code >= 45 && code <= 48) return "Fog";

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return "Rain";
  }

  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 95) return "Thunderstorm";

  return "Default";
}


/* =========================
   GET CITY NAME（🔥关键新增）
========================= */

async function getCityName(lat, lon) {
  const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const place = data.results?.[0];

    if (!place) return "Unknown";

    return place.city || place.town || place.village || place.name || place.country;

  } catch (err) {
    console.error("Geocoding error:", err);
    return "Unknown";
  }
}


/* =========================
   UPDATE UI
========================= */

function updateUI(weatherType, lat, lon) {

  const poem = poemDatabase[weatherType] || poemDatabase.Default;

  // 更新 poem
  poemNameEl.textContent = poem.name;
  contentEl.textContent = poem.text;

  // 更新 weather
  weatherEl.textContent = `${weatherType}`;

  // 🔥 更新城市（异步）
  getCityName(lat, lon).then((city) => {
    locationEl.textContent = city;
  });

  // body class（给你后面做动画用）
  document.body.className = "";
  document.body.classList.add(`weather-${weatherType.toLowerCase()}`);
}


/* =========================
   FETCH WEATHER
========================= */

async function fetchWeather(lat, lon) {

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    const code = data.current_weather.weathercode;
    const windSpeed = data.current_weather.windspeed;

    const weatherType = mapWeatherCode(code, windSpeed);

    updateUI(weatherType, lat, lon);

  } catch (error) {
    console.error("Weather fetch failed:", error);
    updateUI("Default", 40.73, -73.94);
  }
}


/* =========================
   GET LOCATION
========================= */

function getLocation() {

  if (!navigator.geolocation) {
    updateUI("Default", 40.73, -73.94);
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      fetchWeather(lat, lon);
    },
    () => {
      updateUI("Default", 40.73, -73.94);
    }
  );
}


/* =========================
   START
========================= */

getLocation();