/* main.js — Premium Portfolio Interactions */

// 1. Scroll reveal
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// 2. Expertise bar animation
const barObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animate');
      barObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.exp-bar').forEach(el => barObs.observe(el));

// 3. Nav scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// 4. Mobile menu
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open);
    navToggle.textContent = open ? '✕' : '☰';
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.textContent = '☰';
    });
  });
}

// 5. Smooth scroll on anchor clicks
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// 6. Hero mouse glow
const hero = document.querySelector('.hero');
if (hero) {
  hero.addEventListener('mousemove', e => {
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    hero.style.setProperty('--mx', `${x}%`);
    hero.style.setProperty('--my', `${y}%`);
  });
}

// 7. Card spotlight (mouse-tracked radial gradient)
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    card.style.setProperty('--cx', `${x}%`);
    card.style.setProperty('--cy', `${y}%`);
  });
});

// 8. Revit Plugin WPF Mockup Simulation
const wpfWindow = document.getElementById('wpfWindow');
const wpfMinimize = document.getElementById('wpfMinimize');
const wpfMaximize = document.getElementById('wpfMaximize');
const wpfClose = document.getElementById('wpfClose');
const wpfRestoreBtn = document.getElementById('wpfRestoreBtn');

const wpfRunBtn = document.getElementById('wpfRunBtn');
const wpfRunWrap = document.getElementById('wpfRunWrap');
const wpfForm = document.getElementById('wpfForm');
const wpfProgressPanel = document.getElementById('wpfProgressPanel');
const wpfProgressFill = document.getElementById('wpfProgressFill');
const wpfStatusTask = document.getElementById('wpfStatusTask');
const wpfStatusPercent = document.getElementById('wpfStatusPercent');
const wpfSuccessAlert = document.getElementById('wpfSuccessAlert');
const wpfAlertDesc = document.getElementById('wpfAlertDesc');
const wpfRunAgain = document.getElementById('wpfRunAgain');
const wpfConsoleBody = document.getElementById('wpfConsoleBody');

const wpfPathText = document.getElementById('wpfPathText');
const wpfBrowseBtn = document.getElementById('wpfBrowseBtn');

// Interactive Dropdown Elements
const wpfFormatDropdown = document.getElementById('wpfFormatDropdown');
const wpfFormatBtn = document.getElementById('wpfFormatBtn');
const wpfFormatValue = document.getElementById('wpfFormatValue');
const wpfFormatMenu = document.getElementById('wpfFormatMenu');

