import { MotionConfig } from 'framer-motion';
import { lazy, Suspense, useEffect, type ComponentType, type LazyExoticComponent } from 'react';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import type { RouteId } from './components/navigation/routes';
import { useNavigationStore } from './stores/navigationStore';

const HomePage = lazy(() => import('./pages/HomePage'));
const AesPage = lazy(() => import('./modules/aes/components/AesPage'));
const RsaOverviewPage = lazy(() => import('./modules/rsa/components/RsaOverviewPage'));
const RsaKeygenPage = lazy(() => import('./modules/rsa/components/RsaKeygenPage'));
const RsaEncryptPage = lazy(() => import('./modules/rsa/components/RsaEncryptPage'));
const RsaDecryptPage = lazy(() => import('./modules/rsa/components/RsaDecryptPage'));
const ShaPage = lazy(() => import('./modules/sha/components/ShaPage'));
const HashComparePage = lazy(() => import('./modules/sha/components/HashComparePage'));
const AvalanchePage = lazy(() => import('./modules/sha/components/AvalanchePage'));
const TextHexTool = lazy(() => import('./pages/tools/TextHexTool'));
const HexBinaryTool = lazy(() => import('./pages/tools/HexBinaryTool'));
const ByteViewerTool = lazy(() => import('./pages/tools/ByteViewerTool'));
const KeyGeneratorTool = lazy(() => import('./pages/tools/KeyGeneratorTool'));
const RandomNumberTool = lazy(() => import('./pages/tools/RandomNumberTool'));
const CompareTool = lazy(() => import('./pages/tools/CompareTool'));

type Page = LazyExoticComponent<ComponentType<{ route: RouteId }>>;

const PAGES: Record<RouteId, Page> = {
  home: HomePage,
  'aes-128': AesPage,
  'aes-192': AesPage,
  'aes-256': AesPage,
  rsa: RsaOverviewPage,
  'rsa-keygen': RsaKeygenPage,
  'rsa-encrypt': RsaEncryptPage,
  'rsa-decrypt': RsaDecryptPage,
  'sha-256': ShaPage,
  'sha-512': ShaPage,
  'hash-compare': HashComparePage,
  avalanche: AvalanchePage,
  'tool-text-hex': TextHexTool,
  'tool-hex-binary': HexBinaryTool,
  'tool-bytes': ByteViewerTool,
  'tool-keygen': KeyGeneratorTool,
  'tool-random': RandomNumberTool,
  'tool-compare': CompareTool,
};

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent-brand" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

export function App() {
  const route = useNavigationStore((s) => s.route);
  const syncFromLocation = useNavigationStore((s) => s.syncFromLocation);

  useEffect(() => {
    window.addEventListener('hashchange', syncFromLocation);
    return () => window.removeEventListener('hashchange', syncFromLocation);
  }, [syncFromLocation]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  const Page = PAGES[route];

  return (
    <MotionConfig reducedMotion="user">
      <AppShell>
        <ErrorBoundary resetKey={route}>
          <Suspense fallback={<PageFallback />}>
            <Page route={route} />
          </Suspense>
        </ErrorBoundary>
      </AppShell>
    </MotionConfig>
  );
}
