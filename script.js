// --- Force Scroll to Top on Page Load ---
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

// Remove any hash (#about, #projects) from the URL before the browser can jump to it
if (window.location.hash) {
    history.replaceState(null, null, window.location.pathname + window.location.search);
}

// Immediate scroll to top
window.scrollTo(0, 0);
// 1. GLOBAL VARIABLES
let lenis;
let currentProjectContext = null;
const projectDataElement = document.getElementById('project-data');
const projectDB = projectDataElement ? JSON.parse(projectDataElement.textContent) : {};

/* =========================================
   PRELOADER & INIT
========================================= */
window.addEventListener('load', () => {
    // Definitive scroll strict reset
    setTimeout(() => {
        window.scrollTo(0, 0);
        if (lenis) lenis.scrollTo(0, { immediate: true });
    }, 10);
    
    // Initialize Web Icons
    lucide.createIcons();

    const tlIntro = gsap.timeline({
        onComplete: () => {
            document.getElementById('preloader').style.display = 'none';
            document.body.classList.remove('no-scroll');
            initLenisAndGSAP();
        }
    });

    // 1. Reveal Characters Staggered
    tlIntro.to('.p-char', { 
        opacity: 1, 
        y: 0, 
        duration: 0.8, 
        stagger: 0.1, 
        ease: 'power4.out',
        delay: 0.3
    });

    // 2. Sophisticated Hold & Letter Compression
    tlIntro.to('.preloader-logo', {
        letterSpacing: "-0.15em",
        duration: 0.8,
        ease: 'expo.inOut'
    }, "+=0.2");

    // 3. The Collapse (Framework Style)
    tlIntro.to('#preloader', {
        scaleY: 0,
        duration: 1.2,
        ease: 'expo.inOut',
        transformOrigin: "center center"
    }, "-=0.2");

    // 4. Subtle scale down of the logo during collapse
    tlIntro.to('.preloader-content', {
        scale: 0.5,
        opacity: 0,
        duration: 0.6,
        ease: 'power4.inOut'
    }, "<");
});

/* =========================================
   LENIS & GSAP Core
========================================= */
function initLenisAndGSAP() {
    lenis = new Lenis({
        duration: 1.4,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    lenis.on('scroll', (e) => {
        ScrollTrigger.update();
        if (window.__audioEngine) window.__audioEngine.onScroll(e.velocity || 0);
    });
    gsap.ticker.add((time)=>{ lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    // Keep Lenis height in sync with pin-spacers created by ScrollTrigger
    ScrollTrigger.addEventListener('refresh', () => lenis.resize());

    initCursor();
    initNavTabs();
    initAnimations();
    initAudioEngine();

    // Recalculate pinned sections after layout + fonts settle
    requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => ScrollTrigger.refresh());
        }
    });
}

/* =========================================
   CUSTOM CURSOR — Magnetic Spring
========================================= */
function initCursor() {
    const cursorDot = document.getElementById('cursor-dot');
    const cursorRing = document.getElementById('cursor-ring');

    let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;
    let ringVelX = 0, ringVelY = 0;
    
    let cursorInitialized = false;
    let magneticEls = [];

    const setDotX = gsap.quickSetter(cursorDot, "x", "px");
    const setDotY = gsap.quickSetter(cursorDot, "y", "px");
    const setRingX = gsap.quickSetter(cursorRing, "x", "px");
    const setRingY = gsap.quickSetter(cursorRing, "y", "px");

    const MAGNETIC_DISTANCE = 110;

    window.addEventListener('mousemove', (e) => {
        if (!cursorInitialized) {
            gsap.set([cursorDot, cursorRing], { opacity: 1 });
            ringX = e.clientX; ringY = e.clientY;
            magneticEls = Array.from(document.querySelectorAll(
                '.project-card, .nav-logo, .nav-contact-btn, .contact-cta, .edu-card'
            ));
            cursorInitialized = true;
        }
        mouseX = e.clientX;
        mouseY = e.clientY;
        setDotX(mouseX);
        setDotY(mouseY);
    }, { passive: true });

    gsap.ticker.add(() => {
        if (!cursorInitialized) return;

        let targetX = mouseX, targetY = mouseY;
        let isMagnetic = false;
        let nearestDist = Infinity;

        for (const el of magneticEls) {
            const rect = el.getBoundingClientRect();
            if (!rect.width || !rect.height) continue;
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dist = Math.hypot(mouseX - cx, mouseY - cy);

            if (dist < MAGNETIC_DISTANCE && dist < nearestDist) {
                nearestDist = dist;
                const pull = (1 - dist / MAGNETIC_DISTANCE) * 0.42;
                targetX = mouseX + (cx - mouseX) * pull;
                targetY = mouseY + (cy - mouseY) * pull;
                isMagnetic = true;
            }
        }

        // Spring Physics (Framer Motion feel)
        const stiffness = isMagnetic ? 0.25 : 0.12; 
        const damping = isMagnetic ? 0.55 : 0.70; 

        // Calculate Spring Force
        const forceX = (targetX - ringX) * stiffness;
        const forceY = (targetY - ringY) * stiffness;

        ringVelX += forceX;
        ringVelY += forceY;

        ringVelX *= damping;
        ringVelY *= damping;

        ringX += ringVelX;
        ringY += ringVelY;

        setRingX(ringX);
        setRingY(ringY);

        if (isMagnetic) cursorRing.classList.add('is-magnetic');
        else cursorRing.classList.remove('is-magnetic');
    });

    bindCursorHover();
}

/* =========================================
   PROJECTS — Scroll Velocity Linked Offset
========================================= */
function initProjectsVelocity() {
    const trackLeft = document.querySelector('.track-left');
    const trackRight = document.querySelector('.track-right');
    if (!trackLeft || !trackRight) return;

    let targetLeft = 0, targetRight = 0;
    let currentLeft = 0, currentRight = 0;
    const MAX_OFFSET = 52;

    lenis.on('scroll', (e) => {
        const vel = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, (e.velocity || 0) * 1.3));
        targetLeft = -vel * 0.65;
        targetRight = vel * 0.65;
    });

    gsap.ticker.add(() => {
        const dt = 1.0 - Math.pow(1.0 - 0.09, gsap.ticker.deltaRatio());
        currentLeft  += (targetLeft  - currentLeft)  * dt;
        currentRight += (targetRight - currentRight) * dt;
        targetLeft  *= 0.91;
        targetRight *= 0.91;
        gsap.set(trackLeft,  { y: currentLeft });
        gsap.set(trackRight, { y: currentRight });
    });
}