if (wpfRunBtn) {
  let simTimeout = null;
  let selectedFormat = 'pdf'; // default

  // Option 1: Titlebar Controls Interactivity
  if (wpfClose && wpfWindow && wpfRestoreBtn) {
    wpfClose.addEventListener('click', () => {
      wpfWindow.classList.add('wpf-closed');
      wpfRestoreBtn.classList.remove('wpf-state-hidden');
      wpfRestoreBtn.classList.add('wpf-state-visible');
      trackGAEvent('revit_exporter_window_control', { 'action': 'close' });
    });
  }

  if (wpfRestoreBtn && wpfWindow) {
    wpfRestoreBtn.addEventListener('click', () => {
      wpfWindow.classList.remove('wpf-closed');
      wpfRestoreBtn.classList.remove('wpf-state-visible');
      wpfRestoreBtn.classList.add('wpf-state-hidden');
      trackGAEvent('revit_exporter_window_control', { 'action': 'restore' });
    });
  }

  if (wpfMinimize && wpfWindow) {
    wpfMinimize.addEventListener('click', () => {
      wpfWindow.classList.toggle('wpf-minimized');
      const isMinimized = wpfWindow.classList.contains('wpf-minimized');
      trackGAEvent('revit_exporter_window_control', { 'action': isMinimized ? 'minimize' : 'unminimize' });
    });
  }

  if (wpfMaximize) {
    wpfMaximize.addEventListener('click', () => {
      appendLog('Window maximization disabled in simulated sandbox environment.', true);
      trackGAEvent('revit_exporter_window_control', { 'action': 'maximize_attempt' });
    });
  }

  // Option 2: Path browser cycling
  const samplePaths = [
    'C:\\Projects\\AECOM_Central\\Exports\\',
    'D:\\BIM_Deliverables\\Phase_1\\Outputs\\',
    'C:\\Users\\BIM_Coordinator\\Desktop\\Revit_PDFs\\'
  ];
  let currentPathIndex = 0;

  if (wpfBrowseBtn && wpfPathText) {
    wpfBrowseBtn.addEventListener('click', () => {
      currentPathIndex = (currentPathIndex + 1) % samplePaths.length;
      wpfPathText.textContent = samplePaths[currentPathIndex];

      // Reset & trigger path flash animation
      wpfPathText.classList.remove('wpf-path-flash');
      void wpfPathText.offsetWidth; // Trigger reflow
      wpfPathText.classList.add('wpf-path-flash');

      appendLog(`Output path redirected to: ${samplePaths[currentPathIndex]}`);
      trackGAEvent('revit_exporter_browse', { 'new_path': samplePaths[currentPathIndex] });
    });
  }

  // Dropdown interactivity
  if (wpfFormatBtn && wpfFormatDropdown && wpfFormatMenu) {
    wpfFormatBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      wpfFormatDropdown.classList.toggle('open');
    });

    // Close dropdown on click outside
    document.addEventListener('click', () => {
      wpfFormatDropdown.classList.remove('open');
    });

    // Handle Option Selection
    wpfFormatMenu.querySelectorAll('.wpf-dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedFormat = item.getAttribute('data-value');
        wpfFormatValue.textContent = item.getAttribute('data-label');
        
        // Update active class
        wpfFormatMenu.querySelectorAll('.wpf-dropdown-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        
        // Close menu
        wpfFormatDropdown.classList.remove('open');
        
        trackGAEvent('change_revit_exporter_format', { 'selected_format': selectedFormat });
      });
    });
  }

  function formatTime() {
    const now = new Date();
    return `[${now.toTimeString().split(' ')[0]}]`;
  }

  function appendLog(message, isImportant = false) {
    if (wpfConsoleBody) {
      const placeholder = wpfConsoleBody.querySelector('.wpf-console-placeholder');
      if (placeholder) placeholder.remove();

      const row = document.createElement('div');
      row.className = 'wpf-console-row';
      if (isImportant) row.style.color = 'var(--accent-light)';
      row.innerHTML = `<span style="color:var(--text-3); margin-right:6px;">${formatTime()}</span> ${message}`;
      wpfConsoleBody.appendChild(row);
      wpfConsoleBody.scrollTop = wpfConsoleBody.scrollHeight;
    }
  }

  function resetSimulation() {
    if (simTimeout) clearTimeout(simTimeout);
    if (wpfWindow) wpfWindow.classList.remove('wpf-running');

    // Fade visible state back to Form/Run btn
    wpfSuccessAlert.classList.remove('wpf-state-visible');
    wpfSuccessAlert.classList.add('wpf-state-hidden');
    
    wpfForm.classList.remove('wpf-state-hidden');
    wpfForm.classList.add('wpf-state-visible');
    wpfRunWrap.classList.remove('wpf-state-hidden');
    wpfRunWrap.classList.add('wpf-state-visible');

    wpfRunBtn.disabled = false;
    wpfProgressPanel.classList.remove('wpf-state-visible');
    wpfProgressPanel.classList.add('wpf-state-hidden');
    wpfProgressFill.style.width = '0%';
    wpfStatusPercent.textContent = '0%';
    wpfStatusTask.textContent = 'Ready';
    
    if (wpfConsoleBody) {
      wpfConsoleBody.innerHTML = '<div class="wpf-console-placeholder">Revit API Simulated Sandbox. Click \'Run Exporter\' above to begin.</div>';
    }
  }

  function startSimulation() {
    wpfRunBtn.disabled = true;
    if (wpfWindow) wpfWindow.classList.add('wpf-running'); // Start caret blink

    appendLog('System initialized. Checking Revit document context...', true);

    trackGAEvent('run_revit_exporter_simulation', {
      'export_format': selectedFormat,
      'output_path': wpfPathText ? wpfPathText.textContent : 'C:\\Projects\\AECOM_Central\\Exports\\'
    });

    setTimeout(() => {
      // Transition state: Hide form & run button, Show progress panel
      wpfForm.classList.remove('wpf-state-visible');
      wpfForm.classList.add('wpf-state-hidden');
      wpfRunWrap.classList.remove('wpf-state-visible');
      wpfRunWrap.classList.add('wpf-state-hidden');

      wpfProgressPanel.classList.remove('wpf-state-hidden');
      wpfProgressPanel.classList.add('wpf-state-visible');
      
      runSteps();
    }, 800);
  }

  function runSteps() {
    let steps = [];
    let successMessage = "";
    let finalLog = "";
    
    if (selectedFormat === 'pdf') {
      steps = [
        { progress: 5, task: 'Loading database...', log: 'Opening Autodesk.Revit.DB connection...', delay: 400 },
        { progress: 12, task: 'Analyzing views...', log: 'Scanning sheets database. Found 247 printable views.', delay: 500 },
        { progress: 20, task: 'Exporting sheets 1 - 50...', log: 'Exporting Sheets [1 - 50] to PDF format...', delay: 600 },
        { progress: 45, task: 'Exporting sheets 51 - 120...', log: 'Exporting Sheets [51 - 120] to PDF format...', delay: 600 },
        { progress: 70, task: 'Exporting sheets 121 - 200...', log: 'Exporting Sheets [121 - 200] to PDF format...', delay: 600 },
        { progress: 90, task: 'Exporting sheets 201 - 247...', log: 'Exporting Sheets [201 - 247] to PDF format...', delay: 500 },
        { progress: 96, task: 'Combining sheets into PDF...', log: 'Merging separate pages into a single multipage document...', delay: 700 },
        { progress: 100, task: 'Completing export...', log: `PDF generated successfully: ${wpfPathText ? wpfPathText.textContent : 'C:\\Projects\\AECOM_Central\\Exports\\'}AECOM_Set_Merged.pdf`, delay: 400 }
      ];
      successMessage = "247 sheets combined into PDF. Saved ~6.5 hours of manual work.";
      finalLog = "Task finished. Saved 6.5 hours of manual work.";
    } else if (selectedFormat === 'dwg') {
      steps = [
        { progress: 5, task: 'Loading database...', log: 'Opening Autodesk.Revit.DB connection...', delay: 400 },
        { progress: 12, task: 'Analyzing views...', log: 'Scanning sheets database. Found 247 printable views.', delay: 500 },
        { progress: 20, task: 'Exporting sheets 1 - 50...', log: 'Exporting Sheets [1 - 50] to CAD DWG format...', delay: 600 },
        { progress: 45, task: 'Exporting sheets 51 - 120...', log: 'Exporting Sheets [51 - 120] to CAD DWG format...', delay: 600 },
        { progress: 70, task: 'Exporting sheets 121 - 200...', log: 'Exporting Sheets [121 - 200] to CAD DWG format...', delay: 600 },
        { progress: 90, task: 'Exporting sheets 201 - 247...', log: 'Exporting Sheets [201 - 247] to CAD DWG format...', delay: 500 },
        { progress: 96, task: 'Verifying files...', log: 'Validating exported file naming patterns and standard styles...', delay: 700 },
        { progress: 100, task: 'Completing export...', log: `247 DWG files exported successfully to ${wpfPathText ? wpfPathText.textContent : 'C:\\Projects\\AECOM_Central\\Exports\\'}`, delay: 400 }
      ];
      successMessage = "247 DWG files exported successfully. Saved ~6.5 hours of manual work.";
      finalLog = "Task finished. Saved 6.5 hours of manual work.";
    } else if (selectedFormat === 'dwg-csv') {
      steps = [
        { progress: 5, task: 'Loading database...', log: 'Opening Autodesk.Revit.DB connection...', delay: 400 },
        { progress: 12, task: 'Analyzing views...', log: 'Scanning sheets database. Found 247 printable views.', delay: 500 },
        { progress: 20, task: 'Exporting sheets 1 - 50...', log: 'Exporting Sheets [1 - 50] to CAD DWG format...', delay: 600 },
        { progress: 45, task: 'Exporting sheets 51 - 120...', log: 'Exporting Sheets [51 - 120] to CAD DWG format...', delay: 600 },
        { progress: 70, task: 'Exporting sheets 121 - 200...', log: 'Exporting Sheets [121 - 200] to CAD DWG format...', delay: 600 },
        { progress: 85, task: 'Exporting sheets 201 - 247...', log: 'Exporting Sheets [201 - 247] to CAD DWG format...', delay: 500 },
        { progress: 92, task: 'Extracting schedules...', log: 'Querying schedule views. Extracting room, door, and window parameters...', delay: 600 },
        { progress: 98, task: 'Exporting CSV schedules...', log: 'Generating 12 CSV reports with structured BIM metadata...', delay: 500 },
        { progress: 100, task: 'Completing export...', log: `DWG + CSV files generated at ${wpfPathText ? wpfPathText.textContent : 'C:\\Projects\\AECOM_Central\\Exports\\'}`, delay: 400 }
      ];
      successMessage = "247 DWG files + 12 CSV schedules exported. Saved ~8 hours of manual work.";
      finalLog = "Task finished. Saved 8 hours of manual work.";
    }

    let currentStep = 0;

    function nextStep() {
      if (currentStep >= steps.length) {
        setTimeout(() => {
          // Hide progress, Show success alert
          wpfProgressPanel.classList.remove('wpf-state-visible');
          wpfProgressPanel.classList.add('wpf-state-hidden');
          if (wpfWindow) wpfWindow.classList.remove('wpf-running'); // Turn off caret blink
          
          if (wpfAlertDesc) wpfAlertDesc.textContent = successMessage;
          wpfSuccessAlert.classList.remove('wpf-state-hidden');
          wpfSuccessAlert.classList.add('wpf-state-visible');
          
          appendLog(finalLog, true);

          // Auto-reset after 7 seconds if the user doesn't click "Run again"
          simTimeout = setTimeout(resetSimulation, 7000);
        }, 500);
        return;
      }

      const s = steps[currentStep];
      wpfStatusTask.textContent = s.task;
      wpfStatusPercent.textContent = `${s.progress}%`;
      wpfProgressFill.style.width = `${s.progress}%`;
      appendLog(s.log);

      currentStep++;
      simTimeout = setTimeout(nextStep, s.delay);
    }

    nextStep();
  }

  wpfRunBtn.addEventListener('click', () => {
    if (simTimeout) clearTimeout(simTimeout);
    startSimulation();
  });

  if (wpfRunAgain) {
    wpfRunAgain.addEventListener('click', () => {
      resetSimulation();
      trackGAEvent('revit_exporter_run_again', { 'last_format': selectedFormat });
    });
  }
}

