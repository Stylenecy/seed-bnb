import { useState } from 'react';
import { MotionConfig } from 'framer-motion';
import { useRoute } from './lib/router';
import { getSession, isBackendMode } from './lib/backend';
import { useBackendPolling, useCerminStore } from './store';
import { Halftone } from './lib/comic';
import { BorrowFlow } from './screens/BorrowFlow';
import { Connect } from './screens/Connect';
import { Dashboard } from './screens/Dashboard';
import { Landing } from './screens/Landing';
import { Onboarding } from './screens/Onboarding';
import { Simulate } from './screens/Simulate';
import { Vault } from './screens/Vault';

const ONBOARDED_KEY = 'cermin_onboarded';

function App() {
  const [route, navigate] = useRoute();
  const { view, screen } = route;

  // Backend-polling mode (VITE_API_URL set): keep the store synced with the live
  // ledger. Gated to the app view (Task 19) — `/` is the public landing page and
  // must never poll the ledger, even for a visitor whose earlier session is
  // still in localStorage. No-op in the default standalone build either way.
  useBackendPolling(view === 'app');

  const session = useCerminStore((s) => s.session);

  // Backend mode: the "login" is the self-service connect screen (username -> a
  // provisioned party). Mock mode: the connect screen never exists — the 3-slide
  // Onboarding is the intro, exactly as before (Mode A untouched).
  const [onboarded, setOnboarded] = useState(
    () => (isBackendMode() ? !!getSession() : localStorage.getItem(ONBOARDED_KEY) === 'true'),
  );

  function completeOnboarding() {
    localStorage.setItem(ONBOARDED_KEY, 'true');
    setOnboarded(true);
    navigate('dashboard');
  }

  function completeConnect() {
    setOnboarded(true);
    navigate('dashboard');
  }

  function renderScreen() {
    // Task 19: `/` (no hash) is the public landing page — the judges' first
    // impression, and pure static content (no store/session reads). "Launch
    // app" just moves the hash to `#/app`; the existing mode-aware gating right
    // below (Connect vs. Onboarding vs. Dashboard) decides what a visitor lands
    // on next, exactly as it always has for a direct `#/app...` deep link.
    if (view === 'landing') {
      return <Landing onLaunch={() => navigate('dashboard')} />;
    }

    if (isBackendMode()) {
      // No session yet -> the connect screen is the only thing to show.
      if (!session) {
        return <Connect onConnected={completeConnect} />;
      }
    } else if (!onboarded) {
      return <Onboarding onDone={completeOnboarding} />;
    }

    switch (screen) {
      case 'borrow':
        return <BorrowFlow onNavigate={navigate} />;
      case 'vault':
        return <Vault onNavigate={navigate} />;
      case 'simulate':
        return <Simulate onNavigate={navigate} />;
      case 'onboarding':
        // In mock mode a hash of #/app/onboarding replays the intro; in backend
        // mode (already connected) fall through to the dashboard.
        return isBackendMode() ? <Dashboard onNavigate={navigate} /> : <Onboarding onDone={completeOnboarding} />;
      case 'dashboard':
      default:
        return <Dashboard onNavigate={navigate} />;
    }
  }

  // `reducedMotion="user"` makes every framer-motion animation in the app
  // (ring, status stamp, stat pops, feed) honor the OS motion preference —
  // the comic kit's own JS one-shots (CoinBurst/SavedBurst) also self-gate.
  // The app-level halftone is the one subtle comic texture every screen
  // inherits: a whisper (opacity 0.04), theme-aware (currentColor), fixed and
  // non-interactive so it never blocks a tap, and below the bottom nav (z-40).
  return (
    <MotionConfig reducedMotion="user">
      {renderScreen()}
      <Halftone className="fixed inset-0 z-[1]" opacity={0.04} dot={1} gap={14} />
    </MotionConfig>
  );
}

export default App;
