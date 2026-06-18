// 1. DATA LOADING
let workouts = JSON.parse(localStorage.getItem("breakpoint")) || [];
let skills = JSON.parse(localStorage.getItem("skills")) || {};
let customExercises = JSON.parse(localStorage.getItem("customExercises")) || ["Push-ups", "Pull-ups", "Dips"];
let warmupExercises = JSON.parse(localStorage.getItem("warmupExercises")) || ["Wrist Circles", "Shoulder Circles"];
let currentWorkout = [];

// 2. NAVIGATION
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    const target = document.getElementById(pageId);
    if (target) {
        target.style.display = "block";
    }
    if (pageId === 'history-page') renderHistory();
    if (pageId === 'dashboard-page') render();
    renderDropdowns();
}

// 3. DATABASE MANAGEMENT
function renderDropdowns() {
    const exSelect = document.getElementById("exercise-builder");
    const wuSelect = document.getElementById("warmup-builder");
    if (exSelect) {
        exSelect.innerHTML = customExercises.map(ex => `<option value="${ex}">${ex}</option>`).join('');
    }
    if (wuSelect) {
        wuSelect.innerHTML = warmupExercises.map(wu => `<option value="${wu}">${wu}</option>`).join('');
    }
}

function addNewExerciseToList() {
    const val = document.getElementById("new-exercise-name").value.trim();
    if (val && !customExercises.includes(val)) {
        customExercises.push(val);
        localStorage.setItem("customExercises", JSON.stringify(customExercises));
        document.getElementById("new-exercise-name").value = "";
        renderDropdowns();
    }
}

function addWarmupToWorkout() {
    const name = document.getElementById("warmup-builder").value;
    const repsInput = document.getElementById("warmup-reps");
    const setsInput = document.getElementById("warmup-sets");
    
    const reps = Number(repsInput.value);
    const setCount = Number(setsInput.value);

    if (!reps || !setCount) return alert("Enter reps and number of sets!");

    // Create an array with the exact number of sets specified
    // Example: 10 reps and 2 sets becomes [10, 10]
    const setsArray = Array(setCount).fill(reps);

    currentWorkout.push({ 
        exercise: name, 
        sets: setsArray, 
        isWarmup: true, 
        notes: "" 
    });

    renderCurrentWorkout();
    
    // Reset inputs
    repsInput.value = "";
    setsInput.value = "1"; // Default back to 1
}

function deleteExerciseFromList() {
    const val = document.getElementById("exercise-builder").value;
    if (confirm(`Remove ${val}?`)) {
        customExercises = customExercises.filter(e => e !== val);
        localStorage.setItem("customExercises", JSON.stringify(customExercises));
        renderDropdowns();
    }
}

// 4. WORKOUT LOGIC


function addExercise() {
    const name = document.getElementById("exercise-builder").value;
    const sets = [1,2,3,4].map(i => Number(document.getElementById(`set${i}`).value)).filter(s => s > 0);
    if (sets.length === 0) return alert("Enter sets!");
    
    currentWorkout.push({ 
        exercise: name, 
        sets: sets, 
        isWarmup: false, 
        notes: document.getElementById("workout-notes").value 
    });
    
    renderCurrentWorkout();
    [1,2,3,4].forEach(i => document.getElementById(`set${i}`).value = "");
    document.getElementById("workout-notes").value = "";
}

function renderCurrentWorkout() {
    let html = "";
    currentWorkout.forEach((item, i) => {
        html += `
        <div class="card" style="border-left: 4px solid ${item.isWarmup ? '#ff9800' : '#2196F3'}; margin-bottom: 5px;">
            <strong>${item.exercise}</strong> (${item.sets.join("/")})
            <button onclick="currentWorkout.splice(${i},1); renderCurrentWorkout();" style="float:right; background:none; border:none; color:white; cursor:pointer;">❌</button>
            ${item.notes ? `<br><small style="color: #888;">📝 ${item.notes}</small>` : ""}
        </div>`;
    });
    document.getElementById("current-workout").innerHTML = html;
}

function saveFullWorkout() {
    if (currentWorkout.length === 0) return;

    const summaryElement = document.getElementById("session-summary");
    const fatigueElement = document.getElementById("fatigue-slider");
    
    const summaryText = summaryElement ? summaryElement.value.trim() : "";
    const fatigueScore = fatigueElement ? Number(fatigueElement.value) : 5;

    workouts.push({ 
        date: new Date().toLocaleDateString(), 
        exercises: [...currentWorkout],
        summary: summaryText,
        fatigue: fatigueScore // NEW PROPERTY
    });

    localStorage.setItem("breakpoint", JSON.stringify(workouts));
    
    currentWorkout = [];
    if (summaryElement) summaryElement.value = ""; 
    if (fatigueElement) fatigueElement.value = "5"; // Reset to middle
    
    renderCurrentWorkout();
    showPage('dashboard-page');
}

