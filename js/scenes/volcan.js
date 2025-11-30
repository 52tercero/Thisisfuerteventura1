// scenes/volcan.js
// Artistic low-poly volcano with symbolic breathing glow and heat distortion
(function () {
  if (!window.THREE) {
    return;
  }
  const THREE = window.THREE;
  const container = document.querySelector('#scene-volcan');
  if (!container) {
    return;
  }

  const isReduced = (window.__ANIMATIONS__ && window.__ANIMATIONS__.isReduced)
    ? window.__ANIMATIONS__.isReduced()
    : false;

  // === RENDERER ===
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x1a0f08, 0.3);
  container.appendChild(renderer.domElement);

  // === SCENE & CAMERA ===
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    54,
    container.clientWidth / container.clientHeight,
    0.1,
    120
  );
  camera.position.set(0.4, 1.35, 2.4);

  // === LIGHTING: Volcanic warmth ===
  scene.add(new THREE.AmbientLight(0x3d2817, 0.5));
  const warmLight = new THREE.DirectionalLight(0xffa060, 0.7);
  warmLight.position.set(1.8, 2.5, 1.3);
  scene.add(warmLight);

  const rimLight = new THREE.DirectionalLight(0x4d7c8a, 0.3);
  rimLight.position.set(-1.5, 0.5, -1);
  scene.add(rimLight);

  // === VOLCANO GEOMETRY: Low-poly cone ===
  const volcanoGeo = new THREE.ConeGeometry(0.9, 1.6, 7, 2);
  const volcanoMat = new THREE.MeshStandardMaterial({
    color: 0x4a3728,
    roughness: 0.92,
    metalness: 0.05,
    flatShading: true,
  });
  const volcano = new THREE.Mesh(volcanoGeo, volcanoMat);
  volcano.position.y = 0.75;
  volcano.castShadow = true;
  scene.add(volcano);

  // === CRATER GLOW: Symbolic heat with breathing shader ===
  const glowGeo = new THREE.PlaneGeometry(0.72, 0.72);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uIntensity: { value: isReduced ? 0.15 : 0.75 },
      uScrollProgress: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform float uIntensity;
      uniform float uScrollProgress;
      
      varying vec2 vUv;

      void main() {
        // Breathing pulse
        float breath = 0.5 + 0.5 * sin(uTime * 1.5);
        
        // Radial gradient from center (crater)
        vec2 centered = vUv - 0.5;
        float dist = length(centered) * 2.0;
        
        // Heat shimmer effect
        float shimmer = sin(uTime * 2.2 + dist * 5.0) * 0.3 + 0.7;
        
        // Scroll-driven intensity
        float intensity = mix(0.3, 1.1, uScrollProgress) * uIntensity * breath;
        
        // Core color: deep red to orange gradient
        vec3 coreColor = mix(
          vec3(0.8, 0.2, 0.05),  // Deep red
          vec3(1.0, 0.5, 0.1),   // Orange
          breath * 0.5 + 0.5
        );
        
        // Outer glow fade
        float alpha = (1.0 - dist) * intensity * 0.85;
        alpha *= smoothstep(1.0, 0.3, dist);
        
        vec3 finalColor = coreColor * shimmer;
        
        gl_FragColor = vec4(finalColor, max(0.0, alpha));
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
  });

  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, 1.5, 0.05);
  glow.scale.set(1.0, 1.0, 1.0);
  scene.add(glow);

  // === LAVA PARTICLES: Symbolic heat rising ===
  const particleCount = isReduced ? 80 : 300;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(particleCount * 3);
  const particleVel = new Float32Array(particleCount * 3);
  const particleLife = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const radius = Math.random() * 0.2;

    particlePos[i * 3] = Math.cos(angle) * radius; // x
    particlePos[i * 3 + 1] = 0.3 + Math.random() * 0.2; // y
    particlePos[i * 3 + 2] = Math.sin(angle) * radius; // z

    particleVel[i * 3] = (Math.random() - 0.5) * 0.01;
    particleVel[i * 3 + 1] = 0.008 + Math.random() * 0.012;
    particleVel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;

    particleLife[i] = Math.random();
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
  particleGeo.setAttribute('velocity', new THREE.BufferAttribute(particleVel, 3));
  particleGeo.setAttribute('life', new THREE.BufferAttribute(particleLife, 1));

  const particleMat = new THREE.PointsMaterial({
    color: 0xff6b35,
    size: 0.04,
    transparent: true,
    opacity: 0.6,
    sizeAttenuation: true,
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // === RESIZE HANDLER ===
  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  // === ANIMATION LOOP ===
  let t = 0;
  function animate() {
    t += 0.016;

    // Volcano subtle rotation
    volcano.rotation.y += 0.0008;

    // Update glow shader
    glowMat.uniforms.uTime.value = t;

    // Animate particles
    const pPos = particleGeo.attributes.position.array;
    const pVel = particleGeo.attributes.velocity.array;
    const pLife = particleGeo.attributes.life.array;

    for (let i = 0; i < particleCount; i++) {
      const idx = i * 3;
      pLife[i] += 0.008;

      if (pLife[i] > 1.0) {
        pLife[i] = 0;
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.2;
        pPos[idx] = Math.cos(angle) * radius;
        pPos[idx + 1] = 0.3;
        pPos[idx + 2] = Math.sin(angle) * radius;
      }

      pPos[idx] += pVel[idx];
      pPos[idx + 1] += pVel[idx + 1];
      pPos[idx + 2] += pVel[idx + 2];
    }

    particleGeo.attributes.position.needsUpdate = true;
    particleGeo.attributes.life.needsUpdate = true;

    renderer.render(scene, camera);
    if (!isReduced) {
      requestAnimationFrame(animate);
    }
  }
  animate();

  // === SCROLL SYNC ===
  if (!isReduced && window.gsap && window.ScrollTrigger) {
    window.ScrollTrigger.create({
      trigger: container,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.7,
      onUpdate: (self) => {
        const prog = self.progress;
        glowMat.uniforms.uIntensity.value = 0.25 + prog * 0.85;
        glowMat.uniforms.uScrollProgress.value = prog;

        // Pulse volcano on scroll
        volcano.scale.set(1 + prog * 0.08, 1 + prog * 0.05, 1 + prog * 0.08);
      },
    });
  }

  // === CLEANUP ===
  window.__CLEANUP__ = window.__CLEANUP__ || [];
  window.__CLEANUP__.push(() => {
    renderer.dispose();
    volcanoGeo.dispose();
    volcanoMat.dispose();
    glowGeo.dispose();
    glowMat.dispose();
    particleGeo.dispose();
    particleMat.dispose();
  });
})();
