const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ----------------------------
// SETTINGS
// ----------------------------
const NUM_PARTICLES = 800;
const SPEED = 1.5;

// ----------------------------
// PARTICLE CLASS
// ----------------------------
class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
  }

  update() {
    const velocity = getVelocity(this.x, this.y);

    this.x += velocity.u * SPEED;
    this.y += velocity.v * SPEED;

    // Reset if off screen
    if (this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.x = 0;
      this.y = Math.random() * canvas.height;
    }
  }

  draw() {
    ctx.fillRect(this.x, this.y, 2, 2);
  }
}

// ----------------------------
// VELOCITY FIELD
// ----------------------------
// This is your "fake Navier-Stokes" for now
// Later you replace this with real solver logic
function getVelocity(x, y) {
  // Base uniform flow (left → right)
  let u = 1;
  let v = 0;

  // Add disturbance (like airflow around an object)
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const dx = x - cx;
  const dy = y - cy;
  const distSq = dx * dx + dy * dy;

  const influence = 10000 / (distSq + 1);

  // Creates a swirl effect (very crude vortex)
  u += -dy * influence * 0.00005;
  v += dx * influence * 0.00005;

  return { u, v };
}

// ----------------------------
// INIT PARTICLES
// ----------------------------
const particles = [];
for (let i = 0; i < NUM_PARTICLES; i++) {
  particles.push(new Particle());
}

// ----------------------------
// ANIMATION LOOP
// ----------------------------
function animate() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";

  particles.forEach(p => {
    p.update();
    p.draw();
  });

  requestAnimationFrame(animate);
}

animate();
