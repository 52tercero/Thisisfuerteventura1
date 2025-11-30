// scenes/volcan.js
// Stylized low-poly volcano with breathing glow
(function () {
  if (!window.THREE) {return;}
  const THREE = window.THREE;
  const container = document.querySelector('#scene-volcan');
  if (!container) {return;}

  const isReduced = (window.__ANIMATIONS__ && window.__ANIMATIONS__.isReduced) ? window.__ANIMATIONS__.isReduced() : false;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 120);
  camera.position.set(0.3, 1.2, 2.2);

  scene.add(new THREE.AmbientLight(0x404040, 0.4));
  const dir = new THREE.DirectionalLight(0xffe0b2, 0.8); dir.position.set(1.5, 2.2, 1.2); scene.add(dir);

  const volcanoGeo = new THREE.ConeGeometry(0.8, 1.4, 6, 1);
  const volcanoMat = new THREE.MeshStandardMaterial({ color: 0x6a4f3b, roughness: 0.95, metalness: 0.0, flatShading: true });
  const volcano = new THREE.Mesh(volcanoGeo, volcanoMat);
  volcano.position.y = 0.6; scene.add(volcano);

  // Glow at the crater using a sprite-like plane with shader
  const glowGeo = new THREE.PlaneGeometry(0.6, 0.6);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uIntensity: { value: isReduced ? 0.15 : 0.7 } },
    vertexShader: `
      void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: `
      uniform float uTime; uniform float uIntensity;
      void main() {
        float r = 0.5 + 0.5*sin(uTime*1.7);
        vec3 col = mix(vec3(0.2,0.05,0.01), vec3(1.0,0.4,0.1), r*uIntensity);
        gl_FragColor = vec4(col, 0.8);
      }
    `,
    transparent: true
  });
  const glow = new THREE.Mesh(glowGeo, glowMat); glow.position.set(0, 1.2, 0.0); scene.add(glow);

  function onResize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  let t = 0;
  function animate() {
    t += 0.016; glowMat.uniforms.uTime.value = t; volcano.rotation.y += 0.002;
    renderer.render(scene, camera);
    if (!isReduced) {requestAnimationFrame(animate);}
  }
  animate();

  if (!isReduced && window.gsap && window.ScrollTrigger) {
    window.ScrollTrigger.create({
      trigger: container,
      start: 'top bottom', end: 'bottom top', scrub: 0.6,
      onUpdate: self => { glowMat.uniforms.uIntensity.value = 0.2 + self.progress * 0.8; }
    });
  }
})();
