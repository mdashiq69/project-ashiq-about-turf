// Matter.js Setup
const { Engine, Render, Runner, World, Bodies, Mouse, MouseConstraint, Composite } = Matter;

let engine, render, runner, world;
let physicsActive = false;
let bodies = [];

function initPhysics() {
    const container = document.getElementById('physics-container');
    const width = window.innerWidth;
    const height = window.innerHeight;

    engine = Engine.create();
    world = engine.world;

    render = Render.create({
        element: container,
        engine: engine,
        options: {
            width: width,
            height: height,
            wireframes: false,
            background: 'transparent'
        }
    });

    // Boundaries
    const ground = Bodies.rectangle(width / 2, height + 50, width, 100, { isStatic: true });
    const wallLeft = Bodies.rectangle(-50, height / 2, 100, height, { isStatic: true });
    const wallRight = Bodies.rectangle(width + 50, height / 2, 100, height, { isStatic: true });
    
    World.add(world, [ground, wallLeft, wallRight]);

    // Mouse control
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            stiffness: 0.2,
            render: { visible: false }
        }
    });
    World.add(world, mouseConstraint);

    runner = Runner.create();
    Runner.run(runner, engine);
}

function activateGravity() {
    if (physicsActive) return;
    physicsActive = true;
    
    document.getElementById('physics-container').style.pointerEvents = 'auto';
    
    const elements = document.querySelectorAll('.physics-element');
    
    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const body = Bodies.rectangle(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            rect.width,
            rect.height,
            {
                restitution: 0.6,
                friction: 0.1,
                render: { visible: false }
            }
        );
        
        el.style.position = 'fixed';
        el.style.width = rect.width + 'px';
        el.style.height = rect.height + 'px';
        el.style.margin = '0';
        el.style.zIndex = '1000';
        
        bodies.push({ element: el, body: body, w: rect.width, h: rect.height });
        World.add(world, body);
    });

    // Sync loop
    (function update() {
        bodies.forEach(item => {
            const { element, body, w, h } = item;
            element.style.transform = `translate(${body.position.x - w/2}px, ${body.position.y - h/2}px) rotate(${body.angle}rad)`;
            element.style.top = '0';
            element.style.left = '0';
        });
        requestAnimationFrame(update);
    })();
}

// UI & Animations
window.addEventListener('load', () => {
    // Hide Loader
    setTimeout(() => {
        const loader = document.getElementById('loader');
        loader.style.opacity = '0';
        setTimeout(() => loader.style.display = 'none', 500);
    }, 1500);

    initPhysics();

    // GSAP Animations
    gsap.from('.hero-content > *', {
        y: 50,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'power4.out'
    });

    gsap.from('.nav-container', {
        y: -50,
        opacity: 0,
        duration: 1,
        delay: 0.5
    });

    // Floating animation for sports icons
    gsap.to('.float-item', {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        stagger: 0.5,
        ease: 'sine.inOut'
    });
});

// Gravity Trigger
document.getElementById('gravity-trigger').addEventListener('click', activateGravity);

// Tools Logic

// 1. Turf Size Calculator
function calculateTurf() {
    const l = document.getElementById('turf-length').value;
    const w = document.getElementById('turf-width').value;
    const result = document.getElementById('turf-result');

    if (l && w) {
        const area = l * w;
        const players = Math.floor(area / 50); // Rough estimate 50sqm per player
        const grass = (area * 1.05).toFixed(2); // 5% wastage
        result.innerHTML = `Area: ${area} m²<br>Recommended: ${players} Players<br>Grass Req: ${grass} m²`;
    } else {
        result.innerHTML = "Please enter dimensions.";
    }
}

// 2. Match Cost Splitter
function splitCost() {
    const total = document.getElementById('total-cost').value;
    const players = document.getElementById('player-count').value;
    const result = document.getElementById('cost-result');

    if (total && players) {
        const perPlayer = (total / players).toFixed(2);
        result.innerHTML = `Cost Per Player: <span class="accent-text">$${perPlayer}</span>`;
    } else {
        result.innerHTML = "Enter total and players.";
    }
}

