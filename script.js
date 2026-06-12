/* =========================================================
   NEXUS — Secure Access Portal
   Vanilla JS: validation, theme, storage, toasts, animations
   ========================================================= */

(() => {
  'use strict';

  /* ---------------------------------------------------
     Element references
  --------------------------------------------------- */
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const toastContainer = document.getElementById('toastContainer');

  const authCard = document.getElementById('authCard');
  const authForm = document.getElementById('authForm');
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  const modeSwitch = document.querySelector('.mode-switch');
  const formSubtitle = document.getElementById('formSubtitle');
  const switchPrompt = document.getElementById('switchPrompt');
  const switchModeBtn = document.getElementById('switchModeBtn');
  const loginExtras = document.getElementById('loginExtras');

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmField = document.getElementById('confirmField');
  const confirmInput = document.getElementById('confirmPassword');

  const togglePassword = document.getElementById('togglePassword');
  const toggleConfirm = document.getElementById('toggleConfirm');

  const strengthMeter = document.getElementById('strengthMeter');
  const strengthLabel = document.getElementById('strengthLabel');

  const rememberMe = document.getElementById('rememberMe');
  const submitBtn = document.getElementById('submitBtn');
  const submitLabel = document.getElementById('submitLabel');

  const loginStage = document.querySelector('.stage');
  const dashboardStage = document.getElementById('dashboardStage');
  const dashUser = document.getElementById('dashUser');
  const dashSession = document.getElementById('dashSession');
  const logoutBtn = document.getElementById('logoutBtn');

  const typeTarget = document.getElementById('typeTarget');
  const forgotLink = document.getElementById('forgotLink');

  let mode = 'login'; // 'login' | 'signup'
  let isSubmitting = false;

  /* ---------------------------------------------------
     THEME
  --------------------------------------------------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.className = theme === 'light' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    localStorage.setItem('nexus_theme', theme);
  }

  function initTheme() {
    const saved = localStorage.getItem('nexus_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
  }

  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  /* ---------------------------------------------------
     TOAST NOTIFICATIONS
  --------------------------------------------------- */
  const TOAST_ICONS = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
  };

  function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fa-solid ${TOAST_ICONS[type] || TOAST_ICONS.info}" aria-hidden="true"></i><span>${escapeHTML(message)}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
  }

  /* ---------------------------------------------------
     SANITIZATION HELPERS
  --------------------------------------------------- */
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function sanitizeInput(value) {
    return value.trim().replace(/[<>]/g, '');
  }

  /* ---------------------------------------------------
     TYPING ANIMATION FOR HEADING
  --------------------------------------------------- */
  function typeHeading(text) {
    let i = 0;
    typeTarget.textContent = '';
    const interval = setInterval(() => {
      typeTarget.textContent = text.slice(0, i + 1);
      i++;
      if (i === text.length) clearInterval(interval);
    }, 110);
  }

  /* ---------------------------------------------------
     MODE SWITCHING (Login <-> Signup)
  --------------------------------------------------- */
  function setMode(newMode) {
    mode = newMode;
    const isSignup = mode === 'signup';

    modeSwitch.setAttribute('data-active', mode);
    loginTab.classList.toggle('active', !isSignup);
    signupTab.classList.toggle('active', isSignup);
    loginTab.setAttribute('aria-selected', String(!isSignup));
    signupTab.setAttribute('aria-selected', String(isSignup));

    confirmField.classList.toggle('visible', isSignup);
    confirmField.setAttribute('aria-hidden', String(!isSignup));
    confirmInput.required = isSignup;

    loginExtras.classList.toggle('hidden', isSignup);

    strengthMeter.classList.toggle('visible', isSignup);
    strengthMeter.setAttribute('aria-hidden', String(!isSignup));

    submitLabel.textContent = isSignup ? 'Create account' : 'Sign in';
    formSubtitle.textContent = isSignup
      ? 'Set up your account to get started'
      : 'Sign in to continue to your dashboard';

    switchPrompt.textContent = isSignup ? 'Already have an account?' : 'New here?';
    switchModeBtn.textContent = isSignup ? 'Sign in instead' : 'Create an account';

    clearFieldState(emailInput, 'emailError');
    clearFieldState(passwordInput, 'passwordError');
    clearFieldState(confirmInput, 'confirmError');
  }

  loginTab.addEventListener('click', () => setMode('login'));
  signupTab.addEventListener('click', () => setMode('signup'));
  switchModeBtn.addEventListener('click', () => setMode(mode === 'login' ? 'signup' : 'login'));

  /* ---------------------------------------------------
     PASSWORD VISIBILITY TOGGLES
  --------------------------------------------------- */
  function bindToggle(button, input) {
    button.addEventListener('click', () => {
      const showing = input.type === 'text';
      input.type = showing ? 'password' : 'text';
      button.setAttribute('aria-pressed', String(!showing));
      button.querySelector('i').className = showing ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });
  }
  bindToggle(togglePassword, passwordInput);
  bindToggle(toggleConfirm, confirmInput);

  /* ---------------------------------------------------
     VALIDATION HELPERS
  --------------------------------------------------- */
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function setFieldError(input, errorId, message) {
    const field = input.closest('.field');
    const errorEl = document.getElementById(errorId);
    field.classList.add('error');
    field.classList.remove('success');
    errorEl.textContent = message;
    const status = field.querySelector('.field-status');
    if (status) status.className = 'field-status fa-solid fa-circle-exclamation';
  }

  function setFieldSuccess(input, errorId) {
    const field = input.closest('.field');
    const errorEl = document.getElementById(errorId);
    field.classList.remove('error');
    field.classList.add('success');
    errorEl.textContent = '';
    const status = field.querySelector('.field-status');
    if (status) status.className = 'field-status fa-solid fa-circle-check';
  }

  function clearFieldState(input, errorId) {
    const field = input.closest('.field');
    const errorEl = document.getElementById(errorId);
    field.classList.remove('error', 'success');
    errorEl.textContent = '';
    const status = field.querySelector('.field-status');
    if (status) status.className = 'field-status fa-solid';
  }

  function validateEmail(showState = true) {
    const value = sanitizeInput(emailInput.value);
    if (!value) {
      if (showState) setFieldError(emailInput, 'emailError', 'This field is required.');
      return false;
    }
    // Allow plain usernames (min 3 chars) OR valid email format
    const looksLikeEmail = value.includes('@');
    if (looksLikeEmail && !EMAIL_REGEX.test(value)) {
      if (showState) setFieldError(emailInput, 'emailError', 'Enter a valid email address.');
      return false;
    }
    if (!looksLikeEmail && value.length < 3) {
      if (showState) setFieldError(emailInput, 'emailError', 'Username must be at least 3 characters.');
      return false;
    }
    if (showState) setFieldSuccess(emailInput, 'emailError');
    return true;
  }

  function getPasswordStrength(value) {
    let score = 0;
    if (value.length >= 8) score++;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
    if (/\d/.test(value)) score++;
    if (/[^A-Za-z0-9]/.test(value)) score++;
    return score; // 0 - 4
  }

  function updateStrengthMeter(value) {
    const score = getPasswordStrength(value);
    strengthMeter.setAttribute('data-level', String(score));
    const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];
    strengthLabel.textContent = value ? labels[score] : 'Password strength';
  }

  function validatePassword(showState = true) {
    const value = passwordInput.value;

    if (!value) {
      if (showState) setFieldError(passwordInput, 'passwordError', 'This field is required.');
      return false;
    }

    if (value.length < 8) {
      if (showState) setFieldError(passwordInput, 'passwordError', 'Password must be at least 8 characters.');
      return false;
    }

    if (mode === 'signup') {
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[^A-Za-z0-9]/.test(value);

      if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
        if (showState) setFieldError(
          passwordInput,
          'passwordError',
          'Use upper & lower case, a number, and a symbol.'
        );
        return false;
      }
    }

    if (showState) setFieldSuccess(passwordInput, 'passwordError');
    return true;
  }

  function validateConfirm(showState = true) {
    if (mode !== 'signup') return true;
    const value = confirmInput.value;

    if (!value) {
      if (showState) setFieldError(confirmInput, 'confirmError', 'Please confirm your password.');
      return false;
    }
    if (value !== passwordInput.value) {
      if (showState) setFieldError(confirmInput, 'confirmError', 'Passwords do not match.');
      return false;
    }
    if (showState) setFieldSuccess(confirmInput, 'confirmError');
    return true;
  }

  /* ---------------------------------------------------
     REAL-TIME VALIDATION LISTENERS
  --------------------------------------------------- */
  emailInput.addEventListener('input', () => validateEmail());
  emailInput.addEventListener('blur', () => validateEmail());

  passwordInput.addEventListener('input', () => {
    validatePassword();
    if (mode === 'signup') {
      updateStrengthMeter(passwordInput.value);
      if (confirmInput.value) validateConfirm();
    }
  });
  passwordInput.addEventListener('blur', () => validatePassword());

  confirmInput.addEventListener('input', () => validateConfirm());
  confirmInput.addEventListener('blur', () => validateConfirm());

  /* ---------------------------------------------------
     RIPPLE EFFECT ON SUBMIT BUTTON
  --------------------------------------------------- */
  submitBtn.addEventListener('click', (e) => {
    const rect = submitBtn.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height) * 1.2;
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    submitBtn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 650);
  });

  /* ---------------------------------------------------
     FORM SUBMISSION
  --------------------------------------------------- */
  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isSubmitting) return; // prevent multiple submissions

    const emailOk = validateEmail();
    const passOk = validatePassword();
    const confirmOk = validateConfirm();

    if (!emailOk || !passOk || !confirmOk) {
      showToast('Please fix the highlighted fields.', 'error');
      // Focus first invalid field
      const firstInvalid = authForm.querySelector('.field.error .field-input');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    isSubmitting = true;
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    setTimeout(() => {
      if (mode === 'signup') {
        handleSignup();
      } else {
        handleLogin();
      }
      isSubmitting = false;
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }, 1400);
  });

  function handleSignup() {
    const email = sanitizeInput(emailInput.value);
    const users = JSON.parse(localStorage.getItem('nexus_users') || '{}');

    if (users[email]) {
      showToast('An account with this email already exists.', 'error');
      setFieldError(emailInput, 'emailError', 'This account already exists.');
      return;
    }

    users[email] = { password: passwordInput.value };
    localStorage.setItem('nexus_users', JSON.stringify(users));

    showToast('Account created successfully! Please sign in.', 'success');
    authForm.reset();
    [emailInput, passwordInput, confirmInput].forEach((el) => {
      clearFieldState(el, el.id === 'email' ? 'emailError' : el.id === 'password' ? 'passwordError' : 'confirmError');
    });
    updateStrengthMeter('');
    setMode('login');
  }

  function handleLogin() {
    const email = sanitizeInput(emailInput.value);
    const users = JSON.parse(localStorage.getItem('nexus_users') || '{}');
    const record = users[email];

    // Allow login even without a pre-registered account (demo-friendly),
    // but if an account exists, password must match.
    if (record && record.password !== passwordInput.value) {
      showToast('Incorrect password. Please try again.', 'error');
      setFieldError(passwordInput, 'passwordError', 'Incorrect password.');
      return;
    }

    const session = {
      email,
      remember: rememberMe.checked,
      time: Date.now()
    };

    if (rememberMe.checked) {
      localStorage.setItem('nexus_session', JSON.stringify(session));
    } else {
      sessionStorage.setItem('nexus_session', JSON.stringify(session));
    }

    showToast('Signed in successfully. Welcome back!', 'success');
    setTimeout(() => showDashboard(session), 500);
  }

  /* ---------------------------------------------------
     DASHBOARD / SESSION VIEW
  --------------------------------------------------- */
  function showDashboard(session) {
    dashUser.textContent = session.email;
    const date = new Date(session.time);
    dashSession.textContent = `Session started ${date.toLocaleString()}`;

    loginStage.classList.add('hide');
    dashboardStage.hidden = false;
    dashboardStage.classList.add('show');
  }

  function hideDashboard() {
    loginStage.classList.remove('hide');
    dashboardStage.hidden = true;
    dashboardStage.classList.remove('show');
  }

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('nexus_session');
    sessionStorage.removeItem('nexus_session');
    authForm.reset();
    [emailInput, passwordInput, confirmInput].forEach((el) => {
      clearFieldState(el, el.id === 'email' ? 'emailError' : el.id === 'password' ? 'passwordError' : 'confirmError');
    });
    showToast('You have been logged out.', 'info');
    hideDashboard();
  });

  /* ---------------------------------------------------
     AUTO-LOGIN (Remember Me)
  --------------------------------------------------- */
  function checkExistingSession() {
    const saved = localStorage.getItem('nexus_session') || sessionStorage.getItem('nexus_session');
    if (saved) {
      try {
        const session = JSON.parse(saved);
        showDashboard(session);
      } catch (_) { /* ignore corrupted data */ }
    }
  }

  /* ---------------------------------------------------
     SOCIAL LOGIN BUTTONS (demo simulation)
  --------------------------------------------------- */
  document.querySelectorAll('.social-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const provider = btn.getAttribute('data-provider');
      showToast(`${provider} sign-in is a demo placeholder.`, 'warning');
    });
  });

  /* ---------------------------------------------------
     FORGOT PASSWORD (demo simulation)
  --------------------------------------------------- */
  forgotLink.addEventListener('click', (e) => {
    e.preventDefault();
    const email = sanitizeInput(emailInput.value);
    if (!email || !validateEmail(false)) {
      showToast('Enter your email above to reset your password.', 'warning');
      emailInput.focus();
      return;
    }
    showToast(`Password reset link sent to ${email}.`, 'success');
  });

  /* ---------------------------------------------------
     PARTICLES BACKGROUND
  --------------------------------------------------- */
  function buildParticles() {
    const container = document.getElementById('particles');
    const count = window.innerWidth < 600 ? 14 : 26;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.style.left = `${Math.random() * 100}%`;
      p.style.bottom = `-10px`;
      p.style.setProperty('--drift', `${(Math.random() - 0.5) * 120}px`);
      p.style.animationDuration = `${12 + Math.random() * 14}s`;
      p.style.animationDelay = `${Math.random() * 14}s`;
      p.style.opacity = String(0.2 + Math.random() * 0.5);
      container.appendChild(p);
    }
  }

  /* ---------------------------------------------------
     KEYBOARD ACCESSIBILITY: Enter to submit from any field
  --------------------------------------------------- */
  [emailInput, passwordInput, confirmInput].forEach((input) => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        authForm.requestSubmit();
      }
    });
  });

  /* ---------------------------------------------------
     INIT
  --------------------------------------------------- */
  initTheme();
  setMode('login');
  buildParticles();
  typeHeading('Vanakam');
  checkExistingSession();
})();