// 9. Copy email
window.copyEmail = function() {
  const email = 'e.hossamsabry@gmail.com';
  const btn = document.getElementById('emailBtn');
  navigator.clipboard.writeText(email).then(() => {
    const orig = btn.innerHTML;
    btn.innerHTML = '✓ Copied!';
    setTimeout(() => { btn.innerHTML = orig; }, 2000);
  }).catch(() => {
    const ta = Object.assign(document.createElement('textarea'), { value: email, style: 'position:fixed;left:-9999px' });
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  });
};

// 10. Contact form
const form = document.getElementById('contactForm');
if (form) {
  // Clear error styling on input
  form.querySelectorAll('[required], [type="email"]').forEach(f => {
    f.addEventListener('input', () => {
      f.closest('.form-field')?.classList.remove('has-error');
    });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach(f => {
      const g = f.closest('.form-field');
      if (!f.value.trim()) { g?.classList.add('has-error'); valid = false; }
      else g?.classList.remove('has-error');
    });
    const em = form.querySelector('[type="email"]');
    if (em?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value)) {
      em.closest('.form-field')?.classList.add('has-error'); valid = false;
    }
    if (!valid) {
      trackGAEvent('contact_form_error', { 'error_reason': 'validation_failed' });
      return;
    }

    const btn = form.querySelector('.btn-submit');
    const succ = form.querySelector('.form-success');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (typeof emailjs !== 'undefined') {
        if (!window._ejsInit) { emailjs.init('0o6S42Yn8J2Sleaw1'); window._ejsInit = true; }
        await emailjs.send('service_f6ehl85', 'template_dks5llc', {
          from_name: form.querySelector('[name="name"]').value,
          from_email: form.querySelector('[name="email"]').value,
          message: form.querySelector('[name="message"]').value,
          to_name: 'Hossam Sabry'
        });
      } else if (isLocal) {
        // Simulate local success for testing
        await new Promise(r => setTimeout(r, 1000));
        console.log('[Form Sent Mock]', {
          name: form.querySelector('[name="name"]').value,
          email: form.querySelector('[name="email"]').value,
          message: form.querySelector('[name="message"]').value
        });
      } else {
        throw new Error('blocked');
      }
      
      trackGAEvent('contact_form_success', { 'method': 'emailjs' });
      succ?.classList.add('show');
      form.reset();
      btn.textContent = 'Sent ✓';
      setTimeout(() => { succ?.classList.remove('show'); btn.textContent = 'Send Message'; btn.disabled = false; }, 4000);
    } catch (err) {
      trackGAEvent('contact_form_failure', { 'error_reason': err?.message || 'api_error' });
      
      btn.textContent = err?.message === 'blocked' ? 'Blocked by Browser - Click to Email' : 'Failed - Click to Email';
      btn.disabled = false;
      
      // Fallback click listener to open local mail client prefilled with their typed content
      const mailFallback = (e) => {
        e.preventDefault();
        const freshMsg = form.querySelector('[name="message"]').value;
        const freshName = form.querySelector('[name="name"]').value;
        window.location.href = `mailto:e.hossamsabry@gmail.com?subject=${encodeURIComponent('Contact via Portfolio - ' + freshName)}&body=${encodeURIComponent(freshMsg)}`;
        btn.removeEventListener('click', mailFallback);
        btn.textContent = 'Send Message';
      };
      btn.addEventListener('click', mailFallback);
    }

  });
}