// 3. Tournament Generator
function generateTournament() {
    const list = document.getElementById('teams-list').value;
    const result = document.getElementById('tournament-result');
    
    if (!list) return;

    const teams = list.split(',').map(t => t.trim()).filter(t => t);
    if (teams.length < 2) {
        result.innerHTML = "Need at least 2 teams.";
        return;
    }

    // Shuffle
    for (let i = teams.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [teams[i], teams[j]] = [teams[j], teams[i]];
    }

    let html = '<div class="bracket-round">';
    for (let i = 0; i < teams.length; i += 2) {
        const team1 = teams[i];
        const team2 = teams[i + 1] || "BYE";
        html += `
            <div class="matchup">
                <div class="match-team">${team1}</div>
                <div class="match-vs">VS</div>
                <div class="match-team">${team2}</div>
            </div>
        `;
    }
    html += '</div>';
    result.innerHTML = html;
    
    gsap.from('.matchup', {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1
    });
}

// 4. Live Scoreboard & Timer
let scoreA = 0;
let scoreB = 0;
let timerSeconds = 0;
let timerInterval;

function updateScore(team, val) {
    if (team === 'a') {
        scoreA = Math.max(0, scoreA + val);
        document.getElementById('score-a').innerText = scoreA;
    } else {
        scoreB = Math.max(0, scoreB + val);
        document.getElementById('score-b').innerText = scoreB;
    }
}

function toggleTimer() {
    const btn = document.getElementById('timer-btn');
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        btn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        timerInterval = setInterval(() => {
            timerSeconds++;
            const mins = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
            const secs = (timerSeconds % 60).toString().padStart(2, '0');
            document.getElementById('timer-display').innerText = `${mins}:${secs}`;
        }, 1000);
        btn.innerHTML = '<i class="fas fa-pause"></i>';
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds = 0;
    document.getElementById('timer-display').innerText = "00:00";
    document.getElementById('timer-btn').innerHTML = '<i class="fas fa-play"></i>';
}

// 5. BMI Calculator
function calculateBMI() {
    const h = document.getElementById('height').value / 100;
    const w = document.getElementById('weight').value;
    const result = document.getElementById('bmi-result');

    if (h && w) {
        const bmi = (w / (h * h)).toFixed(1);
        let status = "";
        if (bmi < 18.5) status = "Underweight";
        else if (bmi < 25) status = "Healthy";
        else if (bmi < 30) status = "Overweight";
        else status = "Obese";
        
        result.innerHTML = `BMI: ${bmi} (${status})`;
    } else {
        result.innerHTML = "Enter height and weight.";
    }
}

// 6. Team Name Generator
const prefixes = ["Electric", "Neon", "Cyber", "Mega", "Shadow", "Titan", "Alpha", "Zenith", "Quantum", "Hyper"];
const suffixes = ["Strikers", "Titans", "Ninjas", "Warriors", "Kings", "Gladiators", "Wolves", "Dragons", "Knights", "Eagles"];

function generateTeamName() {
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const s = suffixes[Math.floor(Math.random() * suffixes.length)];
    const result = document.getElementById('team-name-result');
    result.innerHTML = `<span class="accent-text">${p} ${s}</span>`;
    
    gsap.fromTo(result, { scale: 1.2 }, { scale: 1, duration: 0.3 });
}

// Mobile Menu Toggle
const mobileMenu = document.getElementById('mobile-menu');
const navLinks = document.querySelector('.nav-links');

mobileMenu.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    // Basic mobile menu styling injection for brevity
    if(navLinks.classList.contains('active')) {
        navLinks.style.display = 'flex';
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = 'rgba(0,0,0,0.95)';
        navLinks.style.padding = '2rem';
    } else {
        navLinks.style.display = 'none';
    }
});
