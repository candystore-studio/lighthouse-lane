/**
 * <ll-shop-cards> — mobile disclosure for the shop luggage labels.
 *
 * The design keeps the photo above the name row, which rules out <details>
 * (its content must follow the summary). So the card markup stays in design
 * order and this element drives an ARIA disclosure over it instead.
 *
 * Behaviour by breakpoint:
 *   mobile  — one card open at a time; the rest collapse to the compact row
 *   desktop — every card open, toggles removed from the tab order
 *
 * Without JS nothing is hidden: cards render fully expanded, which is the
 * desktop design and an acceptable mobile fallback.
 *
 * Configuration comes in through data attributes only:
 *   data-mobile-breakpoint — max-width in px for the collapsed layout
 *   data-default-open      — on each card, whether it starts open on mobile
 */
class LLShopCards extends HTMLElement {
  #mediaQuery = null;
  #controller = new AbortController();

  connectedCallback() {
    const breakpoint = Number(this.dataset.mobileBreakpoint) || 749;
    this.#mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);

    const { signal } = this.#controller;
    this.#mediaQuery.addEventListener('change', this.#applyBreakpoint, { signal });
    this.addEventListener('click', this.#onClick, { signal });

    this.#applyBreakpoint();
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  /** @returns {HTMLElement[]} */
  get #cards() {
    return Array.from(this.querySelectorAll('.ll-shop-card'));
  }

  #applyBreakpoint = () => {
    const isMobile = this.#mediaQuery.matches;

    for (const card of this.#cards) {
      // On desktop every card is open and its toggle is inert; on mobile the
      // authored default decides, so rotating the device restores the design.
      const open = isMobile ? card.dataset.defaultOpen === 'true' : true;
      this.#setOpen(card, open);

      const toggle = card.querySelector('.ll-shop-card__toggle');
      if (toggle instanceof HTMLButtonElement) toggle.disabled = !isMobile;
    }
  };

  #onClick = (event) => {
    if (!this.#mediaQuery.matches) return;

    const toggle = event.target instanceof Element ? event.target.closest('.ll-shop-card__toggle') : null;
    if (!toggle) return;

    const card = toggle.closest('.ll-shop-card');
    if (!card) return;

    const willOpen = card.dataset.open !== 'true';

    // Exclusive: opening one closes the rest.
    if (willOpen) {
      for (const sibling of this.#cards) {
        if (sibling !== card) this.#setOpen(sibling, false);
      }
    }

    this.#setOpen(card, willOpen);
  };

  /**
   * @param {HTMLElement} card
   * @param {boolean} open
   */
  #setOpen(card, open) {
    card.dataset.open = String(open);
    card.querySelector('.ll-shop-card__toggle')?.setAttribute('aria-expanded', String(open));
  }
}

if (!customElements.get('ll-shop-cards')) {
  customElements.define('ll-shop-cards', LLShopCards);
}
