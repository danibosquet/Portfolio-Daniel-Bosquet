'use client'

import { useState } from 'react'
import { ChevronDown, CheckCircle2 } from 'lucide-react'

const experiences = [
  {
    id: 1,
    date: 'feb. 2026 — Act',
    role: 'Full-Stack AI Developer',
    subtitle: 'Automatización Sistemática & Vibe Coding',
    company: 'Almería, España',
    description:
      'Liderazgo técnico en la integración de flujos de IA generativa y agentes autónomos para la optimización de procesos empresariales. Especializado en el desarrollo de ecosistemas full-stack de alto rendimiento bajo la metodología Vibe Coding, priorizando la agilidad y la iteración constante sobre prototipos funcionales de alto impacto.',
    features: [
      'Orquestación de Agentes Autónomos',
      'Interfaces de Usuario Dinámicas con React',
      'Integración Profunda de LLMs en Flujos Críticos',
    ],
  },
  {
    id: 2,
    date: '2022 — Act',
    role: 'Investigación en IA Aplicada',
    subtitle: 'Modelos fundacionales & Optimización operativa',
    company: 'Investigador Indep.',
    description:
      'Investigación aplicada centrada en arquitecturas RAG (Retrieval-Augmented Generation) y el despliegue de modelos fundacionales para resolver problemas lógicos no estructurados. Exploración activa de infraestructuras de datos inmutables basadas en DAG para pasaportes digitales y trazabilidad absoluta.',
    features: [
      'Benchmark de Modelos de Lenguaje',
      'Optimización de Prompt Engineering Estratégico',
      'Arquitecturas Descentralizadas de Datos',
    ],
  },
  {
    id: 3,
    date: '2022 — 2026',
    role: 'Ingeniero de Aplicaciones & Startup',
    subtitle: 'Ecosistemas de IoT & Blockchain',
    company: 'AgriSense | Almería',
    description:
      'Co-fundador de un ecosistema IoT integrado con blockchain para trazabilidad agrícola. Diseño de arquitecturas full-stack conectando sensores de campo, procesamiento de datos en tiempo real y visualización en dashboards interactivos.',
    features: [
      'Arquitectura IoT Multi-sensor',
      'Cadena de Custodia Digital',
      'APIs RESTful de Alto Rendimiento',
    ],
  },
]

export default function Experience() {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  return (
    <section id="experience" className="exp-section">
      <div className="container">
        <div className="section-header">
          <span className="section-label">04 / Trayectoria</span>
          <h2 className="section-title">Experiencia Histórica</h2>
        </div>

        <div className="exp-list">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className={`exp-item ${expandedId === exp.id ? 'active' : ''}`}
              data-cursor="hover"
              onClick={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
            >
              <div className="exp-header">
                <div className="exp-date">{exp.date}</div>
                <div className="exp-main">
                  <h3>{exp.role}</h3>
                  <p className="exp-sub">{exp.subtitle}</p>
                </div>
                <div className="exp-company">
                  <span>{exp.company}</span>
                  <ChevronDown className="exp-arrow" />
                </div>
              </div>

              {expandedId === exp.id && (
                <div className="exp-details">
                  <div className="exp-content">
                    <p>{exp.description}</p>
                    <ul className="exp-features">
                      {exp.features.map((feature, idx) => (
                        <li key={idx}>
                          <CheckCircle2 size={20} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
