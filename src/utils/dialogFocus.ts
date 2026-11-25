export function restoreDialogFocus(previous: HTMLElement | null, fallbackSelector?: string) {
  queueMicrotask(() => {
    const target = previous?.isConnected ? previous : fallbackSelector ? document.querySelector<HTMLElement>(fallbackSelector) : null;
    const modal = [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1);
    if (!target || (modal && !modal.contains(target)) || target.matches(':disabled') || (target.checkVisibility && !target.checkVisibility())) return;
    target.focus({ preventScroll: true });
  });
}
