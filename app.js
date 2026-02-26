// Firebase Configuration
// TODO: Replace with your Firebase config from Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyCaMwpnNeoxmHMObSLaGEiu_3EYUZck9u8",
    authDomain: "devsparkers.firebaseapp.com",
    projectId: "devsparkers",
    storageBucket: "devsparkers.firebasestorage.app",
    messagingSenderId: "909869667719",
    appId: "1:909869667719:web:685830c766e288f9526f22",
    measurementId: "G-9XTE8CEJ49"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// State Management
let state = {
    user: "Student",
    email: "",
    coins: 0,
    studyMinutes: 0,
    treeLevel: 1,
    tasks: [],
    isTimerRunning: false,
    timerSeconds: 1500, // 25 mins
    gamesUnlocked: false,
    streak: 0,
    lastStudyDate: null,
    profilePic: ""
};

let isSignUpMode = false;
let currentUser = null;

// Auth Mode Toggle
function toggleAuthMode() {
    isSignUpMode = !isSignUpMode;
    const btn = document.getElementById('auth-btn');
    const toggle = document.getElementById('auth-toggle');
    if (isSignUpMode) {
        btn.innerText = "Create Account";
        toggle.innerText = "Already have an account? Sign in";
    } else {
        btn.innerText = "Enter Space";
        toggle.innerText = "New here? Create account";
    }
    document.getElementById('auth-error').style.display = 'none';
}

// Auth Handler
async function handleAuth() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('auth-error');

    if (!email || !password) {
        errorDiv.innerText = "Please enter email and password";
        errorDiv.style.display = 'block';
        return;
    }

    try {
        if (isSignUpMode) {
            // Sign up
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            currentUser = userCredential.user;
            state.email = email;
            state.user = email.split('@')[0];
            
            // Create user document in Firestore
            await db.collection('users').doc(currentUser.uid).set({
                email: email,
                displayName: state.user,
                coins: 0,
                studyMinutes: 0,
                treeLevel: 1,
                tasks: [],
                gamesUnlocked: false,
                streak: 0,
                lastStudyDate: null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                profilePic: `https://api.dicebear.com/7.x/avataaars/svg?seed=${state.user}`
            });
        } else {
            // Sign in
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            currentUser = userCredential.user;
        }
        
        // Load user data
        await loadUserData();
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
        updateUI();
    } catch (error) {
        errorDiv.innerText = error.message;
        errorDiv.style.display = 'block';
    }
}

