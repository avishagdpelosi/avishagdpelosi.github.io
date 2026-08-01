const canvas = document.getElementById("genesisCanvas");
const ctx = canvas.getContext("2d");

let W, H, CX, CY, R;
const particles = [];

const TAU = Math.PI * 2;

/* Main adjustable values */
const PARTICLE_COUNT =
  window.innerWidth <= 600 ? 8000 :
  window.innerWidth <= 950 ? 15000 :
  25000;

const SPIRAL_TURNS = 4.8;
/*
  Higher values place more particles toward the outside.
  Try values between 1.8 and 3.
*/
const OUTWARD_BIAS = 2.0;

/*
  Controls how diffuse the spiral becomes as it expands.
  Try values between 0.04 and 0.09.
*/

const SPIRAL_WIDTH = 0.105;

/*
  Minimum dispersion near the centre.
  Increase this if the central spiral line is still too visible.
*/
const INNER_SPREAD = 13;

/*
  Strength of the outward travelling pulse.
  Try values between 0.025 and 0.06.
*/

/*
  Controls the slow rotation of the whole spiral.
*/
const ROTATION_SPEED = 0.000008;

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

const motionScale = reducedMotion ? 0.18 : 1;

const colors = [
  "rgb(0, 52, 62)",
  "rgb(0, 78, 88)",
  "rgb(18, 112, 118)",
  "rgb(145, 94, 28)",
  "rgb(205, 151, 55)"
];

/*
  Coherent inward-outward movement of the entire spiral.
*/
const BREATH_STRENGTH = 0.16;
const BREATH_SPEED = 0.0012;


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


/*
  The centre remains slightly to the right so that the title
  retains its own space, but the spiral now occupies the
  complete landing page.
*/
if (W <= 800) {
  CX = W * 0.52;
  CY = H * 0.62;
} else {
  CX = W * 0.58;
  CY = H * 0.50;
}

/*
  The diagonal measurement allows the spiral to continue
  beyond every visible edge of the canvas.
*/
R = Math.hypot(W, H);
}

function selectColor() {
  const choice = Math.random();

  if (choice < 0.45) return 0;
  if (choice < 0.72) return 1;
  if (choice < 0.84) return 2;
  if (choice < 0.94) return 3;

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
     atmosphere: Math.random() < 0.30,
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

  const glowRadius =
    Math.min(W, H) * 0.68 * pulse;

  const glow = ctx.createRadialGradient(
    CX,
    CY,
    0,
    CX,
    CY,
    glowRadius
  );

glow.addColorStop(
  0,
  "rgba(255, 255, 255, 0.82)"
);

glow.addColorStop(
  0.12,
  "rgba(225, 247, 246, 0.14)"
);

glow.addColorStop(
  0.42,
  "rgba(26, 123, 128, 0.025)"
);

glow.addColorStop(
  1,
  "rgba(255, 255, 255, 0)"
);

  
  ctx.beginPath();
  ctx.arc(CX, CY, glowRadius, 0, TAU);
  ctx.fillStyle = glow;
  ctx.fill();
}

