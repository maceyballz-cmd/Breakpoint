// 1. DATA LOADING
let workouts = JSON.parse(localStorage.getItem("breakpoint")) || [];
let skillStorage = JSON.parse(localStorage.getItem("bp_skills_v3")) || {};
let customExercises = JSON.parse(localStorage.getItem("customExercises")) || ["Push-ups", "Pull-ups", "Dips"];
let warmupExercises = JSON.parse(localStorage.getItem("warmupExercises")) || ["Wrist Circles", "Shoulder Circles"];
let currentWorkout = [];

const plancheData = [
    { id: "p1", name: "Planche lean", isBridge: false },
    { id: "p2", name: "Tuck", isBridge: false },
    { id: "p3", name: "Half tuck", isBridge: true }, 
    { id: "p4", name: "Adv tuck", isBridge: false },
    { id: "p5", name: "Frog stand w/ raised legs", isBridge: true }, 
    { id: "p6", name: "Piked planche", isBridge: false },
    { id: "p7", name: "Half Piked planche", isBridge: true }, 
    { id: "p8", name: "Straddle", isBridge: false },
    { id: "p9", name: "Full", isBridge: false }
];

const handstandData = [
    { id: "h1", name: "Wall Handstand (30s)", isBridge: false },
    { id: "h2", name: "Pike Push-ups", isBridge: true },
    { id: "h3", name: "Chest-to-Wall HS (20s)", isBridge: false },
    { id: "h4", name: "Kick-up Balance practice", isBridge: true },
    { id: "h5", name: "Freestanding HS (5s)", isBridge: false },
    { id: "h6", name: "Wall HS Push-ups", isBridge: true },
    { id: "h7", name: "Solid 10s Handstand", isBridge: false }
];

// 2. NAVIGATION
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const target = document.getElementById(pageId);
    if (target) target.style.display = "block";

    if (pageId === 'dashboard-page') render();
    if (pageId === 'workout-page') renderDropdowns();
    if (pageId === 'skills-page') renderSkills();
    if (pageId === 'history-page') renderHistory();
}

// 3. DATABASE MANAGEMENT
function renderDropdowns() {
    const exSelect = document.getElementById("exercise-builder");
    const wuSelect = document.getElementById("warmup-builder");
    if (exSelect) exSelect.innerHTML = customExercises.map(ex => `<option value="${ex}">${ex}</option>`).join('');
    if (wuSelect) wuSelect.innerHTML = warmupExercises.map(wu => `<option value="${wu}">${wu}</option>`).join('');
}

function addNewExerciseToList() {
    const name = document.getElementById("new-exercise-name").value.trim();
    if (!name) return alert("Type a name!");
    if (!customExercises.includes(name)) {
        customExercises.push(name);
        localStorage.setItem("customExercises", JSON.stringify(customExercises));
        document.getElementById("new-exercise-name").value = "";
        renderDropdowns();
    }
}

function addNewWarmupToList() {
    const name = document.getElementById("new-warmup-name").value.trim();
    if (!name) return alert("Type a name!");
    if (!warmupExercises.includes(name)) {
        warmupExercises.push(name);
        localStorage.setItem("warmupExercises", JSON.stringify(warmupExercises));
        document.getElementById("new-warmup-name").value = "";
        renderDropdowns();
    }
}

function deleteExerciseFromList() {
    const val = document.getElementById("exercise-builder").value;
    if (confirm(`Remove ${val}?`)) {
        customExercises = customExercises.filter(e => e !== val);
        localStorage.setItem("customExercises", JSON.stringify(customExercises));
        renderDropdowns();
    }
}

// 4. WORKOUT BUILDER
function addWarmupToWorkout() {
    const name = document.getElementById("warmup-builder").value;
    const reps = Number(document.getElementById("warmup-reps").value);
    const sets = Number(document.getElementById("warmup-sets").value);
    if (!reps || sets < 1) return alert("Enter reps and sets!");
    let sArr = Array(sets).fill(reps);
    currentWorkout.push({ exercise: name, sets: sArr, isWarmup: true, isHold: false, notes: "" });
    renderCurrentWorkout();
    document.getElementById("warmup-reps").value = "";
    document.getElementById("warmup-sets").value = "1";
}

