// ==========================================
// 1. DATA & STORAGE
// ==========================================
let workouts = JSON.parse(localStorage.getItem("breakpoint")) || [];
let skillStorage = JSON.parse(localStorage.getItem("bp_skills_v3")) || {};
let customExercises = JSON.parse(localStorage.getItem("customExercises")) || ["Push-ups", "Pull-ups", "Dips"];
let warmupExercises = JSON.parse(localStorage.getItem("warmupExercises")) || ["Wrist Circles", "Shoulder Circles"];
let routines = JSON.parse(localStorage.getItem("bp_routines")) || [];
let currentWorkout = [];
let restTimerInterval;

// ==========================================
// 2. SKILL DATA DEFINITIONS
// ==========================================
const plancheData = [{ id: "p1", name: "Planche lean", isBridge: false }, { id: "p2", name: "Tuck", isBridge: false }, { id: "p3", name: "Half tuck", isBridge: true }, { id: "p4", name: "Adv tuck", isBridge: false }, { id: "p5", name: "Frog stand w/ raised legs", isBridge: true }, { id: "p6", name: "Piked planche", isBridge: false }, { id: "p7", name: "Half Piked planche", isBridge: true }, { id: "p8", name: "Straddle", isBridge: false }, { id: "p9", name: "Full", isBridge: false }];
const handstandData = [{ id: "h1", name: "Wall Handstand (30s)", isBridge: false }, { id: "h2", name: "Pike Push-ups", isBridge: true }, { id: "h3", name: "Chest-to-Wall HS (20s)", isBridge: false }, { id: "h4", name: "Kick-up Balance practice", isBridge: true }, { id: "h5", name: "Freestanding HS (5s)", isBridge: false }, { id: "h6", name: "Wall HS Push-ups", isBridge: true }, { id: "h7", name: "Solid 10s Handstand", isBridge: false }, { id: "h8", name: "Freestanding HSPU", isBridge: false }];
const leverData = [{ id: "l1", name: "Scapula Pull-ups", isBridge: false }, { id: "l2", name: "Tuck Lever Hold", isBridge: false }, { id: "l3", name: "Tuck Lever Pull-ups", isBridge: true }, { id: "l4", name: "Adv. Tuck Lever", isBridge: false }, { id: "l5", name: "Straddle Lever Lean", isBridge: true }, { id: "l6", name: "One Leg Lever", isBridge: true }, { id: "l7", name: "Straddle Lever", isBridge: false }, { id: "l8", name: "Full Front Lever", isBridge: false }];

// ==========================================
// 3. NAVIGATION
// ==========================================
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const target = document.getElementById(pageId);
    if (target) target.style.display = "block";

    if (pageId === 'dashboard-page') render();
    if (pageId === 'workout-page') renderDropdowns();
    if (pageId === 'skills-page') renderSkills();
    if (pageId === 'history-page') renderHistory();
    if (pageId === 'routines-page') renderRoutines();
}