// 11. Console signature
console.log('%c Hossam Sabry ', 'background:#5B8DF3;color:#fff;font-family:monospace;padding:4px 8px;border-radius:4px;font-size:13px;');
console.log('%c BIM Automation Engineer   github.com/M2Dawn', 'color:#A1A1AA;font-family:monospace;font-size:12px;');

// === NEXT-LEVEL UPGRADES ===

// A. Count-up animation for stat numbers
function countUp(el, target, suffix, duration = 1600) {
  const isFloat = target % 1 !== 0;
  const start = performance.now();
  const startVal = 0;
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const val = startVal + (target - startVal) * eased;
    el.textContent = (isFloat ? val.toFixed(0) : Math.floor(val)) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// Count-up: hero metrics trigger after hero-enter animation; others trigger on scroll
document.querySelectorAll('[data-count]').forEach(el => {
  const inHero = !!el.closest('.hero');
  if (inHero) {
    setTimeout(() => {
      countUp(el, parseFloat(el.dataset.count), el.dataset.suffix || '');
    }, 1000);
  } else {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        countUp(entry.target, parseFloat(entry.target.dataset.count), entry.target.dataset.suffix || '');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    obs.observe(el);
  }
});

// B. Active nav link based on scroll position
const sections = document.querySelectorAll('section[id]');
const navAs = document.querySelectorAll('.nav-links a[href^="#"]');
const sectionObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      navAs.forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => sectionObs.observe(s));

