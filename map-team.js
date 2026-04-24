// ======================================
// 🔧 SUPABASE INITIALISIERUNG (TEAM)
// ======================================

const supabaseClient = window.supabase.createClient(
  "https://havaoqxnxnlmyfbldyic.supabase.co",
  "sb_publishable_U-UsVeVHSjF0NXZeZ-D4wA_Ly4ZRgH5"
);

// ======================================
// 🧠 GLOBALE ZUSTÄNDE
// ======================================

let currentTeamId = null;
let currentRoundId = 1;
let currentRound = null;

// ================================
// 📦 RUNDE AUS DB LADEN (TEAM)
// ================================

async function loadRound(roundId) {
  const { data, error } = await supabaseClient
    .from("map_rounds")
    .select("id, round_index, question")
    .eq("round_index", roundId)
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
    `Pinne: ${data.question}`;
}

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

btnSubmitPin.onclick = async () => {

  // 🔒 Sicherheitschecks
  if (!currentTeamId) {
    alert("Bitte zuerst ein Team auswählen.");
    return;
  }

  if (!teamMarker) {
    alert("Bitte zuerst einen Pin setzen.");
    return;
  }

  const { lat, lng } = teamMarker.getLatLng();

  // ✅ Pin in DB speichern (oder überschreiben)
const { error } = await supabaseClient
  .from("map_pins")
  .upsert(
    {
      round_id: currentRound.id,
      team_id: currentTeamId,
      lat,
      lng
    },
    {
      onConflict: "round_id,team_id"
    }
  );

  if (error) {
    console.error("Fehler beim Speichern des Pins:", error);
    alert("Pin konnte nicht gespeichert werden.");
    return;
  }

  // ✅ UI sperren
  map.off("click");
  btnSubmitPin.classList.add("hidden");
  document.getElementById("pinHint").classList.add("hidden");
  document.getElementById("waitMessage").classList.remove("hidden");
};

// ======================================
// ▶️ INITIAL START
// ======================================

// Teams laden
loadTeams();
// Erste Runde laden
loadRound(currentRoundId);

// ======================================
// 🔄 RUNDE SYNCHRON HALTEN (Polling)
// ======================================

setInterval(async () => {
  const nextRoundId = currentRoundId;

  if (!currentRound || nextRoundId !== currentRound.id) {
    await loadRound(nextRoundId);
  }
}, 3000);
