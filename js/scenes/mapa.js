// scenes/mapa.js
// Stylized low-poly map of Fuerteventura with wind particles
(function() {
  if (!window.THREE) return;
  const THREE = window.THREE;
  const container = document.querySelector('#scene-mapa');
  if (!container) return;

  const isReduced = (window.__ANIMATIONS__ && window.__ANIMATIONS__.isReduced) ? window.__ANIMATIONS__.isReduced() : false;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 200);
  camera.position.set(0, 1.8, 3.2);

  const light = new THREE.DirectionalLight(0xffe2a9, 0.8);
  light.position.set(2, 3, 2);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x667788, 0.35));

  // Stylized island shape (low-poly plane with height map-like perturbation)
  const islandGeo = new THREE.PlaneGeometry(2.6, 0.8, 64, 16);
  islandGeo.rotateX(-Math.PI / 2);
  const pos = islandGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const ridge = Math.exp(-((x*x)/(2.1) + (z*z)/(0.4))) * 0.35;
    pos.setY(i, ridge + (Math.sin(x*2.3) + Math.cos(z*3.1)) * 0.03);
  }
  pos.needsUpdate = true;
  const islandMat = new THREE.MeshStandardMaterial({ color: 0xe0c48b, roughness: 0.95, metalness: 0.0, flatShading: true });
  const island = new THREE.Mesh(islandGeo, islandMat);
  scene.add(island);

  // Wind particles (points) flowing across the island
  const pCount = isReduced ? 200 : 900;
  const windGeo = new THREE.BufferGeometry();
  const windPos = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    windPos[i*3+0] = (Math.random() - 0.5) * 3.2; // x
    windPos[i*3+1] = 0.15 + Math.random() * 0.25; // y
    windPos[i*3+2] = (Math.random() - 0.5) * 1.6; // z
  }
  windGeo.setAttribute('position', new THREE.BufferAttribute(windPos, 3));
  const windMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.015, transparent: true, opacity: 0.7 });
  const wind = new THREE.Points(windGeo, windMat);
  scene.add(wind);

  // Scroll-linked gentle camera dolly
  const updateScroll = (s) => {
    camera.position.z = 3.2 - s * 0.8;
    camera.position.y = 1.8 + s * 0.3;
    camera.lookAt(island.position);
  };

  if (!isReduced && window.gsap && window.ScrollTrigger) {
    window.ScrollTrigger.create({
      trigger: container,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 0.8,
      onUpdate: self => updateScroll(self.progress)
    });
  }

  function onResize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  let t = 0;
  function animate() {
    t += 0.016;
    const p = windGeo.attributes.position.array;
    for (let i = 0; i < p.length; i+=3) {
      p[i] += 0.006 + Math.sin(t + i*0.001) * 0.001; // x drift
      p[i+2] += Math.cos(t*0.5 + i*0.002) * 0.0012; // z meander
      if (p[i] > 1.6) p[i] = -1.6;
    }
    windGeo.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
    if (!isReduced) requestAnimationFrame(animate);
  }
  animate();
})();
