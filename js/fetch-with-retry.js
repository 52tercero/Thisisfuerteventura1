/**
 * Fetch with retry logic and offline indicator
 * @module FetchWithRetry
 *
 * Features:
 * - Exponential backoff retry strategy (3 attempts by default)
 * - AbortController timeout support
 * - Offline detection (no retry on network error)
 * - Error categorization (network vs HTTP)
 * - Console logging for debugging
 */

class FetchWithRetry {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.initialDelayMs = options.initialDelayMs || 500;
    this.maxDelayMs = options.maxDelayMs || 4000;
    this.timeoutMs = options.timeoutMs || 8000;
    this.debug = options.debug || false;
  }

  log(msg, level = 'info') {
    if (this.debug) {
      console[level]?.(`[FetchWithRetry] ${msg}`);
    }
  }

  /**
   * Calculate exponential backoff delay (with jitter)
   * @private
   */
  getDelayMs(attemptNumber) {
    const exponential = this.initialDelayMs * Math.pow(2, attemptNumber - 1);
    const capped = Math.min(exponential, this.maxDelayMs);
    // Add jitter: ±10% of delay
    const jitter = capped * 0.1 * (Math.random() * 2 - 1);
    return Math.max(100, capped + jitter);
  }

  /**
   * Determine if error is network-level (likely offline)
   * @private
   */
  isNetworkError(err) {
    return err instanceof TypeError ||
           err.name === 'AbortError' ||
           !navigator.onLine;
  }

  /**
   * Fetch with retry logic
   * @param {string} url - Resource URL
   * @param {object} options - Fetch options (method, headers, etc.)
   * @returns {Promise<Response>} - Fetch response
   * @throws {Error} - After max retries exhausted
   */
  async fetch(url, options = {}) {
    const fetchOptions = {
      ...options,
      signal: this.createAbortSignal(this.timeoutMs)
    };

    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.log(`Attempt ${attempt}/${this.maxRetries}: ${url}`);
        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
          // HTTP error (don't retry 4xx, do retry 5xx)
          if (response.status >= 400 && response.status < 500) {
            const msg = `HTTP ${response.status} (client error, no retry)`;
            this.log(msg, 'warn');
            throw new Error(msg);
          }
          // 5xx - might be temporary, retry
          this.log(`HTTP ${response.status} (server error, will retry)`, 'warn');
          throw new Error(`HTTP ${response.status}`);
        }

        this.log(`Success on attempt ${attempt}`, 'info');
        return response;

      } catch (err) {
        lastError = err;
        const isNetErr = this.isNetworkError(err);

        this.log(
          `Attempt ${attempt} failed: ${err.message || err} (network: ${isNetErr})`,
          'warn'
        );

        // Don't retry network errors (likely offline)
        if (isNetErr && attempt > 1) {
          this.log('Network error detected, stopping retries', 'error');
          break;
        }

        // If not last attempt and might be recoverable, wait and retry
        if (attempt < this.maxRetries) {
          const delayMs = this.getDelayMs(attempt);
          this.log(`Waiting ${delayMs}ms before retry...`);
          await this.sleep(delayMs);
        }
      }
    }

    // All retries exhausted
    const finalMsg = `Fetch failed after ${this.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`;
    this.log(finalMsg, 'error');
    throw lastError || new Error(finalMsg);
  }

  /**
   * Fetch with automatic offline indicator rendering
   * @param {string} url - Resource URL
   * @param {HTMLElement} container - DOM element to render into
   * @param {object} options - Fetch options
   * @returns {Promise<object|null>} - Parsed JSON response or null on error
   */
  async fetchWithIndicator(url, container, options = {}) {
    if (!container) {return null;}

    try {
      const response = await this.fetch(url, options);
      const data = await response.json();
      return data;
    } catch (err) {
      const isNetworkIssue = this.isNetworkError(err);
      const message = isNetworkIssue
        ? 'No conexión disponible'
        : 'Error al cargar datos';

      container.innerHTML = `
        <div class="widget-error" role="alert">
          <i class="fas fa-exclamation-circle"></i>
          <span>${message}</span>
        </div>
      `;

      this.log(`Displayed error to user: ${message}`, 'info');
      return null;
    }
  }

  /**
   * Helper: Create AbortSignal with timeout
   * @private
   */
  createAbortSignal(timeoutMs) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    // Prevent memory leak from timeout
    const originalAbort = controller.abort.bind(controller);
    controller.abort = function () {
      clearTimeout(timeoutId);
      return originalAbort();
    };

    return controller.signal;
  }

  /**
   * Helper: Sleep utility
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance with sensible defaults
window.FetchWithRetry = new FetchWithRetry({
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 4000,
  timeoutMs: 8000,
  debug: false
});
