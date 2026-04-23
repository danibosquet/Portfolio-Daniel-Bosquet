'use client'

import { useAnimations } from '@/hooks/useAnimations'
import Navigation from '@/components/Navigation'
import Hero from '@/components/Hero'
import About from '@/components/About'
import Ecosystems from '@/components/Ecosystems'
import Experience from '@/components/Experience'

export default function Home() {
  useAnimations()

  return (
    <main id="smooth-wrapper">
      <div id="smooth-content">
        <Navigation />
        <Hero />
        <About />
        <Ecosystems />
        <Experience />

        {/* Contact Section */}
        <section id="contact" className="contact-section">
          <div className="container">
            <h2>Hablemos sobre tu próximo proyecto</h2>
            <a href="mailto:contact@danielbosquet.com" className="contact-cta" data-cursor="hover">
              Enviar email
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}
