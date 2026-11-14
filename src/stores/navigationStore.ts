import { create } from 'zustand';
import { isRouteId, type RouteId } from '@/components/navigation/routes';

function readHash(): RouteId {
  const value = window.location.hash.replace(/^#\/?/, '');
  return isRouteId(value) ? value : 'home';
}

interface NavigationState {
  route: RouteId;
  navigate: (route: RouteId) => void;
  syncFromLocation: () => void;
}

/**
 * Navegación basada en el fragmento de la URL (#/ruta). Permite usar los botones
 * de atrás y adelante del navegador y compartir enlaces a cada simulador.
 */
export const useNavigationStore = create<NavigationState>()((set, get) => ({
  route: typeof window === 'undefined' ? 'home' : readHash(),
  navigate: (route) => {
    if (route === get().route) return;
    window.location.hash = `/${route}`;
    set({ route });
  },
  syncFromLocation: () => set({ route: readHash() }),
}));

export function useNavigate() {
  return useNavigationStore((s) => s.navigate);
}
