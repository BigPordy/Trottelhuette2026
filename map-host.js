// ======================================
// 🔧 SUPABASE INITIALISIERUNG
// ======================================

const supabaseClient = window.supabase.createClient(
  "https://havaoqxnxnlmyfbldyic.supabase.co",
  "sb_publishable_U-UsVeVHSjF0NXZeZ-D4wA_Ly4ZRgH5"
);
// ================================
// 📦 RUNDE AUS DB LADEN (HOST)
// ================================

async function loadRound(roundId) {
  const { data, error } = await supabaseClient
    .from("map_rounds")
    .select("id, round_index, question, target_lat, target_lng")
    .eq("id", roundId)
    .single();

  if (error) {
    console.error("Fehler beim Laden der Runde:", error);
    return;
  }

  currentRound = data;

  // ✅ UI aktualisieren
  document.getElementById("roundCounter").textContent =
    `Runde ${data.round_index} von 8`;

  document.getElementById("questionText").textContent =
    `Gesucht: ${data.question}`;
}

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

async function initHost() {
  await loadTeams();
  await loadRound(currentRoundId);
}

initHost();

// ======================================
// 🧠 GLOBALER SPIELZUSTAND
// ======================================

let currentPins = [];      // Team-Pins dieser Runde
let currentTarget = null;  // Zielkoordinaten dieser Runde
let teamMap = {}; // team_id → team_name
let currentRoundId = 1;
let currentRound = null; // enthält question, target_lat/lng
const TOTAL_MAP_ROUNDS = 8;

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
const btnShowTotalScore = document.getElementById("btnShowTotalScore");
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

if (currentRoundId > TOTAL_MAP_ROUNDS) {
  finishMapMode();
  return;
}

loadRound(currentRoundId);

  resultPanel.classList.add("hidden");
  resultList.innerHTML = "";

  btnNextRound.classList.add("hidden");
  btnShowPins.classList.remove("hidden");
  
// ======================================
// 💾 MAP-PUNKTE ZUM GESAMTSCORE ADDIEREN
// ======================================

async function applyMapScoreToTotal() {

  // prüfen, ob Punkte schon addiert wurden
  const { data: roundMeta } = await supabaseClient
    .from("map_rounds")
    .select("scores_applied")
    .eq("id", currentRoundId)
    .single();

  if (roundMeta?.scores_applied) {
    console.log("Map-Punkte wurden bereits addiert.");
    return;
  }

  // Map-Scores laden
  const { data: mapScores } = await supabaseClient
    .from("map_scores")
    .select("team_id, points");

  const mapSum = {};
  mapScores.forEach(row => {
    mapSum[row.team_id] = (mapSum[row.team_id] || 0) + row.points;
  });

  // Punkte zu team_scores addieren
  for (const [teamId, points] of Object.entries(mapSum)) {
    const { data: teamRow } = await supabaseClient
      .from("team_scores")
      .select("score")
      .eq("team_id", teamId)
      .single();

    const newScore = (teamRow?.score || 0) + points;

    await supabaseClient
      .from("team_scores")
      .update({ score: newScore })
      .eq("team_id", teamId);
  }

  // als angewendet markieren
  await supabaseClient
    .from("map_rounds")
    .update({ scores_applied: true })
    .eq("id", currentRoundId);
}
};
loadRound(currentRoundId);

// ======================================
// 🏁 MAP-MODUS BEENDEN
// ======================================

async function finishMapMode() {

  // ✅ Map-Punkte JETZT permanent speichern
  await applyMapScoreToTotal();

  // UI aufräumen
  teamPinLayer.clearLayers();
  targetLayer.clearLayers();

  // … Map-Ergebnis anzeigen …
}

  btnNextRound.classList.add("hidden");
  btnShowPins.classList.add("hidden");
  btnRevealTarget.classList.add("hidden");

  // ✅ Map-Modus-Ergebnis laden
  const { data: mapScores, error } = await supabaseClient
    .from("map_scores")
    .select("team_id, points");

  if (error) {
    console.error("Fehler beim Laden der Map-Scores:", error);
    return;
  }

  // Punkte pro Team aufsummieren
  const summary = {};
  mapScores.forEach(row => {
    summary[row.team_id] = (summary[row.team_id] || 0) + row.points;
  });

  // Anzeige vorbereiten
  resultList.innerHTML = "";

  Object.entries(summary).forEach(([teamId, points]) => {
    const li = document.createElement("li");
    li.textContent = `${teamMap[teamId] || "Unbekanntes Team"} – ${points} Punkte`;
    resultList.appendChild(li);
  });

  document.getElementById("questionText").textContent =
    "🏁 Map‑Modus beendet – Ergebnis";

  resultPanel.classList.remove("hidden"); 
  btnShowTotalScore.classList.remove("hidden");
  
// ======================================
// 🧮 GESAMTSPIELSTAND ANZEIGEN
// ======================================

btnShowTotalScore.onclick = async () => {

  // 1️⃣ bisherigen Gesamtstand laden
  const { data: baseScores, error: baseError } = await supabaseClient
    .from("team_scores")
    .select("team_id, score");

  if (baseError) {
    console.error("Fehler beim Laden der Gesamtpunkte:", baseError);
    return;
  }

  // 2️⃣ Map‑Punkte laden
  const { data: mapScores, error: mapError } = await supabaseClient
    .from("map_scores")
    .select("team_id, points");

  if (mapError) {
    console.error("Fehler beim Laden der Map‑Punkte:", mapError);
    return;
  }

  // 3️⃣ Map‑Punkte aufsummieren
  const mapSum = {};
  mapScores.forEach(row => {
    mapSum[row.team_id] = (mapSum[row.team_id] || 0) + row.points;
  });

  // 4️⃣ Gesamtscore berechnen
  const totalScores = {};

  baseScores.forEach(row => {
    totalScores[row.team_id] =
      row.score + (mapSum[row.team_id] || 0);
  });

  // 5️⃣ Anzeige aktualisieren
  resultList.innerHTML = "";

  Object.entries(totalScores)
    .sort((a, b) => b[1] - a[1])   // absteigend
    .forEach(([teamId, score]) => {
      const li = document.createElement("li");
      li.textContent =
        `${teamMap[teamId] || "Unbekanntes Team"} – ${score} Punkte`;
      resultList.appendChild(li);
    });

  document.getElementById("questionText").textContent =
    "🏆 Gesamtspielstand";

  btnShowTotalScore.classList.add("hidden");
};
}
