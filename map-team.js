let currentRoundId = 1;
let currentRound = null; // enthält question (ohne Ziel!)


// ======================================
// 🔧 SUPABASE INITIALISIERUNG (TEAM)
// ======================================

const supabaseClient = window.supabase.createClient(
  "https://havaoqxnxnlmyfbldyic.supabase.co",
  "sb_publishable_U-UsVeVHSjF0NXZeZ-D4wA_Ly4ZRgH5"
);

// ================================
// 🧑‍🤝‍🧑 TEAM-AUSWAHL – ZUSTAND
// ================================

let currentTeamId = null;

// ================================
// 🧑‍🤝‍🧑 TEAMS AUS DB LADEN
// ================================

async function loadTeams() {
  const { data, error } = await supabaseClient
    .from("teams")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Fehler beim Laden der Teams:", error);
    return;
  }

  const select = document.getElementById("teamSelect");

  data.forEach(team => {
    const option = document.createElement("option");
    option.value = team.id;
    option.textContent = team.name;
    select.appendChild(option);
  });
}

// ================================
// ✅ TEAM AUSWÄHLEN
// ================================

const teamSelect = document.getElementById("teamSelect");

teamSelect.onchange = (event) => {
  currentTeamId = event.target.value;
};

// beim Laden der Seite ausführen
loadTeams();
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
