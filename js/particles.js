/* particles.js: sistema de partículas Three.js para hero sections - arena/viento/estrellas */
(function(){
  if(typeof THREE === 'undefined') return; // CDN no cargado
  const d = document;
  
  // Detectar si queremos partículas (solo hero sections con .particle-scene)
  const heroes = d.querySelectorAll('.hero.particle-scene');
  if(!heroes.length) return;

  heroes.forEach(hero => {
    const canvas = d.createElement('canvas');
    canvas.className = 'particle-canvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
    hero.style.position = 'relative';
    hero.appendChild(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, hero.offsetWidth / hero.offsetHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setSize(hero.offsetWidth, hero.offsetHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    camera.position.z = 15;

    // Determinar tipo de partículas según tema
    const isDark = d.documentElement.getAttribute('data-theme') === 'dark';
    const isBeach = hero.classList.contains('beaches-hero');
    
    let particleCount = 800;
    let color = isDark ? 0xffffff : 0xf4e4c1; // estrellas blancas o arena dorada
    let particleSize = isDark ? 0.15 : 0.25;

    if(isBeach && !isDark) {
      particleCount = 500;
      color = 0xf4e4c1; // arena
    }

    const positions = [];
    for(let i = 0; i < particleCount; i++){
      positions.push(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
      );
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color,
      size: particleSize,
      transparent: true,
      opacity: isDark ? 0.8 : 0.6,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let animationId;
    function animate(){
      animationId = requestAnimationFrame(animate);
      // Rotación suave simulando viento/deriva estelar
      particles.rotation.y += isDark ? 0.0003 : 0.0008;
      particles.rotation.x += 0.0002;
      renderer.render(scene, camera);
    }
    animate();

    // Resize
    const resizeObs = new ResizeObserver(()=>{
      const w = hero.offsetWidth, h = hero.offsetHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObs.observe(hero);

    // Cleanup si hero se elimina
    const mutObs = new MutationObserver(()=>{
      if(!d.body.contains(hero)){
        cancelAnimationFrame(animationId);
        resizeObs.disconnect();
        mutObs.disconnect();
        renderer.dispose();
        geometry.dispose();
        material.dispose();
      }
    });
    mutObs.observe(d.body, { childList: true, subtree: true });

    // Re-render al cambiar tema
    d.documentElement.addEventListener('data-theme-change', ()=>{
      const nowDark = d.documentElement.getAttribute('data-theme') === 'dark';
      material.color.setHex(nowDark ? 0xffffff : 0xf4e4c1);
      material.opacity = nowDark ? 0.8 : 0.6;
      material.size = nowDark ? 0.15 : 0.25;
    });
  });
})();
