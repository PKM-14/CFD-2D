const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ----------------------------
// PHYSICAL SCALE
const PIXELS_PER_METER = 50;
const DT = 1/60;

// ----------------------------
// SETTINGS
let airSpeed = 10; // m/s
let PARTICLES_PER_LINE = 50;
let NUM_LINES = 10;
let showVortex = true;
let angleOfAttack = 0;

const vortexStrength = 0.2;
const vortexRadius = 100;

// ----------------------------
// UI
const ui = document.getElementById("ui");

// ----------------------------
// HELPERS
function rotatePoint(x, y, angle) {
    return {
        x: x * Math.cos(angle) - y * Math.sin(angle),
        y: x * Math.sin(angle) + y * Math.cos(angle)
    };
}

// ----------------------------
// NACA 4412
function generateNACA4412(chord = 300, points = 120) {
    const m = 0.04, p = 0.4, t = 0.12;
    let upper = [], lower = [];

    for (let i = 0; i <= points; i++) {
        let x = i / points;

        let yt = 5*t*(0.2969*Math.sqrt(x) - 0.1260*x - 0.3516*x**2 + 0.2843*x**3 - 0.1015*x**4);

        let yc, dyc;
        if (x < p) {
            yc = m/(p*p)*(2*p*x - x*x);
            dyc = 2*m/(p*p)*(p - x);
        } else {
            yc = m/((1-p)**2)*((1-2*p)+2*p*x-x*x);
            dyc = 2*m/((1-p)**2)*(p - x);
        }

        let theta = Math.atan(dyc);

        upper.push({
            x: (x - yt*Math.sin(theta)) * chord,
            y: -(yc + yt*Math.cos(theta)) * chord
        });

        lower.push({
            x: (x + yt*Math.sin(theta)) * chord,
            y: -(yc - yt*Math.cos(theta)) * chord
        });
    }

    lower.reverse();
    return upper.concat(lower);
}

const airfoil = generateNACA4412();
const airfoilPos = { x: canvas.width/2 - 150, y: canvas.height/2 };

// ----------------------------
// PARTICLES
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.color = color;
    }

    update(vortices) {
        this.prevX = this.x;
        this.prevY = this.y;

        let baseVel = airSpeed * PIXELS_PER_METER * DT;
        this.x += baseVel;

        let speedMultiplier = 1;

        // VORTICES
        if (showVortex) {
            vortices.forEach(v => {
                const dx = this.x - v.x;
                const dy = this.y - v.y;
                const dist2 = dx*dx + dy*dy;

                if (dist2 < vortexRadius*vortexRadius) {
                    const dist = Math.sqrt(dist2);
                    const factor = (vortexRadius - dist)/vortexRadius;

                    this.x += -dy * factor * vortexStrength;
                    this.y += dx * factor * vortexStrength;

                    speedMultiplier += factor * 0.5;
                }
            });
        }

        this.x += baseVel * (speedMultiplier - 1);

        // AIRFOIL DEFLECTION
        airfoil.forEach(p => {
            const r = rotatePoint(p.x, p.y, angleOfAttack);
            const ax = r.x + airfoilPos.x;
            const ay = r.y + airfoilPos.y;

            const dx = this.x - ax;
            const dy = this.y - ay;
            const dist2 = dx*dx + dy*dy;

            const radius = 20;

            if (dist2 < radius*radius) {
                const dist = Math.sqrt(dist2) || 0.001;
                const force = (radius - dist)/radius * 0.5;

                this.x += (dx/dist)*force;
                this.y += (dy/dist)*force;
            }
        });

        // LIFT ILLUSION
        const relX = this.x - airfoilPos.x;
        const relY = this.y - airfoilPos.y;
        const local = rotatePoint(relX, relY, -angleOfAttack);

        if (local.x > 0 && local.x < 300) {
            if (local.y < 0) this.x += 0.5;
            else this.x -= 0.2;
        }

        // WRAP
        if (this.x > canvas.width) {
            this.x = 0;
            this.prevX = this.x;
            this.prevY = this.y;
        }

        if (this.y < 0) this.y = 0;
        if (this.y > canvas.height) this.y = canvas.height;
    }

    draw() {
        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
    }
}

// ----------------------------
// INIT PARTICLES
let particles = [];

function resetParticles() {
    particles = [];
    const spacingY = canvas.height / (NUM_LINES + 1);
    const spacingX = canvas.width / PARTICLES_PER_LINE;

    for (let i = 0; i < NUM_LINES; i++) {
        const y = spacingY * (i + 1);
        const hue = 200 - i * (150 / NUM_LINES);
        const color = `hsl(${hue},100%,70%)`;

        for (let p = 0; p < PARTICLES_PER_LINE; p++) {
            particles.push(new Particle(p * spacingX, y, color));
        }
    }
}

resetParticles();

// ----------------------------
// VORTICES
let vortices = [{x: canvas.width/2, y: canvas.height/2}];

canvas.addEventListener("click", e => {
    vortices.push({x: e.clientX, y: e.clientY});
});

// ----------------------------
// DRAW AIRFOIL
function drawAirfoil() {
    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;

    airfoil.forEach((p, i) => {
        const r = rotatePoint(p.x, p.y, angleOfAttack);
        const x = r.x + airfoilPos.x;
        const y = r.y + airfoilPos.y;

        if (i === 0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
    });

    ctx.closePath();
    ctx.stroke();
}

// ----------------------------
// LOOP
function animate() {
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.shadowBlur = 6;
    ctx.shadowColor = "white";

    particles.forEach(p => {
        p.update(vortices);
        p.draw();
    });

    ctx.shadowBlur = 0;

    drawAirfoil();

    // UI
    ui.innerHTML = `
    Air Speed: ${airSpeed.toFixed(1)} m/s<br>
    AoA: ${(angleOfAttack * 180/Math.PI).toFixed(1)}°<br><br>
    Controls:<br>
    = / - : Speed<br>
    A / Z : AoA<br>
    V : Toggle vortex<br>
    Click : Add vortex<br>
    C : Clear vortices<br>
    ↑ ↓ : Particles<br>
    L / K : Lines
    `;

    requestAnimationFrame(animate);
}

animate();

// ----------------------------
// CONTROLS
window.addEventListener("keydown", e => {
    switch(e.key){
        case "=": airSpeed += 1; break;
        case "-": airSpeed = Math.max(0, airSpeed - 1); break;
        case "a": angleOfAttack += 0.05; break;
        case "z": angleOfAttack -= 0.05; break;
        case "v": showVortex = !showVortex; break;
        case "c": vortices = []; break;
        case "ArrowUp": PARTICLES_PER_LINE += 10; resetParticles(); break;
        case "ArrowDown": PARTICLES_PER_LINE = Math.max(10, PARTICLES_PER_LINE-10); resetParticles(); break;
        case "l": NUM_LINES++; resetParticles(); break;
        case "k": NUM_LINES = Math.max(1, NUM_LINES-1); resetParticles(); break;
    }
});

// ----------------------------
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    resetParticles();
});
