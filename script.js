const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ----------------------------
// SETTINGS
let PARTICLES_PER_LINE = 50;
let NUM_LINES = 10;
let showVortex = true;
let baseVelocity = 2;         // horizontal speed
const vortexStrength = 50;    // strength of vortex effect
const vortexRadius = 150;     // radius in pixels

// ----------------------------
// PARTICLE CLASS
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
    }

    update(vortexX, vortexY) {
        this.prevX = this.x;
        this.prevY = this.y;

        // Base rightward movement
        this.x += baseVelocity;

        // Add vortex effect if enabled
        if(showVortex) {
            const dx = this.x - vortexX;
            const dy = this.y - vortexY;
            const dist2 = dx*dx + dy*dy;
            if(dist2 < vortexRadius*vortexRadius) {
                const dist = Math.sqrt(dist2);
                const strength = (vortexRadius - dist)/vortexRadius * vortexStrength / 100;
                this.x += -dy * strength;
                this.y += dx * strength;
            }
        }

        // Wrap horizontally
        if(this.x > canvas.width) {
            this.x = 0;
            this.prevX = this.x;
            this.prevY = this.y;
        }

        // Stay within vertical bounds
        if(this.y < 0) this.y = 0;
        if(this.y > canvas.height) this.y = canvas.height;
    }

    draw() {
        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
    }
}

// ----------------------------
// INITIALIZE PARTICLES
let particles = [];

function resetParticles() {
    particles = [];
    const spacingY = canvas.height / (NUM_LINES + 1);
    const spacingX = canvas.width / PARTICLES_PER_LINE;
    for(let line = 0; line < NUM_LINES; line++) {
        const y = spacingY * (line + 1);
        for(let p = 0; p < PARTICLES_PER_LINE; p++) {
            particles.push(new Particle(p * spacingX, y));
        }
    }
}

resetParticles();

// ----------------------------
// ANIMATION LOOP
function animate() {
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const vortexX = canvas.width / 2;
    const vortexY = canvas.height / 2;

    particles.forEach(p => {
        p.update(vortexX, vortexY);
        p.draw();
    });

    requestAnimationFrame(animate);
}

animate();

// ----------------------------
// CONTROLS
window.addEventListener("keydown", e => {
    switch(e.key){
        case "v": showVortex = !showVortex; break;
        case "ArrowUp": PARTICLES_PER_LINE += 10; resetParticles(); break;
        case "ArrowDown": PARTICLES_PER_LINE = Math.max(10, PARTICLES_PER_LINE - 10); resetParticles(); break;
        case "l": NUM_LINES = Math.min(20, NUM_LINES + 1); resetParticles(); break;
        case "k": NUM_LINES = Math.max(1, NUM_LINES - 1); resetParticles(); break;
    }
});

// ----------------------------
// HANDLE RESIZE
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    resetParticles();
});
