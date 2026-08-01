const canvas = document.getElementById("genesisCanvas");
const ctx = canvas.getContext("2d");

let W, H, CX, CY, R;
const particles = [];

const TAU = Math.PI * 2;

/* Main adjustable values */

const PARTICLE_COUNT =
  window.innerWidth <= 600 ? 6500 :
  window.innerWidth <= 950 ? 11000 :
  18000;

const SPIRAL_TURNS = 3.2;

/*
  Higher values place more particles toward the outside.
  Try values between 1.8 and 3.
*/
const OUTWARD_BIAS = 2.35;

/*
  Controls how diffuse the spiral becomes as it expands.
  Try values between 0.04 and 0.09.
*/
const SPIRAL_WIDTH = 0.065;

/*
  Controls the slow rotation of the whole spiral.
*/
const ROTATION_SPEED = 0.000018;

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const motionScale = reducedMotion ? 0.18 : 1;

const colors = [
  "rgb(0, 72, 82)",
  "rgb(5, 96, 105)",
  "rgb(35, 119, 124)",
  "rgb(120, 94, 48)",
  "rgb(176, 133, 55)"
];


function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}


function smoothstep(value) {
  value = clamp(value, 0, 1);
  return value * value * (3 - 2 * value);
}


function randomGaussian() {
  let u = 0;
  let v = 0;

  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();

  return (
    Math.sqrt(-2 * Math.log(u)) *
    Math.cos(TAU * v)
  );
}


function resize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  W = rect.width;
  H = rect.height;

  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  CX = W / 2;
  CY = H / 2;

  R = Math.min(W, H) * 0.44;
}


function selectColor() {
  const choice = Math.random();

  if (choice < 0.50) return 0;
  if (choice < 0.78) return 1;
  if (choice < 0.91) return 2;
  if (choice < 0.97) return 3;

  return 4;
}


function initParticles() {
  particles.length = 0;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const emphasis = Math.random();

    particles.push({
      /*
        phase determines where the particle begins in its
        journey from the centre to the outside.
      */
      phase: Math.random(),

      /*
        Each particle moves outward at a slightly different rate.
        A complete journey takes approximately 50-95 seconds.
      */
      speed: 1 / (50000 + Math.random() * 45000),

      radialJitter: randomGaussian(),
      angularJitter: randomGaussian(),

      wobblePhase: Math.random() * TAU,
      wobbleSpeed: 0.00025 + Math.random() * 0.00055,

      twinklePhase: Math.random() * TAU,
      twinkleSpeed: 0.001 + Math.random() * 0.0025,

      size:
        emphasis < 0.84
          ? 0.35 + Math.random() * 0.65
          : 0.9 + Math.random() * 1.25,

      alpha:
        emphasis < 0.84
          ? 0.12 + Math.random() * 0.28
          : 0.32 + Math.random() * 0.38,

      color: selectColor(),

      /*
        A small proportion of particles receive a faint halo.
      */
      spark: Math.random() < 0.012
    });
  }
}


function drawCentralGlow(time) {
  const pulse =
    1 + Math.sin(time * 0.0007) * 0.035 * motionScale;

  const glow = ctx.createRadialGradient(
    CX,
    CY,
    0,
    CX,
    CY,
    R * 1.18 * pulse
  );

  glow.addColorStop(
    0,
    "rgba(255, 255, 249, 0.98)"
  );

  glow.addColorStop(
    0.12,
    "rgba(247, 222, 164, 0.22)"
  );

  glow.addColorStop(
    0.42,
    "rgba(26, 123, 128, 0.055)"
  );

  glow.addColorStop(
    1,
    "rgba(255, 255, 255, 0)"
  );

  ctx.beginPath();
  ctx.arc(CX, CY, R * 1.25, 0, TAU);
  ctx.fillStyle = glow;
  ctx.fill();
}


function drawParticles(time) {
  const minimumRadius = R * 0.018;
  const maximumRadius = R * 1.02;

  const logarithmicRange = Math.log(
    maximumRadius / minimumRadius
  );

  const rotation =
    time * ROTATION_SPEED * motionScale;

  const breath =
    1 +
    Math.sin(time * 0.00065) *
      0.014 *
      motionScale;

  for (const particle of particles) {
    /*
      q moves continuously from 0 to 1.
      At 1, the particle returns to the centre.
    */
    const q =
      (
        particle.phase +
        time * particle.speed * motionScale
      ) % 1;

    /*
      This easing causes particles to move quickly through
      the centre and spend more time near the outside.
      The visible number of dots therefore increases with radius.
    */
    const progress =
      1 - Math.pow(1 - q, OUTWARD_BIAS);

    /*
      r = a × e^(bθ), the logarithmic spiral equation.
    */
    const baseRadius =
      minimumRadius *
      Math.exp(logarithmicRange * progress);

    const spreading =
      2 +
      baseRadius * SPIRAL_WIDTH;

    const radialWobble =
      Math.sin(
        time * particle.wobbleSpeed +
        particle.wobblePhase
      ) *
      (1.2 + progress * 3.5) *
      motionScale;

    const radius =
      baseRadius * breath +
      particle.radialJitter * spreading +
      radialWobble;

    const spiralAngle =
      -Math.PI / 2 +
      TAU * SPIRAL_TURNS * progress +
      rotation;

    const angle =
      spiralAngle +
      particle.angularJitter *
        (0.012 + progress * 0.075) +
      Math.sin(
        time * particle.wobbleSpeed * 0.7 +
        particle.wobblePhase
      ) *
        0.008 *
        motionScale;

    const x = CX + Math.cos(angle) * radius;
    const y = CY + Math.sin(angle) * radius;

    /*
      Particles fade in near the centre and fade out
      before returning to the beginning.
    */
    const fadeIn = smoothstep(q / 0.045);
    const fadeOut = smoothstep((1 - q) / 0.04);

    const twinkle =
      0.65 +
      0.35 *
        Math.sin(
          time * particle.twinkleSpeed +
          particle.twinklePhase
        );

    const alpha =
      particle.alpha *
      fadeIn *
      fadeOut *
      twinkle;

    const size =
      particle.size *
      (0.7 + progress * 0.45);

    ctx.fillStyle = colors[particle.color];

    if (particle.spark) {
      ctx.globalAlpha = alpha * 0.13;

      ctx.beginPath();
      ctx.arc(x, y, size * 4.2, 0, TAU);
      ctx.fill();
    }

    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, TAU);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}


function drawCore(time) {
  const pulse =
    1 +
    Math.sin(time * 0.0011) *
      0.12 *
      motionScale;

  const core = ctx.createRadialGradient(
    CX,
    CY,
    0,
    CX,
    CY,
    R * 0.085 * pulse
  );

  core.addColorStop(
    0,
    "rgba(255, 253, 235, 0.95)"
  );

  core.addColorStop(
    0.3,
    "rgba(205, 157, 68, 0.28)"
  );

  core.addColorStop(
    1,
    "rgba(0, 98, 106, 0)"
  );

  ctx.beginPath();
  ctx.arc(CX, CY, R * 0.09 * pulse, 0, TAU);
  ctx.fillStyle = core;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(CX, CY, 2.6 * pulse, 0, TAU);
  ctx.fillStyle = "rgba(117, 88, 37, 0.72)";
  ctx.fill();
}


function animate(time) {
  ctx.clearRect(0, 0, W, H);

  drawCentralGlow(time);
  drawParticles(time);
  drawCore(time);

  requestAnimationFrame(animate);
}


resize();
initParticles();
requestAnimationFrame(animate);


window.addEventListener("resize", () => {
  resize();
  initParticles();
});