// C. Expertise card spotlight
document.querySelectorAll('.exp-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--cx', `${((e.clientX - r.left)/r.width*100).toFixed(1)}%`);
    card.style.setProperty('--cy', `${((e.clientY - r.top)/r.height*100).toFixed(1)}%`);
  });
});

// D. Keyboard: allow card clicks via Enter/Space
document.querySelectorAll('.card[role="link"]').forEach(card => {
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
  });
});

// E. Scroll progress indicator on nav
const progressBar = document.createElement('div');
progressBar.style.cssText = `
  position:fixed;top:0;left:0;height:2px;width:0%;z-index:200;pointer-events:none;
  background:linear-gradient(90deg,#5B8DF3,#9B5CF6);
  transition:width 0.1s linear;
  box-shadow:0 0 8px rgba(91,141,243,0.6);
`;
document.body.appendChild(progressBar);
window.addEventListener('scroll', () => {
  const doc = document.documentElement;
  const pct = (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100;
  progressBar.style.width = pct + '%';
}, { passive: true });

// F. Smooth entrance for hero section label dot
const heroDot = document.querySelector('.hero-label-dot');
if (heroDot) {
  heroDot.style.cssText += `animation: pulse-dot 2.5s ease-in-out infinite;`;
  const s = document.createElement('style');
  s.textContent = `@keyframes pulse-dot {
    0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.5);}
    50%{box-shadow:0 0 0 6px rgba(34,197,94,0);}
  }`;
  document.head.appendChild(s);
}

// === GOOGLE ANALYTICS CUSTOM EVENTS ===

// 0. Privacy & Developer Environment Optimizations
(function() {
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  window.location.protocol === 'file:';
  
  const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  const isDNT = dnt === '1' || dnt === 'yes';

  if (isLocal || isDNT) {
    window['ga-disable-G-MWW9X0CJQF'] = true;
    if (isLocal) {
      console.log('%c[GA4 Debug Mode]%c Localhost environment detected. Live analytics calls are disabled.', 'background:#e0f2fe;color:#0369a1;padding:2px 6px;border-radius:4px;font-weight:bold;', 'color:#52525b;');
    }
  }
})();

function trackGAEvent(name, params = {}) {
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  window.location.protocol === 'file:';
  
  if (isLocal) {
    console.log(`%c[GA4 Event Debug]%c ${name}`, 'color:#0369a1;font-weight:bold;', 'color:#1c1917;', params);
    return;
  }
  
  if (typeof gtag === 'function') {
    gtag('event', name, params);
  }
}


// 1. Track general button and links clicks
document.querySelectorAll('.social-btn, .nav-cta, .btn-ghost, .btn-primary, .btn-submit, .btn-link, .contact-email').forEach(el => {
  el.addEventListener('click', () => {
    const label = el.getAttribute('aria-label') || el.innerText?.trim() || el.id || 'button';
    const href = el.getAttribute('href') || '';
    trackGAEvent('click_interaction', {
      'element_label': label,
      'element_url': href,
      'page_location': window.location.pathname
    });
  });
});

// 2. Track Case Study Bento Card Clicks
document.querySelectorAll('.card[role="link"]').forEach(card => {
  card.addEventListener('click', () => {
    const title = card.querySelector('.card-title')?.innerText?.trim() || 'Unknown Case Study';
    trackGAEvent('view_case_study', {
      'case_study_title': title
    });
  });
});

// 3. Track copy email click
const emailBtn = document.getElementById('emailBtn');
if (emailBtn) {
  emailBtn.addEventListener('click', () => {
    trackGAEvent('copy_email', {
      'method': 'copy_button'
    });
  });
}

// 4. Track trying live interactive tools
document.querySelectorAll('a[href*="/index.html"]').forEach(link => {
  link.addEventListener('click', () => {
    const title = link.closest('.card')?.querySelector('.card-title')?.innerText?.trim() || link.href;
    trackGAEvent('try_live_tool', {
      'tool_name': title
    });
  });
});
