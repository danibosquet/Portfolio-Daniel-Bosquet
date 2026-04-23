'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const navItems = [
  { href: '#about', label: 'Perfil' },
  { href: '#ecosystems', label: 'Ecosistemas' },
  { href: '#experience', label: 'Experiencia' },
  { href: '#projects', label: 'Proyectos' },
]

export default function Navigation() {
  const pillRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<(HTMLAnchorElement | null)[]>([])

  useEffect(() => {
    const tabs = tabsRef.current
    const pill = pillRef.current
    const container = containerRef.current

    if (!tabs.length || !pill || !container) return

    let targetX = 0,
      targetY = 0,
      targetW = 0,
      targetH = 0
    let currentX = 0,
      currentY = 0,
      currentW = 0,
      currentH = 0
    let velX = 0,
      velY = 0,
      velW = 0,
      velH = 0
    let isHovering = false
    let initialized = false

    const setPill = gsap.quickSetter(pill, 'css')

    tabs.forEach((tab) => {
      if (!tab) return
      tab.addEventListener('mouseenter', () => {
        const rect = tab.getBoundingClientRect()
        const containerRect = container.getBoundingClientRect()

        targetX = rect.left - containerRect.left
        targetY = rect.top - containerRect.top
        targetW = rect.width
        targetH = rect.height

        if (!initialized) {
          currentX = targetX
          currentY = targetY
          currentW = targetW
          currentH = targetH
          initialized = true
        }
        isHovering = true
        pill.style.opacity = '1'
      })
    })

    container.addEventListener('mouseleave', () => {
      isHovering = false
      pill.style.opacity = '0'
      initialized = false
    })

    const ticker = gsap.ticker.add(() => {
      if (!isHovering && !initialized) return

      const stiffness = 0.22
      const damping = 0.62

      velX += (targetX - currentX) * stiffness
      velY += (targetY - currentY) * stiffness
      velW += (targetW - currentW) * stiffness
      velH += (targetH - currentH) * stiffness

      velX *= damping
      velY *= damping
      velW *= damping
      velH *= damping

      currentX += velX
      currentY += velY
      currentW += velW
      currentH += velH

      setPill({
        left: currentX + 'px',
        top: currentY + 'px',
        width: currentW + 'px',
        height: currentH + 'px',
      })
    })

    return () => {
      gsap.ticker.remove(ticker)
    }
  }, [])

  return (
    <nav className="nav-bar">
      <div className="nav-container">
        <a href="#hero" className="nav-logo" data-cursor="hover">
          D.B.T
        </a>
        <div className="nav-links" id="nav-tabs" ref={containerRef}>
          <div className="nav-pill" ref={pillRef}></div>
          {navItems.map((item, idx) => (
            <a
              key={item.href}
              href={item.href}
              className="nav-tab"
              data-cursor="hover"
              ref={(el) => {
                tabsRef.current[idx] = el
              }}
            >
              {item.label}
            </a>
          ))}
          <a href="#contact" className="nav-contact-btn nav-tab" data-cursor="hover">
            Hablemos
          </a>
        </div>
      </div>
    </nav>
  )
}
