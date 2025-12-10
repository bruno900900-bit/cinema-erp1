import { useEffect } from 'react';

// Hook simples para mitigar casos onde aria-hidden é aplicado erroneamente ao root
export function useFixAriaHidden(rootSelector: string = '#root') {
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return;

    // Aplica inert até a primeira interação para evitar foco em áreas escondidas
    if (typeof (root as any).inert !== 'undefined') {
      (root as any).inert = false;
    }

    const fix = () => {
      if (root.getAttribute('aria-hidden') === 'true') {
        root.removeAttribute('aria-hidden');
      }
    };

    const observer = new MutationObserver(fix);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['aria-hidden'],
    });
    fix();
    return () => observer.disconnect();
  }, [rootSelector]);
}