// Load user data from Firestore
async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            state.user = data.displayName || data.email.split('@')[0];
            state.email = data.email;
            state.coins = data.coins || 0;
            state.studyMinutes = data.studyMinutes || 0;
            state.treeLevel = data.treeLevel || 1;
            state.tasks = data.tasks || [];
            state.gamesUnlocked = data.gamesUnlocked || false;
            state.streak = data.streak || 0;
            state.lastStudyDate = data.lastStudyDate ? data.lastStudyDate.toDate() : null;
            state.profilePic = data.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${state.user}`;
            
            // Update UI elements
            document.getElementById('user-name-tag').innerText = state.user;
            document.getElementById('edit-name').value = state.user;
            document.getElementById('edit-email').value = state.email;
            document.getElementById('profile-pic').src = state.profilePic;
            
            // Check and update streak
            updateStreak();
            renderTasks();
        }
    } catch (error) {
        console.error("Error loading user data:", error);
    }
}

// Save user data to Firestore
async function saveToFirestore() {
    if (!currentUser) return;
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            displayName: state.user,
            coins: state.coins,
            studyMinutes: state.studyMinutes,
            treeLevel: state.treeLevel,
            tasks: state.tasks,
            gamesUnlocked: state.gamesUnlocked,
            streak: state.streak,
            lastStudyDate: state.lastStudyDate ? firebase.firestore.Timestamp.fromDate(state.lastStudyDate) : null,
            profilePic: state.profilePic,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (error) {
        console.error("Error saving to Firestore:", error);
    }
}

// Streak Management
function updateStreak() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (!state.lastStudyDate) {
        // First time studying
        state.streak = 1;
        state.lastStudyDate = today;
        saveToFirestore();
        return;
    }
    
    const lastDate = new Date(state.lastStudyDate);
    lastDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
        // Already studied today, no change
        return;
    } else if (daysDiff === 1) {
        // Consecutive day
        state.streak += 1;
        state.lastStudyDate = today;
    } else {
        // Streak broken
        state.streak = 1;
        state.lastStudyDate = today;
    }
    saveToFirestore();
}

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        await loadUserData();
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
    } else {
        currentUser = null;
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
    }
});

// Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// UI Updates
function updateUI() {
    document.getElementById('coin-display').innerHTML = `<i class="fas fa-coins"></i> ${state.coins}`;
    document.getElementById('total-study-time').innerText = `${state.studyMinutes} mins`;
    document.getElementById('tree-level').innerText = state.treeLevel;
    document.getElementById('tasks-count').innerText = state.tasks.filter(t => t.done).length;
    document.getElementById('streak-count').innerText = `${state.streak} days 🔥`;
    
    // Tree Evolution
    const tree = document.getElementById('tree-visual');
    const treeStatus = document.getElementById('tree-status');
    if (state.studyMinutes > 60) { 
        tree.innerText = "🌳"; 
        state.treeLevel = 3;
        treeStatus.innerText = "Your tree is fully grown! Keep studying to maintain it!";
    }
    else if (state.studyMinutes > 30) { 
        tree.innerText = "🌲"; 
        state.treeLevel = 3;
        treeStatus.innerText = "Your tree is growing strong!";
    }
    else if (state.studyMinutes > 10) { 
        tree.innerText = "🌿"; 
        state.treeLevel = 2;
        treeStatus.innerText = "Your plant is growing! Keep it up!";
    }
    else { 
        tree.innerText = "🌱"; 
        state.treeLevel = 1;
        treeStatus.innerText = "Your tree is a seedling. Study to grow it!";
    }

    // Game Lock Logic
    if (state.studyMinutes >= 2) {
        state.gamesUnlocked = true;
        document.getElementById('game-lock-msg').innerHTML = "✅ Games Unlocked!";
        document.getElementById('game-lock-msg').style.color = "var(--primary)";
        document.getElementById('bubble-card').classList.remove('locked');
    } else {
        document.getElementById('bubble-card').classList.add('locked');
    }
    saveToFirestore();
}

// Timer Logic
let timerInterval;
function toggleTimer() {
    if (state.isTimerRunning) {
        clearInterval(timerInterval);
        state.isTimerRunning = false;
        document.getElementById('timer-btn').innerText = "Resume Session";
    } else {
        state.isTimerRunning = true;
        document.getElementById('timer-btn').innerText = "Pause Session";
        timerInterval = setInterval(() => {
            state.timerSeconds--;
            if (state.timerSeconds % 120 === 0) { // Every 2 minutes
                state.coins += 10;
                state.studyMinutes += 2;
                updateStreak(); // Update streak when studying
                updateUI();
            }
            displayTime();
            if (state.timerSeconds <= 0) {
                clearInterval(timerInterval);
                state.isTimerRunning = false;
                document.getElementById('timer-btn').innerText = "Start Focus Session";
                state.timerSeconds = 1500; // Reset to 25 mins
                updateStreak(); // Final streak update
                alert("Session Complete! Well done.");
            }
        }, 1000);
    }
}

function displayTime() {
    const mins = Math.floor(state.timerSeconds / 60);
    const secs = state.timerSeconds % 60;
    document.getElementById('timer-display').innerText = 
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function startStudy(mode) {
    // Reset timer for new session
    state.timerSeconds = 1500; // 25 minutes
    displayTime();
    if (mode === 'group') {
        alert("Group Study mode: Share your session with friends!");
    }
}

// AI Planner (Mock)
function generateSchedule() {
    const input = document.getElementById('ai-input').value;
    if (!input) return;
    
    const aiTasks = [
        { id: Date.now(), text: `Read ${input} summary`, done: false },
        { id: Date.now()+1, text: `Practice 5 problems on ${input}`, done: false },
        { id: Date.now()+2, text: `Flashcards for ${input}`, done: false }
    ];
    
    state.tasks = [...state.tasks, ...aiTasks];
    renderTasks();
    document.getElementById('ai-input').value = "";
}

function renderTasks() {
    const list = document.getElementById('task-list');
    list.innerHTML = state.tasks.map(task => `
        <div class="task-item">
            <span class="${task.done ? 'completed' : ''}">${task.text}</span>
            <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleTask(${task.id})">
        </div>
    `).join('');
    updateUI();
}

function toggleTask(id) {
    state.tasks = state.tasks.map(t => t.id === id ? {...t, done: !t.done} : t);
    renderTasks();
    // Update streak when task is completed
    if (state.tasks.find(t => t.id === id && t.done)) {
        updateStreak();
    }
}

// AI Chatbot (Mock)
function sendMessage() {
    const input = document.getElementById('chat-input').value;
    const box = document.getElementById('chat-box');
    if(!input) return;

    box.innerHTML += `<p><strong>You:</strong> ${input}</p>`;
    
    setTimeout(() => {
        const responses = [
            "That's a great question! Focus on the core concepts first.",
            "According to your schedule, you should be finishing this soon!",
            "I recommend taking a 5-minute break after this topic.",
            "Studies show that explaining this to a friend helps retention."
        ];
        const reply = responses[Math.floor(Math.random()*responses.length)];
        box.innerHTML += `<p style="color:var(--primary)"><strong>AI:</strong> ${reply}</p>`;
        box.scrollTop = box.scrollHeight;
    }, 800);
    
    document.getElementById('chat-input').value = "";
}

// Distraction Solver
function solveDistraction() {
    const input = document.getElementById('distract-input').value.toLowerCase();
    const solDiv = document.getElementById('distract-solution');
    
    let solution = "Try the Pomodoro technique: 25 mins work, 5 mins break.";
    if (input.includes("phone") || input.includes("instagram")) {
        solution = "Put your phone in another room and set a physical timer.";
    } else if (input.includes("noise")) {
        solution = "Try 'Brown Noise' or 'Lo-fi Study Beats' on YouTube.";
    } else if (input.includes("tired")) {
        solution = "Stand up, stretch, and drink 2 glasses of water now.";
    }
    
    solDiv.innerText = "AI Suggestion: " + solution;
}

// Simple Bubble Game
function startBubbleGame() {
    if (!state.gamesUnlocked) return;
    const canvas = document.getElementById('bubble-game-canvas');
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    let score = 0;
    
    function draw() {
        ctx.clearRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = "var(--primary)";
        ctx.beginPath();
        ctx.arc(Math.random()*canvas.width, Math.random()*canvas.height, 20, 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = "white";
        ctx.fillText("Pop the bubbles! Score: " + score, 10, 20);
    }

    canvas.onclick = () => { 
        score++; 
        if(score % 5 === 0) { state.coins += 1; updateUI(); }
        draw(); 
    };
    draw();
}

function saveProfile() {
    state.user = document.getElementById('edit-name').value || state.user;
    state.email = document.getElementById('edit-email').value || state.email;
    document.getElementById('user-name-tag').innerText = state.user;
    state.profilePic = `https://api.dicebear.com/7.x/avataaars/svg?seed=${state.user}`;
    document.getElementById('profile-pic').src = state.profilePic;
    saveToFirestore();
    alert("Profile Updated!");
}

// Logout function
function logout() {
    auth.signOut();
}

// Add logout button to nav
window.addEventListener('DOMContentLoaded', () => {
    const nav = document.querySelector('nav');
    const logoutBtn = document.createElement('div');
    logoutBtn.className = 'nav-item';
    logoutBtn.style.position = 'absolute';
    logoutBtn.style.bottom = '60px';
    logoutBtn.style.cursor = 'pointer';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
    logoutBtn.onclick = logout;
    nav.appendChild(logoutBtn);
});

