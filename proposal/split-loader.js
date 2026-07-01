/**
 * Split Cards Loader — loads split-section card data from site.json
 * Sets background images and button links dynamically.
 * Cards are identified by data-card attribute matching the JSON id field.
 * 
 * The HTML keeps the title/subtitle hardcoded as fallback text;
 * images come from JSON as inline background-image on the card's ::before,
 * and buttons navigate to the link_href specified in JSON.
 */
(function() {
    fetch('data/site.json')
        .then(res => res.json())
        .then(data => {
            const cards = data.split_cards || [];
            cards.forEach(card => {
                const el = document.querySelector(`[data-card="${card.id}"]`);
                if (!el) return;

                // Set background image inline on the element
                if (card.image) {
                    el.style.setProperty('--card-bg', `url('${card.image}')`);
                    // Apply via style — CSS uses var(--card-bg) or falls back
                }

                // Wire up the button
                const btn = el.querySelector('.btn-card-action');
                if (btn && card.link_type !== 'modal') {
                    btn.onclick = function() {
                        if (card.link_href) {
                            window.location.href = card.link_href;
                        }
                    };
                }
            });
        })
        .catch(e => console.warn('Split cards loader: could not load site.json'));
})();
