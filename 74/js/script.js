/* ============================
   データ保存・読み込み
============================ */

const STORAGE_KEY = "workout_logs";
const EXERCISE_KEY = "exercise_list";

let defaultExercises = {
  "胸": ["ベンチプレス", "ダンベルフライ"],
  "背中": ["懸垂", "デッドリフト"],
  "足": ["スクワット", "レッグプレス"],
  "肩": ["ショルダープレス", "サイドレイズ"],
  "腕": ["アームカール", "トライセプスプレスダウン"]
};

function loadLogs() {
  let json = localStorage.getItem(STORAGE_KEY);
  return json ? JSON.parse(json) : [];
}

function saveLogs(logs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

function loadExercises() {
  let json = localStorage.getItem(EXERCISE_KEY);
  return json ? JSON.parse(json) : defaultExercises;
}

function saveExercises(list) {
  localStorage.setItem(EXERCISE_KEY, JSON.stringify(list));
}

/* ============================
   カレンダー生成
============================ */

const calendarEl = document.getElementById("calendar");
let currentDate = new Date();
let selectedDate = null;

function renderCalendar() {
  calendarEl.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  document.getElementById("calendar-title").textContent =
    `${year}年 ${month + 1}月`;

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  // 曜日
  const weekdays = document.createElement("div");
  weekdays.className = "calendar-weekdays";
  ["日","月","火","水","木","金","土"].forEach(d => {
    let w = document.createElement("div");
    w.textContent = d;
    weekdays.appendChild(w);
  });
  calendarEl.appendChild(weekdays);

  // 日付グリッド
  const days = document.createElement("div");
  days.className = "calendar-days";

  // 空白
  for (let i = 0; i < firstDay; i++) {
    let blank = document.createElement("div");
    days.appendChild(blank);
  }

  const logs = loadLogs();
  const logDates = logs.map(l => l.date);

  // 日付セル
  for (let d = 1; d <= lastDate; d++) {
    let cell = document.createElement("div");
    cell.className = "calendar-day";
    cell.textContent = d;

    let dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

    // 今日
    let today = new Date();
    if (
      d === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      cell.classList.add("today");
    }

    // トレした日 → ●マーク
    if (logDates.includes(dateStr)) {
      cell.classList.add("has-log");
    }

    // 選択中
    if (selectedDate === dateStr) {
      cell.classList.add("selected");
    }

    // クリック
    cell.addEventListener("click", () => {
      selectedDate = dateStr;
      renderCalendar();
      showLogsOfDay(dateStr);
    });

    days.appendChild(cell);
  }

  calendarEl.appendChild(days);
}

/* ============================
   前月・次月ボタン
============================ */

document.getElementById("prev-month").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById("next-month").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar();
});

/* ============================
   日付クリック → トレ内容表示
============================ */

const dayLogList = document.getElementById("day-log-list");
const selectedDateTitle = document.getElementById("selected-date-title");

function showLogsOfDay(dateStr) {
  const logs = loadLogs().filter(l => l.date === dateStr);

  const d = new Date(dateStr);
  const w = ["日","月","火","水","木","金","土"];
  selectedDateTitle.textContent = `${d.getMonth()+1}月${d.getDate()}日（${w[d.getDay()]}）`;

  dayLogList.innerHTML = "";

  if (logs.length === 0) {
    dayLogList.innerHTML = "<li>記録なし</li>";
    return;
  }

  logs.forEach(log => {
    let li = document.createElement("li");
    li.innerHTML = `
      ${log.bodypart} / ${log.exercise}  
      ${log.weight}kg × ${log.reps}回
      <button class="edit-btn" data-id="${log.id}">編集</button>
      <button class="delete-btn" data-id="${log.id}">削除</button>
    `;
    dayLogList.appendChild(li);
  });

  // 編集
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => startEdit(Number(btn.dataset.id)));
  });

  // 削除
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteLog(Number(btn.dataset.id)));
  });
}

/* ============================
   入力フォーム
============================ */

let bodypartSelect = document.getElementById("bodypart");
let exerciseSelect = document.getElementById("exercise");
let addExerciseBtn = document.getElementById("add-exercise-btn");
let exerciseAddArea = document.getElementById("exercise-add-area");
let newExerciseInput = document.getElementById("new-exercise");
let saveExerciseBtn = document.getElementById("save-exercise-btn");

