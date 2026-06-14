// 1. DATA LOADING
let workouts = JSON.parse(localStorage.getItem("breakpoint")) || [];
let skills = JSON.parse(localStorage.getItem("skills")) || {};
let handstandSkills = JSON.parse(localStorage.getItem("handstandSkills")) || {};
let frontLeverSkills = JSON.parse(localStorage.getItem("frontLeverSkills")) || {};
let customExercises = JSON.parse(localStorage.getItem("customExercises")) || ["Push-ups", "Pull-ups", "Dips"];
let warmupExercises = JSON.parse(localStorage.getItem("warmupExercises")) || ["Wrist Circles", "Shoulder Dislocates"];
let currentWorkout = [];

// 2. NAVIGATION (Safe Version)
function showPage(pageId) {
    const pages = document.querySelectorAll(".page");
    const targetPage = document.getElementById(pageId);

    if (!targetPage) {
        console.error("Page ID not found:", pageId);
        return;
    }

    pages.forEach(page => {
        page.classList.remove("active");
        page.style.display = "none";
    });

    targetPage.classList.add("active");
    targetPage.style.display = "block";

    if (pageId === 'history-page') renderHistory();
    if (pageId === 'dashboard-page') render();
    renderDropdowns();
}

// 3. DATABASE MANAGEMENT
function renderDropdowns() {
    const exSelect = document.getElementById("exercise-builder");
    const wuSelect = document.getElementById("warmup-builder");
    if (exSelect) {
        exSelect.innerHTML = "";
        customExercises.forEach(ex => {
            const opt = document.createElement("option");
            opt.value = opt.textContent = ex;
            exSelect.appendChild(opt);
        });
    }
    if (wuSelect) {
        wuSelect.innerHTML = "";
        warmupExercises.forEach(wu => {
            const opt = document.createElement("option");
            opt.value = opt.textContent = wu;
            wuSelect.appendChild(opt);
        });
    }
}

function addNewWarmupToList() {
    const name = document.getElementById("new-warmup-name").value.trim();
    if (name && !warmupExercises.includes(name)) {
        warmupExercises.push(name);
        localStorage.setItem("warmupExercises", JSON.stringify(warmupExercises));
        document.getElementById("new-warmup-name").value = "";
        renderDropdowns();
    }
}

function addNewExerciseToList() {
    const name = document.getElementById("new-exercise-name").value.trim();
    if (name && !customExercises.includes(name)) {
        customExercises.push(name);
        localStorage.setItem("customExercises", JSON.stringify(customExercises));
        document.getElementById("new-exercise-name").value = "";
        renderDropdowns();
    }
}

function deleteExerciseFromList() {
    const name = document.getElementById("exercise-builder").value;
    if (name && confirm(`Delete ${name}?`)) {
        customExercises = customExercises.filter(ex => ex !== name);
        localStorage.setItem("customExercises", JSON.stringify(customExercises));
        renderDropdowns();
    }
}

// 4. WORKOUT BUILDER
function addWarmupToWorkout() {
    const exercise = document.getElementById("warmup-builder").value;
    const reps = Number(document.getElementById("warmup-reps").value);
    if (!reps) return;
    currentWorkout.push({ exercise, sets: [reps, reps, reps], isWarmup: true });
    renderCurrentWorkout();
    document.getElementById("warmup-reps").value = "";
}

function addExercise() {
    const exercise = document.getElementById("exercise-builder").value;
    const sets = [
        Number(document.getElementById("set1").value),
        Number(document.getElementById("set2").value),
        Number(document.getElementById("set3").value),
        Number(document.getElementById("set4").value)
    ].filter(s => s > 0);
    if (sets.length === 0) return;
    currentWorkout.push({ 
        exercise, 
        sets, 
        isWarmup: false, 
        notes: document.getElementById("workout-notes").value 
    });
    renderCurrentWorkout();
    ["set1", "set2", "set3", "set4", "workout-notes"].forEach(id => document.getElementById(id).value = "");
}

function renderCurrentWorkout() {
    let html = "";
    currentWorkout.forEach((item, index) => {
        html += `<div class="workout-entry" style="border-left:4px solid ${item.isWarmup ? '#ff9800' : '#2196F3'}">
            <strong>${item.exercise}</strong> (${item.sets.join("/")})
            <button onclick="removeExercise(${index})">❌</button>
        </div>`;
    });
    document.getElementById("current-workout").innerHTML = html;
}

function removeExercise(i) { currentWorkout.splice(i, 1); renderCurrentWorkout(); }

