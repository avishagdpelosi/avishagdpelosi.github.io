const canvas = document.getElementById("genesisCanvas");
const ctx = canvas.getContext("2d");

let W, H, CX, CY, R;
const particles = [];
const poles = [];

const N = 42000;

const cyan = [0, 95, 105];
const gold = [190, 128, 32];

function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  W = rect.width;
  H = rect.height;

  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  CX = W / 2;
  CY = H / 2;
  R = W * 0.34;

  poles.length = 0;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
    poles.push({
      x: CX + Math.cos(a) * R,
      y: CY + Math.sin(a) * R,
      a
    });
  }
}

function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function initParticles() {
  particles.length = [];

  for (let i = 0; i < N; i++) {
    const mode = Math.random();
    const angle = Math.random() * Math.PI * 2;
    let radius;

    // Dense golden center + dense cyan outer cloud + sparse middle.
    if (mode < 0.35) {
      radius = Math.abs(randn()) * R * 0.20;
    } else if (mode < 0.90) {
      radius = R + randn() * 44;
    } else {
      radius = R * 0.45 + Math.random() * R * 0.35;
    }

    const emphasis = Math.random();

    particles.push({
      angle,
      baseRadius: radius,
      size: emphasis < 0.84 ? Math.random() * 0.75 + 0.22 : Math.random() * 1.8 + 0.8,
      alpha: emphasis < 0.84 ? Math.random() * 0.22 + 0.08 : Math.random() * 0.42 + 0.22,
      phase: Math.random() * Math.PI * 2,
      drift: Math.random() * 0.002 + 0.00025,
      noise: Math.random() * 9 + 3
    });
  }
}

function mixColor(c1, c2, t) {
  return [
    Math.round(c1[0] * (1 - t) + c2[0] * t),
    Math.round(c1[1] * (1 - t) + c2[1] * t),
    Math.round(c1[2] * (1 - t) + c2[2] * t)
  ];
}

function drawGlow(breath) {
  const glow = ctx.createRadialGradient(CX, CY, R * 0.03, CX, CY, R * 1.45);

  glow.addColorStop(0, `rgba(226,170,70,${0.36 + 0.18 * breath})`);
  glow.addColorStop(0.45, `rgba(47,111,115,${0.12 + 0.08 * breath})`);
  glow.addColorStop(1, "rgba(255,255,255,0)");

  ctx.beginPath();
  ctx.arc(CX, CY, R * 1.65, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
}

function drawParticles(time, breath) {
  for (const p of particles) {
    const wobble =
      Math.sin(time * 0.00045 + p.phase) * p.noise +
      Math.cos(time * 0.00031 + p.phase * 0.7) * p.noise * 0.45;

    const rr = p.baseRadius * (1 + 0.025 * Math.sin(time * 0.00023)) + wobble;
    const aa = p.angle + Math.sin(time * p.drift + p.phase) * 0.10;

    const x = CX + Math.cos(aa) * rr;
    const y = CY + Math.sin(aa) * rr;

    // Gold in center, progressively cyan outward.
    const t = Math.min(1, Math.max(0, rr / R));
    const c = mixColor(gold, cyan, t);

    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${p.alpha})`;
    ctx.fill();
  }
}

function drawLine(x1, y1, x2, y2, alpha, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `rgba(18,63,67,${alpha})`;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawGeometry() {
  ctx.save();
  ctx.globalAlpha = 0.98;

  // Outer five points.
  for (const p of poles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 16, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,95,105,0.45)";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p.x, p.y, 8.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,82,88,1)";
    ctx.fill();
  }

  // Couplings: pairwise relations between all five processes, not a pentagram emphasis.
  for (let i = 0; i < poles.length; i++) {
    for (let j = i + 1; j < poles.length; j++) {
      drawLine(
        poles[i].x,
        poles[i].y,
        poles[j].x,
        poles[j].y,
        0.11,
        0.65
      );
    }
  }

  // Slightly stronger neighboring couplings.
  for (let i = 0; i < poles.length; i++) {
    const j = (i + 1) % poles.length;
    drawLine(
      poles[i].x,
      poles[i].y,
      poles[j].x,
      poles[j].y,
      0.16,
    0.8
    );
  }

  // Former triad.
  const tri = [
    { x: CX, y: CY - R * 0.44 },
    { x: CX + R * 0.37, y: CY + R * 0.22 },
    { x: CX - R * 0.37, y: CY + R * 0.22 }
  ];

  drawLine(tri[0].x, tri[0].y, tri[1].x, tri[1].y, 0.62, 1.65);
  drawLine(tri[1].x, tri[1].y, tri[2].x, tri[2].y, 0.62, 1.65);
  drawLine(tri[2].x, tri[2].y, tri[0].x, tri[0].y, 0.62, 1.65);

  for (const t of tri) {
    ctx.beginPath();
    ctx.arc(t.x, t.y, R * 0.14, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(18,63,67,0.58)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(t.x, t.y, 5.4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(170,112,38,0.98)";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(CX, CY, 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(170,112,38,1)";
  ctx.fill();

  ctx.restore();
}

function animate(time) {
  ctx.clearRect(0, 0, W, H);

  const breath = (Math.sin(time * 0.00023) + 1) / 2;

  drawGlow(breath);
  drawParticles(time, breath);
  drawGeometry();

  requestAnimationFrame(animate);
}

resize();
initParticles();
animate(0);

window.addEventListener("resize", () => {
  resize();
  initParticles();
});
