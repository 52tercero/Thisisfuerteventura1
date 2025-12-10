// Load GA4 gtag without inline code and configure measurement ID
(function(){
  try {
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-46FPEKQGKZ';
    var ref = document.getElementsByTagName('script')[0];
    ref.parentNode.insertBefore(s, ref);
    gtag('js', new Date());
    gtag('config', 'G-46FPEKQGKZ');
  } catch (e) { /* noop */ }
})();
