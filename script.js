/**
 * ==========================================
 * CYBERPUNK PORTFOLIO FRONTEND INTERACTIONS
 * Client-Side JavaScript
 * ==========================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- 1. DETECT TOUCH DEVICE & STYLING ---
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice) {
    document.body.classList.add('touch-device');
    // Hide custom cursor elements if on touch device
    const cursors = document.querySelectorAll('.custom-cursor, .custom-cursor-glow');
    cursors.forEach(c => c.style.display = 'none');
  }

  // --- 2. CUSTOM GLOWING CURSOR ---
  const cursorDot = document.getElementById('cursor-dot');
  const cursorGlow = document.getElementById('cursor-glow');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let dotX = mouseX;
  let dotY = mouseY;
  let glowX = mouseX;
  let glowY = mouseY;

  if (!isTouchDevice) {
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Custom animation loop to interpolate (lerp) cursor glow for trailing effect
    const animateCursor = () => {
      // Direct update for inner dot
      dotX += (mouseX - dotX) * 0.3;
      dotY += (mouseY - dotY) * 0.3;
      cursorDot.style.left = `${dotX}px`;
      cursorDot.style.top = `${dotY}px`;

      // Interpolation for outer glow (slower speed = more lag/tail effect)
      glowX += (mouseX - glowX) * 0.15;
      glowY += (mouseY - glowY) * 0.15;
      cursorGlow.style.left = `${glowX}px`;
      cursorGlow.style.top = `${glowY}px`;

      requestAnimationFrame(animateCursor);
    };
    animateCursor();

    // Hover states for interactive elements
    const hoverElements = document.querySelectorAll('a, button, input, textarea, select, .tilt-card, .modal-close');
    hoverElements.forEach(elem => {
      elem.addEventListener('mouseenter', () => {
        cursorDot.classList.add('hovered');
        cursorGlow.classList.add('hovered');
      });
      elem.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('hovered');
        cursorGlow.classList.remove('hovered');
      });
    });
  }

  // --- 3. CANVAS PARTICLE FIELD (Neural Network Aesthetics) ---
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');

  let particles = [];
  const particleCount = isTouchDevice ? 30 : 70; // Optimized count for mobile/desktop
  const connectionDistance = 110;

  // Add mouse tracking for particles
  const mouse = {
    x: null,
    y: null,
    radius: 180
  };

  window.addEventListener('mousemove', (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });

  window.addEventListener('mouseout', () => {
    mouse.x = undefined;
    mouse.y = undefined;
  });

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor() {
      this.reset();
      // Start randomly positioned
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.radius = Math.random() * 2 + 1;
      this.alpha = Math.random() * 0.5 + 0.2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Bounce/teleport bounds
      if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
      if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 240, 255, ${this.alpha})`;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.5)';
      ctx.fill();
      ctx.shadowBlur = 0; // Reset shadow for line drawings
    }
  }

  // Initialize Particle Array
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  // Animation Frame Loop
  const animateParticles = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and Draw Particles
    particles.forEach(p => {
      p.update();
      p.draw();
    });

    // Draw connecting lines and mouse interactions
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          const alpha = (1 - (distance / connectionDistance)) * 0.15;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(168, 85, 247, ${alpha})`; // Purple connections
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
      
      // Interactive mouse lines and subtle repulsion
      if (mouse.x != null && mouse.y != null) {
        const dxMouse = particles[i].x - mouse.x;
        const dyMouse = particles[i].y - mouse.y;
        const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (distanceMouse < mouse.radius) {
          const alpha = (1 - (distanceMouse / mouse.radius)) * 0.3;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`; // Cyan connections to mouse
          ctx.lineWidth = 1;
          ctx.stroke();
          
          // Subtle repulsion from mouse
          const forceDirectionX = dxMouse / distanceMouse;
          const forceDirectionY = dyMouse / distanceMouse;
          const force = (mouse.radius - distanceMouse) / mouse.radius;
          particles[i].x += forceDirectionX * force * 1.5;
          particles[i].y += forceDirectionY * force * 1.5;
        }
      }
    }

    requestAnimationFrame(animateParticles);
  };
  animateParticles();

  // --- 4. MAGNETIC CTA BUTTON EFFECTS ---
  const magneticItems = document.querySelectorAll('.btn-cyber, .social-icon');

  if (!isTouchDevice) {
    magneticItems.forEach(item => {
      item.addEventListener('mousemove', (e) => {
        const rect = item.getBoundingClientRect();
        // Mouse coordinate relative to the button center
        const x = e.clientX - rect.left - (rect.width / 2);
        const y = e.clientY - rect.top - (rect.height / 2);

        // Translate the button slightly towards coordinates
        item.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
        item.style.transition = 'none'; // Lock transition during movements
      });

      item.addEventListener('mouseleave', () => {
        // Smooth return to resting state
        item.style.transform = 'translate(0px, 0px)';
        item.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)';
      });
    });
  }

  // --- 5. 3D CARD TILT EFFECT ---
  const tiltCards = document.querySelectorAll('.tilt-card');

  if (!isTouchDevice) {
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Normalized offsets (-0.5 to 0.5)
        const xPercent = (x / rect.width) - 0.5;
        const yPercent = (y / rect.height) - 0.5;

        // Tilt values (max rotation 8 degrees)
        const rotateY = xPercent * 16;
        const rotateX = -yPercent * 16;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        card.style.transition = 'none';
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        card.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
      });
    });
  }

  // --- 6. TYPING EFFECT CAROUSEL ---
  const typedTextSpan = document.getElementById('typed-text');
  const roles = [
    'Full Stack Developer',
    'AI Engineer',
    'Software Developer',
    'Cyber Security Enthusiast'
  ];

  const typingSpeed = 100;
  const erasingSpeed = 60;
  const newTextDelay = 2200; // Delay before typing next text
  let roleIndex = 0;
  let charIndex = 0;

  const type = () => {
    if (charIndex < roles[roleIndex].length) {
      typedTextSpan.textContent += roles[roleIndex].charAt(charIndex);
      charIndex++;
      setTimeout(type, typingSpeed);
    } else {
      setTimeout(erase, newTextDelay);
    }
  };

  const erase = () => {
    if (charIndex > 0) {
      typedTextSpan.textContent = roles[roleIndex].substring(0, charIndex - 1);
      charIndex--;
      setTimeout(erase, erasingSpeed);
    } else {
      roleIndex = (roleIndex + 1) % roles.length;
      setTimeout(type, typingSpeed + 300);
    }
  };

  // Start Typing Cycle
  if (roles.length) setTimeout(type, 1000);

  // --- 7. HEADER SCROLL AND ACTIVE STATE LINKS ---
  const header = document.getElementById('header');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // --- 8. COLLAPSIBLE MOBILE MENU ---
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  menuToggle.addEventListener('click', () => {
    const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isExpanded);
    menuToggle.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close nav panel when a link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });

  // --- 9. PROJECTS HOVER SPOTLIGHT & DETAIL EXPANSION ---
  const projectCard = document.getElementById('project-truthlens');
  if (projectCard) {
    projectCard.addEventListener('mousemove', (e) => {
      const rect = projectCard.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      projectCard.style.setProperty('--mouse-x', `${x}px`);
      projectCard.style.setProperty('--mouse-y', `${y}px`);
    });
  }

  const btnMoreDetails = document.getElementById('btn-truthlens-more');
  const detailsExpand = document.getElementById('truthlens-details');
  if (btnMoreDetails && detailsExpand) {
    btnMoreDetails.addEventListener('click', () => {
      const isExpanded = detailsExpand.classList.contains('expanded');
      if (isExpanded) {
        detailsExpand.classList.remove('expanded');
        btnMoreDetails.innerHTML = `More Details <i class="fa-solid fa-chevron-down"></i>`;
      } else {
        detailsExpand.classList.add('expanded');
        btnMoreDetails.innerHTML = `Less Details <i class="fa-solid fa-chevron-up"></i>`;
      }
    });
  }

  // --- 10. SCROLL REVEAL ANIMATIONS ---
  const revealElements = document.querySelectorAll('.reveal');

  const checkReveal = () => {
    const triggerBottom = window.innerHeight * 0.88; // Reveal when 88% down

    revealElements.forEach(el => {
      const elementTop = el.getBoundingClientRect().top;
      if (elementTop < triggerBottom) {
        el.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', checkReveal);
  // Initial check
  checkReveal();



  // --- 12. ACTUAL CONTACT FORM INTERACTION (EmailJS) ---
  const contactForm = document.getElementById('contact-form');
  const formSuccess = document.getElementById('form-success');
  const formError = document.getElementById('form-error');

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Reset notifications
    formSuccess.style.display = 'none';
    formError.style.display = 'none';

    const submitBtn = contactForm.querySelector('.form-submit-btn');
    const originalText = submitBtn.innerHTML;

    // Set loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Encrypting Payload...`;

    // Send via EmailJS
    // Replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' with actual values from EmailJS dashboard
    emailjs.sendForm('service_0vbruvh', 'template_nauaktq', contactForm)
      .then(() => {
        // Success pathway
        submitBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Connected`;
        formSuccess.style.display = 'flex';
        formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        contactForm.reset();

        // Reset submit button state after 3 seconds
        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.disabled = false;
        }, 4000);
      }, (error) => {
        // Fallback error
        console.error('EmailJS Error:', error);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        formError.style.display = 'flex';
      });
  });

  // --- 13. CYBERPUNK MUSIC PLAYER ---
  const musicPlayer = document.getElementById('music-player');
  const bgAudio = document.getElementById('bg-audio');
  const musicToggleBtn = document.getElementById('music-toggle');
  const musicMainIcon = document.getElementById('music-main-icon');

  let isPlaying = false;
  let fadeInterval;

  // Set default volume
  bgAudio.volume = 0.3;

  // Play/Pause Logic with Fade
  const togglePlay = () => {
    clearInterval(fadeInterval);
    if (isPlaying) {
      // Fade out
      let currentVol = bgAudio.volume;
      const step = currentVol / 20; // 20 steps for 1 second fade (approx 50ms per step)
      
      fadeInterval = setInterval(() => {
        if (bgAudio.volume > step) {
          bgAudio.volume -= step;
        } else {
          bgAudio.volume = 0;
          bgAudio.pause();
          clearInterval(fadeInterval);
          bgAudio.volume = 0.3; // restore volume value for next play
          isPlaying = false;
          updatePlayUI();
        }
      }, 50);
    } else {
      // Fade in
      const targetVol = 0.3;
      bgAudio.volume = 0;
      bgAudio.play().then(() => {
        isPlaying = true;
        updatePlayUI();
        
        const step = targetVol / 20;
        fadeInterval = setInterval(() => {
          if (bgAudio.volume + step < targetVol) {
            bgAudio.volume += step;
          } else {
            bgAudio.volume = targetVol;
            clearInterval(fadeInterval);
          }
        }, 50);
      }).catch(err => console.log("Audio play prevented:", err));
    }
  };

  const updatePlayUI = () => {
    if (isPlaying) {
      musicMainIcon.classList.remove('fa-music');
      musicMainIcon.classList.add('fa-pause');
      musicPlayer.classList.add('playing');
    } else {
      musicMainIcon.classList.remove('fa-pause');
      musicMainIcon.classList.add('fa-music');
      musicPlayer.classList.remove('playing');
    }
  };

  // Toggle on button click
  musicToggleBtn.addEventListener('click', togglePlay);

  // Keyboard Shortcut (Spacebar)
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      togglePlay();
    }
  });

});