function addExercise() {
    const name = document.getElementById("exercise-builder").value;
    const isHold = document.getElementById("is-hold").checked;
    const sets = [1,2,3,4].map(i => Number(document.getElementById(`set${i}`).value)).filter(s => s > 0);
    if (sets.length === 0) return alert("Enter sets!");
    currentWorkout.push({ exercise: name, sets, isWarmup: false, isHold, notes: document.getElementById("workout-notes").value });
    renderCurrentWorkout();
    [1,2,3,4].forEach(i => document.getElementById(`set${i}`).value = "");
    document.getElementById("workout-notes").value = "";
    document.getElementById("is-hold").checked = false;
}

function renderCurrentWorkout() {
    document.getElementById("current-workout").innerHTML = currentWorkout.map((item, i) => {
        const display = item.isHold ? item.sets.map(s => s+'s').join(" / ") : item.sets.join(" / ");
        return `<div class="card" style="border-left: 4px solid ${item.isWarmup ? '#ff9800' : '#2196F3'}">
            <strong>${item.exercise}</strong> (${display}) <button onclick="currentWorkout.splice(${i},1); renderCurrentWorkout();" style="float:right; background:none; border:none; color:white;">❌</button>
        </div>`;
    }).join('');
}

function saveFullWorkout() {
    if (currentWorkout.length === 0) return;
    workouts.push({ 
        date: new Date().toLocaleDateString(), 
        exercises: [...currentWorkout],
        summary: document.getElementById("session-summary").value.trim(),
        fatigue: document.getElementById("fatigue-slider").value
    });
    localStorage.setItem("breakpoint", JSON.stringify(workouts));
    currentWorkout = [];
    document.getElementById("session-summary").value = "";
    showPage('dashboard-page');
}

// 5. DASHBOARD 
function calculateStreak() {
    if (workouts.length === 0) return 0;
    const dates = [...new Set(workouts.map(w => w.date))].map(d => new Date(d)).sort((a,b) => b-a);
    let streak = 0; let today = new Date(); today.setHours(0,0,0,0);
    if (dates.length > 0 && Math.floor((today - dates[0])/86400000) <= 1) {
        for (let i=0; i<dates.length; i++) {
            if (i===0 || (dates[i-1]-dates[i])/86400000 === 1) streak++; else break;
        }
    }
    return streak;
}

function render() {
    document.getElementById("total-workouts").textContent = workouts.length;
    document.getElementById("streak").textContent = calculateStreak() + " Days";
    const infoContainer = document.getElementById("prs");
    if (!infoContainer) return;
    
    let html = "";
    if (workouts.length === 0) {
        infoContainer.innerHTML = `<div class="card" style="text-align:center; color:#888;">Welcome! Log a workout to see stats.</div>`;
        return;
    }

    const last = workouts[workouts.length - 1];
    
    // Recovery
    const f = last.fatigue || 5;
    let sColor = f <= 4 ? "#4CAF50" : (f <= 7 ? "#ff9800" : "#f44336");
    html += `<div class="card" style="border: 1px solid ${sColor}; background:${sColor}15; text-align: center;">RECOVERY STATUS: ${f <= 4 ? "Ready ⚡" : (f <= 7 ? "Caution ⚠️" : "Rest 😴")}</div>`;
    
    // Latest
    const latestEx = last.exercises.map(ex => `<div><strong>${ex.exercise}</strong>: ${ex.sets.join("/")}${ex.isHold ? 's' : ''}</div>`).join('');
    html += `<div class="card" style="border-left: 4px solid var(--text);"><h4>📅 Latest Session</h4>${latestEx}${last.summary ? `<div style="margin-top:10px; color:#ffeb3b; font-style:italic; font-size:0.85rem; border-top:1px solid #333; padding-top:5px;">📝 ${last.summary}</div>` : ""}</div>`;
    
    // PRs
    const allPrs = {};
    workouts.forEach(w => w.exercises?.forEach(ex => {
        if (ex.isWarmup) return;
        const best = Math.max(...(ex.sets || [0]));
        if (!allPrs[ex.exercise] || best > allPrs[ex.exercise].val) allPrs[ex.exercise] = {val: best, hold: ex.isHold};
    }));
    
    let prRows = Object.entries(allPrs).map(([name, data]) => `<div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #222;"><span>${name}</span><span style="color:#ffeb3b; font-weight:bold;">🏆 ${data.val}${data.hold ? 's' : ''}</span></div>`).join('');
    html += `<div class="card"><h4>👑 All-Time Records</h4>${prRows || 'No PRs yet.'}</div>`;
    
    infoContainer.innerHTML = html;
}

