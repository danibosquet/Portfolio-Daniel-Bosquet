'use client'

import { useEffect } from 'react'
import gsap from 'gsap'
import Lenis from 'lenis'

export function useAnimations() {
  useEffect(() => {
    // Initialize Lenis
    const lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    })

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    // Preloader Animation
    const preloader = document.getElementById('preloader')
    if (preloader) {
      const tlIntro = gsap.timeline({
        onComplete: () => {
          preloader.style.display = 'none'
          document.body.classList.remove('no-scroll')
        },
      })

      tlIntro.to('.p-char', {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power4.out',
        delay: 0.3,
      })

      tlIntro.to(
        '.preloader-logo',
        {
          letterSpacing: '-0.15em',
          duration: 0.8,
          ease: 'expo.inOut',
        },
        '+=0.2'
      )

      tlIntro.to(
        '#preloader',
        {
          scaleY: 0,
          duration: 1.2,
          ease: 'expo.inOut',
          transformOrigin: 'center center',
        },
        '-=0.2'
      )

      tlIntro.to(
        '.preloader-content',
        {
          scale: 0.5,
          opacity: 0,
          duration: 0.6,
          ease: 'power4.inOut',
        },
        '<'
      )
    }

    // Cursor Logic
    const cursorDot = document.getElementById('cursor-dot')
    const cursorRing = document.getElementById('cursor-ring')

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let ringX = mouseX
    let ringY = mouseY
    let ringVelX = 0
    let ringVelY = 0
    let cursorInitialized = false
    let magneticEls: Element[] = []

    if (cursorRing && cursorDot) {
      const setDotX = gsap.quickSetter(cursorDot, 'x', 'px')
      const setDotY = gsap.quickSetter(cursorDot, 'y', 'px')
      const setRingX = gsap.quickSetter(cursorRing, 'x', 'px')
      const setRingY = gsap.quickSetter(cursorRing, 'y', 'px')

      const MAGNETIC_DISTANCE = 110

      window.addEventListener(
        'mousemove',
        (e) => {
          if (!cursorInitialized) {
            gsap.set([cursorDot, cursorRing], { opacity: 1 })
            ringX = e.clientX
            ringY = e.clientY
            magneticEls = Array.from(
              document.querySelectorAll('.project-card, .nav-logo, .nav-contact-btn, .contact-cta, .edu-card')
            )
            cursorInitialized = true
          }
          mouseX = e.clientX
          mouseY = e.clientY
          setDotX(mouseX)
          setDotY(mouseY)
        },
        { passive: true }
      )

      gsap.ticker.add(() => {
        if (!cursorInitialized) return

        let targetX = mouseX
        let targetY = mouseY
        let isMagnetic = false
        let nearestDist = Infinity

        for (const el of magneticEls) {
          const rect = el.getBoundingClientRect()
          if (!rect.width || !rect.height) continue
          const cx = rect.left + rect.width / 2
          const cy = rect.top + rect.height / 2
          const dist = Math.hypot(mouseX - cx, mouseY - cy)

          if (dist < MAGNETIC_DISTANCE && dist < nearestDist) {
            nearestDist = dist
            const pull = (1 - dist / MAGNETIC_DISTANCE) * 0.42
            targetX = mouseX + (cx - mouseX) * pull
            targetY = mouseY + (cy - mouseY) * pull
            isMagnetic = true
          }
        }

        const stiffness = isMagnetic ? 0.25 : 0.12
        const damping = isMagnetic ? 0.55 : 0.7

        const forceX = (targetX - ringX) * stiffness
        const forceY = (targetY - ringY) * stiffness

        ringVelX += forceX
        ringVelY += forceY

        ringVelX *= damping
        ringVelY *= damping

        ringX += ringVelX
        ringY += ringVelY

        setRingX(ringX)
        setRingY(ringY)

        if (isMagnetic) cursorRing.classList.add('is-magnetic')
        else cursorRing.classList.remove('is-magnetic')
      })

      // Cursor Hover Logic
      document.body.addEventListener('mouseover', (e) => {
        const interactive = (e.target as Element).closest(
          '[data-cursor="hover"], a, button, .exp-item, .project-card, .chip, .preset-btn, .modal-close'
        )
        const textTarget = (e.target as Element).closest('h1, h2, h3, p, span.hero-sub, .cert-summary')

        if (interactive) {
          document.body.classList.add('cursor-hover')
          document.body.classList.remove('cursor-text')
        } else if (textTarget) {
          document.body.classList.add('cursor-text')
          document.body.classList.remove('cursor-hover')

          const style = window.getComputedStyle(textTarget as Element)
          const lh = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2
          cursorRing.style.setProperty('--caret-h', `${lh}px`)
        }
      })

      document.body.addEventListener('mouseout', (e) => {
        const interactive = (e.target as Element).closest(
          '[data-cursor="hover"], a, button, .exp-item, .project-card, .chip, .preset-btn, .modal-close'
        )
        const textTarget = (e.target as Element).closest('h1, h2, h3, p, span.hero-sub, .cert-summary')

        if (interactive) document.body.classList.remove('cursor-hover')
        if (textTarget) document.body.classList.remove('cursor-text')
      })
    }

    return () => {
      lenis.destroy()
    }
  }, [])
}
