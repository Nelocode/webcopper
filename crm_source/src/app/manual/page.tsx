'use client';

import React from 'react';

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 md:p-10 font-sans">
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .printable-card {
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            padding: 0 !important;
          }
          h1, h2, h3, h4, strong {
            color: #000000 !important;
          }
          th {
            background-color: #f1f5f9 !important;
            color: #000000 !important;
          }
          td {
            background-color: #ffffff !important;
            color: #000000 !important;
          }
          .cmd-tag {
            background-color: #f1f5f9 !important;
            color: #0284c7 !important;
            border: 1px solid #cbd5e1 !important;
          }
          img {
            max-width: 100% !important;
            border: 1px solid #cbd5e1 !important;
            margin: 16px 0 !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto bg-[#0f172a] border border-white/10 rounded-3xl p-6 md:p-12 shadow-2xl printable-card space-y-8">
        
        {/* Floating Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 no-print">
          <div>
            <span className="text-xs font-black uppercase text-[#84cc16] tracking-widest bg-[#84cc16]/10 px-3 py-1 rounded-full border border-[#84cc16]/20">
              Versión 2.1 — Producción con Capturas Ilustradas
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-white mt-2 font-['Outfit']">
              OUTCROP SILVER CRM
            </h1>
            <p className="text-xs text-sky-400 font-bold mt-1">
              Manual Oficial de Usuario Ilustrado para el Equipo de Investor Relations (IR)
            </p>
          </div>

          <button
            onClick={() => window.print()}
            className="hs-pill-btn hs-btn-lime py-3 px-6 text-xs font-black flex items-center gap-2 shadow-xl shrink-0"
          >
            <span>🖨️ Imprimir / Exportar a PDF</span>
          </button>
        </div>

        {/* Intro Alert Box */}
        <div className="bg-sky-500/10 border border-sky-500/30 p-5 rounded-2xl space-y-1">
          <h4 className="text-xs font-black text-sky-400 uppercase tracking-wider">
            📌 Guía Ilustrada para Usuarios No Técnicos
          </h4>
          <p className="text-xs text-slate-300">
            Este manual contiene explicaciones paso a paso con <strong>capturas de pantalla reales</strong> de la plataforma. Puedes consultarlo en pantalla o presionar <kbd className="px-1.5 py-0.5 bg-black/40 rounded border border-white/20 font-mono text-[10px]">Ctrl + P</kbd> (o <kbd className="px-1.5 py-0.5 bg-black/40 rounded border border-white/20 font-mono text-[10px]">Cmd + P</kbd> en Mac) para exportarlo como documento PDF.
          </p>
        </div>

        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-white border-l-4 border-sky-400 pl-3 font-['Outfit']">
            1. Introducción al CRM
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Outcrop Silver CRM v2.1</strong> es la plataforma centralizada para organizar, hacer seguimiento y cerrar acuerdos de inversión con Family Offices, Fondos Institucionales, inversionistas HNW y Brokers interesados en el proyecto de plata de alta ley Santa Ana.
          </p>
          <ul className="list-disc list-inside text-xs text-slate-300 space-y-1 pl-2">
            <li>Consultar el expediente 360° de cada contacto con notas de voz e informes técnicos.</li>
            <li>Mover contactos por etapas de cierre (Lead, Reunión, Due Diligence, Términos, Cierre).</li>
            <li>Ver el mapa físico de conexiones entre brokers e inversionistas.</li>
            <li>Generar comunicados de prensa con Inteligencia Artificial.</li>
            <li>Controlar todo el sistema directamente desde tu celular por <strong>WhatsApp</strong>.</li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl font-black text-white border-l-4 border-sky-400 pl-3 font-['Outfit']">
            2. Estructura de la Pantalla Principal y Marca
          </h2>
          <p className="text-xs text-slate-300">
            Al ingresar a la plataforma web observarás la barra lateral a la izquierda con el logo institucional y los accesos rápidos a los 5 módulos principales:
          </p>
          
          {/* Screenshot 7: Sidebar & Branding */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 p-2">
            <img src="/manual_images/07_sidebar_branding.png" alt="Barra Lateral e Identidad Outcrop Silver" className="w-full h-auto rounded-xl" />
            <p className="text-[11px] text-center text-slate-400 mt-2 italic font-mono">
              Figura 1: Barra lateral de navegación con el widget Powered by i2 y accesos principales.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4 page-break">
          <h2 className="text-xl font-black text-white border-l-4 border-sky-400 pl-3 font-['Outfit']">
            3. Módulo 1: Directorio e Expediente 360°
          </h2>
          <p className="text-xs text-slate-300">
            En el directorio general puedes buscar inversionistas por nombre, empresa o correo, filtrar por puntaje de interés (*Lead Score*) y consultar sus perfiles completos:
          </p>

          {/* Screenshot 1: Directory */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 p-2">
            <img src="/manual_images/01_directorio_360.png" alt="Directorio General de Inversionistas" className="w-full h-auto rounded-xl" />
            <p className="text-[11px] text-center text-slate-400 mt-2 italic font-mono">
              Figura 2: Directorio principal con tarjetas de inversionistas, etiquetas y medidores de interés.
            </p>
          </div>

          <h3 className="text-sm font-bold text-sky-400 mt-4">Expediente 360° del Inversionista</h3>
          <p className="text-xs text-slate-300">
            Al hacer clic en <strong>Ver Expediente 360°</strong>, ingresarás al expediente consolidado con 5 pestañas temáticas:
          </p>

          {/* Screenshot 2: 360 Dossier */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 p-2">
            <img src="/manual_images/02_expediente_360.png" alt="Expediente 360° del Inversionista" className="w-full h-auto rounded-xl" />
            <p className="text-[11px] text-center text-slate-400 mt-2 italic font-mono">
              Figura 3: Expediente 360° con pestañas de Resumen, Historial, Relaciones, Búsqueda IA e Ensayes Mineros.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4 page-break">
          <h2 className="text-xl font-black text-white border-l-4 border-sky-400 pl-3 font-['Outfit']">
            4. Módulo 2: Embudo de Seguimiento y Tareas (Kanban)
          </h2>
          <p className="text-xs text-slate-300">
            Organiza tus inversionistas en 5 columnas de avance (*First Contact ➔ Meeting Scheduled ➔ Due Diligence ➔ Term Sheet ➔ Closed Investor*). Puedes arrastrar y soltar las tarjetas para cambiar su etapa en tiempo real:
          </p>

          {/* Screenshot 3: Kanban */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 p-2">
            <img src="/manual_images/03_embudo_kanban.png" alt="Tablero Kanban de Seguimiento" className="w-full h-auto rounded-xl" />
            <p className="text-[11px] text-center text-slate-400 mt-2 italic font-mono">
              Figura 4: Tablero Kanban interactivo y módulo superior de Tareas & Alertas Programadas.
            </p>
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-4 page-break">
          <h2 className="text-xl font-black text-white border-l-4 border-sky-400 pl-3 font-['Outfit']">
            5. Módulo 3: Grafo Interactivo de Relaciones (Red de Contactos)
          </h2>
          <p className="text-xs text-slate-300">
            Muestra visualmente a tus contactos como una red física viva con gravedad interactiva. Puedes arrastrar nodos con el ratón y conectar personas con roles como *Co-Inversor*, *Broker de*, *Referido por* o *Asesor Técnico*:
          </p>

          {/* Screenshot 4: Interactive Graph */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 p-2">
            <img src="/manual_images/04_grafo_interactivo.png" alt="Grafo Interactivo de Conexiones" className="w-full h-auto rounded-xl" />
            <p className="text-[11px] text-center text-slate-400 mt-2 italic font-mono">
              Figura 5: Malla física interactiva de conexiones entre inversionistas y panel de inspección.
            </p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="space-y-4 page-break">
          <h2 className="text-xl font-black text-white border-l-4 border-sky-400 pl-3 font-['Outfit']">
            6. Módulo 4: Calendario de Redes & IA Social Studio
          </h2>
          <p className="text-xs text-slate-300">
            Te permite programar noticias sobre el proyecto Santa Ana y generar textos con Inteligencia Artificial seleccionando el tono adecuado (*Professional, Casual, Inspirational*):
          </p>

          {/* Screenshot 5: Social Media */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 p-2">
            <img src="/manual_images/05_redes_sociales_ia.png" alt="Calendario Editorial y Estudio de IA" className="w-full h-auto rounded-xl" />
            <p className="text-[11px] text-center text-slate-400 mt-2 italic font-mono">
              Figura 6: Programador mensual de noticias corporativas y creador de contenidos con Inteligencia Artificial.
            </p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="space-y-4 page-break">
          <h2 className="text-xl font-black text-white border-l-4 border-sky-400 pl-3 font-['Outfit']">
            7. Módulo 5: Centro de WhatsApp y Asistente Virtual desde el Celular
          </h2>
          <p className="text-xs text-slate-300">
            Gestiona permisos de tu equipo y prueba comandos en tiempo real desde la consola integrada:
          </p>

          {/* Screenshot 6: WhatsApp Center */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-slate-900/60 p-2">
            <img src="/manual_images/06_centro_whatsapp.png" alt="Centro de WhatsApp y Simulación" className="w-full h-auto rounded-xl" />
            <p className="text-[11px] text-center text-slate-400 mt-2 italic font-mono">
              Figura 7: Centro de administración de WhatsApp, lista autorizada y consola de comandos.
            </p>
          </div>

          <div className="bg-[#84cc16]/10 border border-[#84cc16]/30 p-4 rounded-2xl space-y-1 mt-4">
            <h4 className="text-xs font-black text-[#84cc16] uppercase tracking-wider">
              📱 Tabla Resumen de Comandos de WhatsApp
            </h4>
          </div>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-xs text-left border border-white/10 rounded-2xl overflow-hidden">
              <thead className="bg-slate-800 text-white font-bold">
                <tr>
                  <th className="p-3 border-b border-white/10">Comando</th>
                  <th className="p-3 border-b border-white/10">¿Qué hace?</th>
                  <th className="p-3 border-b border-white/10">Ejemplo de Texto a Enviar por WhatsApp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-mono text-[#84cc16] font-bold">/scan</td>
                  <td className="p-3">Escáner de tarjetas (Fotos + Nota de Voz).</td>
                  <td className="p-3">Envías <code className="cmd-tag px-1.5 py-0.5 bg-slate-900 text-[#84cc16] rounded border border-white/10 font-mono">/scan</code> y sigues las indicaciones.</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-mono text-[#84cc16] font-bold">/crear (1 línea)</td>
                  <td className="p-3">Crea contacto directo separado por comas.</td>
                  <td className="p-3"><code className="cmd-tag px-1.5 py-0.5 bg-slate-900 text-[#84cc16] rounded border border-white/10 font-mono">/crear Ricardo, Gómez, ricardo@gmail.com, Family Office</code></td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-mono text-[#84cc16] font-bold">/crear (Paso a paso)</td>
                  <td className="p-3">Asistente conversacional de 5 preguntas.</td>
                  <td className="p-3">Envías <code className="cmd-tag px-1.5 py-0.5 bg-slate-900 text-[#84cc16] rounded border border-white/10 font-mono">/crear</code> solo.</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-mono text-[#84cc16] font-bold">/tipify [Nombre]</td>
                  <td className="p-3">Cambia la etapa mediante lista numerada.</td>
                  <td className="p-3"><code className="cmd-tag px-1.5 py-0.5 bg-slate-900 text-[#84cc16] rounded border border-white/10 font-mono">/tipify David</code> (luego respondes con el número ej: 3).</td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-mono text-[#84cc16] font-bold">/search [Texto]</td>
                  <td className="p-3">Busca contactos desde tu móvil.</td>
                  <td className="p-3"><code className="cmd-tag px-1.5 py-0.5 bg-slate-900 text-[#84cc16] rounded border border-white/10 font-mono">/search Sprott</code></td>
                </tr>
                <tr className="hover:bg-white/5">
                  <td className="p-3 font-mono text-[#84cc16] font-bold">/stats</td>
                  <td className="p-3">Resumen de métricas del CRM.</td>
                  <td className="p-3"><code className="cmd-tag px-1.5 py-0.5 bg-slate-900 text-[#84cc16] rounded border border-white/10 font-mono">/stats</code></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Footer */}
        <div className="pt-6 border-t border-white/10 text-center text-xs text-slate-500 font-mono">
          Outcrop Silver CRM v2.1 — Proyecto Santa Ana | Powered by i2
        </div>

      </div>
    </div>
  );
}
