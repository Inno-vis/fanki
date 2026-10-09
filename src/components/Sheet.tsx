import type { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

/**
 * Bottom sheet (Hulp, rating help). On open the title gets focus; Tab stays inside the sheet; Escape or a tap on
 * the backdrop closes it, and focus goes back to the element that opened it. The footer (the close button) is
 * sticky, so it is always visible while the content scrolls.
 */
export function Sheet({ title, onClose, footer, children }: { title: string; onClose: () => void; footer: ComponentChildren; children: ComponentChildren }) {
  const sheet = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    heading.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !sheet.current) return;
      const focusable = [...sheet.current.querySelectorAll<HTMLElement>('button, summary, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, []);

  return (
    <div class="sheet-backdrop" onClick={onClose}>
      <div class="sheet" ref={sheet} role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="sheet-title" tabIndex={-1} ref={heading}>
          {title}
        </h2>
        <div class="sheet-body">{children}</div>
        <div class="sheet-footer">{footer}</div>
      </div>
    </div>
  );
}
