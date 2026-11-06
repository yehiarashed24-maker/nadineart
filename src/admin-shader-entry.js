import {
  ShaderMount,
  getShaderColorFromString,
  getShaderNoiseTexture,
  warpFragmentShader,
  ShaderFitOptions,
  WarpPatterns
} from "@paper-design/shaders";

async function initWarpShader() {
  const container = document.getElementById("adminShaderCanvas");
  if (!container) return;

  // 21st.dev Component exact colors
  const colors = [
    "hsl(200, 100%, 20%)",
    "hsl(160, 100%, 75%)",
    "hsl(180, 90%, 30%)",
    "hsl(170, 100%, 80%)"
  ];

  try {
    // 1. Safely load & decode noise texture to prevent unhandled rejection
    let noiseTexture = getShaderNoiseTexture();
    if (noiseTexture) {
      if (noiseTexture.decode) {
        try {
          await noiseTexture.decode();
        } catch (e) {}
      } else if (!noiseTexture.complete) {
        await new Promise((resolve) => {
          noiseTexture.onload = resolve;
          noiseTexture.onerror = resolve;
          setTimeout(resolve, 350);
        });
      }
    }

    const uniforms = {
      u_colors: colors.map(getShaderColorFromString),
      u_colorsCount: colors.length,
      u_proportion: 0.45,
      u_softness: 1.0,
      u_distortion: 0.25,
      u_swirl: 0.8,
      u_swirlIterations: 10,
      u_shapeScale: 0.1,
      u_shape: WarpPatterns.checks,
      u_noiseTexture: noiseTexture,
      u_scale: 1.0,
      u_rotation: 0,
      u_fit: ShaderFitOptions.none,
      u_offsetX: 0,
      u_offsetY: 0,
      u_originX: 0.5,
      u_originY: 0.5,
      u_worldWidth: 0,
      u_worldHeight: 0
    };

    // 2. Mount WebGL2 Shader
    window.adminShaderMount = new ShaderMount(
      container,
      warpFragmentShader,
      uniforms,
      { alpha: true, antialias: true },
      1.0,
      0
    );
  } catch (err) {
    console.warn("Warp WebGL fallback active:", err);
    startCanvasFallback(container);
  }
}

// Resilient 60fps Silk Gradient Fallback if WebGL2 is unsupported or context lost
function startCanvasFallback(container) {
  if (!container) return;
  if (container.querySelector("canvas")) return;

  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;";
  container.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  let t = 0;
  function render() {
    t += 0.008;
    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#03141f";
    ctx.fillRect(0, 0, w, h);

    const g1 = ctx.createRadialGradient(
      w * (0.35 + 0.2 * Math.sin(t * 0.8)),
      h * (0.35 + 0.2 * Math.cos(t * 0.9)),
      0,
      w * 0.5,
      h * 0.5,
      w * 0.75
    );
    g1.addColorStop(0, "rgba(80, 255, 195, 0.45)");
    g1.addColorStop(0.55, "rgba(6, 120, 150, 0.35)");
    g1.addColorStop(1, "transparent");

    const g2 = ctx.createRadialGradient(
      w * (0.65 - 0.2 * Math.cos(t * 0.7)),
      h * (0.65 - 0.2 * Math.sin(t * 0.85)),
      0,
      w * 0.55,
      h * 0.55,
      w * 0.8
    );
    g2.addColorStop(0, "rgba(140, 255, 230, 0.4)");
    g2.addColorStop(0.6, "rgba(0, 60, 85, 0.4)");
    g2.addColorStop(1, "transparent");

    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, w, h);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initWarpShader);
} else {
  initWarpShader();
}
