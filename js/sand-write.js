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
(function(){
  function pickSpeed(step){
    if(step <= 0.05) return {key:'f', inc:0.04};
    if(step >= 0.075) return {key:'s', inc:0.08};
    return {key:'m', inc:0.06};
  }
  function pickDurationClass(d){
    if(d <= 0.75) return 'sd-dur-short';
    if(d >= 0.95) return 'sd-dur-long';
    return 'sd-dur-med';
  }
  function quantizeBaseDelay(base, inc){
    var n = Math.round(base / inc);
    return Math.max(0, n);
  }
  function applySandWrite(){
    var nodes = document.querySelectorAll('[data-sand-write]');
    nodes.forEach(function(el){
      if(el.dataset.sandProcessed) return;
      var raw = el.textContent;
      var duration = parseFloat(el.getAttribute('data-sand-duration')||'0.85');
      var step = parseFloat(el.getAttribute('data-sand-step')||'0.06');
      var delayBase = parseFloat(el.getAttribute('data-sand-delay')||'0');
      var distribution = (el.getAttribute('data-sand-distribution')||'linear').trim();
      var shimmer = (el.getAttribute('data-sand-shimmer')||'on') !== 'off';
      var speed = pickSpeed(step);
      var baseTicks = quantizeBaseDelay(delayBase, speed.inc);
      el.textContent = '';
      var frag = document.createDocumentFragment();
      var count = raw.length;
      for(var i=0;i<count;i++){
        var ch = raw[i];
        var span = document.createElement('span');
        span.textContent = ch;
        // Fallback spacing for spaces
        if(ch === ' ') span.className = 'sd-space';
        // Only linear distribution supported in CSP-safe mode; others fallback
        var idx = i + baseTicks;
        // Cap index to our CSS set size (1..120)
        var capped = Math.min(120, Math.max(0, idx));
        span.classList.add('sd-'+speed.key+'-'+capped);
        frag.appendChild(span);
      }
      el.appendChild(frag);
      el.classList.add(pickDurationClass(duration));
      el.dataset.sandProcessed = '1';
      // Total time approx
      var total = duration + speed.inc * (count-1 + baseTicks);
      if(shimmer){
        setTimeout(function(){ el.classList.add('done'); }, total*1000);
      }
      if(distribution !== 'linear'){
        el.setAttribute('data-sand-note','distribution fallback to linear for CSP');
      }
    });
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applySandWrite); else applySandWrite();
})();
