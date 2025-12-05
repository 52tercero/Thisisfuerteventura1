/**
 * GSAP + CAMERA ORBITAL CONTROLLER
 * Smooth animations, transitions between scenes
 */

(function() {
  'use strict';

  const ORBITAL_CONFIG = {
    center: new THREE.Vector3(0, 20, 0),
    radius: 150,
    speed: 0.001,
    autoRotate: false,
    damping: 0.05
  };

  const state = {
    orbital: {
      theta: 0,
      phi: Math.PI / 3,
      targetTheta: 0,
      targetPhi: Math.PI / 3,
      targetRadius: ORBITAL_CONFIG.radius
    },
    animations: {},
    isAnimating: false
  };

  /**
   * ORBITAL CAMERA CONTROLLER
   */
  class OrbitalController {
    constructor(camera, config = {}) {
      this.camera = camera;
      this.config = { ...ORBITAL_CONFIG, ...config };
      this.state = {
        theta: 0,
        phi: Math.PI / 3,
        radius: this.config.radius,
        targetTheta: 0,
        targetPhi: Math.PI / 3,
        targetRadius: this.config.radius
      };
    }

    /**
     * Update orbital position (smooth interpolation)
     */
    update(deltaTime = 0.016) {
      // Smooth damping interpolation
      this.state.theta += (this.state.targetTheta - this.state.theta) * this.config.damping;
      this.state.phi += (this.state.targetPhi - this.state.phi) * this.config.damping;
      this.state.radius += (this.state.targetRadius - this.state.radius) * this.config.damping;

      // Convert spherical to cartesian
      const x = this.config.center.x + this.state.radius * Math.sin(this.state.phi) * Math.cos(this.state.theta);
      const y = this.config.center.y + this.state.radius * Math.cos(this.state.phi);
      const z = this.config.center.z + this.state.radius * Math.sin(this.state.phi) * Math.sin(this.state.theta);

      this.camera.position.set(x, y, z);
      this.camera.lookAt(this.config.center);
    }

    /**
     * Animate to target spherical position
     */
    animateTo(target, duration = 3) {
      // target: { theta, phi, radius }
      if (state.animations.orbital) {
        state.animations.orbital.kill();
      }

      state.isAnimating = true;

      state.animations.orbital = gsap.to(this.state, {
        targetTheta: target.theta ?? this.state.targetTheta,
        targetPhi: target.phi ?? this.state.targetPhi,
        targetRadius: target.radius ?? this.state.targetRadius,
        duration: duration,
        ease: 'power2.inOut',
        onComplete: () => {
          state.isAnimating = false;
        }
      });
    }

    /**
     * Enable auto-rotation
     */
    startAutoRotate(speed = 0.0005) {
      this.config.autoRotate = true;
      this.config.speed = speed;
    }

    /**
     * Disable auto-rotation
     */
    stopAutoRotate() {
      this.config.autoRotate = false;
    }

    /**
     * Pan camera
     */
    pan(deltaTheta, deltaPhi) {
      this.state.targetTheta += deltaTheta;
      this.state.targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1, this.state.targetPhi + deltaPhi));
    }

    /**
     * Zoom in/out
     */
    zoom(factor) {
      this.state.targetRadius *= factor;
      this.state.targetRadius = Math.max(50, Math.min(500, this.state.targetRadius));
    }

    /**
     * Auto-rotation loop
     */
    updateAutoRotate(deltaTime) {
      if (this.config.autoRotate) {
        this.state.targetTheta += this.config.speed;
      }
    }
  }

  /**
   * SCENE TRANSITION MANAGER
   */
  class SceneTransitioner {
    constructor(camera, config = {}) {
      this.camera = camera;
      this.controller = new OrbitalController(camera, config);
      this.scenes = new Map();
      this.currentScene = null;
    }

    /**
     * Define a named scene viewpoint
     */
    defineScene(name, viewpoint) {
      // viewpoint: { theta, phi, radius, lookAt }
      this.scenes.set(name, viewpoint);
    }

    /**
     * Transition to named scene
     */
    transitionTo(sceneName, duration = 3) {
      const scene = this.scenes.get(sceneName);
      if (!scene) {
        console.warn(`❌ Scene "${sceneName}" not defined`);
        return;
      }

      this.currentScene = sceneName;
      this.controller.animateTo(scene, duration);
    }

    /**
     * List all defined scenes
     */
    listScenes() {
      return Array.from(this.scenes.keys());
    }
  }

  /**
   * GSAP TIMELINE MANAGER
   * Orchestrate complex animations
   */
  class TimelineManager {
    constructor() {
      this.timelines = new Map();
      this.masterTimeline = gsap.timeline();
    }

    /**
     * Create named timeline
     */
    create(name, config = {}) {
      const tl = gsap.timeline(config);
      this.timelines.set(name, tl);
      return tl;
    }

    /**
     * Get timeline
     */
    get(name) {
      return this.timelines.get(name);
    }

    /**
     * Play timeline
     */
    play(name) {
      const tl = this.get(name);
      if (tl) tl.play();
    }

    /**
     * Pause timeline
     */
    pause(name) {
      const tl = this.get(name);
      if (tl) tl.pause();
    }

    /**
     * Add animation to master timeline
     */
    addToMaster(name, label) {
      const tl = this.get(name);
      if (tl) {
        this.masterTimeline.add(tl, label);
      }
    }

    /**
     * Play master timeline
     */
    playMaster() {
      this.masterTimeline.play();
    }
  }

  /**
   * CAMERA PATH ANIMATOR
   * Animate camera along a 3D curve
   */
  class CameraPathAnimator {
    constructor(camera, center = new THREE.Vector3()) {
      this.camera = camera;
      this.center = center;
      this.curve = null;
    }

    /**
     * Create curved path
     */
    createCatmullRomCurve(points) {
      return new THREE.CatmullRomCurve3(points);
    }

    /**
     * Animate along path
     */
    animateAlongPath(path, duration = 5, lookAhead = true) {
      const pathData = { progress: 0 };

      gsap.to(pathData, {
        progress: 1,
        duration: duration,
        ease: 'none',
        onUpdate: () => {
          const point = path.getPoint(pathData.progress);
          this.camera.position.copy(point);

          if (lookAhead) {
            const nextPoint = path.getPoint(Math.min(1, pathData.progress + 0.05));
            this.camera.lookAt(nextPoint);
          } else {
            this.camera.lookAt(this.center);
          }
        }
      });
    }
  }

  /**
   * SCROLL-BASED CAMERA CONTROL
   * Tie camera to scroll progress
   */
  class ScrollCameraController {
    constructor(camera, controller) {
      this.camera = camera;
      this.controller = controller;
      this.viewpoints = [];
    }

    /**
     * Define scroll-linked viewpoints
     */
    defineViewpoints(viewpoints) {
      // viewpoints: array of { theta, phi, radius }
      this.viewpoints = viewpoints;
    }

    /**
     * Update camera based on scroll progress
     */
    updateByScrollProgress(progress) {
      // progress: 0-1
      if (this.viewpoints.length < 2) return;

      const scaledProgress = progress * (this.viewpoints.length - 1);
      const currentIndex = Math.floor(scaledProgress);
      const nextIndex = Math.min(currentIndex + 1, this.viewpoints.length - 1);
      const localProgress = scaledProgress - currentIndex;

      const current = this.viewpoints[currentIndex];
      const next = this.viewpoints[nextIndex];

      // Interpolate between viewpoints
      this.controller.state.targetTheta = gsap.utils.interpolate(current.theta, next.theta, localProgress);
      this.controller.state.targetPhi = gsap.utils.interpolate(current.phi, next.phi, localProgress);
      this.controller.state.targetRadius = gsap.utils.interpolate(current.radius, next.radius, localProgress);
    }
  }

  /**
   * FOCUS ANIMATION
   * Smooth focus transition to object
   */
  class FocusAnimator {
    constructor(camera, controller) {
      this.camera = camera;
      this.controller = controller;
    }

    /**
     * Focus on 3D point
     */
    focusOn(target, distance = 100, duration = 2) {
      // Calculate spherical position relative to target
      const direction = this.camera.position.clone().sub(this.controller.config.center);
      const theta = Math.atan2(direction.z, direction.x);
      const phi = Math.acos(direction.y / direction.length());

      this.controller.config.center.copy(target);
      this.controller.animateTo({ theta, phi, radius: distance }, duration);
    }

    /**
     * Reset focus to origin
     */
    resetFocus(duration = 2) {
      this.controller.config.center.set(0, 20, 0);
      this.controller.animateTo({ theta: 0, phi: Math.PI / 3, radius: 150 }, duration);
    }
  }

  /**
   * INITIALIZE & SETUP
   */
  function init(camera) {
    if (!camera) return null;

    const controller = new OrbitalController(camera);
    const transitioner = new SceneTransitioner(camera);
    const timelineManager = new TimelineManager();
    const pathAnimator = new CameraPathAnimator(camera);
    const scrollController = new ScrollCameraController(camera, controller);
    const focusAnimator = new FocusAnimator(camera, controller);

    // Define default scenes
    transitioner.defineScene('overview', {
      theta: 0,
      phi: Math.PI / 3,
      radius: 150
    });

    transitioner.defineScene('dunesClose', {
      theta: -Math.PI / 4,
      phi: Math.PI / 4,
      radius: 80
    });

    transitioner.defineScene('volcanoView', {
      theta: -Math.PI / 2,
      phi: Math.PI / 3,
      radius: 120
    });

    transitioner.defineScene('seaLevel', {
      theta: 0,
      phi: Math.PI / 6,
      radius: 100
    });

    transitioner.defineScene('aerial', {
      theta: 0,
      phi: Math.PI * 0.9,
      radius: 200
    });

    // Create main animation loop
    let lastTime = performance.now();
    const animationLoop = () => {
      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      controller.updateAutoRotate(deltaTime);
      controller.update(deltaTime);

      requestAnimationFrame(animationLoop);
    };
    animationLoop();

    // Public API
    return {
      controller,
      transitioner,
      timelineManager,
      pathAnimator,
      scrollController,
      focusAnimator,
      startAutoRotate: (speed) => controller.startAutoRotate(speed),
      stopAutoRotate: () => controller.stopAutoRotate(),
      getState: () => state
    };
  }

  // =====================================================
  // PUBLIC EXPORTS
  // =====================================================
  window.__ORBITAL_CAMERA__ = {
    OrbitalController,
    SceneTransitioner,
    TimelineManager,
    CameraPathAnimator,
    ScrollCameraController,
    FocusAnimator,
    init: init
  };

  console.log('✅ GSAP + Orbital Camera module loaded');

})();
