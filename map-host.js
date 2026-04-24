// ======================================
// 🔧 SUPABASE INITIALISIERUNG
// ======================================

const supabaseClient = window.supabase.createClient(
  "https://havaoqxnxnlmyfbldyic.supabase.co",
  "sb_publishable_U-UsVeVHSjF0NXZeZ-D4wA_Ly4ZRgH5"
);
//Team‑Namen aus der DB laden
async function loadTeams() {
  const { data, error } = await supabaseClient
    .from("teams")
    .select("id, name");

  if (error) {
    console.error("Fehler beim Laden der Teams:", error);
    return;
  }

  data.forEach(team => {
    teamMap[team.id] = team.name;
  });
}

// einmalig ausführen
loadTeams();
// ======================================
// 🧠 GLOBALER SPIELZUSTAND
// ======================================

let currentRoundId = 1;
let currentPins = [];      // Team-Pins dieser Runde
let currentTarget = null;  // Zielkoordinaten dieser Runde
let teamMap = {}; // team_id → team_name
let currentRoundId = 1;
let currentRound = null; // enthält question, target_lat/lng

// ======================================
// 🗺️ KARTE INITIALISIEREN
// ======================================

const map = L.map("mapContainer", {
  center: [20, 0],
  zoom: 2,
  zoomControl: false
});

// ======================================
// 🌍 KARTEN-KACHELN (OHNE LABELS)
// ======================================

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
  {
    maxZoom: 18,
    attribution: "© OpenStreetMap & Carto"
  }
).addTo(map);

// ======================================
// 📍 MARKER-LAYER
// ======================================

const teamPinLayer = L.layerGroup().addTo(map);
const targetLayer = L.layerGroup().addTo(map);

// ======================================
// 📐 DISTANZBERECHNUNG (HAVERSINE)
// ======================================

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ======================================
// 🎛️ HOST-BUTTON-REFERENZEN
// ======================================

const btnShowPins = document.getElementById("btnShowPins");
const btnRevealTarget = document.getElementById("btnRevealTarget");
const btnNextRound = document.getElementById("btnNextRound");

const resultPanel = document.getElementById("resultPanel");
const resultList = document.getElementById("resultList");

// ======================================
// 🟡 KLICK 1: TEAM-PINS ANZEIGEN
// ======================================

btnShowPins.onclick = async () => {

  teamPinLayer.clearLayers();
  resultPanel.classList.add("hidden");
  resultList.innerHTML = "";

  const { data, error } = await supabaseClient
    .from("map_pins")
    .select("team_id, lat, lng, submitted_at")
    .eq("round_id", currentRoundId);

  if (error) {
    console.error("Fehler beim Laden der Pins:", error);
    return;
  }

  currentPins = data || [];

  currentPins.forEach(pin => {
    L.marker([pin.lat, pin.lng])
      .bindPopup(teamMap[pin.team_id] || "Unbekanntes Team")
      .addTo(teamPinLayer);
  });

  btnShowPins.classList.add("hidden");
  btnRevealTarget.classList.remove("hidden");
};

// ======================================
// 🔵 KLICK 2: ZIEL AUFLÖSEN & WERTEN
// ======================================

btnRevealTarget.onclick = async () => {

  // 🎯 Ziel laden
  const { data: round, error } = await supabaseClient
    .from("map_rounds")
    .select("target_lat, target_lng")
    .eq("id", currentRoundId)
    .single();

  if (error) {
    console.error("Fehler beim Laden des Ziels:", error);
    return;
  }

  currentTarget = round;

  // 🎯 Ziel anzeigen
  L.circleMarker([round.target_lat, round.target_lng], {
    radius: 10,
    color: "#facc15",
    fillColor: "#facc15",
    fillOpacity: 1
  })
    .bindPopup("🎯 Ziel")
    .addTo(targetLayer);

  // 📏 Entfernungen berechnen
  const results = currentPins.map(p => ({
    team_id: p.team_id,
    distance: haversine(
      p.lat,
      p.lng,
      round.target_lat,
      round.target_lng
    ),
    submitted_at: p.submitted_at
  }));

  // Sortieren: Distanz, dann Zeit
  results.sort((a, b) =>
    a.distance !== b.distance
      ? a.distance - b.distance
      : new Date(a.submitted_at) - new Date(b.submitted_at)
  );

  // 🧮 Punkte vergeben & speichern
  for (let i = 0; i < results.length; i++) {
    const points = i === 0 ? 2 : i === 1 ? 1 : 0;

    await supabaseClient.from("map_scores").insert({
      round_id: currentRoundId,
      team_id: results[i].team_id,
      points
    });
  }

  // 📊 ERGEBNISLISTE (C4)
  resultList.innerHTML = "";

  results.forEach((r, index) => {
    const points = index === 0 ? 2 : index === 1 ? 1 : 0;

    const li = document.createElement("li");
    li.textContent =
      `${index + 1}. ${teamMap[r.team_id] || "Unbekanntes Team"} – `
+ `${Math.round(r.distance)} km → ${points} Punkte`;

    resultList.appendChild(li);
  });

  resultPanel.classList.remove("hidden");

  btnRevealTarget.classList.add("hidden");
  btnNextRound.classList.remove("hidden");
};

// ======================================
// 🔁 NÄCHSTE RUNDE
// ======================================

btnNextRound.onclick = () => {
  teamPinLayer.clearLayers();
  targetLayer.clearLayers();

  currentPins = [];
  currentTarget = null;

  currentRoundId++;

  resultPanel.classList.add("hidden");
  resultList.innerHTML = "";

  btnNextRound.classList.add("hidden");
  btnShowPins.classList.remove("hidden");

};
