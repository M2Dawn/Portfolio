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

// 8. Typewriter for code panel
const codeOutput = document.getElementById('codeOutput');
if (codeOutput) {
  const codeLines = [
    { t: 'cm', v: '// BIM Automation Tool &mdash; Batch Export' },
    { t: '', v: '' },
    { t: 'cm', v: '[Transaction(TransactionMode.Manual)]' },
    { t: 'ck', v: 'public class ', c: 'cn', cv: 'BatchExportCommand', c2: 'cv', v2: ' : IExternalCommand' },
    { t: 'cv', v: '{' },
    { t: 'ck', v: '  public ', c: 'cs', cv: 'Result', c2: 'cv', v2: ' Execute(' },
    { t: 'cs', v: '    ExternalCommandData', c: 'cv', cv: ' commandData,' },
    { t: 'ck', v: '    ref ', c: 'cs', cv: 'string', c2: 'cv', v2: ' message)' },
    { t: 'cv', v: '  {' },
    { t: 'cv', v: '    var ', c: 'cn', cv: 'doc', c2: 'cv', v2: ' = commandData' },
    { t: 'cv', v: '      .Application.ActiveUIDocument.Document;' },
    { t: '', v: '' },
    { t: 'cv', v: '    var ', c: 'cn', cv: 'views', c2: 'cv', v2: ' = new FilteredElementCollector(doc)' },
    { t: 'cv', v: '      .OfClass(typeof(', c: 'cs', cv: 'ViewSheet', c2: 'cv', v2: '))' },
    { t: 'cv', v: '      .Cast&lt;', c: 'cs', cv: 'ViewSheet', c2: 'cv', v2: '&gt;()' },
    { t: 'cv', v: '      .Where(v =&gt; v.CanBePrinted)' },
    { t: 'cv', v: '      .ToList();' },
    { t: '', v: '' },
    { t: 'cm', v: '    // 6&ndash;8 hrs &rarr; under 2 hrs' },
    { t: 'cv', v: '    ExportViews(doc, views);' },
    { t: '', v: '' },
    { t: 'ck', v: '    return ', c: 'cs', cv: 'Result', c2: 'cv', v2: '.Succeeded;' },
    { t: 'cv', v: '  }' },
    { t: 'cv', v: '}' },
  ];

  function buildLine(l) {
    let out = '';
    if (l.t)  out += '<span class="' + l.t + '">' + l.v + '</span>';
    else      out += l.v || '';
    if (l.c)  out += '<span class="' + l.c + '">' + l.cv + '</span>';
    if (l.c2) out += '<span class="' + l.c2 + '">' + l.v2 + '</span>';
    return out;
  }

  const codeBody = codeOutput.closest('.code-body');
  let lineIdx = 0;
  const ks = document.createElement('style');
  ks.textContent = '@keyframes fadeIn{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}';
  document.head.appendChild(ks);

  function typeLine() {
    if (lineIdx >= codeLines.length) {
      setTimeout(function() { if (codeBody) codeBody.scrollTop = 0; }, 700);
      return;
    }
    const el = document.createElement('div');
    el.style.cssText = 'min-height:1.55em;animation:fadeIn 0.15s ease forwards';
    el.innerHTML = buildLine(codeLines[lineIdx]) || '\u200B';
    codeOutput.appendChild(el);
    if (codeBody) codeBody.scrollTop = codeBody.scrollHeight;
    lineIdx++;
    setTimeout(typeLine, lineIdx < 4 ? 130 : 65);
  }

  setTimeout(typeLine, 900);
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
  form.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;
    form.querySelectorAll('[required]').forEach(f => {
      const g = f.closest('.form-field');
      const err = g?.querySelector('.form-error');
      if (!f.value.trim()) { g?.classList.add('has-error'); valid = false; }
      else g?.classList.remove('has-error');
    });
    const em = form.querySelector('[type="email"]');
    if (em?.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value)) {
      em.closest('.form-field')?.classList.add('has-error'); valid = false;
    }
    if (!valid) return;

    const btn = form.querySelector('.btn-submit');
    const succ = form.querySelector('.form-success');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      if (typeof emailjs !== 'undefined') {
        if (!window._ejsInit) {
          emailjs.init({ publicKey: '0o6S42Yn8J2Sleaw1' });
          window._ejsInit = true;
        }
        await emailjs.send('service_f6ehl85', 'template_dks5llc', {
          from_name: form.querySelector('[name="name"]').value,
          from_email: form.querySelector('[name="email"]').value,
          message: form.querySelector('[name="message"]').value,
          to_name: 'Hossam Sabry'
        });
      } else {
        await new Promise(r => setTimeout(r, 1000));
      }
      succ?.classList.add('show');
      form.reset();
      btn.textContent = 'Sent ✓';
      setTimeout(() => { succ?.classList.remove('show'); btn.textContent = 'Send Message'; btn.disabled = false; }, 4000);
    } catch (err) {
      console.error('EmailJS Error:', err);
      btn.textContent = 'Failed — try again';
      btn.disabled = false;
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
    // easeOutExpo
    const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
    const val = startVal + (target - startVal) * eased;
    el.textContent = (isFloat ? val.toFixed(0) : Math.floor(val)) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// Observe stat numbers
const statObs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const raw = el.dataset.count;
    if (!raw) return;
    const suffix = el.dataset.suffix || '';
    countUp(el, parseFloat(raw), suffix);
    statObs.unobserve(el);
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => statObs.observe(el));

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
  heroDot.style.cssText += `
    animation: pulse-dot 2.5s ease-in-out infinite;
  `;
  const s = document.createElement('style');
  s.textContent = `@keyframes pulse-dot {
    0%,100%{box-shadow:0 0 0 0 rgba(91,141,243,0.5);}
    50%{box-shadow:0 0 0 6px rgba(91,141,243,0);}
  }`;
  document.head.appendChild(s);
}
