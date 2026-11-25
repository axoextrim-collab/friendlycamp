/** Keep Tab inside the active modal, including browsers that otherwise move to browser chrome. */
export function installDialogKeyboardNavigation(doc: Document = document) {
  const handle = (event: KeyboardEvent) => {
    if (event.key !== 'Tab' || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
    const active = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    const dialogs = [...doc.querySelectorAll<HTMLDialogElement>('dialog[open]')];
    const dialog = active?.closest<HTMLDialogElement>('dialog[open]') || dialogs.at(-1);
    if (!dialog) return;
    const visible = (element: HTMLElement) => (!element.checkVisibility || element.checkVisibility()) && element.getClientRects().length > 0 && !element.closest('[hidden],[inert],[aria-hidden="true"]');
    const candidates = [...dialog.querySelectorAll<HTMLElement>('button,a[href],input:not([type="hidden"]),select,textarea,summary,video[controls],audio[controls],iframe,[contenteditable="true"],[tabindex]')].filter(element => element.tabIndex >= 0 && !element.matches(':disabled') && visible(element));
    const stops = candidates.filter(element => {
      if (!(element instanceof HTMLInputElement) || element.type !== 'radio' || !element.name) return true;
      const group = candidates.filter((item): item is HTMLInputElement => item instanceof HTMLInputElement && item.type === 'radio' && item.name === element.name && item.form === element.form);
      return element === (group.find(item => item.checked) || (event.shiftKey ? group.at(-1) : group[0]));
    });
    if (!stops.length) { event.preventDefault(); dialog.focus({ preventScroll: true }); return; }
    const first = stops[0], last = stops.at(-1)!;
    if (!active || active === dialog || !dialog.contains(active) || (event.shiftKey && active === first) || (!event.shiftKey && active === last)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    }
  };
  doc.addEventListener('keydown', handle, true);
  return () => doc.removeEventListener('keydown', handle, true);
}