// ==========================================
// 4. REST TIMER
// ==========================================
function startRestTimer(seconds) {
    clearInterval(restTimerInterval);
    let timeLeft = seconds;
    const display = document.getElementById("timer-display");
    const label = document.getElementById("timer-label");
    label.textContent = "⌛ RESTING...";
    const update = (s) => {
        const mins = Math.floor(s / 60); const secs = s % 60;
        display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    update(timeLeft);
    restTimerInterval = setInterval(() => {
        timeLeft--; update(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(restTimerInterval);
            label.textContent = "🔥 READY!";
            if (navigator.vibrate) navigator.vibrate([500, 200, 500]);
        }
    }, 1000);
}
function stopRestTimer() { clearInterval(restTimerInterval); document.getElementById("timer-display").textContent = "00:00"; }

// ==========================================
// 5. ROUTINES (TEMPLATES)
// ==========================================
function saveAsRoutine() {
    const name = document.getElementById("routine-name").value.trim();
    if (!name || currentWorkout.length === 0) return alert("Add exercises and a name first!");
    routines.push({ name, exercises: JSON.parse(JSON.stringify(currentWorkout)) });
    localStorage.setItem("bp_routines", JSON.stringify(routines));
    document.getElementById("routine-name").value = "";
    alert("Routine Saved!");
}
function renderRoutines() {
    const list = document.getElementById("routines-list");
    if (!list) return;
    if (routines.length === 0) { list.innerHTML = "<div class='card' style='text-align:center;'>No templates saved.</div>"; return; }
    list.innerHTML = routines.map((r, i) => `
        <div class="card" style="border-left:4px solid #ffeb3b;">
            <div style="display:flex; justify-content:space-between;"><h3>${r.name}</h3> <button onclick="deleteRoutine(${i})" style="width:auto; background:red;">X</button></div>
            <p style="font-size:0.8rem; color:#888; margin:10px 0;">${r.exercises.map(ex => ex.exercise).join(", ")}</p>
            <button onclick="loadRoutine(${i})" style="background:#e94560; color:white;">⚡ Load Template</button>
        </div>`).join('');
}
function loadRoutine(i) { currentWorkout = JSON.parse(JSON.stringify(routines[i].exercises)); showPage('workout-page'); renderCurrentWorkout(); }
function deleteRoutine(i) { if(confirm("Delete routine?")) { routines.splice(i,1); localStorage.setItem("bp_routines", JSON.stringify(routines)); renderRoutines(); }}

// ==========================================
// 6. WORKOUT BUILDER & DATABASE
// ==========================================
function renderDropdowns() {
    const ex = document.getElementById("exercise-builder"); const wu = document.getElementById("warmup-builder");
    if (ex) ex.innerHTML = customExercises.map(e => `<option value="${e}">${e}</option>`).join('');
    if (wu) wu.innerHTML = warmupExercises.map(e => `<option value="${e}">${e}</option>`).join('');
}
function addNewExerciseToList() { const n = document.getElementById("new-exercise-name").value.trim(); if(n){ customExercises.push(n); localStorage.setItem("customExercises", JSON.stringify(customExercises)); document.getElementById("new-exercise-name").value=""; renderDropdowns(); }}
function addNewWarmupToList() { const n = document.getElementById("new-warmup-name").value.trim(); if(n){ warmupExercises.push(n); localStorage.setItem("warmupExercises", JSON.stringify(warmupExercises)); document.getElementById("new-warmup-name").value=""; renderDropdowns(); }}
function deleteExerciseFromList() { const v = document.getElementById("exercise-builder").value; customExercises = customExercises.filter(e => e!==v); localStorage.setItem("customExercises", JSON.stringify(customExercises)); renderDropdowns(); }
function deleteWarmupFromList() { const v = document.getElementById("warmup-builder").value; warmupExercises = warmupExercises.filter(e => e!==v); localStorage.setItem("warmupExercises", JSON.stringify(warmupExercises)); renderDropdowns(); }

function addWarmupToWorkout() {
    const n = document.getElementById("warmup-builder").value; const r = Number(document.getElementById("warmup-reps").value); const s = Number(document.getElementById("warmup-sets").value);
    if(r && s >= 1){ currentWorkout.push({ exercise: n, sets: Array(s).fill(r), isWarmup: true }); renderCurrentWorkout(); }
}
function addExercise() {
    const n = document.getElementById("exercise-builder").value; const h = document.getElementById("is-hold").checked; const s = [1,2,3,4].map(i => Number(document.getElementById(`set${i}`).value)).filter(v => v > 0);
    if(s.length > 0){ currentWorkout.push({ exercise: n, sets: s, isWarmup: false, isHold: h, notes: document.getElementById("workout-notes").value }); renderCurrentWorkout(); }
}
function renderCurrentWorkout() {
    document.getElementById("current-workout").innerHTML = currentWorkout.map((item, i) => `<div class="card" style="border-left: 4px solid ${item.isWarmup ? '#ff9800' : '#2196F3'}"><strong>${item.exercise}</strong> (${item.isHold ? item.sets.map(s=>s+'s').join("/") : item.sets.join("/")}) <button onclick="currentWorkout.splice(${i},1); renderCurrentWorkout();" style="float:right; background:none; border:none; color:white;">❌</button></div>`).join('');
}
function saveFullWorkout() {
    if (currentWorkout.length === 0) return;
    workouts.push({ date: new Date().toLocaleDateString(), exercises: [...currentWorkout], summary: document.getElementById("session-summary").value, preFatigue: Number(document.getElementById("pre-fatigue-slider").value), fatigue: Number(document.getElementById("fatigue-slider").value) });
    localStorage.setItem("breakpoint", JSON.stringify(workouts));
    currentWorkout = []; showPage('dashboard-page');
}

// ==========================================
// 7. DASHBOARD LOGIC (RINGS + GRAPH + PRs)
// ==========================================
function calculateStreak() {
    if (workouts.length === 0) return 0;
    const dates = [...new Set(workouts.map(w => w.date))].map(d => new Date(d)).sort((a,b) => b-a);
    let streak = 0; let today = new Date(); today.setHours(0,0,0,0);
    if (dates.length > 0 && Math.floor((today - dates[0])/86400000) <= 1) {
        for (let i=0; i<dates.length; i++) { if (i===0 || (dates[i-1]-dates[i])/86400000 === 1) streak++; else break; }
    }
    return streak;
}

function render() {
    const totalEl = document.getElementById("total-workouts");
    const streakEl = document.getElementById("streak");
    const info = document.getElementById("prs"); 
    if (totalEl) totalEl.textContent = workouts.length;
    if (streakEl) streakEl.textContent = calculateStreak() + " Days";
    if (!info) return;

    let html = "";
    if (workouts.length === 0) {
        info.innerHTML = `<div class='card' style='text-align:center; padding:50px 20px;'>
            <h1 style='font-size:3rem;'>🚀</h1>
            <h2>Welcome, Athlete</h2>
            <p style='color:#888;'>Your journey to mastery starts with your first log.</p>
        </div>`;
        return;
    }

    const last = workouts[workouts.length - 1];
    const pre = last.preFatigue || 5;
    const post = last.fatigue || 5;

    // --- DYNAMIC MOTIVATION ---
    let motivationalText = "";
    let badgeHTML = "";
    if (pre >= 8) {
        motivationalText = "Body is primed. Today is the day to push boundaries. 🦾";
        badgeHTML = `<span class="badge" style="background:${"#4CAF50"}22; color:#4CAF50; border:1px solid #4CAF50;">ELITE READINESS</span>`;
    } else if (pre >= 5) {
        motivationalText = "Consistency is key. Focus on high-quality movement. 🎯";
        badgeHTML = `<span class="badge" style="background:${"#ffeb3b"}22; color:#ffeb3b; border:1px solid #ffeb3b;">STEADY PROGRESS</span>`;
    } else {
        motivationalText = "Recovery is training too. Listen to your joints today. 🧘";
        badgeHTML = `<span class="badge" style="background:${"#e94560"}22; color:#e94560; border:1px solid #e94560;">RECOVERY MODE</span>`;
    }

    // Readiness Rings
    const createRing = (score, label, color) => {
        const r = 35; const c = 2 * Math.PI * r; const o = c - (score/10)*c;
        return `<div style="text-align:center;"><div style="position:relative; width:85px; height:85px; margin:0 auto;"><svg style="width:85px; height:85px; transform:rotate(-90deg);"><circle cx="42" cy="42" r="${r}" fill="none" stroke="#222" stroke-width="6"></circle><circle cx="42" cy="42" r="${r}" fill="none" stroke="${color}" stroke-width="6" stroke-dasharray="${c}" stroke-dashoffset="${o}" stroke-linecap="round" style="filter: drop-shadow(0 0 5px ${color});"></circle></svg><div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-weight:900; font-size:1.4rem;">${score}</div></div><div style="font-size:10px; color:#888; margin-top:8px; font-weight:bold; letter-spacing:1px;">${label}</div></div>`;
    };

    // Volume Graph Logic
    const last7 = []; const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for(let i=6; i>=0; i--) { const d = new Date(); d.setDate(d.getDate() - i); last7.push({ ds: d.toLocaleDateString(), lb: dayNames[d.getDay()] }); }
    const vol = last7.map(day => { let sets = 0; workouts.filter(w => w.date === day.ds).forEach(w => w.exercises.forEach(ex => sets += (ex.sets || []).length)); return sets; });
    const maxV = Math.max(...vol, 5);
    const graphHTML = vol.map((v, i) => `
        <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
            <div style="font-size:9px; color:#ffeb3b; font-weight:bold; margin-bottom:4px;">${v > 0 ? v : ''}</div>
            <div class="chart-bar" style="width:20px; height:${(v/maxV)*70}px; min-height:3px;"></div>
            <div style="font-size:9px; margin-top:8px; color:#555; font-weight:bold;">${last7[i].lb}</div>
        </div>`).join('');

    // --- CONSTRUCT DASHBOARD ---
    html += `
        <div class="card" style="text-align:center;">
            ${badgeHTML}
            <div style="display:flex; justify-content:space-around; margin:10px 0;">
                ${createRing(pre, "FRESHNESS", "#4CAF50")}
                ${createRing(post, "EFFORT", "#e94560")}
            </div>
            <p style="font-size:0.85rem; color:#ccc; font-style:italic; margin-top:15px; border-top:1px solid #222; padding-top:15px;">"${motivationalText}"</p>
        </div>`;

    html += `
        <div class="card">
            <h4 style="margin-bottom:20px; color:#888; font-size:0.7rem;">WEEKLY VOLUME</h4>
            <div style="display:flex; align-items:flex-end; height:100px;">${graphHTML}</div>
        </div>`;

    html += `
        <div class="card" style="border-left: 5px solid var(--accent);">
            <h4 style="margin-bottom:15px; font-size:0.7rem; color:#888;">LATEST HIGHLIGHTS</h4>
            ${last.exercises.slice(0,3).map(ex => `<div style="margin-bottom:5px;"><strong>${ex.exercise}</strong> <span style="color:var(--accent); float:right;">${ex.sets.length} SETS</span></div>`).join('')}
        </div>`;

    // Records
    const allPrs = {};
    workouts.forEach(w => (w.exercises || []).forEach(ex => { if (!ex.isWarmup) { const best = Math.max(...(ex.sets || [0])); if (!allPrs[ex.exercise] || best > allPrs[ex.exercise].v) allPrs[ex.exercise] = { v: best, h: ex.isHold }; } }));
    let prsHTML = Object.entries(allPrs).map(([n, d]) => `
        <div style="display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #222;">
            <span style="font-weight:700; color:#eee; font-size:0.9rem;">${n}</span>
            <span style="color:#ffeb3b; font-weight:900;">🏆 ${d.v}${d.h ? 's' : ''}</span>
        </div>`).join('');

    html += `<div class="card">
        <h4 style="margin-bottom:10px; font-size:0.7rem; color:#888;">HALL OF FAME</h4>
        ${prsHTML || 'Log more sessions!'}
    </div>`;
    
    info.innerHTML = html;
}

// ==========================================
// 8. HISTORY LOGIC
// ==========================================
function renderHistory() {
    const list = document.getElementById("workout-history-list");
    if (!list) return;
    let html = [...workouts].reverse().map((w, reversedIndex) => {
        const originalIndex = workouts.length - 1 - reversedIndex;
        const exList = (w.exercises || []).map((ex, exIndex) => `<div style="margin-bottom:8px;"><strong>${ex.exercise}</strong>: ${(ex.sets||[]).join(" / ")}${ex.isHold?'s':''}<br><small style="color:#888;">📝 ${ex.notes || ""} <a href="#" onclick="editHistoryNote(${originalIndex}, ${exIndex})" style="color:#e94560; text-decoration:none;">[Edit]</a></small></div>`).join('');
        return `
        <div class="card">
            <h3>📅 ${w.date} <button onclick="deleteWorkout(${originalIndex})" style="float:right; background:red; border:none; color:white; padding:2px 5px; font-size:10px;">Delete</button></h3>
            ${exList}
            <div style="margin-top:10px; border-top:1px solid #333; padding-top:5px; font-style:italic; font-size:0.85rem; color:#ffeb3b;">Summary: ${w.summary || "None"} <a href="#" onclick="editWorkoutSummary(${originalIndex})" style="color:#e94560; text-decoration:none;">[Edit]</a></div>
            <div style="margin-top:5px; color:#888; font-size:0.7rem;">Freshness: ${w.preFatigue||'?'}/10 | Effort: ${w.fatigue||'?'}/10</div>
        </div>`;
    }).join('') || "No history yet.";
    list.innerHTML = html;
}
function deleteWorkout(i) { if (confirm("Delete?")) { workouts.splice(i, 1); localStorage.setItem("breakpoint", JSON.stringify(workouts)); renderHistory(); render(); }}
function editWorkoutSummary(i) { const n = prompt("Edit Summary:", workouts[i].summary); if (n !== null) { workouts[i].summary = n; localStorage.setItem("breakpoint", JSON.stringify(workouts)); renderHistory(); }}
function editHistoryNote(wi, ei) { const n = prompt("Edit Note:", workouts[wi].exercises[ei].notes); if (n !== null) { workouts[wi].exercises[ei].notes = n; localStorage.setItem("breakpoint", JSON.stringify(workouts)); renderHistory(); }}

// ==========================================
// 9. SKILLS LOGIC
// ==========================================
function renderSkills() {
    const renderT = (data, cont, bar, txt) => {
        const c = document.getElementById(cont); if (!c) return; let done = 0;
        c.innerHTML = data.map((s, i) => { const isD = skillStorage[s.id]; const isL = i > 0 && !skillStorage[data[i - 1].id]; if (isD) done++; return `<div class="skill-node ${isD ? 'done' : ''} ${isL ? 'locked' : ''} ${s.isBridge ? 'bridge-node' : ''}" onclick="toggleSkillNode('${s.id}', ${isL}, '${cont}')"><span>${s.name}</span><span>${isD ? '✅' : (isL ? '🔒' : '🎯')}</span></div>`; }).join('');
        const p = Math.round((done / data.length) * 100); document.getElementById(bar).style.width = p + "%"; document.getElementById(txt).textContent = p + "%";
    };
    renderT(plancheData, "planche-tree", "planche-bar", "planche-percent");
    renderT(handstandData, "handstand-tree", "handstand-bar", "handstand-percent");
    renderT(leverData, "lever-tree", "lever-bar", "lever-percent");
}
function toggleSkillNode(id, locked, cont) {
    if (locked) return alert("Master previous step first!"); skillStorage[id] = !skillStorage[id];
    if (!skillStorage[id]) { let cur = cont === "planche-tree" ? plancheData : (cont === "lever-tree" ? leverData : handstandData); let start = cur.findIndex(s => s.id === id); for (let i = start; i < cur.length; i++) delete skillStorage[cur[i].id]; }
    localStorage.setItem("bp_skills_v3", JSON.stringify(skillStorage)); renderSkills();
}

function exportData() { const b = new Blob([JSON.stringify(localStorage)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "backup.json"; a.click(); }

// 10. START
showPage('dashboard-page');