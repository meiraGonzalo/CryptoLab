import { motion } from 'framer-motion';
import { ShieldHalf } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useUiStore } from '@/stores/uiStore';
import { cn } from '@/utils/cn';
import { NAVIGATION, type RouteId } from '../navigation/routes';

export function Brand() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-accent-brand/30 bg-accent-brand/10 text-accent-brand">
        <ShieldHalf size={20} />
      </span>
      <div className="leading-tight">
        <p className="text-[17px] font-semibold tracking-tight text-white">CriptoLab</p>
        <p className="text-xs text-slate-500">Laboratorio visual de criptografía</p>
      </div>
    </div>
  );
}

export function SidebarNavigation() {
  const route = useNavigationStore((s) => s.route);
  const navigate = useNavigationStore((s) => s.navigate);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  const go = (id: RouteId) => {
    navigate(id);
    setMobileNavOpen(false);
  };

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-6">
      {NAVIGATION.map((section) => (
        <div key={section.title}>
          <p className="label-caps mb-2 px-3">{section.title}</p>
          <ul className="flex flex-col gap-0.5">
            {section.routes.map((item) => {
              const active = item.id === route;
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <a
                    href={`#/${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      go(item.id);
                    }}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition-colors',
                      active ? 'text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100',
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg border border-accent-brand/25 bg-accent-brand/10"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                    <Icon size={17} className={cn('relative shrink-0', active ? 'text-accent-brand' : 'text-slate-500')} />
                    <span className="relative truncate">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
