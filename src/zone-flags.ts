/**
 * Zone.js flags. (Intentionally empty.)
 *
 * Do NOT set `__Zone_disable_customElements = true` here: Ionic is built on
 * Web Components and `ion-router-outlet` completes its page transition inside a
 * custom-element callback. Disabling that patch makes the callback run outside
 * Angular's zone, so change detection never fires and the entering page stays
 * stuck with `ion-page-invisible` (opacity: 0) — i.e. a black screen on
 * in-app navigation that only "fixes itself" on a full refresh.
 */
export {};