// 6. HISTORY 
function renderHistory() {
    const list = document.getElementById("workout-history-list");
    if (!list) return;
    let html = [...workouts].reverse().map((w, reversedIndex) => {
        const originalIndex = workouts.length - 1 - reversedIndex;
        const exList = (w.exercises || []).map((ex, exIndex) => {
            const sets = (ex.sets || []).join(" / ");
            return `<div style="margin-bottom:8px;"><strong>${ex.exercise}</strong>: ${sets}${ex.isHold ? 's' : ''}<br><small style="color:#888;">📝 ${ex.notes || ""} <a href="#" onclick="editHistoryNote(${originalIndex}, ${exIndex})" style="color:#e94560; text-decoration:none;">[Edit]</a></small></div>`;
        }).join('');
        return `<div class="card"><h3>📅 ${w.date} <button onclick="deleteWorkout(${originalIndex})" style="float:right; background:red; border:none; color:white; padding:2px 5px; font-size:10px;">Delete</button></h3>${exList}<div style="margin-top:10px; border-top:1px solid #333; padding-top:5px; font-style:italic; font-size:0.85rem; color:#ffeb3b;">Summary: ${w.summary || "None"} <a href="#" onclick="editWorkoutSummary(${originalIndex})" style="color:#e94560; text-decoration:none;">[Edit]</a></div><small style="color:#888;">Effort: ${w.fatigue || 5}/10</small></div>`;
    }).join('') || "No history yet.";
    list.innerHTML = html;
}

function deleteWorkout(i) {
    if (confirm("Delete?")) { workouts.splice(i, 1); localStorage.setItem("breakpoint", JSON.stringify(workouts)); renderHistory(); render(); }
}

function editWorkoutSummary(i) {
    const n = prompt("Edit Summary:", workouts[i].summary || "");
    if (n !== null) { workouts[i].summary = n; localStorage.setItem("breakpoint", JSON.stringify(workouts)); renderHistory(); }
}

function editHistoryNote(wi, ei) {
    const n = prompt("Edit Note:", workouts[wi].exercises[ei].notes || "");
    if (n !== null) { workouts[wi].exercises[ei].notes = n; localStorage.setItem("breakpoint", JSON.stringify(workouts)); renderHistory(); }
}

// 7. SKILLS
function renderSkills() {
    renderSingleTree(plancheData, "planche-tree", "planche-bar", "planche-percent");
    renderSingleTree(handstandData, "handstand-tree", "handstand-bar", "handstand-percent");
}

function renderSingleTree(data, containerId, barId, textId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    let done = 0;
    container.innerHTML = data.map((skill, index) => {
        const isDone = skillStorage[skill.id];
        const isLocked = index > 0 && !skillStorage[data[index - 1].id];
        if (isDone) done++;
        return `<div class="skill-node ${isDone ? 'done' : ''} ${isLocked ? 'locked' : ''} ${skill.isBridge ? 'bridge-node' : ''}" onclick="toggleSkillNode('${skill.id}', ${isLocked}, '${containerId}')"><div class="node-info"><span>${skill.isBridge ? '→' : index + 1}</span><span class="node-name">${skill.name}</span></div><span>${isDone ? '✅' : (isLocked ? '🔒' : '🎯')}</span></div>`;
    }).join('');
    const pct = Math.round((done / data.length) * 100);
    document.getElementById(barId).style.width = pct + "%";
    document.getElementById(textId).textContent = pct + "%";
}

function toggleSkillNode(skillId, isLocked, containerId) {
    if (isLocked) return alert("Master previous step first!");
    skillStorage[skillId] = !skillStorage[skillId];
    if (!skillStorage[skillId]) {
        let currentData = containerId === "planche-tree" ? plancheData : handstandData;
        const start = currentData.findIndex(s => s.id === skillId);
        for (let i = start; i < currentData.length; i++) delete skillStorage[currentData[i].id];
    }
    localStorage.setItem("bp_skills_v3", JSON.stringify(skillStorage));
    renderSkills();
}

function exportData() {
    const blob = new Blob([JSON.stringify(localStorage)], {type: "application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "backup.json"; a.click();
}

// START
showPage('dashboard-page');