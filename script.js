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
// FLUID GRID
let u = [], v = [], uPrev = [], vPrev = [], pressure = [], divergence = [];
for(let i=0;i<GRID_SIZE*GRID_SIZE;i++){ u[i]=v[i]=uPrev[i]=vPrev[i]=pressure[i]=divergence[i]=0; }
const IX = (x,y) => x + y*GRID_SIZE;

// ----------------------------
// FLUID FUNCTIONS
function diffuse(b, x, x0, diff, dt){
    const a = dt*diff*GRID_SIZE*GRID_SIZE;
    for(let k=0;k<20;k++){
        for(let j=1;j<GRID_SIZE-1;j++){
            for(let i=1;i<GRID_SIZE-1;i++){
                x[IX(i,j)] = (x0[IX(i,j)] + a*(x[IX(i-1,j)] + x[IX(i+1,j)] + x[IX(i,j-1)] + x[IX(i,j+1)]))/(1+4*a);
            }
        }
    }
}

function advect(b,d,d0,uField,vField,dt){
    for(let j=1;j<GRID_SIZE-1;j++){
        for(let i=1;i<GRID_SIZE-1;i++){
            let x = i - dt*uField[IX(i,j)]*GRID_SIZE;
            let y = j - dt*vField[IX(i,j)]*GRID_SIZE;
            if(x<0.5) x=0.5; if(x>GRID_SIZE-1.5) x=GRID_SIZE-1.5;
            if(y<0.5) y=0.5; if(y>GRID_SIZE-1.5) y=GRID_SIZE-1.5;
            let i0=Math.floor(x), j0=Math.floor(y);
            let i1=i0+1, j1=j0+1;
            let s1=x-i0, s0=1-s1, t1=y-j0, t0=1-t1;
            d[IX(i,j)] = s0*(t0*d0[IX(i0,j0)] + t1*d0[IX(i0,j1)]) + s1*(t0*d0[IX(i1,j0)] + t1*d0[IX(i1,j1)]);
        }
    }
}

function project(u,v,p,div){
    const h = 1.0/GRID_SIZE;
    for(let j=1;j<GRID_SIZE-1;j++){
        for(let i=1;i<GRID_SIZE-1;i++){
            div[IX(i,j)] = -0.5*h*(u[IX(i+1,j)] - u[IX(i-1,j)] + v[IX(i,j+1)] - v[IX(i,j-1)]);
            p[IX(i,j)] = 0;
        }
    }
    for(let k=0;k<20;k++){
        for(let j=1;j<GRID_SIZE-1;j++){
            for(let i=1;i<GRID_SIZE-1;i++){
                p[IX(i,j)] = (div[IX(i,j)] + p[IX(i-1,j)] + p[IX(i+1,j)] + p[IX(i,j-1)] + p[IX(i,j+1)])/4;
            }
        }
    }
    for(let j=1;j<GRID_SIZE-1;j++){
        for(let i=1;i<GRID_SIZE-1;i++){
            u[IX(i,j)] -= 0.5*(p[IX(i+1,j)] - p[IX(i-1,j)])/h;
            v[IX(i,j)] -= 0.5*(p[IX(i,j+1)] - p[IX(i,j-1)])/h;
        }
    }
}

// ----------------------------
// PARTICLES
class Particle{
    constructor(x, y){ this.x=x; this.y=y; this.prevX=x; this.prevY=y; }
    update(){
        let i = Math.floor(this.x / CELL_W);
        let j = Math.floor(this.y / CELL_H);
        i = Math.max(0, Math.min(i, GRID_SIZE-1));
        j = Math.max(0, Math.min(j, GRID_SIZE-1));
        let idx = IX(i,j);
        let velX = u[idx]*CELL_W;
        let velY = v[idx]*CELL_H;
        this.prevX=this.x; this.prevY=this.y;
        this.x+=velX; this.y+=velY;
        if(this.x>canvas.width){ this.x=0; this.prevX=this.x; this.prevY=this.y; }
        if(this.y<0) this.y=0; if(this.y>canvas.height) this.y=canvas.height;
    }
    draw(){
        ctx.beginPath();
        ctx.strokeStyle="white";
        ctx.moveTo(this.prevX,this.prevY);
        ctx.lineTo(this.x,this.y);
        ctx.stroke();
    }
}

// ----------------------------
// INITIALIZE PARTICLE LINES
let particles = [];
function resetParticles(){
    particles=[];
    const spacingY = canvas.height/(NUM_LINES+1);
    const spacingX = canvas.width/PARTICLES_PER_LINE;
    for(let line=0; line<NUM_LINES; line++){
        let y = spacingY*(line+1);
        for(let p=0; p<PARTICLES_PER_LINE; p++){
            particles.push(new Particle(p*spacingX, y));
        }
    }
}
resetParticles();

// ----------------------------
// VORTEX
function addVortex(cx,cy,strength){
    for(let y=0;y<GRID_SIZE;y++){
        for(let x=0;x<GRID_SIZE;x++){
            let dx=x-cx, dy=y-cy, r2=dx*dx+dy*dy+1;
            u[IX(x,y)] += -dy*strength/r2;
            v[IX(x,y)] += dx*strength/r2;
        }
    }
}

// ----------------------------
// ANIMATION LOOP
function step(){
    const dt=0.1;
    uPrev.fill(0); vPrev.fill(0);

    if(showVortex) addVortex(GRID_SIZE/2, GRID_SIZE/2, 5);

    diffuse(1,u,uPrev,0.0001,dt);
    diffuse(2,v,vPrev,0.0001,dt);

    advect(1,u,uPrev,uPrev,vPrev,dt);
    advect(2,v,vPrev,uPrev,vPrev,dt);

    project(u,v,pressure,divergence);

    ctx.fillStyle="rgba(0,0,0,0.2)";
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
    if(e.key==="l"){ NUM_LINES=Math.min(20,NUM_LINES+1); resetParticles(); }
    if(e.key==="k"){ NUM_LINES=Math.max(1,NUM_LINES-1); resetParticles(); }
});
