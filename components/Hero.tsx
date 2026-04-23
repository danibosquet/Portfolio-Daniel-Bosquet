'use client'

import Image from 'next/image'

export default function Hero() {
  return (
    <>
      <section id="hero" className="hero-pinned hero-editorial-studio">
        <div className="hero-sticky-content">
          <div className="studio-glow"></div>

          <div className="hero-studio-name" aria-hidden="true">
            <span className="name-part">DANIEL</span>
            <span className="name-part">BOSQUET</span>
          </div>

          <div className="hero-studio-subject">
            <img
              src="/assets/hero.png"
              alt="Daniel Bosquet"
              className="studio-img"
              width={560}
              height={600}
            />
          </div>
        </div>
      </section>

      <section className="marquee-section">
        <div className="marquee-track">
          <h2 className="marquee-text">— TRAZABILIDAD — LLM — VIBE CODING — AGENTES IA </h2>
          <h2 className="marquee-text">— TRAZABILIDAD — LLM — VIBE CODING — AGENTES IA </h2>
        </div>
      </section>
    </>
  )
}
