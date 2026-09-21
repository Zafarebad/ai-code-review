'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--color-surface-0)] relative">
      {/* ── Desktop Sidebar ─────────────────────────────────────────────────── */}
      <div className="hidden lg:flex h-full shrink-0">
        <Sidebar />
      </div>

      {/* ── Mobile Sidebar Overlay ──────────────────────────────────────────── */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 flex lg:hidden">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </>
      )}

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        {/* Pass the menu toggle down through context/prop drilling is acceptable
            at this scale — children receive it via the Header component */}
        <main className="flex-1 overflow-y-auto min-h-0 relative">
          {/* Inject the mobile toggle into the page via a slot pattern.
              Children are responsible for rendering <Header onMenuClick={...} />.
              We expose the setter via a data attribute trick-free approach:
              pass it as a context value. */}
          <MobileMenuContext.Provider value={() => setSidebarOpen(true)}>
            {children}
          </MobileMenuContext.Provider>
        </main>
      </div>
    </div>
  );
}

// ── Mobile menu context ────────────────────────────────────────────────────────
import { createContext, useContext } from 'react';

const MobileMenuContext = createContext<() => void>(() => {});

export function useMobileMenu() {
  return useContext(MobileMenuContext);
}