function saveFullWorkout() {
    if (currentWorkout.length === 0) return;
    workouts.push({ date: new Date().toLocaleDateString(), exercises: [...currentWorkout] });
    localStorage.setItem("breakpoint", JSON.stringify(workouts));
    currentWorkout = [];
    renderCurrentWorkout();
    showPage('dashboard-page');
}

// 5. STATS & HISTORY
function calculateStreak() {
    if (workouts.length === 0) return 0;
    const dates = [...new Set(workouts.map(w => w.date))].map(d => new Date(d)).sort((a,b) => b-a);
    let streak = 0;
    let today = new Date(); today.setHours(0,0,0,0);
    if (Math.floor((today - dates[0])/86400000) > 1) return 0;
    for (let i=0; i<dates.length; i++) {
        if (i===0 || (dates[i-1]-dates[i])/86400000 === 1) streak++; else break;
    }
    return streak;
}

function render() {
    document.getElementById("total-workouts").textContent = workouts.length;
    document.getElementById("streak").textContent = calculateStreak() + " Days";
    const prs = {};
    workouts.forEach(w => w.exercises.forEach(ex => {
        if (ex.isWarmup) return;
        const best = Math.max(...ex.sets);
        if (!prs[ex.exercise] || best > prs[ex.exercise]) prs[ex.exercise] = best;
    }));
    let prHTML = "";
    Object.entries(prs).forEach(([ex, val]) => prHTML += `<div>🏆 ${ex}: ${val}</div>`);
    document.getElementById("prs").innerHTML = prHTML;
}

function renderHistory() {
    let html = "";
    [...workouts].reverse().forEach((w, i) => {
        html += `<div class="card"><h3>${w.date}</h3>`;
        w.exercises.forEach(ex => html += `<div>${ex.exercise}: ${ex.sets.join("/")}</div>`);
        html += `<button onclick="deleteWorkout(${workouts.length-1-i})" class="delete-btn">Delete</button></div>`;
    });
    document.getElementById("workout-history-list").innerHTML = html || "No history yet.";
}

function deleteWorkout(i) { workouts.splice(i,1); localStorage.setItem("breakpoint", JSON.stringify(workouts)); renderHistory(); render(); }

// 6. SKILLS
function renderSkillCategory(selector, storageObj, progressId, textId) {
    const buttons = [...document.querySelectorAll(selector)];
    let done = 0;
    buttons.forEach((btn, i) => {
        const name = btn.textContent.replace("✓ ", "").replace("🔒 ", "").trim();
        btn.classList.remove("skill-complete", "skill-locked");
        if (storageObj[name]) { btn.classList.add("skill-complete"); btn.innerHTML = "✓ " + name; done++; }
        else if (i > 0 && !storageObj[buttons[i-1].textContent.replace("✓ ", "").replace("🔒 ", "").trim()]) {
            btn.classList.add("skill-locked"); btn.innerHTML = "🔒 " + name;
        } else btn.innerHTML = name;
    });
    const pct = Math.round((done/buttons.length)*100) || 0;
    document.getElementById(progressId).style.width = pct + "%";
    document.getElementById(textId).textContent = pct + "%";
}
function renderSkills() { 
    renderSkillCategory(".skill-btn", skills, "planche-progress-bar", "planche-progress-text");
    renderSkillCategory(".handstand-btn", handstandSkills, "handstand-progress-bar", "handstand-progress-text");
    renderSkillCategory(".frontlever-btn", frontLeverSkills, "frontlever-progress-bar", "frontlever-progress-text");
}
function toggleSkillGeneric(btn, obj, key, sel, ren) {
    const name = btn.textContent.replace("✓ ", "").replace("🔒 ", "").trim();
    obj[name] = !obj[name]; localStorage.setItem(key, JSON.stringify(obj)); ren(); render();
}
function toggleSkill(b) { toggleSkillGeneric(b, skills, "skills", ".skill-btn", renderSkills); }
function toggleHandstand(b) { toggleSkillGeneric(b, handstandSkills, "handstandSkills", ".handstand-btn", renderSkills); }
function toggleFrontLever(b) { toggleSkillGeneric(b, frontLeverSkills, "frontLeverSkills", ".frontlever-btn", renderSkills); }

// 7. BACKUP
function exportData() {
    const data = JSON.stringify(localStorage);
    const blob = new Blob([data], {type: "application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "backup.json"; a.click();
}
function importData(e) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const data = JSON.parse(event.target.result);
        Object.keys(data).forEach(k => localStorage.setItem(k, data[k]));
        location.reload();
    };
    reader.readAsText(e.target.files[0]);
}

// INIT
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
showPage('dashboard-page');
renderSkills();