function bindCursorHover() {
    const ring = document.getElementById('cursor-ring');

    document.body.addEventListener('mouseover', (e) => {
        const interactive = e.target.closest('[data-cursor="hover"], a, button, .exp-item, .project-card, .chip, .preset-btn, .modal-close');
        const textTarget = e.target.closest('h1, h2, h3, p, span.hero-sub, .cert-summary');

        if (interactive) {
            document.body.classList.add('cursor-hover');
            document.body.classList.remove('cursor-text');
        } else if (textTarget) {
            document.body.classList.add('cursor-text');
            document.body.classList.remove('cursor-hover');
            
            // Adaptive Caret to text line-height/font-size
            const style = window.getComputedStyle(textTarget);
            const lh = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
            ring.style.setProperty('--caret-h', `${lh}px`);
        }
    });

    document.body.addEventListener('mouseout', (e) => {
        const interactive = e.target.closest('[data-cursor="hover"], a, button, .exp-item, .project-card, .chip, .preset-btn, .modal-close');
        const textTarget = e.target.closest('h1, h2, h3, p, span.hero-sub, .cert-summary');
        
        if (interactive) document.body.classList.remove('cursor-hover');
        if (textTarget) document.body.classList.remove('cursor-text');
    });
}

/* =========================================
   NAV TABS — Shared Layout Animation
========================================= */
function initNavTabs() {
    const tabs = document.querySelectorAll('.nav-tab');
    const pill = document.getElementById('nav-pill');
    const container = document.getElementById('nav-tabs');
    if (!tabs.length || !pill || !container) return;

    let targetX = 0, targetY = 0, targetW = 0, targetH = 0;
    let currentX = 0, currentY = 0, currentW = 0, currentH = 0;
    let velX = 0, velY = 0, velW = 0, velH = 0;
    let isHovering = false;
    let initialized = false;

    const setPill = gsap.quickSetter(pill, "css");

    tabs.forEach(tab => {
        tab.addEventListener('mouseenter', () => {
            const rect = tab.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            targetX = rect.left - containerRect.left;
            targetY = rect.top - containerRect.top;
            targetW = rect.width;
            targetH = rect.height;

            if (!initialized) {
                currentX = targetX; currentY = targetY;
                currentW = targetW; currentH = targetH;
                initialized = true;
            }
            isHovering = true;
            pill.style.opacity = '1';
        });
    });

    container.addEventListener('mouseleave', () => {
        isHovering = false;
        pill.style.opacity = '0';
        initialized = false; 
    });

    gsap.ticker.add(() => {
        if (!isHovering && !initialized) return;

        const stiffness = 0.22;
        const damping = 0.62; // Rebote súper agradable

        velX += (targetX - currentX) * stiffness;
        velY += (targetY - currentY) * stiffness;
        velW += (targetW - currentW) * stiffness;
        velH += (targetH - currentH) * stiffness;

        velX *= damping;
        velY *= damping;
        velW *= damping;
        velH *= damping;

        currentX += velX;
        currentY += velY;
        currentW += velW;
        currentH += velH;

        setPill({
            left: currentX + "px",
            top: currentY + "px",
            width: currentW + "px",
            height: currentH + "px"
        });
    });
}

/* =========================================
   AGENT INFOGRAPHIC LAB
========================================= */
function initAgentLab(customModes = null) {
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const canvas = document.getElementById('infographic-canvas');
    const steps = document.querySelectorAll('.info-step');
    
    let activeTimeline = null;
    const defaultModes = {
        single: {
            nodes: [
                { id: 'leader', icon: 'zap', label: 'Autonomous Agent', x: 0, y: -200 },
                { id: 'sub1', icon: 'binary', label: 'Semantic Parsing', x: -130, y: -80 },
                { id: 'sub2', icon: 'scroll-text', label: 'Action Planner', x: 0, y: -80 },
                { id: 'sub3', icon: 'shield-check', label: 'Output Review', x: 130, y: -80 }
            ],
            tools: [
                { id: 'tool1', icon: 'database', label: 'Vector Memory', x: -90, y: 50 },
                { id: 'tool2', icon: 'globe', label: 'Real-time Data', x: 90, y: 50 }
            ],
            result: { id: 'res', icon: 'award', label: 'Results', x: 0, y: 170 }
        },
        multi: {
            nodes: [
                { id: 'leader', icon: 'brain-circuit', label: 'Task Orchestrator', x: 0, y: -200 },
                { id: 'agent1', icon: 'split', label: 'Decomposition', x: -140, y: -80 },
                { id: 'agent2', icon: 'rotate-cw', label: 'Recursive Auditor', x: 0, y: -80 },
                { id: 'agent3', icon: 'search-code', label: 'Context Retriever', x: 140, y: -80 }
            ],
            tools: [
                { id: 'tool1', icon: 'database', label: 'Vector Memory', x: -180, y: 50 },
                { id: 'tool2', icon: 'globe', label: 'Web Search', x: -60, y: 50 },
                { id: 'tool3', icon: 'file-search', label: 'Traceability', x: 60, y: 50, special: 'amber' },
                { id: 'tool4', icon: 'terminal', label: 'Action Executor', x: 180, y: 50 }
            ],
            result: { id: 'res', icon: 'award', label: 'Results', x: 0, y: 170 }
        }
    };

    const modes = customModes || defaultModes;

    function runInfographic(modeType) {
        if(activeTimeline) activeTimeline.kill();
        canvas.innerHTML = '';
        steps.forEach(s => s.classList.remove('active'));
        
        const m = modes[modeType];
        activeTimeline = gsap.timeline();

        // STEP 1: DECOMPOSITION (Orchestrator Node)
        activeTimeline.add(() => steps[0].classList.add('active'), 0);
        const rootEl = createInfographicNode(m.nodes[0]);
        canvas.appendChild(rootEl);
        activeTimeline.from(rootEl, { scale: 0, opacity: 0, duration: 0.8, ease: 'back.out(1.7)' }, 0.5);

        // STEP 2: ORCHESTRATION (Middle Levels)
        activeTimeline.add(() => steps[1].classList.add('active'), 1.5);
        m.nodes.slice(1).forEach((node, i) => {
            const connEl = document.createElement('div');
            connEl.className = 'i-conn';
            canvas.appendChild(connEl);
            const targetEl = createInfographicNode(node);
            canvas.appendChild(targetEl);

            const angle = Math.atan2(node.y - m.nodes[0].y, node.x - m.nodes[0].x);
            const dist = Math.hypot(node.x - m.nodes[0].x, node.y - m.nodes[0].y);
            
            gsap.set(connEl, { 
                left: '50%', top: '50%', x: m.nodes[0].x, y: m.nodes[0].y,
                width: dist, rotation: angle * (180/Math.PI)
            });

            activeTimeline.from(connEl, { scaleX: 0, opacity: 0, duration: 0.6 }, 1.8 + (i*0.2));
            activeTimeline.from(targetEl, { scale: 0, opacity: 0, duration: 0.6, ease: 'back.out' }, 2.0 + (i*0.2));
        });

        // STEP 3: TOOLS & TRACEABILITY
        activeTimeline.add(() => steps[2].classList.add('active'), 3.5);
        m.tools.forEach((tool, i) => {
            const toolEl = createInfographicNode(tool);
            if(tool.special) toolEl.classList.add(tool.special);
            canvas.appendChild(toolEl);

            const parentNode = modeType === 'single' ? (i === 0 ? m.nodes[1] : m.nodes[2]) : (i < 2 ? m.nodes[1] : (i === 2 ? m.nodes[2] : m.nodes[3]));
            const connEl = document.createElement('div');
            connEl.className = 'i-conn';
            canvas.appendChild(connEl);

            const angle = Math.atan2(tool.y - parentNode.y, tool.x - parentNode.x);
            const dist = Math.hypot(tool.x - parentNode.x, tool.y - parentNode.y);

            gsap.set(connEl, { 
                left: '50%', top: '50%', x: parentNode.x, y: parentNode.y,
                width: dist, rotation: angle * (180/Math.PI)
            });

            activeTimeline.from(connEl, { scaleX: 0, opacity: 0, duration: 0.6 }, 3.8 + (i*0.1));
            activeTimeline.from(toolEl, { scale: 0, opacity: 0, duration: 0.6 }, 4.0 + (i*0.1));

            activeTimeline.add(() => {
                const pulse = document.createElement('div');
                pulse.className = 'i-pulse';
                canvas.appendChild(pulse);
                gsap.set(pulse, { left: '50%', top: '50%', x: parentNode.x, y: parentNode.y });
                gsap.to(pulse, { x: tool.x, y: tool.y, duration: 1.5, repeat: -1, delay: i * 0.3, ease: 'power1.inOut' });
            }, 4.5);
        });

        // STEP 4: FINAL RESULTS
        activeTimeline.add(() => steps[3].classList.add('active'), 5.5);
        const resNode = m.result;
        const resEl = createInfographicNode(resNode);
        canvas.appendChild(resEl);
        
        m.tools.forEach((tool, i) => {
            const connEl = document.createElement('div');
            connEl.className = 'i-conn';
            canvas.appendChild(connEl);
            const angle = Math.atan2(resNode.y - tool.y, resNode.x - tool.x);
            const dist = Math.hypot(resNode.x - tool.x, resNode.y - tool.y);
            
            gsap.set(connEl, { left: '50%', top: '50%', x: tool.x, y: tool.y, width: dist, rotation: angle * (180/Math.PI) });
            activeTimeline.from(connEl, { scaleX: 0, opacity: 0, duration: 0.6 }, 5.8 + (i*0.1));
        });

        activeTimeline.from(resEl, { scale: 0, opacity: 0, duration: 0.8, ease: 'back.out' }, 6.2);

        // Performance: Targeted icon creation
        lucide.createIcons({
            attrs: { strokeWidth: 1.5, class: 'i-icon' },
            nameAttr: 'data-lucide',
            root: canvas
        });
    }

    function createInfographicNode(n) {
        const div = document.createElement('div');
        div.className = 'i-node';
        div.style.left = '50%';
        div.style.top = '50%';
        gsap.set(div, { x: n.x - 25, y: n.y - 25 }); // Offset centered
        div.innerHTML = `<i data-lucide="${n.icon}"></i><span class="i-label">${n.label}</span>`;
        return div;
    }

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            runInfographic(btn.dataset.mode);
        });
    });

    // Run default
    setTimeout(() => runInfographic('single'), 1000);
}

