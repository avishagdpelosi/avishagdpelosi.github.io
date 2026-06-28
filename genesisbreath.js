const canvas = document.getElementById("genesisCanvas");
const ctx = canvas.getContext("2d");

let W, H, CX, CY, R;
const particles = [];
const poles = [];

const N = 42000;
const teal = [0, 95, 105];

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
      y: CY + Math.sin(a) * R
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
    const angle = Math.random() * Math.PI * 2;

   const radius = Math.abs(randn()) * R * 0.14;

    particles.push({
      angle,
      baseRadius: radius,
      size: Math.random() * 0.75 + 0.25,
      alpha: Math.random() * 0.24 + 0.08,
      phase: Math.random() * Math.PI * 2,
      noise: Math.random() * 5 + 2
    });
  }
}

function smoothPulse(time) {
  const s = (Math.sin(time * 0.00075 - Math.PI / 2) + 1) / 2;
  return s * s * (3 - 2 * s);
}

function drawGlow(structureAlpha) {
  const glow = ctx.createRadialGradient(CX, CY, R * 0.02, CX, CY, R * 1.3);

  glow.addColorStop(0, `rgba(255,252,245,${0.85 + structureAlpha * 0.1})`);
  glow.addColorStop(0.35, `rgba(255,250,240,${0.25 + structureAlpha * 0.25})`);
  glow.addColorStop(1, "rgba(255,255,255,0)");

  ctx.beginPath();
  ctx.arc(CX, CY, R * 1.65, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();
}

function drawParticles(time, pulse) {
 const expansion = 0.08 + pulse * 6.2;
  const rotation = time * 0.00028 + pulse * 1.2;

  for (const p of particles) {
    const wobble =
      Math.sin(time * 0.0007 + p.phase) * p.noise +
      Math.cos(time * 0.00041 + p.phase * 0.7) * p.noise * 0.35;

    const rr = p.baseRadius * expansion + wobble;
    const aa = p.angle + rotation + Math.sin(time * 0.0004 + p.phase) * 0.035;

    const x = CX + Math.cos(aa) * rr;
    const y = CY + Math.sin(aa) * rr;

    const distance = Math.min(1, Math.max(0, rr / R));
    const brightness = 1 - 0.18 * distance;

    const r = Math.round(teal[0] * brightness);
    const g = Math.round(teal[1] * brightness);
    const b = Math.round(teal[2] * brightness);

    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.alpha})`;
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

function drawGeometry(alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;

  for (const p of poles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,82,88,1)";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,82,88,1)";
    ctx.fill();
  }

  drawLine(poles[0].x, poles[0].y, poles[2].x, poles[2].y, 0.5, 1.1);
  drawLine(poles[0].x, poles[0].y, poles[3].x, poles[3].y, 0.5, 1.1);
  drawLine(poles[1].x, poles[1].y, poles[3].x, poles[3].y, 0.5, 1.1);
  drawLine(poles[1].x, poles[1].y, poles[4].x, poles[4].y, 0.5, 1.1);
  drawLine(poles[2].x, poles[2].y, poles[4].x, poles[4].y, 0.5, 1.1);

  const tri = [
    { x: CX, y: CY - R * 0.44 },
    { x: CX + R * 0.37, y: CY + R * 0.2 },
    { x: CX - R * 0.37, y: CY + R * 0.2 }
  ];

  drawLine(tri[0].x, tri[0].y, tri[1].x, tri[1].y, 0.5, 1.1);
  drawLine(tri[1].x, tri[1].y, tri[2].x, tri[2].y, 0.5, 1.1);
  drawLine(tri[2].x, tri[2].y, tri[0].x, tri[0].y, 0.5, 1.1);

  for (const t of tri) {
    ctx.beginPath();
    ctx.arc(t.x, t.y, R * 0.14, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,82,88,1)";
    ctx.lineWidth = 1.1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(t.x, t.y, 5.4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,82,88,1)";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(CX, CY, 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,82,88,1)";
  ctx.fill();

  ctx.restore();
}

function animate(time) {
  ctx.clearRect(0, 0, W, H);

  const pulse = smoothPulse(time);
  const structureAlpha = pulse;

  drawGlow(structureAlpha);
  drawParticles(time, pulse);
  drawGeometry(structureAlpha);

  requestAnimationFrame(animate);
}

resize();
initParticles();
animate(0);

window.addEventListener("resize", () => {
  resize();
  initParticles();
});
