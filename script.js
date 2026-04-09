const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// ----------------------------
// SETTINGS
// ----------------------------
let PARTICLES_PER_LINE = 50;
let NUM_LINES = 10;
const GRID_SIZE = 50;
const CELL_W = canvas.width / GRID_SIZE;
const CELL_H = canvas.height / GRID_SIZE;
let showVortex = true;

// ----------------------------
// FLUID GRID (same as before)
let u = [], v = [], uPrev = [], vPrev = [], pressure = [], divergence = [];
for(let i=0;i<GRID_SIZE*GRID_SIZE;i++){ u[i]=v[i]=uPrev[i]=vPrev[i]=pressure[i]=divergence[i]=0; }
const IX = (x,y) => x + y*GRID_SIZE;

function addVortex(cx, cy, strength){
    for(let y=0;y<GRID_SIZE;y++){
        for(let x=0;x<GRID_SIZE;x++){
            let dx = x - cx, dy = y - cy;
            let r2 = dx*dx + dy*dy + 1;
            u[IX(x,y)] += -dy*strength/r2;
            v[IX(x,y)] += dx*strength/r2;
        }
    }
}

// Diffuse, Advect, Project (same functions as before, unchanged)

// ----------------------------
// PARTICLES: structured lines
class Particle{
    constructor(x, y){
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
    }
    update(){
        let i = Math.floor(this.x / CELL_W);
        let j = Math.floor(this.y / CELL_H);
        i = Math.max(0, Math.min(i, GRID_SIZE-1));
        j = Math.max(0, Math.min(j, GRID_SIZE-1));
        let idx = IX(i,j);
        let velX = u[idx]*CELL_W;
        let velY = v[idx]*CELL_H;
        this.prevX = this.x;
        this.prevY = this.y;
        this.x += velX;
        this.y += velY;
        if(this.x>canvas.width){ this.x=0; this.prevX=this.x; this.prevY=this.y; }
        if(this.y<0) this.y=0;
        if(this.y>canvas.height) this.y=canvas.height;
    }
    draw(){
        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
    }
}

// ----------------------------
// INITIALIZE PARTICLE LINES
let particles = [];
function resetParticles(){
    particles = [];
    const spacingY = canvas.height / (NUM_LINES+1);
    for(let line=0; line<NUM_LINES; line++){
        const y = spacingY*(line+1);
        const spacingX = canvas.width / PARTICLES_PER_LINE;
        for(let p=0; p<PARTICLES_PER_LINE; p++){
            particles.push(new Particle(p*spacingX, y));
        }
    }
}
resetParticles();

// ----------------------------
// ANIMATION LOOP
function step(){
    const dt = 0.1;
    uPrev.fill(0); vPrev.fill(0);

    if(showVortex) addVortex(GRID_SIZE/2, GRID_SIZE/2, 5);

    diffuse(1,u,uPrev,0.0001,dt);
    diffuse(2,v,vPrev,0.0001,dt);
    advect(1,u,uPrev,uPrev,vPrev,dt);
    advect(2,v,vPrev,uPrev,vPrev,dt);
    project(u,v,pressure,divergence);

    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.fillRect(0,0,canvas.width,canvas.height);

    particles.forEach(p=>{ p.update(); p.draw(); });

    requestAnimationFrame(step);
}
step();

// ----------------------------
// CONTROLS
window.addEventListener("keydown", e=>{
    if(e.key==="v"){ showVortex=!showVortex; }
    if(e.key==="ArrowUp"){ PARTICLES_PER_LINE+=10; resetParticles(); }
    if(e.key==="ArrowDown"){ PARTICLES_PER_LINE=Math.max(10,PARTICLES_PER_LINE-10); resetParticles(); }
    if(e.key==="l"){ NUM_LINES = Math.min(20, NUM_LINES+1); resetParticles(); }
    if(e.key==="k"){ NUM_LINES = Math.max(1, NUM_LINES-1); resetParticles(); }
});
