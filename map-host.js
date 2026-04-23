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
  const dummyPins = [
    { team: "Rot", lat: -13.2, lng: -72.5 },
    { team: "Blau", lat: -12.5, lng: -70.0 },
    { team: "Gelb", lat: -15.0, lng: -74.0 }
  ];

  dummyPins.forEach(pin => {
    L.marker([pin.lat, pin.lng])
      .bindPopup(`Team ${pin.team}`)
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
  // Dummy-Ziel (später aus DB)
  const targetLat = -13.1631;
  const targetLng = -72.5450;

  L.circleMarker([targetLat, targetLng], {
    radius: 10,
    color: "#facc15",
    fillColor: "#facc15",
    fillOpacity: 1
  })
    .bindPopup("🎯 Ziel")
    .addTo(targetLayer);

  // Button-Zustände wechseln
  btnRevealTarget.classList.add("hidden");
  btnNextRound.classList.remove("hidden");
};
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
