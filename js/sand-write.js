// Sand-writing text effect with configurable rhythm.
// Base usage:
//   <h2 class="sand-write" data-sand-write>Texto</h2>
// Optional data attributes:
//   data-sand-delay="0.3"       -> initial delay before first char
//   data-sand-step="0.05"        -> per-character incremental delay (default 0.06)
//   data-sand-duration="0.85"    -> animation duration for each char (default .85s)
//   data-sand-ease="cubic-bezier(.25,.6,.3,1)" -> override easing
//   data-sand-shimmer="off"      -> disable post shimmer phase
//   data-sand-distribution="ease" -> distribution of step: linear | ease | accelerate | decelerate
// Accessibility: respects prefers-reduced-motion via CSS.
(function () {
  function pickSpeed(step) {
    if (step <= 0.05) {return { key:'f', inc:0.04 };}
    if (step >= 0.075) {return { key:'s', inc:0.08 };}
    return { key:'m', inc:0.06 };
  }
  function pickDurationClass(d) {
    if (d <= 0.75) {return 'sd-dur-short';}
    if (d >= 0.95) {return 'sd-dur-long';}
    return 'sd-dur-med';
  }
  function quantizeBaseDelay(base, inc) {
    const n = Math.round(base / inc);
    return Math.max(0, n);
  }
  function applySandWrite() {
    const nodes = document.querySelectorAll('[data-sand-write]');
    nodes.forEach(function (el) {
      if (el.dataset.sandProcessed) {return;}
      const raw = el.textContent;
      const duration = parseFloat(el.getAttribute('data-sand-duration') || '0.85');
      const step = parseFloat(el.getAttribute('data-sand-step') || '0.06');
      const delayBase = parseFloat(el.getAttribute('data-sand-delay') || '0');
      const distribution = (el.getAttribute('data-sand-distribution') || 'linear').trim();
      const shimmer = (el.getAttribute('data-sand-shimmer') || 'on') !== 'off';
      const speed = pickSpeed(step);
      const baseTicks = quantizeBaseDelay(delayBase, speed.inc);
      el.textContent = '';
      const frag = document.createDocumentFragment();
      const count = raw.length;
      for (let i = 0;i < count;i++) {
        const ch = raw[i];
        const span = document.createElement('span');
        span.textContent = ch;
        // Fallback spacing for spaces
        if (ch === ' ') {span.className = 'sd-space';}
        // Only linear distribution supported in CSP-safe mode; others fallback
        const idx = i + baseTicks;
        // Cap index to our CSS set size (1..120)
        const capped = Math.min(120, Math.max(0, idx));
        span.classList.add('sd-' + speed.key + '-' + capped);
        frag.appendChild(span);
      }
      el.appendChild(frag);
      el.classList.add(pickDurationClass(duration));
      el.dataset.sandProcessed = '1';
      // Total time approx
      const total = duration + speed.inc * (count - 1 + baseTicks);
      if (shimmer) {
        setTimeout(function () { el.classList.add('done'); }, total * 1000);
      }
      if (distribution !== 'linear') {
        el.setAttribute('data-sand-note', 'distribution fallback to linear for CSP');
      }
    });
  }
  if (document.readyState === 'loading') {document.addEventListener('DOMContentLoaded', applySandWrite);} else {applySandWrite();}
})();
