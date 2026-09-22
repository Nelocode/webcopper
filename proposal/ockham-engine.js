// Ockham Engine - Zero-Reflow DOM Orchestrator
// Modifies CSS order and display to manipulate modular views instantly

class OckhamEngine {
    constructor(containerId = 'ockham-orchestrator') {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`OckhamEngine: Container #${containerId} not found.`);
            return;
        }
        this.modules = Array.from(this.container.children).filter(el => el.hasAttribute('data-ockham-id'));
        
        // [#18] Prefers Reduced Motion
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Anti-CLS: Ocultar contenedor suavemente en el primer frame
        this.container.style.opacity = '0';
        if (!this.prefersReducedMotion) {
            this.container.style.transition = 'opacity 0.4s ease-in-out';
        }

        // [#19] ARIA Live Region para Accesibilidad
        this.setupAriaLive();
    }

    setupAriaLive() {
        this.ariaLiveElement = document.createElement('div');
        this.ariaLiveElement.setAttribute('aria-live', 'polite');
        this.ariaLiveElement.setAttribute('aria-atomic', 'true');
        this.ariaLiveElement.style.position = 'absolute';
        this.ariaLiveElement.style.width = '1px';
        this.ariaLiveElement.style.height = '1px';
        this.ariaLiveElement.style.padding = '0';
        this.ariaLiveElement.style.margin = '-1px';
        this.ariaLiveElement.style.overflow = 'hidden';
        this.ariaLiveElement.style.clip = 'rect(0, 0, 0, 0)';
        this.ariaLiveElement.style.whiteSpace = 'nowrap';
        this.ariaLiveElement.style.border = '0';
        document.body.appendChild(this.ariaLiveElement);
    }

    announce(message) {
        if (this.ariaLiveElement) {
            this.ariaLiveElement.textContent = message;
        }
    }

    /**
     * Resets all modules to default state to avoid layout collapse
     */
    resetState() {
        this.modules.forEach((mod, index) => {
            if (mod.getAttribute('data-ockham-id') === 'modulo_hero') {
                mod.style.order = 0; // Hero siempre al inicio
            } else {
                mod.style.order = index + 10; // Default order
            }
            mod.style.display = ''; // Reset display
            mod.style.width = '100%'; // Prevent flex item collapse
        });
    }

    /**
     * Revela el contenedor suavemente (Fade-in)
     */
    reveal() {
        if (this.container) {
            this.container.style.opacity = '1';
        }
    }

    /**
     * Realiza un intercambio suave de multimedia (crossfade)
     * @param {HTMLElement} element - El elemento de video o imagen
     * @param {string} newSrc - La nueva ruta del archivo
     */
    swapMediaSmooth(element, newSrc) {
        // Evitamos recargar si ya es el mismo source
        if (element.src.endsWith(newSrc) || element.getAttribute('src') === newSrc) return;

        const duration = this.prefersReducedMotion ? 0 : 300;

        if (!this.prefersReducedMotion) {
            element.style.transition = 'opacity 0.3s ease-in-out';
            element.style.opacity = '0';
        }

        setTimeout(() => {
            if (element.tagName.toLowerCase() === 'video') {
                const sourceEl = element.querySelector('source');
                if (sourceEl) {
                    sourceEl.src = newSrc;
                } else {
                    element.src = newSrc;
                }
                element.load();
                const playPromise = element.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => console.warn('[Ockham Engine] Autoplay prevented', e));
                }
            } else if (element.tagName.toLowerCase() === 'img') {
                element.src = newSrc;
            }
            
            if (!this.prefersReducedMotion) {
                element.style.opacity = '1';
            }
        }, duration);
    }

    /**
     * Consumes JSON commands and mutates styles without reflows
     * @param {Object} jsonCommand - JSON payload from Gemini API
     */
    execute(jsonCommand) {
        // Remover shimmer skeletons
        document.querySelectorAll('.ockham-shimmer').forEach(el => el.classList.remove('ockham-shimmer'));

        if (!jsonCommand || !jsonCommand.acciones_dom || jsonCommand.perfil_visitante === 'fallback_local') {
            this.reveal();
            return;
        }
        
        console.log(`[Ockham Engine] Executing for profile: ${jsonCommand.perfil_visitante}`);
        sessionStorage.setItem("ockham_perfil_visitante", jsonCommand.perfil_visitante);
        
        this.resetState();

        // 1. Acciones DOM (Reordenamiento)
        this.modules.forEach(mod => mod.classList.remove('ockham-mutated-first-module')); // Limpiar estado previo

        jsonCommand.acciones_dom.forEach(actionObj => {
            const modId = actionObj.id_modulo;
            const action = actionObj.accion;
            
            // Regla de Arquitectura: El Hero JAMÁS se reordena ni oculta
            if (modId === 'modulo_hero') return;

            const targetModule = this.modules.find(el => el.getAttribute('data-ockham-id') === modId);
            
            if (!targetModule) return;

            if (action === 'elevar' && actionObj.prioridad !== undefined) {
                targetModule.style.order = actionObj.prioridad;
            } else if (action === 'ocultar') {
                targetModule.style.display = 'none';
            }
        });

        // 1.5. Prevenir Overlap del Header
        let firstModule = null;
        let lowestOrder = 9999;
        this.modules.forEach(mod => {
            if (mod.style.display !== 'none') {
                let order = parseInt(mod.style.order) || 9999;
                if (order < lowestOrder) {
                    lowestOrder = order;
                    firstModule = mod;
                }
            }
        });

        // Si el primer módulo a mostrar no es el hero, le damos margen top para que no se pise con el header fijo
        if (firstModule && firstModule.getAttribute('data-ockham-id') !== 'modulo_hero') {
            firstModule.classList.add('ockham-mutated-first-module');
        }

        // 2. Mutaciones de Contenido Multimedia
        if (jsonCommand.mutaciones_contenido && Array.isArray(jsonCommand.mutaciones_contenido)) {
            jsonCommand.mutaciones_contenido.forEach(mutacion => {
                const targetElement = document.getElementById(mutacion.target_id);
                if (!targetElement) return;

                if (mutacion.accion === 'swap_media' && mutacion.nuevo_src) {
                    this.swapMediaSmooth(targetElement, mutacion.nuevo_src);
                }
            });
        }

        // 3. Mutaciones de Texto
        if (jsonCommand.mutaciones_texto && Array.isArray(jsonCommand.mutaciones_texto)) {
            jsonCommand.mutaciones_texto.forEach(mutacion => {
                const targetElement = document.getElementById(mutacion.target_id);
                if (!targetElement) return;

                const duration = this.prefersReducedMotion ? 0 : 200;
                if (!this.prefersReducedMotion) {
                    targetElement.style.transition = 'opacity 0.2s ease-in-out';
                    targetElement.style.opacity = '0';
                }
                
                setTimeout(() => {
                    targetElement.innerText = mutacion.texto;
                    if (!this.prefersReducedMotion) targetElement.style.opacity = '1';
                }, duration);
            });
        }

        this.announce("Interfaz adaptada a tu perfil de navegación.");

        // Anti-CLS: Revelamos el DOM sólo después de que los estilos se han recalculado
        requestAnimationFrame(() => {
            this.reveal();
        });
    }
}

// Engine Initialization
document.addEventListener('DOMContentLoaded', () => {
    const engine = new OckhamEngine();
    
    // Set base state immediately
    engine.resetState();
    
    // Expose engine to global window so telemetry can use it
    window.ockhamEngine = engine;
});
