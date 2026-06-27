const canvas = document.getElementById("genesisCanvas");
const ctx = canvas.getContext("2d");

let W, H, CX, CY, R;
const particles = [];
const poles = [];

const N = 36000;

const teal = [18, 87, 93];
const gold = [170, 122, 45];

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
  let u = 0;
  let v = 0;

  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();

  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function initParticles() {
  particles.length = 0;

  for (let i = 0; i < N; i++) {
    const mode = Math.random();

    const angle = Math.random() * Math.PI * 2;
    let radius;

    if (mode < 0.72) {
      radius = R + randn() * 42;
    } else if (mode < 0.92) {
      radius = R * 0.64 + randn() * 46;
    } else {
      radius = Math.random() * R * 0.42;
    }

    const emphasis = Math.random();

    particles.push({
      angle,
      baseRadius: radius,
      size:
        emphasis < 0.82
          ? Math.random() * 0.75 + 0.25
          : Math.random() * 1.8 + 0.8,
      alpha:
        emphasis < 0.82
          ? Math.random() * 0.22 + 0.08
          : Math.random() * 0.42 + 0.22,
      phase: Math.random() * Math.PI * 2,
      drift: Math.random() * 0.002 + 0.00025,
      noise: Math.random() * 10 + 3
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
  const glow = ctx.createRadialGradient(
    CX,
    CY,
    R * 0.04,
    CX,
    CY,
    R * 1.45
  );

  glow.addColorStop(0, `rgba(226, 170, 70, ${0.34 + 0.20 * breath})`);
  glow.addColorStop(0.42, `rgba(47, 111, 115, ${0.10 + 0.10 * breath})`);
  glow.addColorStop(1, "rgba(255, 255, 255, 0)");

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

    const rr = p.baseRadius * (1 + 0.035 * Math.sin(time * 0.00023)) + wobble;
    const aa = p.angle + Math.sin(time * p.drift + p.phase) * 0.10;

    const x = CX + Math.cos(aa) * rr;
    const y = CY + Math.sin(aa) * rr;

    const radialDistance = Math.abs(rr - R);
    const ringStrength = Math.max(0, 1 - radialDistance / 85);

    const colorMix = 0.10 + breath * 0.18 + ringStrength * 0.18;
    const c = mixColor(teal, gold, Math.min(0.55, colorMix));

    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${p.alpha})`;
    ctx.fill();
  }
}

function drawSoftLine(x1, y1, x2, y2, alpha, width = 1) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = `rgba(18, 63, 67, ${alpha})`;
  ctx.lineWidth = width;
  ctx.stroke();
}

function drawGeometry(time, breath) {
  ctx.save();

  ctx.globalAlpha = 0.98;

  // Outer five points: strongly visible.
  for (const p of poles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(18, 87, 93, 0.42)";
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(p.x, p.y, 7.5, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 80, 86, 1)";
    ctx.fill();
  }

  // Couplings between neighboring poles.
  for (let i = 0; i < poles.length; i++) {
    const j = (i + 1) % poles.length;
    drawSoftLine(
      poles[i].x,
      poles[i].y,
      poles[j].x,
      poles[j].y,
      0.42,
      1.45
    );
  }

  // Softer cross-couplings between non-neighboring poles.
  for (let i = 0; i < poles.length; i++) {
    for (let j = i + 2; j < poles.length; j++) {
      if (!(i === 0 && j === 4)) {
        drawSoftLine(
          poles[i].x,
          poles[i].y,
          poles[j].x,
          poles[j].y,
          0.16,
          0.85
        );
      }
    }
  }

  // Former triad structure.
  const tri = [
    { x: CX, y: CY - R * 0.44 },
    { x: CX + R * 0.37, y: CY + R * 0.22 },
    { x: CX - R * 0.37, y: CY + R * 0.22 }
  ];

  drawSoftLine(tri[0].x, tri[0].y, tri[1].x, tri[1].y, 0.62, 1.65);
  drawSoftLine(tri[1].x, tri[1].y, tri[2].x, tri[2].y, 0.62, 1.65);
  drawSoftLine(tri[2].x, tri[2].y, tri[0].x, tri[0].y, 0.62, 1.65);

  for (const t of tri) {
    ctx.beginPath();
    ctx.arc(t.x, t.y, R * 0.14, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(18, 63, 67, 0.58)";
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(t.x, t.y, 5.4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(156, 112, 38, 0.98)";
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(CX, CY, 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(156, 112, 38, 1)";
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
