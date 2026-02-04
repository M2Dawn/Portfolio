/* ========================================
   NEXT-LEVEL PORTFOLIO ENHANCEMENTS
   Advanced JavaScript Features
   ======================================== */

// ========== LIGHTBOX IMAGE GALLERY ==========
class Lightbox {
  constructor() {
    this.images = [];
    this.currentIndex = 0;
    this.init();
  }

  init() {
    // Create lightbox HTML
    const lightboxHTML = `
      <div id="lightbox" class="lightbox">
        <div class="lightbox-content">
          <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
          <button class="lightbox-nav lightbox-prev" aria-label="Previous image">&#10094;</button>
          <img class="lightbox-image" src="" alt="Lightbox image">
          <button class="lightbox-nav lightbox-next" aria-label="Next image">&#10095;</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);

    this.lightboxEl = document.getElementById('lightbox');
    this.imageEl = this.lightboxEl.querySelector('.lightbox-image');
    
    // Event listeners
    this.lightboxEl.querySelector('.lightbox-close').addEventListener('click', () => this.close());
    this.lightboxEl.querySelector('.lightbox-prev').addEventListener('click', () => this.prev());
    this.lightboxEl.querySelector('.lightbox-next').addEventListener('click', () => this.next());
    this.lightboxEl.addEventListener('click', (e) => {
      if (e.target === this.lightboxEl) this.close();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.lightboxEl.classList.contains('active')) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowLeft') this.prev();
      if (e.key === 'ArrowRight') this.next();
    });
  }

  open(images, index = 0) {
    this.images = images;
    this.currentIndex = index;
    this.show();
  }

  show() {
    this.imageEl.src = this.images[this.currentIndex];
    this.lightboxEl.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.lightboxEl.classList.remove('active');
    document.body.style.overflow = 'auto';
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.show();
  }

  prev() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.show();
  }
}

// Initialize lightbox
const lightbox = new Lightbox();

// ========== CONTACT FORM VALIDATION & SUBMISSION ==========
class ContactForm {
  constructor(formId) {
    this.form = document.getElementById(formId);
    if (!this.form) return;
    
    this.init();
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    
    // Real-time validation
    this.form.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => {
        if (input.parentElement.classList.contains('error')) {
          this.validateField(input);
        }
      });
    });
  }

  validateField(field) {
    const formGroup = field.parentElement;
    const errorEl = formGroup.querySelector('.form-error');
    let isValid = true;
    let errorMessage = '';

    // Required validation
    if (field.hasAttribute('required') && !field.value.trim()) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    // Email validation
    if (field.type === 'email' && field.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(field.value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
      }
    }

    // Update UI
    if (isValid) {
      formGroup.classList.remove('error');
    } else {
      formGroup.classList.add('error');
      if (errorEl) errorEl.textContent = errorMessage;
    }

    return isValid;
  }

  validateForm() {
    let isValid = true;
    this.form.querySelectorAll('input, textarea').forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    return isValid;
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    const submitBtn = this.form.querySelector('.submit-btn');
    const successMsg = this.form.querySelector('.form-success');
    
    // Show loading state
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Get form data
    const formData = {
      name: this.form.querySelector('[name="name"]').value,
      email: this.form.querySelector('[name="email"]').value,
      subject: this.form.querySelector('[name="subject"]')?.value || 'Contact Form Submission',
      message: this.form.querySelector('[name="message"]').value
    };

    try {
      // Simulate API call (replace with actual EmailJS or backend API)
      await this.sendEmail(formData);
      
      // Show success message
      successMsg.classList.add('show');
      showToast('Message sent successfully!', 'success');
      this.form.reset();
      
      // Track with GA
      if (typeof gtag !== 'undefined') {
        gtag('event', 'form_submit', {
          event_category: 'Contact',
          event_label: 'Contact Form Submission'
        });
      }

      setTimeout(() => {
        successMsg.classList.remove('show');
      }, 5000);
    } catch (error) {
      showToast('Failed to send message. Please try again.', 'error');
      console.error('Form submission error:', error);
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  }

  async sendEmail(data) {
    // Check if EmailJS is loaded
    if (typeof emailjs === 'undefined') {
      console.warn('EmailJS not loaded. Form data:', data);
      // Simulate success for demo purposes
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('Email data (not sent):', data);
          resolve();
        }, 1500);
      });
    }
    
    // EmailJS credentials - Fully configured!
    // Get them from: https://dashboard.emailjs.com/
    const SERVICE_ID = 'service_f6ehl85';      // ✅ Your EmailJS Service ID
    const TEMPLATE_ID = 'template_dks5llc';    // ✅ Your EmailJS Template ID
    const PUBLIC_KEY = '0o6S42Yn8J2Sleaw1';    // ✅ Your EmailJS Public Key
    
    // Initialize EmailJS (only needs to be done once)
    if (!window.emailjsInitialized) {
      emailjs.init(PUBLIC_KEY);
      window.emailjsInitialized = true;
    }
    
    // Send email using EmailJS
    return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      from_name: data.name,
      from_email: data.email,
      subject: data.subject,
      message: data.message,
      to_name: 'Hossam Sabry'  // Your name
    })
    .then(response => {
      console.log('✅ Email sent successfully!', response.status, response.text);
      return response;
    })
    .catch(error => {
      console.error('❌ Email sending failed:', error);
      throw error;
    });
  }
}

// ========== TOAST NOTIFICATIONS ==========
function showToast(message, type = 'success') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create new toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Show toast
  setTimeout(() => toast.classList.add('show'), 100);

  // Hide and remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========== SCROLL REVEAL ANIMATIONS ==========
class ScrollReveal {
  constructor() {
    this.elements = document.querySelectorAll('.scroll-reveal');
    this.init();
  }

  init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    this.elements.forEach(el => observer.observe(el));
  }
}

// ========== MAGNETIC BUTTON EFFECT ==========
function addMagneticEffect(elements) {
  elements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const moveX = x * 0.3;
      const moveY = y * 0.3;
      
      el.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
    
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'translate(0, 0)';
    });
  });
}


// ========== LAZY LOADING IMAGES ==========
function initLazyLoading() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });

  images.forEach(img => imageObserver.observe(img));
}

// ========== TYPING EFFECT ==========
function typeWriter(element, text, speed = 50) {
  let i = 0;
  element.textContent = '';
  
  function type() {
    if (i < text.length) {
      element.textContent += text.charAt(i);
      i++;
      setTimeout(type, speed);
    }
  }
  
  type();
}

// ========== SMOOTH SCROLL WITH OFFSET ==========
function smoothScrollTo(target, offset = 80) {
  const element = document.querySelector(target);
  if (!element) return;
  
  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
}

// ========== COPY TO CLIPBOARD ==========
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success');
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      showToast('Copied to clipboard!', 'success');
      return true;
    } catch (err) {
      showToast('Failed to copy', 'error');
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}

// ========== ICON ANIMATION ENHANCEMENTS ==========
function initIconAnimations() {
  // Add 3D tilt effect to skill cards
  const skillCards = document.querySelectorAll('.skill');
  
  skillCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-15px) scale(1.03)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
  
  // Add floating animation to icons on hover
  const skillIcons = document.querySelectorAll('.skill-icon');
  skillIcons.forEach(icon => {
    icon.addEventListener('mouseenter', () => {
      icon.style.animation = 'iconFloat 0.6s ease-in-out';
    });
    
    icon.addEventListener('animationend', () => {
      icon.style.animation = '';
    });
  });
}

// Add icon float animation
const iconFloatStyle = document.createElement('style');
iconFloatStyle.textContent = `
  @keyframes iconFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
`;
document.head.appendChild(iconFloatStyle);

// ========== PARALLAX SCROLL EFFECT ==========
function initParallaxEffect() {
  window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.skill-icon, .cert-icon, .tech-item-icon');
    
    parallaxElements.forEach((el, index) => {
      const speed = 0.05 + (index % 3) * 0.02;
      const yPos = -(scrolled * speed);
      el.style.transform = `translateY(${yPos}px)`;
    });
  });
}

// ========== GRADIENT ANIMATION FOR CARDS ==========
function initGradientAnimations() {
  const cards = document.querySelectorAll('.skill, .project, .cert-card, .tech-item');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      this.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    });
  });
}

// ========== ANIMATED PARTICLE NETWORK BACKGROUND ==========
class ParticleNetwork {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: null, y: null, radius: 150 };
    this.particleCount = 80;
    this.connectionDistance = 120;
    this.colors = [
      'rgba(102, 126, 234, 0.8)',  // Purple
      'rgba(78, 205, 196, 0.8)',   // Teal
      'rgba(255, 107, 107, 0.8)',  // Red
      'rgba(255, 230, 109, 0.8)'   // Yellow
    ];
    
    this.init();
  }
  
  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    // Mouse tracking
    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.x;
      this.mouse.y = e.y;
    });
    
    window.addEventListener('mouseout', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
    
    // Create particles
    this.createParticles();
    
    // Start animation
    this.animate();
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        color: this.colors[Math.floor(Math.random() * this.colors.length)]
      });
    }
  }
  
  drawParticles() {
    this.particles.forEach(particle => {
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.fill();
      
      // Add glow effect
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = particle.color;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    });
  }
  
  connectParticles() {
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.connectionDistance) {
          const opacity = (1 - distance / this.connectionDistance) * 0.5;
          this.ctx.beginPath();
          this.ctx.strokeStyle = `rgba(102, 126, 234, ${opacity})`;
          this.ctx.lineWidth = 1;
          this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
          this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
          this.ctx.stroke();
        }
      }
    }
  }
  
  connectToMouse() {
    if (this.mouse.x === null || this.mouse.y === null) return;
    
    this.particles.forEach(particle => {
      const dx = particle.x - this.mouse.x;
      const dy = particle.y - this.mouse.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.mouse.radius) {
        const opacity = (1 - distance / this.mouse.radius) * 0.8;
        this.ctx.beginPath();
        this.ctx.strokeStyle = `rgba(78, 205, 196, ${opacity})`;
        this.ctx.lineWidth = 2;
        this.ctx.moveTo(particle.x, particle.y);
        this.ctx.lineTo(this.mouse.x, this.mouse.y);
        this.ctx.stroke();
        
        // Push particles away from mouse
        const force = (this.mouse.radius - distance) / this.mouse.radius;
        const angle = Math.atan2(dy, dx);
        particle.vx += Math.cos(angle) * force * 0.05;
        particle.vy += Math.sin(angle) * force * 0.05;
      }
    });
  }
  
  updateParticles() {
    this.particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      
      // Bounce off edges
      if (particle.x < 0 || particle.x > this.canvas.width) {
        particle.vx *= -1;
      }
      if (particle.y < 0 || particle.y > this.canvas.height) {
        particle.vy *= -1;
      }
      
      // Apply friction
      particle.vx *= 0.99;
      particle.vy *= 0.99;
      
      // Keep minimum velocity
      if (Math.abs(particle.vx) < 0.1) particle.vx = (Math.random() - 0.5) * 0.2;
      if (Math.abs(particle.vy) < 0.1) particle.vy = (Math.random() - 0.5) * 0.2;
    });
  }
  
  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.drawParticles();
    this.connectParticles();
    this.connectToMouse();
    this.updateParticles();
    
    requestAnimationFrame(() => this.animate());
  }
}

// ========== FLOATING GEOMETRIC SHAPES ==========
class FloatingShapes {
  constructor() {
    this.shapes = [];
    this.init();
  }
  
  init() {
    // Create floating shape elements
    for (let i = 0; i < 8; i++) {
      const shape = document.createElement('div');
      shape.className = 'floating-shape';
      shape.style.cssText = `
        position: fixed;
        width: ${Math.random() * 100 + 50}px;
        height: ${Math.random() * 100 + 50}px;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        opacity: ${Math.random() * 0.1 + 0.05};
        border-radius: ${Math.random() > 0.5 ? '50%' : '10px'};
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(78, 205, 196, 0.3));
        pointer-events: none;
        z-index: -1;
        filter: blur(40px);
        animation: floatShape ${Math.random() * 20 + 15}s ease-in-out infinite;
        animation-delay: ${Math.random() * 5}s;
      `;
      document.body.appendChild(shape);
      this.shapes.push(shape);
    }
  }
}

// ========== GRADIENT ORBS BACKGROUND ==========
class GradientOrbs {
  constructor() {
    this.init();
  }
  
  init() {
    // Create gradient orb elements
    const orbClasses = ['gradient-orb-1', 'gradient-orb-2', 'gradient-orb-3'];
    orbClasses.forEach(className => {
      const orb = document.createElement('div');
      orb.className = `gradient-orb ${className}`;
      document.body.appendChild(orb);
    });
  }
}

// ========== AURORA EFFECT ==========
class AuroraEffect {
  constructor() {
    this.init();
  }
  
  init() {
    const aurora = document.createElement('div');
    aurora.className = 'aurora-effect';
    document.body.appendChild(aurora);
  }
}

// ========== MOUSE SPOTLIGHT EFFECT ==========
class MouseSpotlight {
  constructor() {
    this.spotlight = null;
    this.init();
  }
  
  init() {
    this.spotlight = document.createElement('div');
    this.spotlight.className = 'spotlight';
    this.spotlight.style.transform = 'translate(-50%, -50%)';
    document.body.appendChild(this.spotlight);
    
    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
      this.spotlight.style.left = e.clientX + 'px';
      this.spotlight.style.top = e.clientY + 'px';
    });
  }
}

// ========== ANIMATED GRID PATTERN ==========
class AnimatedGrid {
  constructor() {
    this.init();
  }
  
  init() {
    const grid = document.createElement('div');
    grid.className = 'grid-pattern';
    document.body.appendChild(grid);
  }
}

// Add floating shapes animation
const floatingShapesStyle = document.createElement('style');
floatingShapesStyle.textContent = `
  @keyframes floatShape {
    0%, 100% {
      transform: translate(0, 0) rotate(0deg) scale(1);
    }
    25% {
      transform: translate(50px, -50px) rotate(90deg) scale(1.1);
    }
    50% {
      transform: translate(100px, 0) rotate(180deg) scale(0.9);
    }
    75% {
      transform: translate(50px, 50px) rotate(270deg) scale(1.05);
    }
  }
`;
document.head.appendChild(floatingShapesStyle);

// ========== INITIALIZE ALL ENHANCEMENTS ==========
document.addEventListener('DOMContentLoaded', () => {
  // Initialize scroll reveal
  new ScrollReveal();
  
  // Initialize contact form
  new ContactForm('contactForm');
  
  // Initialize icon animations
  initIconAnimations();
  
  // Initialize gradient animations
  initGradientAnimations();
  
  // Add magnetic effect to buttons
  const magneticButtons = document.querySelectorAll('.magnetic-btn, .btn, .filter-btn');
  if (magneticButtons.length > 0) {
    addMagneticEffect(magneticButtons);
  }
  
  // Initialize lazy loading
  initLazyLoading();
  
  // Initialize particle network background
  setTimeout(() => {
    new ParticleNetwork('particleCanvas');
  }, 100);
  
  // Initialize all background effects
  new FloatingShapes();
  new GradientOrbs();
  new AuroraEffect();
  new MouseSpotlight();
  new AnimatedGrid();
  
  
  // Add ripple effect to buttons
  document.querySelectorAll('.ripple, .btn, .filter-btn').forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.5)';
      ripple.style.pointerEvents = 'none';
      ripple.style.animation = 'rippleEffect 0.6s ease-out';
      ripple.classList.add('ripple-effect');
      
      this.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
  
  // Add smooth hover effects to all interactive elements
  const interactiveElements = document.querySelectorAll('a, button, .skill, .project, .cert-card, .tech-item');
  interactiveElements.forEach(el => {
    el.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  });
  
  console.log('✨ Portfolio enhancements loaded successfully!');
  console.log('🎨 Modern icon system activated!');
  console.log('🚀 All animations initialized!');
});

// Add ripple effect animation
const rippleStyle = document.createElement('style');
rippleStyle.textContent = `
  @keyframes rippleEffect {
    from {
      transform: scale(0);
      opacity: 1;
    }
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(rippleStyle);

// ========== PERFORMANCE MONITORING ==========
window.addEventListener('load', () => {
  if ('performance' in window) {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    
    console.log(`⚡ Page load time: ${pageLoadTime}ms`);
    
    // Track with GA if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'timing_complete', {
        name: 'page_load',
        value: pageLoadTime,
        event_category: 'Performance'
      });
    }
  }
});

// Export functions for global use
window.portfolioEnhancements = {
  lightbox,
  showToast,
  copyToClipboard,
  smoothScrollTo,
  typeWriter
};
