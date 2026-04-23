'use client'

import { Brain, Bot, Network, GitMerge, PlugZap, Sparkles, Zap, Satellite, ScanLine, Server, Layers } from 'lucide-react'

const ecosystems = [
  {
    title: 'IA & Cognición',
    items: [
      {
        icon: Brain,
        label: 'LLMs (ChatGPT, Claude)',
        desc: 'Procesamiento de Lenguaje Natural avanzado. Extracción de entidades, razonamiento semántico y generación dinámica.',
      },
      {
        icon: Bot,
        label: 'Agentes Cognitivos',
        desc: 'Entidades IA aisladas con memoria a corto/largo plazo, capaces de ejecutar flujos de razonamiento y toma de decisiones.',
      },
      {
        icon: Network,
        label: 'Sistemas Multiagente',
        desc: 'Arquitectura distribuida donde múltiples IA especializadas debaten, colaboran y delegan tareas para resolver problemas masivos.',
      },
    ],
  },
  {
    title: 'Ingeniería & Conectividad',
    items: [
      {
        icon: GitMerge,
        label: 'BPA (Business Process Auto.)',
        desc: 'Automatización de Procesos Críticos para eliminar cuellos de botella mediante flujos lógicos deterministas o integración IA.',
      },
      {
        icon: PlugZap,
        label: 'Generación de APIs',
        desc: 'Conectividad modular. Creación de endpoints escalables para comunicar microservicios y bases de datos heterogéneas.',
      },
      {
        icon: Sparkles,
        label: 'Google Antigravity',
        desc: 'Desarrollo bajo entornos de IA empoderados. Testing acelerado de arquitecturas nativas (Actigravity/Gemini).',
      },
      {
        icon: Zap,
        label: 'Vibe Coding',
        desc: 'Metodología ágil: Co-creación ininterrumpida de código utilizando grandes modelos fundacionales de código bajo demanda.',
        highlight: true,
      },
    ],
  },
  {
    title: 'Infraestructura & Físico',
    items: [
      {
        icon: Satellite,
        label: 'IoT (Internet de las Cosas)',
        desc: 'Despliegue de sensores y actuadores físicos, traduciendo variables del mundo real en data points estructurados.',
      },
      {
        icon: ScanLine,
        label: 'Trazabilidad Física',
        desc: 'Monitorización inmutable de activos. Verificación auditable de hardware a través de tecnologías anti-clonación.',
      },
      {
        icon: Server,
        label: 'Despliegue Servidores',
        desc: 'Configuración y virtualización sobre plataformas en la nube, garantizando disponibilidad 24/7 y resiliencia máxima.',
      },
      {
        icon: Layers,
        label: 'Arquitectura Full-Stack',
        desc: 'Control absoluto: desde la arquitectura base de datos relacional hasta la UI visual dinámica en JS.',
      },
    ],
  },
]

export default function Ecosystems() {
  return (
    <section id="ecosystems" className="ecosystem-section">
      <div className="container">
        <div className="section-header">
          <span className="section-label">02 / Ecosistemas Técnicos</span>
          <h2 className="section-title">
            Stack & <span className="hero-font-serif">Tecnologías</span>
          </h2>
        </div>

        <div className="tag-grid">
          {ecosystems.map((group, idx) => (
            <div key={idx} className="tag-group">
              <h3>{group.title}</h3>
              <div className="tech-chips">
                {group.items.map((item, itemIdx) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={itemIdx}
                      className={`chip ${item.highlight ? 'highlight-chip' : ''}`}
                      data-cursor="hover"
                      title={item.desc}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
