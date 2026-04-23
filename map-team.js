const supabase = window.supabase.createClient(
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY"
);

// ================================
// 🗺️ TEAM-KARTE INITIALISIEREN
// ================================

const map = L.map("mapContainer", {
  center: [20, 0],
  zoom: 2,
  zoomControl: false
});

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
  {
    maxZoom: 18,
    attribution: "© OpenStreetMap & Carto"
  }
).addTo(map);

// ================================
// 📍 TEAM-PIN-LAYER
// ================================

const teamPinLayer = L.layerGroup().addTo(map);

// ================================
// 📍 PIN SETZEN (TEAM)
// ================================

let teamMarker = null;

map.on("click", (e) => {
  if (teamMarker) {
    teamMarker.setLatLng(e.latlng);
  } else {
    teamMarker = L.marker(e.latlng, { draggable: true })
      .addTo(teamPinLayer);

    document.getElementById("btnSubmitPin")
      .classList.remove("hidden");
  }
});
// ================================
// ✅ PIN ABSENDEN
// ================================

const btnSubmitPin = document.getElementById("btnSubmitPin");

btnSubmitPin.onclick = () => {
  map.off("click"); // Karte sperren

  btnSubmitPin.classList.add("hidden");
  document.getElementById("pinHint").classList.add("hidden");
  document.getElementById("waitMessage").classList.remove("hidden");

  // später hier:
  // Pin in DB speichern (Supabase)
};
