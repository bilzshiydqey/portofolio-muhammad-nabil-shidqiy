/* ============================================
   JAVASCRIPT - Portfolio Interactivity
   ============================================ */

// ---- Welcome Screen Logic ----
  const welcomeScreen = document.getElementById('welcome-screen');
  const enterBtn = document.getElementById('enter-btn');

  if (welcomeScreen && enterBtn) {
    document.body.classList.add('no-scroll');
    
    enterBtn.addEventListener('click', () => {
      // First: slide content up
      const content = welcomeScreen.querySelector('.welcome-content');
      if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(-40px)';
      }

      // Then: fade out the entire overlay after content slides away
      setTimeout(() => {
        // Instantly position at hero before revealing
        window.scrollTo(0, 0);

        welcomeScreen.classList.add('hidden');
        document.body.classList.remove('no-scroll');
        if (typeof lenis !== 'undefined') {
          lenis.start();
        }
      }, 400);

      // Finally: remove from DOM after all transitions complete
      setTimeout(() => {
        welcomeScreen.style.display = 'none';
      }, 1600);
    });
  }

  // ---- Initialize Lenis Smooth Scroll ----
  let lenis;
  try {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    if (welcomeScreen && enterBtn) {
      lenis.stop(); // Stop Lenis scrolling initially
    }
  } catch (e) {
    console.warn("Lenis smooth scroll could not be initialized:", e);
  }


  // ---- Smooth Scroll Navigation ----
  document.querySelectorAll('.nav-links a, a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId && targetId.startsWith('#') && targetId.length > 1) {
        e.preventDefault();

        // Close mobile menu first if open
        const navLinksEl = document.querySelector('.nav-links');
        const navToggleEl = document.querySelector('.nav-toggle');
        if (navLinksEl && navLinksEl.classList.contains('open')) {
          navLinksEl.classList.remove('open');
          if (navToggleEl) {
            navToggleEl.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
          }
        }

        // Use native scroll on mobile for reliability (Lenis smoothTouch is off)
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            const navbarHeight = document.querySelector('.navbar')?.offsetHeight || 60;
            const y = targetEl.getBoundingClientRect().top + window.scrollY - navbarHeight - 16;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        } else if (lenis) {
          lenis.scrollTo(targetId, {
            offset: -80,
          });
        }
      }
    });
  });

  // ---- Active Nav Link on Scroll ----
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  function updateActiveNav() {
    const scrollY = window.scrollY + 120;

    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav);
  updateActiveNav();

  // ---- Mobile Menu Toggle ----
  const navToggle = document.querySelector('.nav-toggle');
  const navLinksContainer = document.querySelector('.nav-links');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navLinksContainer.classList.toggle('open');
      const isOpen = navLinksContainer.classList.contains('open');
      navToggle.innerHTML = isOpen 
        ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' 
        : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
    });
  }

  // ---- Education Tabs & Active Indicator ----
  const eduTabsContainer = document.querySelector('.education-tabs');
  const eduTabs = document.querySelectorAll('.edu-tab');
  const eduPanels = document.querySelectorAll('.edu-panel');
  const eduContent = document.querySelector('.education-content');
  let eduIndicator;

  if (eduTabsContainer) {
    eduIndicator = document.createElement('div');
    eduIndicator.className = 'tab-indicator';
    eduTabsContainer.appendChild(eduIndicator);
  }

  function syncEduIndicator() {
    if (window.innerWidth <= 768 || !eduIndicator) return;
    const activeTab = eduTabsContainer.querySelector('.edu-tab.active');
    if (activeTab) {
      gsap.set(eduIndicator, {
        top: activeTab.offsetTop,
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
        height: activeTab.offsetHeight,
      });
    }
  }

  eduTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('active')) return;

      const target = tab.dataset.target;
      const targetPanel = document.getElementById(target);
      if (!targetPanel) return;

      const activePanel = eduContent ? eduContent.querySelector('.edu-panel.active') : null;

      // Update active tab button state
      eduTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      if (window.innerWidth <= 768) {
        targetPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        return;
      }

      // Animate indicator
      if (window.innerWidth > 768 && eduIndicator) {
        gsap.to(eduIndicator, {
          top: tab.offsetTop,
          left: tab.offsetLeft,
          width: tab.offsetWidth,
          height: tab.offsetHeight,
          duration: 0.3,
          ease: 'power2.out'
        });
      }

      // Kill any running transitions on the panels to prevent conflicts
      gsap.killTweensOf(eduPanels);

      if (activePanel) {
        // Smoothly fade out current panel
        gsap.to(activePanel, {
          opacity: 0,
          y: -8,
          duration: 0.15,
          ease: 'power2.in',
          onComplete: () => {
            activePanel.classList.remove('active');
            activePanel.style.display = 'none';

            // Set up and fade in new panel
            targetPanel.style.display = 'block';
            targetPanel.classList.add('active');
            gsap.fromTo(targetPanel, 
              { opacity: 0, y: 8 }, 
              { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
            );
          }
        });
      } else {
        targetPanel.style.display = 'block';
        targetPanel.classList.add('active');
        gsap.fromTo(targetPanel, 
          { opacity: 0, y: 8 }, 
          { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
        );
      }
    });
  });

  // ---- Experience Tabs & Active Indicator ----
  const expTabsContainer = document.querySelector('.experience-tabs');
  const expTabs = document.querySelectorAll('.exp-tab');
  const expPanels = document.querySelectorAll('.exp-panel');
  const expContent = document.querySelector('.experience-content');
  let expIndicator;

  if (expTabsContainer) {
    expIndicator = document.createElement('div');
    expIndicator.className = 'tab-indicator';
    expTabsContainer.appendChild(expIndicator);
  }

  function syncExpIndicator() {
    if (window.innerWidth <= 768 || !expIndicator) return;
    const activeTab = expTabsContainer.querySelector('.exp-tab.active');
    if (activeTab) {
      gsap.set(expIndicator, {
        top: activeTab.offsetTop,
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
        height: activeTab.offsetHeight,
      });
    }
  }

  expTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('active')) return;

      const target = tab.dataset.target;
      const targetPanel = document.getElementById(target);
      if (!targetPanel) return;

      const activePanel = expContent ? expContent.querySelector('.exp-panel.active') : null;

      // Update active tab button state
      expTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      if (window.innerWidth <= 768) {
        targetPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        return;
      }

      // Animate indicator
      if (window.innerWidth > 768 && expIndicator) {
        gsap.to(expIndicator, {
          top: tab.offsetTop,
          left: tab.offsetLeft,
          width: tab.offsetWidth,
          height: tab.offsetHeight,
          duration: 0.3,
          ease: 'power2.out'
        });
      }

      // Kill any running transitions on the panels to prevent conflicts
      gsap.killTweensOf(expPanels);

      if (activePanel) {
        // Smoothly fade out current panel
        gsap.to(activePanel, {
          opacity: 0,
          y: -8,
          duration: 0.15,
          ease: 'power2.in',
          onComplete: () => {
            activePanel.classList.remove('active');
            activePanel.style.display = 'none';

            // Set up and fade in new panel
            targetPanel.style.display = 'block';
            targetPanel.classList.add('active');
            gsap.fromTo(targetPanel, 
              { opacity: 0, y: 8 }, 
              { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
            );
          }
        });
      } else {
        targetPanel.style.display = 'block';
        targetPanel.classList.add('active');
        gsap.fromTo(targetPanel, 
          { opacity: 0, y: 8 }, 
          { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
        );
      }
    });
  });

  // ---- Mobile Scroll Sync for Tabs ----
  function setupScrollSync(contentElement, tabElements) {
    if (!contentElement || !tabElements.length) return;
    
    let lastActiveIndex = -1;
    let isClickScrolling = false;

    // Track when a tab is clicked so we don't fight the scroll
    tabElements.forEach(tab => {
      tab.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          isClickScrolling = true;
          setTimeout(() => { isClickScrolling = false; }, 600);
        }
      });
    });
    
    contentElement.addEventListener('scroll', () => {
      if (window.innerWidth > 768) return;
      
      const scrollLeft = contentElement.scrollLeft;
      const panelWidth = contentElement.clientWidth;
      
      // Calculate which panel is currently most visible
      const activeIndex = Math.round(scrollLeft / panelWidth);
      
      // Only trigger updates if the active index actually changed
      if (activeIndex !== lastActiveIndex && tabElements[activeIndex]) {
        lastActiveIndex = activeIndex;
        
        // Update active class instantly without delay
        tabElements.forEach(t => t.classList.remove('active'));
        tabElements[activeIndex].classList.add('active');
        
        // Smoothly scroll the tab into view, unless the user just clicked it
        if (!isClickScrolling) {
          tabElements[activeIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    });
  }

  setupScrollSync(eduContent, eduTabs);
  setupScrollSync(expContent, expTabs);

  // Init indicators and handle window load/resize
  setTimeout(() => {
    syncEduIndicator();
    syncExpIndicator();
  }, 100);

  window.addEventListener('resize', () => {
    syncEduIndicator();
    syncExpIndicator();
  });

  // ---- Scroll Reveal Animation ----
  const revealElements = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => revealObserver.observe(el));

  // ---- Typing Effect ----
  const typingElement = document.querySelector('.hero-typing');
  if (typingElement) {
    const phrases = [
      'Aspiring Data Analyst',
      'UI/UX Designer',
      'Full Stack Developer',
      'System Analyst'
    ];
    let phraseIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;

    function typeEffect() {
      const currentPhrase = phrases[phraseIndex];

      if (isDeleting) {
        typingElement.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 40;
      } else {
        typingElement.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 80;
      }

      if (!isDeleting && charIndex === currentPhrase.length) {
        typingSpeed = 2000; // pause at end
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typingSpeed = 300; // pause before next phrase
      }

      setTimeout(typeEffect, typingSpeed);
    }

    typeEffect();
  }



  // ---- Contact Form (prevent default) ----
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('.btn-primary');
      const originalText = btn.innerHTML;
      btn.innerHTML = '✓ Message Sent!';
      btn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.background = '';
        contactForm.reset();
      }, 3000);
    });
  }

  // ---- Block Browser Zoom Shortcuts (Ctrl +, Ctrl -, Ctrl 0, Ctrl Scroll Wheel) ----
  window.addEventListener('keydown', (e) => {
    if (
      (e.ctrlKey || e.metaKey) && 
      (e.key === '=' || e.key === '-' || e.key === '+' || e.key === '0')
    ) {
      e.preventDefault();
    }
  });

  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  }, { passive: false });


  // ---- Awards Slider Navigation ----
  const awardsSlider = document.getElementById('awards-slider');
  const awardsPrev = document.querySelector('.awards-prev');
  const awardsNext = document.querySelector('.awards-next');

  if (awardsSlider && awardsPrev && awardsNext) {
    const getScrollAmount = () => {
      const firstCard = awardsSlider.querySelector('.award-card');
      if (firstCard) {
        const style = window.getComputedStyle(awardsSlider);
        const gap = parseInt(style.gap) || 24;
        return firstCard.clientWidth + gap;
      }
      return 400; // fallback
    };

    awardsPrev.addEventListener('click', () => {
      awardsSlider.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    });

    awardsNext.addEventListener('click', () => {
      awardsSlider.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    });
  }

  // ---- Skills Category Toggle (Mobile Accordion) ----
  document.querySelectorAll('.skills-category').forEach(category => {
    const toggleBtn = category.querySelector('.skills-toggle-btn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const isExpanded = category.classList.contains('expanded');
        if (isExpanded) {
          category.classList.remove('expanded');
          toggleBtn.textContent = 'Show More';
          category.scrollIntoView({ behavior: 'smooth' });
        } else {
          category.classList.add('expanded');
          toggleBtn.textContent = 'Show Less';
        }
      });
    }
  });

  // ---- Projects Collapse/Expand on Mobile ----
  const projectsGrid = document.querySelector('.projects-grid');
  const projectsToggleBtn = document.getElementById('projects-toggle-btn');
  
  if (projectsGrid && projectsToggleBtn) {
    // Set initial collapsed state on load if mobile
    if (window.innerWidth <= 768) {
      projectsGrid.classList.add('collapsed');
    }
    
    projectsToggleBtn.addEventListener('click', () => {
      const isCollapsed = projectsGrid.classList.contains('collapsed');
      
      if (isCollapsed) {
        projectsGrid.classList.remove('collapsed');
        projectsToggleBtn.textContent = 'Show Less';
      } else {
        projectsGrid.classList.add('collapsed');
        projectsToggleBtn.textContent = 'Show More';
        
        // Scroll back up to the top of the projects section so the user isn't disoriented
        const projectsSection = document.getElementById('projects');
        if (projectsSection) {
          projectsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  // ---- Image Download Protection ----
  // Block right-click on all images
  document.addEventListener('contextmenu', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });

  // Block drag on all images (prevents drag-to-desktop save)
  document.addEventListener('dragstart', (e) => {
    if (e.target.tagName === 'IMG') {
      e.preventDefault();
    }
  });

  // Block long-press save on mobile (iOS/Android)
  document.querySelectorAll('img').forEach(img => {
    img.addEventListener('touchstart', (e) => {
      // Prevent default long-press behavior
    }, { passive: true });
  });

