const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ----------------------------
// SETTINGS
let PARTICLES_PER_LINE = 50;
let NUM_LINES = 10;
let baseVelocity = 2;
let showVortex = true;
const vortexStrength = 0.2;  // small offset per frame
const vortexRadius = 100;    // radius of each vortex

// ----------------------------
// PARTICLE CLASS
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

        // Base rightward movement
        this.x += baseVelocity;

        // Apply all vortices
        if (showVortex) {
            vortices.forEach(v => {
                const dx = this.x - v.x;
                const dy = this.y - v.y;
                const dist2 = dx*dx + dy*dy;
                if (dist2 < vortexRadius*vortexRadius) {
                    const dist = Math.sqrt(dist2);
                    const factor = (vortexRadius - dist)/vortexRadius * vortexStrength;
                    this.x += -dy * factor;
                    this.y += dx * factor;
                }
            });
        }

        // Wrap horizontally
        if(this.x > canvas.width) {
            this.x = 0;
            this.prevX = this.x;
            this.prevY = this.y;
        }

        // Keep inside vertical bounds
        if(this.y < 0) this.y = 0;
        if(this.y > canvas.height) this.y = canvas.height;
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
// PARTICLE LINES
let particles = [];

function resetParticles() {
    particles = [];
    const spacingY = canvas.height / (NUM_LINES + 1);
    const spacingX = canvas.width / PARTICLES_PER_LINE;

    for (let line = 0; line < NUM_LINES; line++) {
        const y = spacingY * (line + 1);
        const hue = 200 - line * (150 / NUM_LINES); // gradient from blue to red
        const color = `hsl(${hue}, 100%, 70%)`;
        for (let p = 0; p < PARTICLES_PER_LINE; p++) {
            particles.push(new Particle(p * spacingX, y, color));
        }
    }
}

resetParticles();

// ----------------------------
// VORTICES
let vortices = [];
// initial central vortex
vortices.push({x: canvas.width/2, y: canvas.height/2});

// Add vortex on click
canvas.addEventListener("click", e => {
    vortices.push({x: e.clientX, y: e.clientY});
});

// ----------------------------
// ANIMATION LOOP
function animate() {
    // Glow trail background
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Enable glow effect
    ctx.shadowBlur = 6;
    ctx.shadowColor = "white";

    particles.forEach(p => {
        p.update(vortices);
        p.draw();
    });

    ctx.shadowBlur = 0; // reset shadow for next frame
    requestAnimationFrame(animate);
}

animate();

// ----------------------------
// CONTROLS
window.addEventListener("keydown", e => {
    switch(e.key) {
        case "v": showVortex = !showVortex; break;
        case "ArrowUp": PARTICLES_PER_LINE += 10; resetParticles(); break;
        case "ArrowDown": PARTICLES_PER_LINE = Math.max(10, PARTICLES_PER_LINE - 10); resetParticles(); break;
        case "l": NUM_LINES = Math.min(20, NUM_LINES + 1); resetParticles(); break;
        case "k": NUM_LINES = Math.max(1, NUM_LINES - 1); resetParticles(); break;
        case "c": vortices = []; break; // clear vortices
    }
});

// ----------------------------
// HANDLE RESIZE
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    resetParticles();
});
