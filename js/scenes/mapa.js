// scenes/mapa.js
// Artistic low-poly map of Fuerteventura with wind particles and symbolic landmarks
(function () {
  if (!window.THREE) {
    return;
  }
  const THREE = window.THREE;
  const container = document.querySelector('#scene-mapa');
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
  renderer.setClearColor(0x1a1a2e, 0.1);
  container.appendChild(renderer.domElement);

  // === SCENE & CAMERA ===
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(0, 2.0, 3.5);

  // === LIGHTING: Warm island sunlight ===
  const sunLight = new THREE.DirectionalLight(0xffe8a8, 0.85);
  sunLight.position.set(2.5, 3.5, 2.2);
  sunLight.castShadow = true;
  scene.add(sunLight);

  const ambientLight = new THREE.AmbientLight(0x8899aa, 0.4);
  scene.add(ambientLight);

  // Subtle rim light for island silhouette
  const rimLight = new THREE.DirectionalLight(0x4d7ea8, 0.25);
  rimLight.position.set(-2, 1.5, -1);
  scene.add(rimLight);

  // === ISLAND GEOMETRY: Low-poly with symbolic height map ===
  const islandGeo = new THREE.PlaneGeometry(2.8, 0.95, 72, 20);
  islandGeo.rotateX(-Math.PI / 2);

  const pos = islandGeo.attributes.position;
  const vertexData = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    // Mountain ridge (Pico de la Zarza)
    const ridge = Math.exp(-(x * x / 2.2 + z * z / 0.5)) * 0.42;

    // Southern bump (Jandía)
    const jandia = Math.exp(-((x - 0.8) * (x - 0.8) / 0.8 + (z + 0.3) * (z + 0.3) / 0.6)) * 0.25;

    // Northern plateau (Corralejo)
    const corralejo = Math.exp(-((x + 1.0) * (x + 1.0) / 1.0 + (z - 0.2) * (z - 0.2) / 0.7)) * 0.18;

    // Volcanic undulations (symbolic)
    const volcanic = (Math.sin(x * 2.8) + Math.cos(z * 3.2)) * 0.025;

    const height = ridge + jandia + corralejo + volcanic;
    pos.setY(i, height);
    vertexData.push({ height, idx: i });
  }
  pos.needsUpdate = true;

  // === ISLAND MATERIAL: Sandy with detail ===
  const islandMat = new THREE.MeshStandardMaterial({
    color: 0xe8d4a8,
    roughness: 0.92,
    metalness: 0.0,
    flatShading: true,
  });
  const island = new THREE.Mesh(islandGeo, islandMat);
  island.castShadow = true;
  island.receiveShadow = true;
  scene.add(island);

  // === WIND PARTICLES: Flowing atmosphere ===
  const particleCount = isReduced ? 250 : 1200;
  const windGeo = new THREE.BufferGeometry();
  const windPos = new Float32Array(particleCount * 3);
  const windVel = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    windPos[i * 3 + 0] = (Math.random() - 0.5) * 3.5; // x
    windPos[i * 3 + 1] = 0.12 + Math.random() * 0.35; // y
    windPos[i * 3 + 2] = (Math.random() - 0.5) * 1.8; // z

    windVel[i * 3 + 0] = (Math.random() - 0.5) * 0.008;
    windVel[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
    windVel[i * 3 + 2] = (Math.random() - 0.5) * 0.01;
  }

  windGeo.setAttribute('position', new THREE.BufferAttribute(windPos, 3));
  windGeo.setAttribute('velocity', new THREE.BufferAttribute(windVel, 3));

  const windMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.018,
    transparent: true,
    opacity: 0.65,
    sizeAttenuation: true,
  });
  const wind = new THREE.Points(windGeo, windMat);
  scene.add(wind);

  // === SYMBOLIC LANDMARKS (low-poly): Peaks ===
  function createPeak(pos, size, color) {
    const geo = new THREE.ConeGeometry(size * 0.15, size * 0.8, 5, 1);
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.88,
      flatShading: true,
    });
    const cone = new THREE.Mesh(geo, mat);
    cone.position.copy(pos);
    cone.castShadow = true;
    return cone;
  }

  scene.add(createPeak(new THREE.Vector3(0, 0.5, 0.05), 0.6, 0xb8956e)); // Central peak
  scene.add(createPeak(new THREE.Vector3(0.75, 0.3, -0.28), 0.35, 0xc9a876)); // Jandía

  // === SCROLL-LINKED CAMERA ANIMATION ===
  const updateScroll = (s) => {
    camera.position.z = 3.5 - s * 1.0;
    camera.position.y = 2.0 + s * 0.4;
    camera.position.x = s * 0.3;
    camera.lookAt(island.position);
  };

  if (!isReduced && window.gsap && window.ScrollTrigger) {
    window.ScrollTrigger.create({
      trigger: container,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1.0,
      onUpdate: (self) => updateScroll(self.progress),
    });
  }

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

    // Rotate island subtly
    island.rotation.y += 0.00015;

    // Animate wind particles with Perlin-like flow
    const p = windGeo.attributes.position.array;
    const v = windGeo.attributes.velocity.array;

    for (let i = 0; i < p.length; i += 3) {
      const idx = i / 3;
      const wave = Math.sin(t * 0.6 + idx * 0.01) * 0.002;
      const meander = Math.cos(t * 0.3 + idx * 0.015) * 0.0015;

      v[i] = (Math.sin(t * 0.4 + idx * 0.008) - 0.5) * 0.008 + wave;
      v[i + 2] = (Math.cos(t * 0.5 + idx * 0.012) - 0.5) * 0.01 + meander;

      p[i] += v[i];
      p[i + 1] += v[i + 1];
      p[i + 2] += v[i + 2];

      // Wrap particles
      if (p[i] > 1.75) p[i] = -1.75;
      if (p[i] < -1.75) p[i] = 1.75;
      if (p[i + 2] > 0.9) p[i + 2] = -0.9;
      if (p[i + 2] < -0.9) p[i + 2] = 0.9;
    }
    windGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    if (!isReduced) {
      requestAnimationFrame(animate);
    }
  }
  animate();

  // === CLEANUP ===
  window.__CLEANUP__ = window.__CLEANUP__ || [];
  window.__CLEANUP__.push(() => {
    renderer.dispose();
    windGeo.dispose();
    windMat.dispose();
    islandGeo.dispose();
    islandMat.dispose();
  });
})();
