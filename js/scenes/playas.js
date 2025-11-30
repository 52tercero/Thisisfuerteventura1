// scenes/playas.js
// Stylized wave shader plane representing beaches
(function () {
  if (!window.THREE) {return;}
  const THREE = window.THREE;
  const container = document.querySelector('#scene-playas');
  if (!container) {return;}

  const isReduced = (window.__ANIMATIONS__ && window.__ANIMATIONS__.isReduced) ? window.__ANIMATIONS__.isReduced() : false;

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 0.7, 1.6);

  const geom = new THREE.PlaneGeometry(4, 2, 128, 64);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color(0x6ec6ff) },
      uColorB: { value: new THREE.Color(0x0e6aa8) },
      uIntensity: { value: isReduced ? 0.25 : 0.8 }
    },
    vertexShader: `
      uniform float uTime; uniform float uIntensity;
      varying float vWave;
      void main() {
        vec3 p = position;
        float w = sin(p.x*2.2 + uTime*1.2)*0.06 + cos(p.y*1.8 + uTime*0.7)*0.04;
        p.z += w * uIntensity;
        vWave = w;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }
    `,
    fragmentShader: `
      varying float vWave; uniform vec3 uColorA; uniform vec3 uColorB;
      void main() {
        float m = smoothstep(-0.05, 0.15, vWave);
        vec3 col = mix(uColorA, uColorB, m);
        gl_FragColor = vec4(col, 0.9);
      }
    `,
    transparent: true
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 3.0;
  scene.add(mesh);

  function onResize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);

  let t = 0;
  function animate() {
    t += 0.016; mat.uniforms.uTime.value = t;
    renderer.render(scene, camera);
    if (!isReduced) {requestAnimationFrame(animate);}
  }
  animate();

  if (!isReduced && window.gsap && window.ScrollTrigger) {
    window.ScrollTrigger.create({
      trigger: container,
      start: 'top bottom', end: 'bottom top', scrub: 0.6,
      onUpdate: self => { mat.uniforms.uIntensity.value = 0.3 + self.progress * 0.6; }
    });
  }
})();
