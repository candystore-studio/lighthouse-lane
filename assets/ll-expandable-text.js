/**
 * <ll-expandable-text> — clamp a block of prose to N lines behind a toggle.
 *
 * Built for the SEO copy under the product grid, which runs long enough to
 * push the footer out of reach but has to stay in the DOM to be worth
 * writing. Nothing is inserted or removed here: the full text ships in the
 * markup and this element only changes how much of it is visible, so crawlers
 * and readers with JS off see the same words.
 *
 * The clamp lives in CSS and is on by default, so there is no flash of the
 * full block before the script upgrades. The toggle is the opposite — it
 * ships `hidden` and is only revealed once we have measured an actual
 * overflow. A collection with two sentences therefore gets no button, which
 * is why the measurement runs again on resize and after webfonts land (Bevan
 * and Karla both reflow the block on swap).
 *
 * The no-JS fallback is a <noscript><style> in the section that drops the
 * clamp. Without it, a reader with JS off would get truncated copy and no way
 * to open it.
 *
 * Contract with the markup:
 *   [data-ll-expandable-body]   — the clamped container
 *   [data-ll-expandable-toggle] — the button, aria-controls the body
 *   data-lines                  — line count, mirrored to a CSS custom property
 */
class LLExpandableText extends HTMLElement {
  #controller = new AbortController();
  #resizeObserver = null;
  /** @type {HTMLElement | null} */
  #body = null;
  /** @type {HTMLButtonElement | null} */
  #toggle = null;

  connectedCallback() {
    this.#body = this.querySelector('[data-ll-expandable-body]');
    this.#toggle = this.querySelector('[data-ll-expandable-toggle]');

    // No pair, no disclosure — leave the block as authored rather than
    // half-wiring a control that cannot open anything.
    if (!this.#body || !this.#toggle) return;

    const { signal } = this.#controller;
    this.#toggle.addEventListener('click', this.#onToggle, { signal });

    this.#resizeObserver = new ResizeObserver(this.#measure);
    this.#resizeObserver.observe(this.#body);

    // Measuring before the webfonts swap reads the fallback metrics, which
    // are a different height. Re-measure once the real faces are in.
    document.fonts?.ready.then(this.#measure);

    this.#measure();
  }

  disconnectedCallback() {
    this.#controller.abort();
    this.#resizeObserver?.disconnect();
  }

  get #expanded() {
    return this.dataset.expanded === 'true';
  }

  /**
   * Overflow can only be read while the clamp is applied, so an expanded
   * block keeps whatever answer it had when it was last collapsed. Closing it
   * re-measures.
   */
  #measure = () => {
    if (!this.#body || !this.#toggle || this.#expanded) return;

    const overflowing = this.#body.scrollHeight > this.#body.clientHeight + 1;

    this.dataset.overflowing = String(overflowing);
    this.#toggle.hidden = !overflowing;
  };

  #onToggle = () => {
    const next = !this.#expanded;

    this.dataset.expanded = String(next);
    this.#toggle?.setAttribute('aria-expanded', String(next));

    if (next) return;

    // Collapsing pulls the page up under the reader. Keep the control they
    // just pressed in view, then re-measure at the new height.
    this.#toggle?.scrollIntoView({ block: 'nearest' });
    this.#measure();
  };
}

if (!customElements.get('ll-expandable-text')) {
  customElements.define('ll-expandable-text', LLExpandableText);
}
