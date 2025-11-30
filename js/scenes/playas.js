// scenes/playas.js
// Artistic wave shader plane representing Fuerteventura beaches with multi-layered animation
(function () {
  if (!window.THREE) {
    return;
  }
  const THREE = window.THREE;
  const container = document.querySelector('#scene-playas');
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
  renderer.setClearColor(0x0a1929, 0.2);
  container.appendChild(renderer.domElement);

  // === SCENE & CAMERA ===
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    56,
    container.clientWidth / container.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0.8, 1.9);
  camera.lookAt(0, 0, 0);

  // === LIGHTING ===
  scene.add(new THREE.AmbientLight(0x668899, 0.5));
  const sunLight = new THREE.DirectionalLight(0xd4e8ff, 0.6);
  sunLight.position.set(1.2, 1.5, 1.0);
  scene.add(sunLight);

  // === WAVE GEOMETRY & SHADER MATERIAL ===
  const geom = new THREE.PlaneGeometry(5, 2.2, 256, 128);

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(0x4db8e8) }, // shallow turquoise
      uColorB: { value: new THREE.Color(0x0d5c99) }, // deep ocean blue
      uColorFoam: { value: new THREE.Color(0xffffff) },
      uIntensity: { value: isReduced ? 0.2 : 0.8 },
      uScrollProgress: { value: 0 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uIntensity;
      uniform float uScrollProgress;
      
      varying float vWave;
      varying float vHeight;
      varying vec3 vPos;

      void main() {
        vec3 p = position;
        
        // Multi-layered waves for natural ocean motion
        float wave1 = sin(p.x * 2.2 + uTime * 1.3) * 0.08;
        float wave2 = cos(p.y * 1.6 + uTime * 0.85) * 0.05;
        float wave3 = sin((p.x + p.y) * 1.1 + uTime * 1.1) * 0.04;
        
        // Scroll modulation: increase wave height as user scrolls
        float scrollMod = mix(0.5, 1.2, uScrollProgress);
        
        float height = (wave1 + wave2 + wave3) * uIntensity * scrollMod;
        p.z += height;
        
        vWave = height;
        vHeight = p.y;
        vPos = p;
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying float vWave;
      varying float vHeight;
      varying vec3 vPos;
      
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorFoam;

      void main() {
        // Wave-based color mixing
        float waveAmount = smoothstep(-0.08, 0.12, vWave);
        
        // Depth-based color: shallow = turquoise, deep = blue
        float depthAmount = smoothstep(-1.1, 1.1, vHeight);
        
        // Foam crest highlighting
        float foam = smoothstep(0.06, 0.12, vWave) * 0.7;
        
        vec3 baseColor = mix(uColorA, uColorB, depthAmount);
        vec3 col = mix(baseColor, uColorFoam, foam);
        
        // Subtle shimmer from wave height
        float shimmer = pow(abs(vWave), 0.5) * 0.15;
        col += shimmer;
        
        gl_FragColor = vec4(col, 0.92);
      }
    `,
    transparent: true,
  });

  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 3.2;
  scene.add(mesh);

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
    mat.uniforms.uTime.value = t;
    renderer.render(scene, camera);
    if (!isReduced) {
      requestAnimationFrame(animate);
    }
  }
  animate();

  // === SCROLL SYNC: Intensity & color modulation ===
  if (!isReduced && window.gsap && window.ScrollTrigger) {
    window.ScrollTrigger.create({
      trigger: container,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.7,
      onUpdate: (self) => {
        const prog = self.progress;
        mat.uniforms.uIntensity.value = 0.25 + prog * 0.75;
        mat.uniforms.uScrollProgress.value = prog;

        // Color shift: more vibrant as you scroll down
        const colorShift = prog;
        mat.uniforms.uColorA.value.setHSL(0.55 - colorShift * 0.05, 0.7, 0.45);
        mat.uniforms.uColorB.value.setHSL(0.6 - colorShift * 0.1, 0.85, 0.35);
      },
    });
  }

  // === CLEANUP ===
  window.__CLEANUP__ = window.__CLEANUP__ || [];
  window.__CLEANUP__.push(() => {
    renderer.dispose();
    geom.dispose();
    mat.dispose();
  });
})();
