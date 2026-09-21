import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

/**
 * Layout — shared application shell.
 *
 * Renders a sticky TopBar + a responsive Sidebar (drawer on mobile,
 * persistent column on desktop) around page content.
 */
export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* TopBar is always visible; sidebar toggle is hidden on desktop */}
      <TopBar onMenuToggle={() => setSidebarOpen(true)} isOpen={sidebarOpen} />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar (desktop: fixed width, mobile: slide-in drawer) */}
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content area */}
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