function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // RESPONSIVE ADAPTATION (GSAP matchMedia)
    let mm = gsap.matchMedia();

    mm.add({
        isDesktop: "(min-width: 769px)",
        isMobile: "(max-width: 768px)"
    }, (context) => {
        let { isDesktop, isMobile } = context.conditions;

        // Infographic Mobile Overlap Fix
        const mobileModes = {
            single: {
                nodes: [
                    { id: 'leader', icon: 'zap', label: 'Autonomous Agent', x: 0, y: -180 },
                    { id: 'sub1', icon: 'binary', label: 'Parsing', x: -80, y: -80 },
                    { id: 'sub2', icon: 'scroll-text', label: 'Planner', x: 0, y: -80 },
                    { id: 'sub3', icon: 'shield-check', label: 'Review', x: 80, y: -80 }
                ],
                tools: [
                    { id: 'tool1', icon: 'database', label: 'Vector', x: -60, y: 30 },
                    { id: 'tool2', icon: 'globe', label: 'Data', x: 60, y: 30 }
                ],
                result: { id: 'res', icon: 'award', label: 'Results', x: 0, y: 140 }
            },
            multi: {
                nodes: [
                    { id: 'leader', icon: 'brain-circuit', label: 'Orchestrator', x: 0, y: -180 },
                    { id: 'agent1', icon: 'split', label: 'Decomp', x: -100, y: -80 },
                    { id: 'agent2', icon: 'rotate-cw', label: 'Audit', x: 0, y: -80 },
                    { id: 'agent3', icon: 'search-code', label: 'Retrieval', x: 100, y: -80 }
                ],
                tools: [
                    { id: 'tool1', icon: 'database', label: 'Vector', x: -110, y: 30 },
                    { id: 'tool2', icon: 'globe', label: 'Search', x: -40, y: 30 },
                    { id: 'tool3', icon: 'file-search', label: 'Trace', x: 40, y: 30, special: 'amber' },
                    { id: 'tool4', icon: 'terminal', label: 'Action', x: 110, y: 30 }
                ],
                result: { id: 'res', icon: 'award', label: 'Results', x: 0, y: 140 }
            }
        };

        // Initialize Agent Lab with contextual coordinates
        initAgentLab(isMobile ? mobileModes : null); 

        // 01. About Portrait Reveal
        gsap.fromTo('.gs-mask-reveal img', 
            { scale: 1.3, clipPath: "inset(100% 0% 0% 0%)" },
            { 
                scale: 1, 
                clipPath: "inset(0% 0% 0% 0%)", 
                duration: 2, 
                ease: "expo.out",
                scrollTrigger: {
                    trigger: '.about-image-wrapper',
                    start: "top 80%",
                }
            }
        );

        return () => { /* cleanup */ };
    });

    // 01. Hero Editorial Studio — Cinematic Entrance & Parallax
    const tlHero = gsap.timeline({ delay: 0.1 });

    // Initial States
    gsap.set('.studio-glow', { opacity: 0, scale: 0.8 });
    gsap.set('.name-part', { opacity: 0, y: 50 });
    gsap.set('.hero-studio-subject', { opacity: 0, y: 30, scale: 0.95 });
    gsap.set('.studio-meta', { opacity: 0 });

    // Sequence
    tlHero.to('.studio-glow', { opacity: 1, scale: 1, duration: 2.5, ease: "power2.out" }, 0)
          .to('.name-part', {
              opacity: 0.34,
              y: 0,
              duration: 2,
              stagger: 0.2,
              ease: "expo.out"
          }, 0.3)
          .to('.hero-studio-subject', {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 2.5,
              ease: "expo.out"
          }, 0.5);

    // MOUSE PARALLAX EFFECT
    const heroSection = document.querySelector('.hero-editorial-studio');
    if (heroSection) {
        heroSection.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            const xPos = (clientX / window.innerWidth - 0.5) * 2;
            const yPos = (clientY / window.innerHeight - 0.5) * 2;

            // Subject moves slightly
            gsap.to('.hero-studio-subject', {
                x: xPos * 25,
                y: yPos * 15,
                duration: 1.5,
                ease: "power2.out"
            });

            // Name moves in opposite direction
            gsap.to('.hero-studio-name', {
                x: xPos * -35,
                y: yPos * -20,
                duration: 1.8,
                ease: "power2.out"
            });

            // Glow follows mouse slightly
            gsap.to('.studio-glow', {
                x: xPos * 40,
                y: yPos * 20,
                duration: 2,
                ease: "power2.out"
            });
        });
    }

    // 02. Scroll Transition: Studio Grey → White
    gsap.to('.hero-pinned', {
        backgroundColor: '#ffffff',
        scrollTrigger: {
            trigger: '.hero-pinned',
            start: "top top",
            end: "bottom top",
            scrub: true,
        }
    });

    // 03. Name text gently rises & fades on scroll
    gsap.to('.hero-ed-name', {
        y: -100, opacity: 0.06,
        scrollTrigger: {
            trigger: '.hero-pinned',
            start: "top top",
            end: "55% top",
            scrub: 1.2,
        }
    });

    // 04. Photo subtle parallax (no y conflict with entrance)
    gsap.to('.hero-ed-photo', {
        y: -60,
        scrollTrigger: {
            trigger: '.hero-pinned',
            start: "5% top",
            end: "bottom top",
            scrub: 1,
        }
    });

    // 05. Meta + CTA fade out on scroll
    gsap.to(['.hero-ed-meta', '.hero-ed-cta'], {
        opacity: 0, y: -20,
        scrollTrigger: {
            trigger: '.hero-pinned',
            start: "8% top",
            end: "35% top",
            scrub: 1,
        }
    });

    // Marquee
    gsap.to('.marquee-track', {
        xPercent: -50, ease: "none",
        scrollTrigger: { trigger: '.marquee-section', start: "top bottom", end: "bottom top", scrub: 1 }
    });

    // General Fade Ups — cinematic (Framer-style: y + blur + scale)
    document.querySelectorAll('.gs-fade-up').forEach(el => {
        gsap.fromTo(el,
            { y: 60, opacity: 0, filter: "blur(8px)", scale: 0.98 },
            {
                y: 0, opacity: 1, filter: "blur(0px)", scale: 1,
                duration: 1.1,
                ease: "expo.out",
                scrollTrigger: { trigger: el, start: "top 88%" }
            });
    });

    // Section titles with word stagger (safe split — walks text nodes only)
    const splitTextNodes = (el) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        nodes.forEach(node => {
            const words = node.nodeValue.split(/(\s+)/);
            const frag = document.createDocumentFragment();
            words.forEach(w => {
                if (/^\s+$/.test(w)) {
                    frag.appendChild(document.createTextNode(w));
                } else if (w.length) {
                    const wrap = document.createElement('span');
                    wrap.className = 'word-wrap';
                    const inner = document.createElement('span');
                    inner.className = 'word-inner';
                    inner.textContent = w;
                    wrap.appendChild(inner);
                    frag.appendChild(wrap);
                }
            });
            node.parentNode.replaceChild(frag, node);
        });
    };

    document.querySelectorAll('.section-title').forEach(title => {
        if (title.dataset.split) return;
        title.dataset.split = "true";
        splitTextNodes(title);
        gsap.fromTo(title.querySelectorAll('.word-inner'),
            { yPercent: 110 },
            {
                yPercent: 0,
                duration: 1,
                stagger: 0.06,
                ease: "expo.out",
                scrollTrigger: { trigger: title, start: "top 85%" }
            });
    });

    // 05. Horizontal Scroll Gallery (Art Gallery)
    const gallerySection = document.querySelector('#education-gallery');
    const horizontalTrack = document.querySelector('.horizontal-track');

    if (gallerySection && horizontalTrack) {
        const eduCards = gsap.utils.toArray('.edu-card');
        
        // Calculate total scroll distance with a safety buffer or functional getter
        const getScrollDistance = () => {
            const totalWidth = horizontalTrack.scrollWidth;
            return totalWidth - window.innerWidth;
        };

        // Main horizontal movement with ID for sub-triggers
        const mainTween = gsap.to(horizontalTrack, {
            x: () => -getScrollDistance(),
            ease: "none",
            id: "horizontalTween",
            scrollTrigger: {
                trigger: gallerySection,
                start: "top top",
                end: () => `+=${getScrollDistance()}`,
                pin: true,
                scrub: 1,
                invalidateOnRefresh: true,
            }
        });

        // Individual Card Lighting Focus (Container Animation)
        eduCards.forEach(card => {
            ScrollTrigger.create({
                trigger: card,
                containerAnimation: mainTween,
                start: "left 65%",
                end: "right 35%",
                onEnter: () => gsap.to(card, { "--light-opacity": 1, duration: 0.4 }),
                onLeave: () => gsap.to(card, { "--light-opacity": 0.3, duration: 0.4 }),
                onEnterBack: () => gsap.to(card, { "--light-opacity": 1, duration: 0.4 }),
                onLeaveBack: () => gsap.to(card, { "--light-opacity": 0.3, duration: 0.4 }),
            });
        });
    }

    // 06. Contact Section — cinematic reveal
    const contactTl = gsap.timeline({
        scrollTrigger: { trigger: '.contact-section', start: "top 75%" }
    });

    contactTl.from('.contact-status', { opacity: 0, y: 15, duration: 0.8, ease: "power3.out" })
             .from('.float-pill', { opacity: 0, scale: 0.7, duration: 0.8, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.6")
             .from('.avail-badge', { opacity: 0, scale: 0.5, rotate: -90, duration: 1, ease: "back.out(1.5)" }, "-=0.8")
             .from('.contact-intro', { opacity: 0, y: 20, duration: 0.8, ease: "power3.out" }, "-=0.7")
             .to('.ct-inner', { yPercent: -100, duration: 1.2, stagger: 0.1, ease: "expo.out" }, "-=0.5")
             .from('.contact-desc', { opacity: 0, y: 20, duration: 0.8, ease: "power3.out" }, "-=0.6")
             .from('.c-pill', { opacity: 0, y: 40, scale: 0.95, duration: 0.9, stagger: 0.1, ease: "power3.out" }, "-=0.4")
             .from('.mini-tag', { opacity: 0, y: 15, duration: 0.6, stagger: 0.08, ease: "power2.out" }, "-=0.5")
             .from('.footer-minimal', { opacity: 0, duration: 0.7 }, "-=0.3");

    // Live clock (Europe/Madrid)
    const liveTime = document.getElementById('liveTime');
    if (liveTime) {
        const updateClock = () => {
            try {
                liveTime.textContent = new Date().toLocaleTimeString('es-ES', {
                    timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit'
                });
            } catch { /* older browsers */ }
        };
        updateClock();
        setInterval(updateClock, 30000);
    }

    // Copy-to-clipboard with toast
    const toast = document.getElementById('copyToast');
    let toastTimer;
    const showToast = (msg) => {
        if (!toast) return;
        toast.querySelector('span').textContent = msg;
        toast.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => toast.classList.remove('visible'), 2000);
    };

    document.querySelectorAll('.c-row[data-copy]').forEach(row => {
        row.addEventListener('click', async (e) => {
            const value = row.getAttribute('data-copy');
            if (!value || !navigator.clipboard) return;
            e.preventDefault();
            try {
                await navigator.clipboard.writeText(value);
                row.classList.add('is-copied');
                showToast('Copiado: ' + value);
                setTimeout(() => row.classList.remove('is-copied'), 1800);
            } catch { /* fallback: let default navigation occur */
                window.location.href = row.href;
            }
        });
    });

    // Project Cards — spotlight + image parallax + staggered cinematic entrance
    const projectsTracks = document.querySelector('.projects-tracks');
    if (projectsTracks) {
        const projectCards = projectsTracks.querySelectorAll('.project-card');

        // Readymag-style entrance: card slides up + image reveals from bottom
        projectCards.forEach((card) => {
            const img = card.querySelector('.project-img-wrapper img');
            const info = card.querySelector('.project-info');
            const isJardin = card.classList.contains('card-jardin');

            gsap.fromTo(card,
                { y: 70, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out',
                  scrollTrigger: { trigger: card, start: 'top 90%' } }
            );

            if (img && !isJardin) {
                gsap.fromTo(img,
                    { scale: 1.12, filter: 'blur(4px)' },
                    { scale: 1, filter: 'blur(0px)', duration: 1.5, ease: 'expo.out',
                      scrollTrigger: { trigger: card, start: 'top 90%' } }
                );
            }

            if (info) {
                gsap.fromTo(Array.from(info.children),
                    { y: 18, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out',
                      scrollTrigger: { trigger: card, start: 'top 84%' } }
                );
            }
        });

        // Spotlight glow on mouse move
        projectsTracks.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.project-card');
            if (!card) return;
            const rect = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
            card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
        }, { passive: true });
    }

    initProjectsVelocity();

    // Navbar Scrolled State
    const navBar = document.querySelector('.nav-bar');
    ScrollTrigger.create({
        start: "top -50",
        onUpdate: (self) => {
            if (self.progress > 0) {
                navBar.classList.add('scrolled');
            } else {
                navBar.classList.remove('scrolled');
            }
        }
    });

    // Final Sync: Ensure all ScrollTriggers are accurate after images load
    setTimeout(() => ScrollTrigger.refresh(), 500);
    window.addEventListener('resize', () => ScrollTrigger.refresh());

    // Ecosystem Visualizer Interactivity
    const chips = document.querySelectorAll('.chip[data-desc]');
    const telemetryLog = document.getElementById('telemetry-log');
    const stageInner = document.getElementById('v-stage-inner');
    let typingInterval;
    let currentSceneTl = null;

    chips.forEach(chip => {
        chip.addEventListener('mouseenter', () => {
            const text = chip.getAttribute('data-desc');
            const category = chip.closest('.tag-group').querySelector('h3').innerText;
            typeText(telemetryLog, text);
            renderScene(category.toLowerCase());
        });
    });

    function typeText(element, text) {
        clearInterval(typingInterval);
        element.innerHTML = '';
        let i = 0;
        typingInterval = setInterval(() => {
            if(i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, 12); // Slightly slowed for better readability and performance
    }

    function renderScene(cat) {
        if(currentSceneTl) currentSceneTl.kill();
        stageInner.innerHTML = '';
        
        // Configuration based on tech stack
        let iconLeft = 'activity', iconRight = 'database';
        
        if(cat.includes('ia')) { iconLeft = 'brain'; iconRight = 'cpu'; }
        else if(cat.includes('ingeniería')) { iconLeft = 'bot'; iconRight = 'git-merge'; }
        else if(cat.includes('infraestructura')) { iconLeft = 'satellite'; iconRight = 'server'; }

        // Create Nodes
        const nodeA = createNode(iconLeft, -80);
        const nodeB = createNode(iconRight, 80);
        const line = document.createElement('div');
        line.className = 'v-line';
        line.style.width = '140px';
        line.style.left = 'calc(50% - 70px)';
        
        stageInner.appendChild(line);
        stageInner.appendChild(nodeA);
        stageInner.appendChild(nodeB);
        
        // Performance: Targeted icon creation
        lucide.createIcons({
            attrs: { strokeWidth: 1.5 },
            nameAttr: 'data-lucide'
        });

        // Animation Timeline
        currentSceneTl = gsap.timeline();
        currentSceneTl.from([nodeA, nodeB], { scale: 0, opacity: 0, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' })
                      .from(line, { scaleX: 0, opacity: 0, duration: 0.4 }, "-=0.2");


        // Loop Pulses
        for(let i=0; i<3; i++) {
            const pulse = document.createElement('div');
            pulse.className = 'v-pulse';
            stageInner.appendChild(pulse);
            
            currentSceneTl.to(pulse, {
                x: 140, // Distance nodeA to nodeB
                left: 'calc(50% - 70px)',
                duration: 1.5,
                repeat: -1,
                delay: i * 0.5,
                ease: 'power1.inOut'
            }, 0.6);
        }
    }

    function createNode(icon, offset) {
        const div = document.createElement('div');
        div.className = 'v-node';
        div.style.left = `calc(50% + ${offset}px)`;
        div.innerHTML = `<i data-lucide="${icon}"></i>`;
        return div;
    }
}

/* =========================================
   CERTIFICATE DATA (Formación)
========================================= */
const certificateDB = {
    bigschool: {
        title: "IA, Vibe Coding & Automatización",
        subtitle: "Desarrollo impulsado por IA y orquestación empresarial",
        institution: "BIG School",
        year: "2026",
        tag: "Industry Expert",
        img: "assets/bigschool.png",
        summary: "Especialización en Vibe Coding y automatización de flujos corporativos, diseñando ecosistemas digitales que transforman operativas tradicionales en sistemas autónomos.",
        highlights: [
            { icon: "sparkles", label: "Vibe Coding", text: "Desarrollo acelerado con Lovable: de idea a producto funcional mediante prompts y lenguaje natural." },
            { icon: "git-merge", label: "Orquestación", text: "Make como motor central de integración, conectando APIs y plataformas en sistemas autónomos." },
            { icon: "database", label: "Data Pipeline", text: "Captación automatizada de leads canalizada a Notion con IA para procesado en tiempo real." }
        ],
        skills: ["Lovable", "Make", "Notion AI", "Prompt Engineering", "APIs", "Low-Code", "Agent Design"]
    },
    powerplatform: {
        title: "Eficiencia Empresarial con IA y Power Platform",
        subtitle: "Transformación digital en el ecosistema Microsoft",
        institution: "Universidad de Almería",
        year: "2024",
        tag: "Microsoft Tech · Sobresaliente",
        img: "assets/powerplatform.png",
        summary: "Diseño y despliegue de soluciones empresariales en el stack Microsoft — automatización de procesos, análisis avanzado y capas cognitivas AI Builder sobre entornos corporativos reales.",
        highlights: [
            { icon: "workflow", label: "Power Automate", text: "Orquestación de flujos multi-aplicación que eliminan tareas manuales repetitivas." },
            { icon: "bar-chart-3", label: "Power BI", text: "Modelado y visualización de datos en cuadros de mando interactivos." },
            { icon: "brain", label: "AI Builder", text: "Integración de modelos cognitivos para procesamiento documental y predicción." }
        ],
        skills: ["Power Automate", "Power BI", "Power Apps", "AI Builder", "Low-Code", "Dataverse"]
    },
    globus: {
        title: "Industry Champion — GLO-BUS Strategy",
        subtitle: "Top 14 mundial en simulador internacional de gestión",
        institution: "Simulador Internacional GLO-BUS",
        year: "2025",
        tag: "Global Award",
        img: "assets/globus.jpg",
        summary: "Reconocimiento top 14 mundial liderando un equipo de tres en el simulador de gestión empresarial GLO-BUS, compitiendo contra instituciones de todo el mundo.",
        highlights: [
            { icon: "trending-up", label: "Posicionamiento", text: "Decisiones estratégicas de marketing para maximizar cuota de mercado global." },
            { icon: "settings-2", label: "Operaciones", text: "Optimización de cadena de suministro y estructura de costos competitiva." },
            { icon: "users", label: "Liderazgo", text: "Coordinación de equipo bajo presión en entorno competitivo internacional." }
        ],
        skills: ["Strategic Planning", "Financial Modeling", "Team Leadership", "Data Analysis", "Global Markets"]
    },
    jump: {
        title: "Jump Emprendimiento — Bosquet Link & Logic",
        subtitle: "Proyecto real: Software IA predictiva + NFC industrial",
        institution: "Universidad de Almería",
        year: "2023",
        tag: "Innovation Project · Empresa Real",
        img: "assets/jump.png",
        summary: "Creación y despliegue de Bosquet Link & Logic: ecosistema digital con IA predictiva y trazabilidad NFC para mantenimiento industrial, pasando de concepto a empresa operativa.",
        highlights: [
            { icon: "cpu", label: "IA Predictiva", text: "Anticipación de fallos y optimización de ciclos de reparación." },
            { icon: "scan-line", label: "NFC WORM", text: "Trazabilidad física en tiempo real de activos e intervenciones técnicas." },
            { icon: "rocket", label: "Go-to-Market", text: "Validación, prototipado y lanzamiento de solución industrial." }
        ],
        skills: ["IA Predictiva", "NFC", "IoT", "Product Design", "Emprendimiento", "B2B Industrial"]
    }
};

window.openCertificateModal = function(id, evt) {
    const data = certificateDB[id];
    if(!data) return;

    const modal = document.getElementById('certificate-modal');
    const body = document.getElementById('cert-modal-body');
    const clickEvt = evt || window.event;

    const highlightsHTML = (data.highlights || []).map((h, i) => `
        <div class="cert-highlight" style="--i:${i}">
            <div class="cert-highlight-icon"><i data-lucide="${h.icon}"></i></div>
            <div class="cert-highlight-text">
                <span class="cert-highlight-label">${h.label}</span>
                <p>${h.text}</p>
            </div>
        </div>
    `).join('');

    const skillsHTML = (data.skills || []).map((s, i) => `<span class="cert-skill" style="--i:${i}">${s}</span>`).join('');

    body.innerHTML = `
        <div class="cert-cinema-view">
            <div class="cert-header-minimal">
                <span class="cert-kicker">${data.year} · ${data.institution}</span>
                <h2 class="cert-display-title">${data.title}</h2>
                <p class="cert-subtitle">${data.subtitle || ''}</p>
            </div>

            <div class="cert-hero-image">
                <div class="cert-image-frame">
                    <img src="${data.img}" alt="${data.title}">
                    <div class="cert-image-glow"></div>
                </div>
                <div class="cert-credential-badge">
                    <i data-lucide="shield-check"></i>
                    <span>Título Verificado · ${data.institution || ''}</span>
                </div>
            </div>

            <div class="cert-description-block">
                <p class="cert-summary">${data.summary || ''}</p>
                
                <div class="cert-details-centered">
                    ${highlightsHTML ? `
                        <div class="cert-meta-section">
                            <h5 class="cert-section-label">Logros Clave</h5>
                            <div class="cert-highlights-stack">
                                ${highlightsHTML}
                            </div>
                        </div>
                    ` : ''}

                    ${skillsHTML ? `
                        <div class="cert-meta-section">
                            <h5 class="cert-section-label">Stack Técnico</h5>
                            <div class="cert-skills-wrap">
                                ${skillsHTML}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;

    if (window.lucide) lucide.createIcons();

    modal.classList.add('active');
    document.body.classList.add('no-scroll');
    if(lenis) lenis.stop();

    const container = modal.querySelector('.cert-container');
    if (container) {
        let originX = '50%', originY = '50%';
        const target = clickEvt && (clickEvt.currentTarget || clickEvt.target?.closest('.edu-card'));
        if (target && target.getBoundingClientRect) {
            const r = target.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const cw = Math.min(1000, window.innerWidth * 0.95);
            const ch = window.innerHeight * 0.88;
            const staticLeft = (window.innerWidth - cw) / 2;
            const staticTop = (window.innerHeight - ch) / 2;
            originX = `${cx - staticLeft}px`;
            originY = `${cy - staticTop}px`;
        }
        container.style.transformOrigin = `${originX} ${originY}`;
        if (window.gsap) {
            gsap.fromTo(container,
                { scale: 0.08, opacity: 0, filter: 'blur(15px)' },
                { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.85, ease: 'expo.out' }
            );
        }
    }

    // Stagger reveal
    if (window.gsap) {
        gsap.from('.cert-image-meta, .cert-image-frame, .cert-image-caption', {
            opacity: 0, y: 20, duration: 0.7, stagger: 0.08, ease: 'power3.out', delay: 0.25
        });
        gsap.from('.cert-info-header > *, .cert-summary, .cert-section', {
            opacity: 0, y: 24, duration: 0.7, stagger: 0.08, ease: 'power3.out', delay: 0.35
        });
        gsap.from('.cert-highlight', {
            opacity: 0, x: -20, duration: 0.6, stagger: 0.08, ease: 'power3.out', delay: 0.55
        });
        gsap.from('.cert-skill', {
            opacity: 0, scale: 0.8, duration: 0.4, stagger: 0.04, ease: 'back.out(1.7)', delay: 0.75
        });
    }
};

window.closeCertificateModal = function() {
    const modal = document.getElementById('certificate-modal');
    const container = modal.querySelector('.cert-container');
    const finish = () => {
        modal.classList.remove('active');
        document.body.classList.remove('no-scroll');
        if(lenis) lenis.start();
    };
    if (container && window.gsap) {
        gsap.to(container, {
            scale: 0.08, opacity: 0, filter: 'blur(15px)',
            duration: 0.45, ease: 'power2.in', onComplete: finish
        });
    } else finish();
};

/* =========================================
   MODAL & CHATBOT LOGIC
========================================= */
const modal = document.getElementById('project-modal');
const modalBody = document.getElementById('modal-body-content');

window.openProjectModal = function(projectId) {
    if(!projectDB[projectId]) return;
    
    currentProjectContext = projectId;
    const data = projectDB[projectId];

    // Build Roadmap HTML
    let roadmapHTML = '';
    if (data.roadmap) {
        roadmapHTML = `
            <div class="roadmap-section">
                <h5 class="roadmap-title">Evolución & Procesos</h5>
                <div class="roadmap-container">
                    ${data.roadmap.map(item => `
                        <div class="roadmap-item">
                            <div class="roadmap-dot"></div>
                            <span class="roadmap-label">${item.label}</span>
                            <div class="roadmap-card">
                                ${ (item.image || item.images || item.video) ? `
                                    <div class="roadmap-media ${item.video ? 'is-video' : 'is-image'}">
                                        ${item.video 
                                            ? `<video src="${item.video}" autoplay muted loop playsinline></video>` 
                                            : (item.images 
                                                ? `<div class="roadmap-gallery" style="display:flex; gap:0.8rem; overflow-x:auto; padding-bottom:0.5rem; max-width: 100%; border-radius: 8px;">${item.images.map(img => `<img src="${img}" alt="${item.title}" style="max-height: 240px; width: auto; flex-shrink: 0; object-fit: contain; border-radius: 6px; border: 1px solid rgba(0,0,0,0.1);">`).join('')}</div>`
                                                : `<img src="${item.image}" alt="${item.title}">`)
                                        }
                                    </div>
                                ` : '' }
                                <div class="roadmap-info">
                                    <h4>${item.title}</h4>
                                    <p>${item.description}</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Build Meta & Tags HTML
    const tagsHTML = data.tags.map(tag => `<span class="tag-chip">${tag}</span>`).join('');
    const metaHTML = `
        <div class="modal-footer-meta">
            <div class="meta-section">
                <h5>Stack & Tags</h5>
                <div class="project-tags">${tagsHTML}</div>
            </div>
            
            <div class="meta-section">
                <h5>Detalles</h5>
                <div class="meta-list">
                    <div class="meta-item">
                        <span class="meta-label">Año</span>
                        <span class="meta-value">${data.year}</span>
                    </div>
                    <div class="meta-item">
                        <span class="meta-label">Categoría</span>
                        <span class="meta-value">${data.category}</span>
                    </div>
                </div>
            </div>

            <a href="mailto:danielbosquettoves@gmail.com?subject=Interés en Proyecto: ${data.title}" class="project-cta" data-cursor="hover">
                <span>Consultar Detalles</span>
                <i data-lucide="arrow-right"></i>
            </a>
        </div>
    `;

    // Inject Unified Content
    modalBody.innerHTML = `
        <div class="modal-editorial-flow">
            <h2>${data.title}</h2>
            <div class="sub">${data.subtitle}</div>
            <div class="modal-text-content">
                ${data.content}
            </div>
            ${roadmapHTML}
            ${metaHTML}
        </div>
    `;

    // Populate Mobile Nav Title
    const mobileNavTitle = document.getElementById('modal-mobile-title');
    if(mobileNavTitle) mobileNavTitle.innerText = data.title;

    // Refresh Lucide Icons
    lucide.createIcons({
        root: modalBody
    });

    // Reset scroll positions
    modalBody.scrollTop = 0;

    // Open Modal
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    
    // Stop Lenis
    if(lenis) lenis.stop();
};

window.closeProjectModal = function() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    currentProjectContext = null;
    if(lenis) lenis.start();
};

/* =========================================
   AUDIO ENGINE — procedural click + wind
========================================= */
function initAudioEngine() {
    if (window.__audioEngine) return;

    const STORAGE_KEY = 'portfolio_audio_muted';
    let ctx = null;
    let noiseSource = null, noiseGain = null, scrollFilter = null;
    let targetNoiseGain = 0, targetFilterFreq = 400;
    let muted = localStorage.getItem(STORAGE_KEY) === '1';
    let initialized = false;

    const createCtx = () => {
        if (ctx) return ctx;
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        return ctx;
    };

    const ensureInit = async () => {
        createCtx();
        if (ctx.state === 'suspended') await ctx.resume();
        if (!initialized) {
            // buildScroll(); // Ambient breeze deactivated for now
            initialized = true;
        }
    };

    const buildScroll = () => {
        // — Layer B: White noise -> Lowpass (Fine, delicate breeze) —
        const bufSize = ctx.sampleRate * 2;
        const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = buf.getChannelData(0);
        // Pink noise approximation for continuous smooth, non-harsh sound
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufSize; i++) {
            let white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
            b6 = white * 0.115926;
        }

        noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buf;
        noiseSource.loop = true;

        scrollFilter = ctx.createBiquadFilter();
        scrollFilter.type = 'lowpass';
        scrollFilter.frequency.value = 400; // Starts calm
        scrollFilter.Q.value = 0.2; // Soft resonance

        noiseGain = ctx.createGain();
        noiseGain.gain.value = 0;

        noiseSource.connect(scrollFilter).connect(noiseGain).connect(ctx.destination);
        noiseSource.start();
    };

    const playClick = () => {
        if (muted) return;
        createCtx();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;

        // — Modern UI Pop (Glassy / Water-drop like) —
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        
        // Very fast pitch drop from 1200Hz to 400Hz creates the "pop" texture
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.25, now);
        env.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

        osc.connect(env).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
        
        // — High frequency transient tick (Crispness) —
        const tickOsc = ctx.createOscillator();
        tickOsc.type = 'triangle';
        tickOsc.frequency.setValueAtTime(4000, now);
        tickOsc.frequency.exponentialRampToValueAtTime(1000, now + 0.015);
        
        const tickEnv = ctx.createGain();
        tickEnv.gain.setValueAtTime(0.08, now);
        tickEnv.gain.exponentialRampToValueAtTime(0.0001, now + 0.015);
        
        tickOsc.connect(tickEnv).connect(ctx.destination);
        tickOsc.start(now);
        tickOsc.stop(now + 0.02);
    };

    const onScroll = (velocity) => {
        if (!initialized || muted) return;
        const rawNorm = Math.abs(velocity) / 50;
        const norm = Math.min(Math.pow(rawNorm, 0.5), 1); // smooth scaling
        
        targetNoiseGain = norm * 0.05;   // Delicate breeze volume
        targetFilterFreq = 400 + (norm * 2200); // Opens up to 2600Hz, calms down to 400Hz
    };

    // Smooth interpolation
    const smoothLoop = () => {
        if (ctx && noiseGain && scrollFilter) {
            const now = ctx.currentTime;
            const ramp = 0.4;
            
            noiseGain.gain.linearRampToValueAtTime(muted ? 0 : targetNoiseGain, now + ramp);
            scrollFilter.frequency.linearRampToValueAtTime(targetFilterFreq, now + ramp);
            
            // Gentle decay when scroll stops (Creates the calming "sigh" effect)
            targetNoiseGain *= 0.94;
            targetFilterFreq = Math.max(400, targetFilterFreq * 0.95);
        }
        requestAnimationFrame(smoothLoop);
    };
    requestAnimationFrame(smoothLoop);

    // Attach click sounds to interactive elements
    const clickSelector = '[data-cursor="hover"], .project-card, .edu-card, .chip, .toggle-btn, .modal-close, .c-pill, .contact-cta, button, a[href]';
    document.addEventListener('click', async (e) => {
        if (e.target.closest('#audio-toggle')) return; // handled separately
        if (!e.target.closest(clickSelector)) return;
        await ensureInit();
        playClick();
    }, { passive: true });

    // First user gesture anywhere → init (so wind works even before a real click)
    const firstGesture = async () => {
        await ensureInit();
        document.removeEventListener('pointerdown', firstGesture);
        document.removeEventListener('keydown', firstGesture);
    };
    document.addEventListener('pointerdown', firstGesture, { once: true });
    document.addEventListener('keydown', firstGesture, { once: true });

    // Build mute toggle UI
    const toggle = document.createElement('button');
    toggle.id = 'audio-toggle';
    toggle.className = 'audio-toggle';
    toggle.setAttribute('aria-label', 'Silenciar sonidos ambiente');
    toggle.innerHTML = `
        <span class="bar"></span><span class="bar"></span><span class="bar"></span><span class="bar"></span>
        <span class="muted-slash"></span>
    `;
    if (muted) toggle.classList.add('is-muted');
    document.body.appendChild(toggle);
    toggle.addEventListener('click', async () => {
        muted = !muted;
        localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
        toggle.classList.toggle('is-muted', muted);
        await ensureInit();
        if (!muted) playClick();
    });

    window.__audioEngine = { onScroll, playClick, setMuted: (v) => { muted = v; } };
}

// =========================================
// TEXT ILLUMINATE EFFECT (Scroll Triggered)
// =========================================
function initTextIlluminate() {
    const titles = document.querySelectorAll(".gs-illuminate");
    
    titles.forEach(elem => {
        const text = elem.innerText;
        elem.innerHTML = ''; 
        
        // Split into spans
        text.split('').forEach(char => {
            const charSpan = document.createElement('span');
            charSpan.className = 'illu-char';
            charSpan.innerHTML = char === ' ' ? '&nbsp;' : char;
            elem.appendChild(charSpan);
        });

        const chars = elem.querySelectorAll('.illu-char');
        
        // GSAP Scroll Animation
        gsap.to(chars, {
            scrollTrigger: {
                trigger: elem,
                start: "top 85%",
                end: "top 45%",
                scrub: 1, // Smooth scrub
                onEnter: () => elem.classList.add('is-visible'),
            },
            color: "#ffffff",
            filter: "drop-shadow(0 0 12px rgba(255, 255, 255, 0.8))",
            stagger: 0.05,
            ease: "power2.out"
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initTextIlluminate();
});


// Experiencia Accordion Toggle logic
window.toggleExp = function(el) {
    const isActive = el.classList.contains('is-active');
    
    // Close other open items (Accordion mode)
    document.querySelectorAll('.exp-item').forEach(item => {
        item.classList.remove('is-active');
    });

    // Toggle current
    if (!isActive) {
        el.classList.add('is-active');
    }
    
    // Refresh Lucide icons in case they were added dynamically
    if (window.lucide) lucide.createIcons();
};

// 3D Tilt Experience for Project Cards
document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll('.project-card');
    const MAX_TILT = 12; // Degrees

    cards.forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = ((y - centerY) / centerY) * -MAX_TILT;
            const rotateY = ((x - centerX) / centerX) * MAX_TILT;
            
            // Glare position
            const glareH = (x / rect.width) * 100;
            const glareV = (y / rect.height) * 100;
            
            card.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            card.style.setProperty('--gh', `${glareH}%`);
            card.style.setProperty('--gv', `${glareV}%`);
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1500px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
        });
    });
});

/* =========================================
   CONTACT TYPEWRITER
========================================= */
(function initContactTypewriter(){
    const el = document.getElementById('contact-typewriter');
    if (!el) return;
    const phrases = [
        'Construyamos juntos',
        'Imaginemos el futuro',
        'Construyamos juntos',
        'Creemos algo real',
        'Construyamos juntos',
        'Automaticemos lo imposible'
    ];
    const TYPE_MS = 85;
    const ERASE_MS = 45;
    const HOLD_MS = 1600;
    const GAP_MS = 400;
    let i = 0;
    async function run(){
        while(true){
            const text = phrases[i % phrases.length];
            for (let c = 1; c <= text.length; c++){
                el.textContent = text.slice(0, c);
                await wait(TYPE_MS);
            }
            await wait(HOLD_MS);
            for (let c = text.length; c >= 0; c--){
                el.textContent = text.slice(0, c);
                await wait(ERASE_MS);
            }
            await wait(GAP_MS);
            i++;
        }
    }
    function wait(ms){ return new Promise(r => setTimeout(r, ms)); }
    run();
})();
