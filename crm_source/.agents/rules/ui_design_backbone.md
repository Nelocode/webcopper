# Outcrop Silver CRM v2.1 — Reglas Estrictas de Diseño UI/UX & Coherencia Visual

Estas reglas son la **columna vertebral del diseño y la experiencia de usuario** de Outcrop Silver CRM. Todos los componentes y futuras funcionalidades deben cumplir con cada uno de estos cinco pilares de forma estricta:

---

## 1. Referente (Benchmark Estético & Calidad de Clase Mundial)
- Toda la interfaz debe inspirarse en paneles ejecutivos y plataformas fintech/mining de nivel mundial (como Linear, Vercel, Stripe).
- **Prohibido**: Diseños genéricos tipo MVP básico, bordes blancos planos o componentes sin estilo corporativo.

---

## 2. Ejemplo (Fidelidad de Interacción & Cero Placeholders)
- Los flujos y vistas se construyen resolviendo la "esencia" práctica del usuario.
- **Prohibido**: Textos dummy de relleno (`Lorem Ipsum`, `Jane Doe`), datos estáticos hardcodeados, o botones deshabilitados sin acción real.

---

## 3. Key Visual (Identidad de Marca Maestra & Logo Inalterable)
- El isotipo y logotipo oficial de Outcrop Silver (`/logo.png`) **NUNCA debe ser alterado en vector, tipografía ni proporción**.
- Debe renderizarse de forma nítida en blanco mediante filtro CSS `brightness-0 invert`.
- El Key Visual incluye el emblema 3D, el arco circular envolvente y el contraste metálico/neón.

---

## 4. UI (Sistema de Diseño Dinámico & Variables CSS)
- Todos los componentes (`ContactModal.tsx`, `Contact360View.tsx`, `ContactGraphView.tsx`, `KanbanPipeline.tsx`, `Sidebar.tsx`, `Navbar.tsx`) **DEBEN consumir exclusivamente `var(--primary-color)` y `var(--secondary-color)`**.
- Al cambiar el color desde el personalizador de branding, **el 100% de la interfaz (botones, badges, bordes, avatares, modales) DEBE cambiar en tiempo real de forma síncrona**.

---

## 5. Técnicas Gráficas (Acabados Premium & Fluidez)
- **Glassmorphism**: Efectos de transparencia cristalina con desenfoque de fondo (`backdrop-blur-md`).
- **Canvas Physics 2D**: Grafos dinámicos e interactivos con simulaciones vectoriales de fuerzas (repulsión Coulomb + resortes Hooke).
- **Micro-Animaciones**: Transiciones de hover a 200ms-300ms, auras de luz palpitantes (`animate-pulse`) y elevación de capas.
- **Jerarquía Tipográfica**: Fuente principal *Urbanist*, con grosores extremos (`font-black`) para títulos y fuente *Mono* (`font-mono`) para identificadores y puntuaciones.
