// Stub analytics to avoid 404s during dev.
// Replace with your real analytics implementation or loader.
(function(){
  const enabled = typeof window !== 'undefined';
  if (!enabled) return;
  console.debug('[analytics] stub loaded');
})();
