const canvas = document.getElementById("genesisCanvas");
const ctx = canvas.getContext("2d");

let W, H, CX, CY, R;
const particles = [];

const N = 18000;

const teal = [31, 93, 98];
const gold = [156, 122, 58];

const poles = [];

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
  R = W * 0.33;

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
  particles.length = 0;

  for (let i = 0; i < N; i++) {
    const mode = Math.random();

    let angle = Math.random() * Math.PI * 2;
    let radius;

    if (mode < 0.68) {
      radius = R + randn() * 34;
    } else if (mode < 0.88) {
      radius = R * 0.55 + randn() * 42;
    } else {
      radius = Math.random() * R * 0.38;
    }

    particles.push({
      angle,
      radius,
      baseRadius: radius,
      size: Math.random() * 0.65 + 0.18,
      alpha: Math.random() * 0.16 + 0.035,
      phase: Math.random() * Math.PI * 2,
      drift: Math.random() * 0.002 + 0.0003,
      noise: Math.random() * 8 + 2
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
  const glow = ctx.createRadialGradient(CX, CY, R * 0.05, CX, CY, R * 1.15);
  glow.addColorStop(0, `rgba(220, 167, 72, ${0.10 + breath * 0.10})`);
  glow.addColorStop(0.45, `rgba(47, 111, 115, ${0.035 + breath * 0.04})`);
  glow.addColorStop(1, "rgba(255,255,255,0)");

  ctx.beginPath();
  ctx.arc(CX, CY, R * 1.5, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
}

function drawParticles(time, breath) {
  for (const p of particles) {
    const wobble =
      Math.sin(time * 0.00045 + p.phase) * p.noise +
      Math.cos(time * 0.00031 + p.phase * 0.7) * p.noise * 0.4;

    const rr = p.baseRadius * (1 + 0.035 * Math.sin(time * 0.00023)) + wobble;
    const aa = p.angle + Math.sin(time * p.drift + p.phase) * 0.10;

    const x = CX + Math.cos(aa) * rr;
    const y = CY + Math.sin(aa) * rr;

    const radial = Math.min(1, Math.abs(rr - R) / 80);
    const colorMix = 0.20 + breath * 0.32 + (1 - radial) * 0.12;
    const c = mixColor(teal, gold, Math.min(0.55, colorMix));

    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${p.alpha})`;
    ctx.fill();
  }
}

function drawSoftLine(x1, y1, x2, y2, alpha, width = 0.9) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `rgba(18, 63, 67, ${alpha})`;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawGeometry(time, breath) {
  const opacity = 0.15 + 0.38 * breath;

  ctx.save();
  ctx.globalAlpha = opacity;

  // Five points
  for (const p of poles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 5.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(22, 95, 100, 0.95)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, 13, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(156, 122, 58, 0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Couplings between every pair of the five operations
  for (let i = 0; i < poles.length; i++) {
    for (let j = i + 1; j < poles.length; j++) {
      const a = i === 0 && j === 1 ? 0.20 : 0.12;
      drawSoftLine(poles[i].x, poles[i].y, poles[j].x, poles[j].y, a, 0.75);
    }
  }

  // Former triad: three small circles + triangle
  const tri = [
    { x: CX, y: CY - R * 0.44 },
    { x: CX + R * 0.37, y: CY + R * 0.22 },
    { x: CX - R * 0.37, y: CY + R * 0.22 }
  ];

  drawSoftLine(tri[0].x, tri[0].y, tri[1].x, tri[1].y, 0.36, 1.1);
  drawSoftLine(tri[1].x, tri[1].y, tri[2].x, tri[2].y, 0.36, 1.1);
  drawSoftLine(tri[2].x, tri[2].y, tri[0].x, tri[0].y, 0.36, 1.1);

  for (const t of tri) {
    ctx.beginPath();
    ctx.arc(t.x, t.y, R * 0.14, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(18, 63, 67, 0.40)";
    ctx.lineWidth = 1.05;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(t.x, t.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(156, 122, 58, 0.72)";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(CX, CY, 4.2, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(156, 122, 58, 0.8)";
  ctx.fill();

  ctx.restore();
}

function animate(time) {
  ctx.clearRect(0, 0, W, H);

  const breath = (Math.sin(time * 0.00023) + 1) / 2;

  drawGlow(breath);
  drawParticles(time, breath);
  drawGeometry(time, breath);

  requestAnimationFrame(animate);
}

resize();
initParticles();
animate(0);

window.addEventListener("resize", () => {
  resize();
  initParticles();
});
