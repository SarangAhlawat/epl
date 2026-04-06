import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useState } from "react";

function DashboardLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (

    <div className="flex min-h-screen bg-slate-50">

      <Sidebar className="hidden md:block" />

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
          <Sidebar className="relative z-10 h-full" onNavigate={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <div className="flex-1">

        <Topbar showMenuButton onMenuToggle={() => setMobileMenuOpen(true)} />

        <div className="p-4 sm:p-6 md:p-8">

          <div className="max-w-7xl mx-auto">

            {children}

          </div>

        </div>

      </div>

    </div>

  );

}

export default DashboardLayout;