// 5. STREAK & STATS
function calculateStreak() {
    if (workouts.length === 0) return 0;
    const dates = [...new Set(workouts.map(w => w.date))].map(d => new Date(d)).sort((a,b) => b-a);
    let streak = 0; let today = new Date(); today.setHours(0,0,0,0);
    if (Math.floor((today - dates[0])/86400000) > 1) return 0;
    for (let i=0; i<dates.length; i++) {
        if (i===0 || (dates[i-1]-dates[i])/86400000 === 1) streak++; else break;
    }
    return streak;
}

function render() {
    document.getElementById("total-workouts").textContent = workouts.length;
    document.getElementById("streak").textContent = calculateStreak() + " Days";

    // --- FATIGUE TRACKER LOGIC ---
    const statusCard = document.getElementById("prs"); // We can repurpose or add a new div
    if (workouts.length > 0) {
        const lastWorkout = workouts[workouts.length - 1];
        const f = lastWorkout.fatigue || 5;
        
        let statusText = "";
        let statusColor = "";

        if (f <= 4) { statusText = "Ready for Intensity ⚡"; statusColor = "#4CAF50"; }
        else if (f <= 7) { statusText = "Proceed with Caution ⚠️"; statusColor = "#ff9800"; }
        else { statusText = "High Fatigue: Consider Rest 😴"; statusColor = "#f44336"; }

        // Inject a "Recovery Status" box at the top of the PRs card or a new one
        statusCard.innerHTML = `
            <div style="padding: 10px; border-radius: 5px; background: ${statusColor}22; border: 1px solid ${statusColor}; text-align: center; margin-bottom: 15px;">
                <small style="color: ${statusColor}; font-weight: bold;">RECOVERY STATUS</small>
                <div style="font-size: 1.1rem; color: white;">${statusText}</div>
            </div>
            <h4>Personal Records</h4>
            <!-- Your existing PR code here -->
        `;
    }
}

function renderHistory() {
    let html = [...workouts].reverse().map((w, reversedIndex) => {
        const originalIndex = workouts.length - 1 - reversedIndex;

        return `
        <div class="card">
            <h3>📅 ${w.date} 
                <button onclick="deleteWorkout(${originalIndex})" style="float:right; background:red; color:white; border:none; padding:2px 5px; font-size:10px;">Delete</button>
            </h3>
            
            ${w.exercises.map((ex, exIndex) => `
                <div style="margin-bottom: 8px;">
                    <strong>${ex.exercise}</strong>: ${ex.sets.join("/")}
                    ${ex.notes ? `<br><small style="color: #aaa;">📝 ${ex.notes} <a href="#" onclick="editHistoryNote(${originalIndex}, ${exIndex})" style="color: #e94560; text-decoration: none;">[Edit]</a></small>` : `<br><small><a href="#" onclick="editHistoryNote(${originalIndex}, ${exIndex})" style="color: #666; text-decoration: none;">+ Add Note</a></small>`}
                </div>
            `).join('')}

            <div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #333;">
                <small style="color: #ffeb3b; font-style: italic;">
                    Summary: <span id="summary-${originalIndex}">${w.summary || "No summary added."}</span>
                    <a href="#" onclick="editWorkoutSummary(${originalIndex})" style="color: #e94560; text-decoration: none; margin-left: 10px;">[Edit]</a>
                </small>
<div style="margin-top: 5px;">
    <small style="color: #888;">
        Exertion: <span style="color: #ffeb3b;">${w.fatigue || 5}/10</span>
    </small>
</div>
            </div>
        </div>
        `;
    }).join('') || "No history.";
    document.getElementById("workout-history-list").innerHTML = html;
}

function editWorkoutSummary(index) {
    const currentSummary = workouts[index].summary || "";
    const newSummary = prompt("Edit Session Summary:", currentSummary);
    if (newSummary !== null) {
        workouts[index].summary = newSummary;
        localStorage.setItem("breakpoint", JSON.stringify(workouts));
        renderHistory();
        render();
    }
}

function editHistoryNote(workoutIndex, exIndex) {
    const currentNote = workouts[workoutIndex].exercises[exIndex].notes || "";
    const newNote = prompt("Edit Exercise Note:", currentNote);
    if (newNote !== null) {
        workouts[workoutIndex].exercises[exIndex].notes = newNote;
        localStorage.setItem("breakpoint", JSON.stringify(workouts));
        renderHistory();
        render();
    }
}

function deleteWorkout(i) {
    if (confirm("Delete workout?")) {
        workouts.splice(i, 1);
        localStorage.setItem("breakpoint", JSON.stringify(workouts));
        renderHistory();
        render();
    }
}

function exportData() {
    const blob = new Blob([JSON.stringify(localStorage)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "breakpoint_backup.json";
    a.click();
}

// 6. INITIALIZE
showPage('dashboard-page');