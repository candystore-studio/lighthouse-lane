/**
 * <ll-expandable-text> — Read more / Read less for a block of rich text.
 *
 * Built for the SEO copy under the collection grid, which runs long enough to
 * bury the footer on a phone but has to stay in the DOM to be worth writing.
 * Nothing is inserted, moved or removed here: the full text ships in the
 * markup and the collapse is CSS keyed off `data-expanded`, so crawlers and
 * readers with JS off see the same words, and arbitrary rich text survives
 * the treatment.
 *
 * That leaves this element two jobs: carry the flag, and drop the toggle when
 * there is nothing behind it. A collection whose description is a single
 * paragraph gets no button rather than one that opens onto nothing.
 *
 * The collapse is mobile-only and lives entirely in a media query, so there
 * is no breakpoint logic here — above 750px the CSS shows everything and
 * hides the toggle, whatever state this element is in.
 *
 * The no-JS fallback is a <noscript><style> in the section that reveals the
 * hidden blocks and removes the toggle. Without it, a reader with JS off gets
 * a lead paragraph and a dead button.
 *
 * Contract with the markup:
 *   [data-ll-expandable-body]   — the container whose children collapse
 *   [data-ll-expandable-toggle] — the button, aria-controls the body
 *   data-lead                   — blocks left visible when collapsed
 */
class LLExpandableText extends HTMLElement {
  #controller = new AbortController();
  /** @type {HTMLButtonElement | null} */
  #toggle = null;

  connectedCallback() {
    this.#toggle = this.querySelector('[data-ll-expandable-toggle]');

    // No toggle, no disclosure. The section renders without one when the
    // merchant has turned the collapse off, and the copy stands open.
    if (!this.#toggle) return;

    const body = this.#toggle
      .closest('.ll-collection-description__card')
      ?.querySelector('[data-ll-expandable-body], .ll-collection-description__body');

    const lead = Number(this.dataset.lead) || 1;

    // `children`, not `childNodes`: the collapse hides element siblings, so
    // whitespace between them is not something to count.
    if (body && body.children.length <= lead) {
      this.#toggle.remove();
      this.#toggle = null;
      return;
    }

    this.#toggle.addEventListener('click', this.#onToggle, { signal: this.#controller.signal });
  }

  disconnectedCallback() {
    this.#controller.abort();
  }

  get #expanded() {
    return this.dataset.expanded === 'true';
  }

  #onToggle = () => {
    const next = !this.#expanded;

    this.dataset.expanded = String(next);
    this.#toggle?.setAttribute('aria-expanded', String(next));

    // Collapsing pulls the page up under the reader — the row they just
    // pressed can end up above the viewport. Keep it in view.
    if (!next) this.#toggle?.scrollIntoView({ block: 'nearest' });
  };
}

if (!customElements.get('ll-expandable-text')) {
  customElements.define('ll-expandable-text', LLExpandableText);
}
