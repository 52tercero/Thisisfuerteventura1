// Realtime form validation for newsletter with visual feedback
(() => {
  if (typeof window === 'undefined') return;
  const form = document.getElementById('newsletter-form');
  if (!form) return;
  const email = form.querySelector('input[type="email"]');
  if (!email) return;

  // Create live region for feedback
  const live = document.createElement('span');
  live.setAttribute('aria-live', 'polite');
  live.className = 'visually-hidden';
  form.appendChild(live);

  const check = document.createElement('span');
  check.className = 'submit-check';
  check.textContent = '✓';
  email.insertAdjacentElement('afterend', check);

  const validate = () => {
    const valid = email.checkValidity();
    email.classList.toggle('valid', valid);
    email.classList.toggle('invalid', !valid && email.value.length > 0);
    check.classList.toggle('show', valid);
    live.textContent = valid ? 'Email válido' : '';
  };

  email.addEventListener('input', validate);
  email.addEventListener('blur', validate);

  form.addEventListener('submit', (e) => {
    if (!email.checkValidity()) {
      e.preventDefault();
      email.focus();
      validate();
    }
  });
})();
