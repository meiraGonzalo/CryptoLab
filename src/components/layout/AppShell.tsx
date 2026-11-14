import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { useUiStore } from '@/stores/uiStore';
import { Brand, SidebarNavigation } from './Sidebar';

export function AppShell({ children }: { children: ReactNode }) {
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMobileNavOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mobileNavOpen, setMobileNavOpen]);

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ink-700 focus:px-4 focus:py-2">
        Saltar al contenido
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/[0.06] bg-ink-900/95 lg:flex">
        <div className="px-5 pb-4 pt-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <SidebarNavigation />
        </div>
        <div className="border-t border-white/[0.06] px-5 py-3 text-xs leading-relaxed text-slate-500">
          Herramienta educativa. No la uses para proteger información real.
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/[0.06] bg-ink-900/90 px-4 py-3 backdrop-blur lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-300 hover:bg-white/[0.06]"
          aria-label="Abrir menú de navegación"
        >
          <Menu size={22} />
        </button>
      </header>

      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-xs flex-col border-r border-white/10 bg-ink-900 lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              role="dialog"
              aria-modal="true"
              aria-label="Navegación"
            >
              <div className="flex items-center justify-between px-5 pb-4 pt-5">
                <Brand />
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06]"
                  aria-label="Cerrar menú"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 pb-6">
                <SidebarNavigation />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main id="main" className="lg:pl-72">
        <div className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pt-8">{children}</div>
      </main>
    </div>
  );
}
