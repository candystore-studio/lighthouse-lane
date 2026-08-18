/**
 * <ll-review-postcards> — the postcard board's carousel brain.
 *
 * Progressive enhancement over a scroll-snap track: without JS the cards
 * are still a scrollable row; with it the arrows page, the dots track the
 * card in view, and everything hides itself when there's nothing to scroll.
 *
 * Configuration comes in through data attributes only:
 *   data-label — accessible name for the scroll region (set from Liquid).
 *
 * Internal wiring uses data-ref, deliberately not Horizon's `ref`
 * attribute, so this never collides with the theme's component framework.
 */
class LLReviewPostcards extends HTMLElement {
  #track = null;
  #prev = null;
  #next = null;
  #dots = null;
  #resizeObserver = null;
  #scrollRaf = 0;

  connectedCallback() {
    this.#track = this.querySelector('[data-ref="track"]');
    this.#prev = this.querySelector('[data-ref="prev"]');
    this.#next = this.querySelector('[data-ref="next"]');
    this.#dots = this.querySelector('[data-ref="dots"]');

    if (!this.#track) return;

    this.#track.setAttribute('role', 'region');
    this.#track.setAttribute('aria-label', this.dataset.label || 'Customer reviews');
    this.#track.setAttribute('tabindex', '0');

    this.#prev?.addEventListener('click', () => this.#page(-1));
    this.#next?.addEventListener('click', () => this.#page(1));
    this.#track.addEventListener('scroll', this.#onScroll, { passive: true });

    this.#resizeObserver = new ResizeObserver(() => this.#sync());
    this.#resizeObserver.observe(this.#track);

    this.#sync();
  }

  disconnectedCallback() {
    this.#resizeObserver?.disconnect();
    cancelAnimationFrame(this.#scrollRaf);
  }

  get #reducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  get #pageCount() {
    return Math.max(1, Math.ceil(this.#track.scrollWidth / this.#track.clientWidth));
  }

  get #pageIndex() {
    return Math.round(this.#track.scrollLeft / this.#track.clientWidth);
  }

  #page(direction) {
    this.#track.scrollBy({
      left: direction * this.#track.clientWidth,
      behavior: this.#reducedMotion ? 'auto' : 'smooth',
    });
  }

  #onScroll = () => {
    cancelAnimationFrame(this.#scrollRaf);
    this.#scrollRaf = requestAnimationFrame(() => this.#update());
  };

  /** Rebuild the dots and recompute overflow — cheap enough to run on resize. */
  #sync() {
    const overflows = this.#track.scrollWidth > this.#track.clientWidth + 1;
    this.dataset.overflow = String(overflows);

    if (this.#dots) {
      this.#dots.replaceChildren(
        ...Array.from({ length: overflows ? this.#pageCount : 0 }, (_, index) => {
          const dot = document.createElement('button');
          dot.type = 'button';
          dot.className = 'll-postcards__dot';
          dot.setAttribute('aria-label', `Go to review ${index + 1}`);
          dot.addEventListener('click', () => {
            this.#track.scrollTo({
              left: index * this.#track.clientWidth,
              behavior: this.#reducedMotion ? 'auto' : 'smooth',
            });
          });
          return dot;
        })
      );
    }

    this.#update();
  }

  /** Arrow disabled states + active dot follow the scroll position. */
  #update() {
    const { scrollLeft, scrollWidth, clientWidth } = this.#track;
    const end = scrollWidth - clientWidth - 1;

    if (this.#prev) this.#prev.disabled = scrollLeft <= 0;
    if (this.#next) this.#next.disabled = scrollLeft >= end;

    this.#dots
      ?.querySelectorAll('.ll-postcards__dot')
      .forEach((dot, index) => dot.toggleAttribute('data-active', index === this.#pageIndex));
  }
}

if (!customElements.get('ll-review-postcards')) {
  customElements.define('ll-review-postcards', LLReviewPostcards);
}
