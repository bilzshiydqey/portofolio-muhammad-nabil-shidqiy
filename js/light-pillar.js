/* ============================================
   LIGHT PILLAR HERO ANIMATION
   Ported from React LightPillar component
   into standalone vanilla JS using Three.js.
   ============================================ */

import * as THREE from 'three';

(function () {
  "use strict";

  /* ---- Config ---- */
  const CONFIG = {
    topColor: '#5227FF',
    bottomColor: '#9ffaff',
    intensity: 1,
    rotationSpeed: 0.9,
    glowAmount: 0.002,
    pillarWidth: 2.4,
    pillarHeight: 0.4,
    noiseIntensity: 0.5,
    pillarRotation: 89,
    interactive: false,
    mixBlendMode: 'screen',
    quality: 'high'
  };

  const container = document.getElementById('light-pillar-container');
  if (!container) return;

  /* ---- WebGL Support Check ---- */
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
  if (!gl) {
    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#888;font-size:14px;">WebGL not supported</div>';
    return;
  }

  /* ---- Setup ---- */
  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowEndDevice = isMobile || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

  let effectiveQuality = CONFIG.quality;
  if (isLowEndDevice && effectiveQuality === 'high') effectiveQuality = 'medium';
  if (isMobile && effectiveQuality !== 'low') effectiveQuality = 'low';

  const qualitySettings = {
    low: { iterations: 24, waveIterations: 1, pixelRatio: 0.5, precision: 'mediump', stepMultiplier: 1.5 },
    medium: { iterations: 40, waveIterations: 2, pixelRatio: 0.65, precision: 'mediump', stepMultiplier: 1.2 },
    high: {
      iterations: 80,
      waveIterations: 4,
      pixelRatio: Math.min(window.devicePixelRatio, 2),
      precision: 'highp',
      stepMultiplier: 1.0
    }
  };

  const settings = qualitySettings[effectiveQuality] || qualitySettings.medium;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: effectiveQuality === 'high' ? 'high-performance' : 'low-power',
      precision: settings.precision,
      stencil: false,
      depth: false
    });
  } catch (error) {
    container.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#888;font-size:14px;">WebGL initialization failed</div>';
    return;
  }

  renderer.setSize(width, height);
  renderer.setPixelRatio(settings.pixelRatio);
  container.appendChild(renderer.domElement);

  /* ---- Apply blend mode ---- */
  container.style.mixBlendMode = CONFIG.mixBlendMode;

  /* ---- Color Parser ---- */
  const parseColor = (hex) => {
    const color = new THREE.Color(hex);
    return new THREE.Vector3(color.r, color.g, color.b);
  };

  /* ---- Shaders ---- */
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    precision ${settings.precision} float;

    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uMouse;
    uniform vec3 uTopColor;
    uniform vec3 uBottomColor;
    uniform float uIntensity;
    uniform bool uInteractive;
    uniform float uGlowAmount;
    uniform float uPillarWidth;
    uniform float uPillarHeight;
    uniform float uNoiseIntensity;
    uniform float uRotCos;
    uniform float uRotSin;
    uniform float uPillarRotCos;
    uniform float uPillarRotSin;
    uniform float uWaveSin;
    uniform float uWaveCos;
    varying vec2 vUv;

    const float STEP_MULT = ${settings.stepMultiplier.toFixed(1)};
    const int MAX_ITER = ${settings.iterations};
    const int WAVE_ITER = ${settings.waveIterations};

    void main() {
      vec2 uv = (vUv * 2.0 - 1.0) * vec2(uResolution.x / uResolution.y, 1.0);
      uv = vec2(uPillarRotCos * uv.x - uPillarRotSin * uv.y, uPillarRotSin * uv.x + uPillarRotCos * uv.y);

      vec3 ro = vec3(0.0, 0.0, -10.0);
      vec3 rd = normalize(vec3(uv, 1.0));

      float rotC = uRotCos;
      float rotS = uRotSin;
      if(uInteractive && (uMouse.x != 0.0 || uMouse.y != 0.0)) {
        float a = uMouse.x * 6.283185;
        rotC = cos(a);
        rotS = sin(a);
      }

      vec3 col = vec3(0.0);
      float t = 0.1;
      
      for(int i = 0; i < MAX_ITER; i++) {
        vec3 p = ro + rd * t;
        p.xz = vec2(rotC * p.x - rotS * p.z, rotS * p.x + rotC * p.z);

        vec3 q = p;
        q.y = p.y * uPillarHeight + uTime;
        
        float freq = 1.0;
        float amp = 1.0;
        for(int j = 0; j < WAVE_ITER; j++) {
          q.xz = vec2(uWaveCos * q.x - uWaveSin * q.z, uWaveSin * q.x + uWaveCos * q.z);
          q += cos(q.zxy * freq - uTime * float(j) * 2.0) * amp;
          freq *= 2.0;
          amp *= 0.5;
        }
        
        float d = length(cos(q.xz)) - 0.2;
        float bound = length(p.xz) - uPillarWidth;
        float k = 4.0;
        float h = max(k - abs(d - bound), 0.0);
        d = max(d, bound) + h * h * 0.0625 / k;
        d = abs(d) * 0.15 + 0.01;

        float grad = clamp((15.0 - p.y) / 30.0, 0.0, 1.0);
        col += mix(uBottomColor, uTopColor, grad) / d;

        t += d * STEP_MULT;
        if(t > 50.0) break;
      }

      float widthNorm = uPillarWidth / 3.0;
      col = tanh(col * uGlowAmount / widthNorm);
      
      col -= fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 15.0 * uNoiseIntensity;
      
      gl_FragColor = vec4(col * uIntensity, 1.0);
    }
  `;

  /* ---- Material ---- */
  const pillarRotRad = (CONFIG.pillarRotation * Math.PI) / 180;
  const waveSin = Math.sin(0.4);
  const waveCos = Math.cos(0.4);

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uTopColor: { value: parseColor(CONFIG.topColor) },
      uBottomColor: { value: parseColor(CONFIG.bottomColor) },
      uIntensity: { value: CONFIG.intensity },
      uInteractive: { value: CONFIG.interactive },
      uGlowAmount: { value: CONFIG.glowAmount },
      uPillarWidth: { value: CONFIG.pillarWidth },
      uPillarHeight: { value: CONFIG.pillarHeight },
      uNoiseIntensity: { value: CONFIG.noiseIntensity },
      uRotCos: { value: 1.0 },
      uRotSin: { value: 0.0 },
      uPillarRotCos: { value: Math.cos(pillarRotRad) },
      uPillarRotSin: { value: Math.sin(pillarRotRad) },
      uWaveSin: { value: waveSin },
      uWaveCos: { value: waveCos }
    },
    transparent: true,
    depthWrite: false,
    depthTest: false
  });

  /* ---- Mesh ---- */
  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  /* ---- Mouse Interaction ---- */
  let mouseMoveTimeout = null;
  const handleMouseMove = (event) => {
    if (!CONFIG.interactive) return;
    if (mouseMoveTimeout) return;
    mouseMoveTimeout = window.setTimeout(() => {
      mouseMoveTimeout = null;
    }, 16);
    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    material.uniforms.uMouse.value.set(x, y);
  };

  if (CONFIG.interactive) {
    container.addEventListener('mousemove', handleMouseMove, { passive: true });
  }

  /* ---- Scroll Handler ---- */
  let isScrolling = false;
  let scrollTimeout = null;
  const handleScroll = () => {
    if (isMobile) return; // No scroll tracking needed on mobile since it is frozen
    isScrolling = true;
    if (scrollTimeout) clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(() => {
      isScrolling = false;
    }, 150);
  };
  window.addEventListener('scroll', handleScroll, { passive: true });

  /* ---- Animation Loop ---- */
  let time = 0;
  let lastTime = performance.now();
  let rafId = null;
  const targetFPS = effectiveQuality === 'low' ? 30 : 60;
  const frameTime = 1000 / targetFPS;

  const animate = (currentTime) => {
    if (isMobile) {
      // Render once to draw the static background, then stop animating entirely
      renderer.render(scene, camera);
      return;
    }

    const deltaTime = currentTime - lastTime;

    if (deltaTime >= frameTime) {
      if (isScrolling) {
        time += 0.016 * CONFIG.rotationSpeed;
        material.uniforms.uTime.value = time;
        material.uniforms.uRotCos.value = Math.cos(time * 0.3);
        material.uniforms.uRotSin.value = Math.sin(time * 0.3);
      }
      renderer.render(scene, camera);
      lastTime = currentTime - (deltaTime % frameTime);
    }

    rafId = requestAnimationFrame(animate);
  };
  rafId = requestAnimationFrame(animate);

  /* ---- Resize Handler ---- */
  let resizeTimeout = null;
  let lastWidth = window.innerWidth;
  const handleResize = () => {
    if (isMobile) {
      // On mobile, only trigger resize if horizontal width actually changes (orientation change)
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
    }

    if (resizeTimeout) clearTimeout(resizeTimeout);

    resizeTimeout = window.setTimeout(() => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      renderer.setSize(newWidth, newHeight);
      material.uniforms.uResolution.value.set(newWidth, newHeight);
    }, 150);
  };

  window.addEventListener('resize', handleResize, { passive: true });

  /* ---- Cleanup on page unload ---- */
  window.addEventListener('beforeunload', () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('scroll', handleScroll);
    if (CONFIG.interactive) {
      container.removeEventListener('mousemove', handleMouseMove);
    }
    if (rafId) cancelAnimationFrame(rafId);
    renderer.dispose();
    renderer.forceContextLoss();
    material.dispose();
    geometry.dispose();
  });

})();