let setsArea = document.getElementById("sets-area");
let addSetBtn = document.getElementById("add-set-btn");

let addBtn = document.getElementById("add-btn");
let updateBtn = document.getElementById("update-btn");
let messageEl = document.getElementById("message");

let editingId = null;

/* 種目リスト更新 */
function renderExerciseOptions() {
  let list = loadExercises();
  let part = bodypartSelect.value;

  exerciseSelect.innerHTML = "";
  list[part].forEach(name => {
    let op = document.createElement("option");
    op.value = name;
    op.textContent = name;
    exerciseSelect.appendChild(op);
  });
}

bodypartSelect.addEventListener("change", renderExerciseOptions);

/* 種目追加 */
addExerciseBtn.addEventListener("click", () => {
  exerciseAddArea.style.display = "block";
});

saveExerciseBtn.addEventListener("click", () => {
  let name = newExerciseInput.value.trim();
  let part = bodypartSelect.value;

  if (!name) return;

  let list = loadExercises();
  list[part].push(name);
  saveExercises(list);

  renderExerciseOptions();
  newExerciseInput.value = "";
  exerciseAddArea.style.display = "none";
});

/* セット追加 */
addSetBtn.addEventListener("click", () => {
  let div = document.createElement("div");
  div.className = "set-row";
  div.innerHTML = `
    <input type="number" class="set-weight" placeholder="重量(kg)">
    <input type="number" class="set-reps" placeholder="回数">
    <button class="delete-set-btn">削除</button>
  `;
  setsArea.appendChild(div);

  div.querySelector(".delete-set-btn").addEventListener("click", () => {
    div.remove();
  });
});

/* 記録追加 */
addBtn.addEventListener("click", () => {
  if (!selectedDate) {
    showMessage("カレンダーの日付を選んでください");
    return;
  }

  let logs = loadLogs();
  let part = bodypartSelect.value;
  let ex = exerciseSelect.value;

  let repsList = document.querySelectorAll(".set-reps");
  let weightList = document.querySelectorAll(".set-weight");

  let added = 0;

  for (let i = 0; i < repsList.length; i++) {
    let reps = Number(repsList[i].value);
    let weight = Number(weightList[i].value);

    if (!reps || !weight) continue;

    logs.push({
      id: Date.now() + i,
      date: selectedDate,
      bodypart: part,
      exercise: ex,
      reps,
      weight
    });

    added++;
  }

  saveLogs(logs);
  renderCalendar();
  showLogsOfDay(selectedDate);

  setsArea.innerHTML = "";
  showMessage(`${added}セット追加しました`, false);
});

/* 編集開始 */
function startEdit(id) {
  let logs = loadLogs();
  let log = logs.find(l => l.id === id);
  if (!log) return;

  editingId = id;

  bodypartSelect.value = log.bodypart;
  renderExerciseOptions();
  exerciseSelect.value = log.exercise;

  setsArea.innerHTML = `
    <div class="set-row">
      <input type="number" class="set-weight" value="${log.weight}">
      <input type="number" class="set-reps" value="${log.reps}">
    </div>
  `;

  addBtn.style.display = "none";
  updateBtn.style.display = "block";
}

/* 更新 */
updateBtn.addEventListener("click", () => {
  let logs = loadLogs();
  let log = logs.find(l => l.id === editingId);

  let reps = Number(document.querySelector(".set-reps").value);
  let weight = Number(document.querySelector(".set-weight").value);

  log.bodypart = bodypartSelect.value;
  log.exercise = exerciseSelect.value;
  log.reps = reps;
  log.weight = weight;

  saveLogs(logs);
  renderCalendar();
  showLogsOfDay(selectedDate);

  updateBtn.style.display = "none";
  addBtn.style.display = "block";
  setsArea.innerHTML = "";
  editingId = null;

  showMessage("更新しました", false);
});

/* 削除 */
function deleteLog(id) {
  let logs = loadLogs().filter(l => l.id !== id);
  saveLogs(logs);
  renderCalendar();
  showLogsOfDay(selectedDate);
}

/* メッセージ */
function showMessage(text, isError = true) {
  messageEl.textContent = text;
  messageEl.style.color = isError ? "#ff5252" : "#4fc3f7";
  setTimeout(() => messageEl.textContent = "", 2000);
}

/* ============================
   初期化
============================ */

window.addEventListener("load", () => {
  renderExerciseOptions();
  renderCalendar();
});