function drawParticles(time) {
  const minimumRadius =
    Math.min(W, H) * 0.012;

  /*
    The spiral continues beyond the visible page,
    preventing a visible outer endpoint.
  */
  const maximumRadius = R * 0.80;

  const logarithmicRange = Math.log(
    maximumRadius / minimumRadius
  );

  const rotation =
    time * ROTATION_SPEED * motionScale;

  /*
    The outward movement periodically accelerates
    and slows without reversing.
  */
  /*
  The dots briefly retreat along the spiral before
  continuing outward.
*/
/*
  The underlying spiral movement continues steadily outward.
*/
const pulsedTime = time;

/*
  All particles contract and expand together.
*/
const globalBreath =
  1 +
  Math.sin(time * BREATH_SPEED) *
    BREATH_STRENGTH *
    motionScale;
/*
  Ranges from 0 to 1 and remains synchronized
  with the global inward-outward movement.
*/
const globalSwell =
  (
    Math.sin(time * BREATH_SPEED) + 1
  ) / 2;
  /*
    Position of the pulse as it travels from the
    centre toward the outer edge.
  */
 
  for (const particle of particles) {
    const q =
      (
        particle.phase +
        pulsedTime *
          particle.speed *
          motionScale
      ) % 1;

    /*
      Particles pass quickly through the centre and
      remain longer toward the outer regions.
    */
    const progress =
      1 - Math.pow(1 - q, OUTWARD_BIAS);

    const atmosphere =
  particle.atmosphere
    ? smoothstep((progress - 0.25) / 0.65)
    : 0;

    const baseRadius =
      minimumRadius *
      Math.exp(logarithmicRange * progress);

    /*
      A substantial initial spread prevents the centre
      from appearing as a clearly defined line.
    */
    const spreading =
  (
    INNER_SPREAD +
    baseRadius * SPIRAL_WIDTH
  ) *
  (1 + atmosphere * 1.8);

    /*
      Distance between the particle and the travelling
      pulse front.
    */
   

    const radialWobble =
      Math.sin(
        time * particle.wobbleSpeed +
        particle.wobblePhase
      ) *
      (2 + progress * 4.5) *
      motionScale;

 const radius =
  baseRadius * globalBreath +
  particle.radialJitter * spreading +
  radialWobble;

    const spiralAngle =
      -Math.PI / 2 +
      TAU * SPIRAL_TURNS * progress +
      rotation;

    const angle =
      spiralAngle +
      particle.angularJitter *
  (0.06 + progress * 0.075) *
  (1 + atmosphere * 3)
      
        motionScale;

    const x =
      CX + Math.cos(angle) * radius;

    const y =
      CY + Math.sin(angle) * radius;

    const fadeIn =
      smoothstep(q / 0.045);

    const fadeOut =
      smoothstep((1 - q) / 0.04);

    const twinkle =
      0.65 +
      0.35 *
        Math.sin(
          time * particle.twinkleSpeed +
          particle.twinklePhase
        );

    /*
      The centre remains less accentuated than the
      outer spiral.
    */
    const centreSoftening =
      0.18 +
      0.82 *
        smoothstep(progress / 0.24);

    /*
      The pulse creates a visible wave of luminosity.
    */
   const pulseBrightness =
  0.65 +
  0.55 * globalSwell;

   const alpha = clamp(
  particle.alpha *
    fadeIn *
    fadeOut *
    twinkle *
    centreSoftening *
    pulseBrightness *
    1.5,
  0,
  0.92
);

    /*
      Dots swell slightly as the pulse passes.
    */
   const size =
  particle.size *
  (0.65 + progress * 0.5) *
  (0.82 + globalSwell * 0.5);

    ctx.fillStyle =
      colors[particle.color];

    if (particle.spark) {
      ctx.globalAlpha =
        alpha * 0.13;

      ctx.beginPath();
      ctx.arc(
        x,
        y,
        size * 4.2,
        0,
        TAU
      );
      ctx.fill();
    }

    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.arc(
      x,
      y,
      size,
      0,
      TAU
    );
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

  const coreRadius =
    Math.min(W, H) * 0.065 * pulse;

  const core = ctx.createRadialGradient(
    CX,
    CY,
    0,
    CX,
    CY,
    coreRadius
  );

core.addColorStop(
  0,
  "rgba(255, 255, 255, 0.98)"
);

core.addColorStop(
  0.3,
  "rgba(218, 245, 244, 0.28)"
);

core.addColorStop(
  1,
  "rgba(0, 98, 106, 0)"
);

  ctx.beginPath();
  ctx.arc(CX, CY, coreRadius, 0, TAU);
  ctx.fillStyle = core;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(CX, CY, 2.6 * pulse, 0, TAU);
 ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
  ctx.fill();
}


function animate(time) {
  ctx.clearRect(0, 0, W, H);

 
  drawParticles(time);


  requestAnimationFrame(animate);
}


resize();
initParticles();
requestAnimationFrame(animate);


window.addEventListener("resize", () => {
  resize();
  initParticles();
});
