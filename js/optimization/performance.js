/**
 * PERFORMANCE OPTIMIZATION MODULE
 * Lazy loading, texture compression, mipmap management, FPS control
 */

(function() {
  'use strict';

  const OPTIMIZATION_CONFIG = {
    textureCache: new Map(),
    loadingQueue: [],
    isLoading: false,
    targetFPS: 60,
    frameTime: 16.67, // ms
    lastFrameTime: performance.now(),
    droppedFrames: 0,
    frameData: []
  };

  /**
   * LAZY TEXTURE LOADER
   * Loads textures on demand with caching
   */
  class TextureLoader {
    constructor() {
      this.loader = new THREE.TextureLoader();
      this.cache = OPTIMIZATION_CONFIG.textureCache;
      this.pendingLoads = new Map();
    }

    async load(url, options = {}) {
      const cacheKey = url;

      // Return cached texture
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }

      // Return pending promise
      if (this.pendingLoads.has(cacheKey)) {
        return this.pendingLoads.get(cacheKey);
      }

      // Create load promise
      const loadPromise = new Promise((resolve, reject) => {
        this.loader.load(
          url,
          (texture) => {
            // Apply optimization settings
            this.optimizeTexture(texture, options);
            this.cache.set(cacheKey, texture);
            this.pendingLoads.delete(cacheKey);
            resolve(texture);
          },
          (progress) => {
            // Optional progress callback
          },
          (error) => {
            this.pendingLoads.delete(cacheKey);
            reject(error);
          }
        );
      });

      this.pendingLoads.set(cacheKey, loadPromise);
      return loadPromise;
    }

    optimizeTexture(texture, options) {
      // Compression
      if (options.compressed !== false) {
        texture.anisotropy = Math.min(8, texture.anisotropy);
      }

      // Mipmaps
      texture.generateMipmaps = true;
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearMipmapLinearFilter;

      // Colorspace
      if (!options.sRGB === false) {
        texture.colorSpace = THREE.SRGBColorSpace;
      }

      return texture;
    }

    clearCache() {
      this.cache.forEach(texture => texture.dispose());
      this.cache.clear();
    }
  }

  /**
   * FPS MONITOR & THROTTLING
   */
  class FPSMonitor {
    constructor(targetFPS = 60) {
      this.targetFPS = targetFPS;
      this.frameTime = 1000 / targetFPS;
      this.frameTimes = [];
      this.maxFrames = 60;
      this.lastFrameTime = performance.now();
      this.currentFPS = targetFPS;
      this.shouldThrottle = false;
    }

    update() {
      const now = performance.now();
      const deltaTime = now - this.lastFrameTime;

      this.frameTimes.push(deltaTime);
      if (this.frameTimes.length > this.maxFrames) {
        this.frameTimes.shift();
      }

      const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
      this.currentFPS = Math.round(1000 / avgFrameTime);

      // Detect throttling need
      this.shouldThrottle = this.currentFPS < (this.targetFPS * 0.8);

      this.lastFrameTime = now;
      return this.currentFPS;
    }

    shouldSkipFrame() {
      // Skip every nth frame if needed
      if (this.shouldThrottle && Math.random() < 0.1) {
        return true;
      }
      return false;
    }

    getStats() {
      return {
        fps: this.currentFPS,
        avgFrameTime: this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length,
        isThrottling: this.shouldThrottle
      };
    }
  }

  /**
   * LOD (Level of Detail) SYSTEM
   * Adjusts geometry complexity based on distance and performance
   */
  class LODManager {
    constructor() {
      this.lodObjects = [];
      this.camera = null;
    }

    registerLOD(object, levels) {
      // levels: [
      //   { distance: 100, geometry: geo1, material: mat1 },
      //   { distance: 500, geometry: geo2, material: mat2 },
      // ]
      this.lodObjects.push({ object, levels, currentLevel: 0 });
    }

    update(camera) {
      this.camera = camera;

      this.lodObjects.forEach(({ object, levels, currentLevel }) => {
        const distance = camera.position.distanceTo(object.position);

        let newLevel = 0;
        for (let i = levels.length - 1; i >= 0; i--) {
          if (distance > levels[i].distance) {
            newLevel = i;
            break;
          }
        }

        if (newLevel !== currentLevel) {
          const level = levels[newLevel];
          object.geometry = level.geometry;
          object.material = level.material;
          this.lodObjects[this.lodObjects.indexOf({ object, levels })].currentLevel = newLevel;
        }
      });
    }
  }

  /**
   * MEMORY MANAGEMENT
   */
  class MemoryManager {
    static getMemoryUsage() {
      if (performance.memory) {
        return {
          used: performance.memory.usedJSHeapSize / 1048576, // MB
          limit: performance.memory.jsHeapSizeLimit / 1048576,
          total: performance.memory.totalJSHeapSize / 1048576
        };
      }
      return null;
    }

    static logMemoryUsage() {
      const usage = this.getMemoryUsage();
      if (usage) {
        console.log(`💾 Memory: ${usage.used.toFixed(2)}MB / ${usage.limit.toFixed(2)}MB`);
      }
    }

    static cleanup(renderer) {
      if (renderer) {
        renderer.dispose();
      }
    }
  }

  /**
   * ADAPTIVE QUALITY SYSTEM
   * Adjusts graphics quality based on performance
   */
  class AdaptiveQuality {
    constructor(renderer, fpsMonitor) {
      this.renderer = renderer;
      this.fpsMonitor = fpsMonitor;
      this.qualityLevel = 3; // 0=low, 1=medium, 2=high, 3=ultra
      this.updateInterval = 5000; // ms
      this.lastCheck = 0;
    }

    update() {
      const now = performance.now();
      if (now - this.lastCheck < this.updateInterval) return;

      this.lastCheck = now;

      const fps = this.fpsMonitor.currentFPS;

      // Adjust quality based on FPS
      if (fps < 30 && this.qualityLevel > 0) {
        this.decreaseQuality();
      } else if (fps > 55 && this.qualityLevel < 3) {
        this.increaseQuality();
      }
    }

    decreaseQuality() {
      this.qualityLevel = Math.max(0, this.qualityLevel - 1);
      this.applyQualityLevel();
      console.log(`⬇️ Quality reduced to level ${this.qualityLevel}`);
    }

    increaseQuality() {
      this.qualityLevel = Math.min(3, this.qualityLevel + 1);
      this.applyQualityLevel();
      console.log(`⬆️ Quality increased to level ${this.qualityLevel}`);
    }

    applyQualityLevel() {
      const settings = {
        0: { shadowMapSize: 512, antialias: false, pixelRatio: 0.5 },
        1: { shadowMapSize: 1024, antialias: true, pixelRatio: 1.0 },
        2: { shadowMapSize: 2048, antialias: true, pixelRatio: 1.25 },
        3: { shadowMapSize: 4096, antialias: true, pixelRatio: 1.5 }
      };

      const setting = settings[this.qualityLevel];

      // Apply shadow map size
      if (this.renderer && this.renderer.shadowMap) {
        this.renderer.shadowMap.enabled = this.qualityLevel > 0;
      }

      window.__QUALITY_SETTING__ = setting;
      console.log(`🎨 Applied quality settings:`, setting);
    }

    getQualityLevel() {
      return this.qualityLevel;
    }
  }

  /**
   * REQUEST ANIMATION FRAME THROTTLER
   */
  class RAFThrottler {
    constructor(fps = 60) {
      this.fps = fps;
      this.frameTime = 1000 / fps;
      this.lastFrameTime = 0;
      this.callbacks = [];
    }

    scheduleCallback(callback) {
      this.callbacks.push(callback);
    }

    start() {
      const rafLoop = (time) => {
        const delta = time - this.lastFrameTime;

        if (delta >= this.frameTime) {
          this.callbacks.forEach(callback => {
            try {
              callback(time, delta);
            } catch (error) {
              console.error('❌ RAF callback error:', error);
            }
          });

          this.lastFrameTime = time;
        }

        requestAnimationFrame(rafLoop);
      };

      requestAnimationFrame(rafLoop);
    }
  }

  /**
   * BATCH PROCESSING FOR UPDATES
   */
  class BatchProcessor {
    constructor(batchSize = 10) {
      this.batchSize = batchSize;
      this.queue = [];
    }

    enqueue(task) {
      this.queue.push(task);
    }

    processBatch(limit = this.batchSize) {
      const batch = this.queue.splice(0, limit);
      batch.forEach(task => {
        try {
          task();
        } catch (error) {
          console.error('❌ Batch task error:', error);
        }
      });
      return batch.length;
    }

    clear() {
      this.queue = [];
    }

    getQueueLength() {
      return this.queue.length;
    }
  }

  // =====================================================
  // PUBLIC API
  // =====================================================
  window.__OPTIMIZATION__ = {
    TextureLoader,
    FPSMonitor,
    LODManager,
    MemoryManager,
    AdaptiveQuality,
    RAFThrottler,
    BatchProcessor
  };

  console.log('✅ Performance optimization module loaded');

})();
