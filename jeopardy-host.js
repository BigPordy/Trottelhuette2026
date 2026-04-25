// ===============================
// 🔧 SUPABASE SETUP
// ===============================
const supabase = window.supabase.createClient(
  "https://havaoqxnxnlmyfbldyic.supabase.co",
  "sb_publishable_U-UsVeVHSjF0NXZeZ-D4wA_Ly4ZRgH5"
);

let questions = [];
let currentQuestion = null;

// ===============================
// 📥 BOARD LADEN
// ===============================
async function loadBoard() {
  const { data, error } = await supabase
    .from("jeopardy_questions")
    .select("*")
    .order("category")
    .order("value");

  if (error) {
    console.error("Fehler beim Laden der Jeopardy-Fragen:", error);
    return;
  }

  questions = data;
  renderBoard();
}

// ===============================
// 🎛️ BOARD RENDERN
// ===============================
function renderBoard() {
  const board = document.getElementById("board");
  board.innerHTML = "";

  questions.forEach(q => {
    const div = document.createElement("div");
    div.className = "cell" + (q.used ? " used" : "");
    div.textContent = q.used ? "" : q.value;

    if (!q.used) {
      div.onclick = () => openQuestion(q);
    }

    board.appendChild(div);
  });
}

// ===============================
// ▶️ FRAGE ÖFFNEN
// ===============================
async function openQuestion(q) {
  currentQuestion = q;

  document.getElementById("questionText").textContent = q.question;
  document.getElementById("board").style.display = "none";
  document.getElementById("questionView").style.display = "block";

  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, name")
    .order("name");

  if (error) {
    console.error("Fehler beim Laden der Teams:", error);
    return;
  }

  const select = document.getElementById("teamSelect");
  select.innerHTML = "";

  teams.forEach(team => {
    const opt = document.createElement("option");
    opt.value = team.id;
    opt.textContent = team.name;
    select.appendChild(opt);
  });
}

// ===============================
// ✅ RICHTIG
// ===============================
async function markCorrect() {
  const teamId = document.getElementById("teamSelect").value;

  const { data: scoreRow } = await supabase
    .from("team_scores")
    .select("score")
    .eq("team_id", teamId)
    .single();

  const newScore = (scoreRow?.score || 0) + currentQuestion.points;

  await supabase
    .from("team_scores")
    .update({ score: newScore })
    .eq("team_id", teamId);

  await closeQuestion();
}

// ===============================
// ❌ FALSCH
// ===============================
async function markWrong() {
  await closeQuestion();
}

// ===============================
// 🔒 FRAGE SCHLIESSEN & SPERREN
// ===============================
async function closeQuestion() {
  await supabase
    .from("jeopardy_questions")
    .update({ used: true })
    .eq("id", currentQuestion.id);

  currentQuestion = null;

  document.getElementById("questionView").style.display = "none";
  document.getElementById("board").style.display = "grid";

  loadBoard();
}

// ===============================
// 🚀 START
// ===============================
loadBoard();
