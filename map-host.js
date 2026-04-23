const supabase = window.supabase.createClient(
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY"
);

// ================================
// 🗺️ KARTE INITIALISIEREN
// ================================

const map = L.map("mapContainer", {
  center: [20, 0], // Welt-Zentrum
  zoom: 2,
  zoomControl: false
});

// ================================
// 🌍 KARTEN-KACHELN (OpenStreetMap)
// ================================

 L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
  {
    maxZoom: 18,
    attribution: "© OpenStreetMap & Carto"
  }
).addTo(map);

// ================================
// 📍 MARKER-LAYER
// ================================

// Team-Pins (alle Teams)
const teamPinLayer = L.layerGroup().addTo(map);

// Zielpunkt
const targetLayer = L.layerGroup().addTo(map);

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
// ================================
// 🎛️ HOST-BUTTONS REFERENZEN
// ================================

const btnShowPins = document.getElementById("btnShowPins");
const btnRevealTarget = document.getElementById("btnRevealTarget");
const btnNextRound = document.getElementById("btnNextRound");

// ================================
// 🟡 KLICK 1: TEAM-PINS ANZEIGEN
// ================================

btnShowPins.onclick = () => {
  // Dummy-Daten (später aus der DB)
const { data: pins } = await supabase
  .from("map_pins")
  .select("team_id, lat, lng")
  .eq("round_id", currentRoundId);

pins.forEach(pin => {
  L.marker([pin.lat, pin.lng])
    .bindPopup(`Team ${pin.team_id}`)
    .addTo(teamPinLayer);
});

  // Button-Zustände wechseln
  btnShowPins.classList.add("hidden");
  btnRevealTarget.classList.remove("hidden");
};
// ================================
// 🔵 KLICK 2: ZIEL AUFLÖSEN
// ================================

btnRevealTarget.onclick = () => {
 const { data: round } = await supabase
  .from("map_rounds")
  .select("target_lat, target_lng")
  .eq("id", currentRoundId)
  .single();

const { target_lat, target_lng } = round;

L.circleMarker([target_lat, target_lng], {
  radius: 10,
  color: "#facc15",
  fillOpacity: 1
}).addTo(targetLayer);

  // Button-Zustände wechseln
  btnRevealTarget.classList.add("hidden");
  btnNextRound.classList.remove("hidden");
};
const results = pins.map(p => {
  return {
    team_id: p.team_id,
    distance: haversine(
      p.lat,
      p.lng,
      target_lat,
      target_lng
    )
  };
});

results.sort((a, b) => a.distance - b.distance);
results.forEach((r, index) => {
  let points = 0;
  if (index === 0) points = 2;
  if (index === 1) points = 1;

  // speichern
  supabase.from("map_scores").insert({
    round_id: currentRoundId,
    team_id: r.team_id,
    points
  });
});

// ================================
// 🔁 NÄCHSTE RUNDE
// ================================

btnNextRound.onclick = () => {
  teamPinLayer.clearLayers();
  targetLayer.clearLayers();

  btnNextRound.classList.add("hidden");
  btnShowPins.classList.remove("hidden");

  // später:
  // - Rundenzähler erhöhen
  // - neue Aufgabe laden
};
