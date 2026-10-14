import React, { useState, useEffect } from 'react';

interface NavbarProps {
  onLaunchConsole: () => void;
  onOpenSignIn: () => void;
  activeSection: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onLaunchConsole,
  onOpenSignIn,
  activeSection,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home', key: 'home' },
    { name: 'Product', href: '#workbench-preview', key: 'product' },
    { name: 'Architecture', href: '#architecture', key: 'architecture' },
    { name: 'Benchmark', href: '#benchmark', key: 'benchmark' },
    { name: 'Pricing', href: '#pricing', key: 'pricing' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 pt-4 px-4 sm:px-6 lg:px-8 pointer-events-none">
      <div
        className={`pointer-events-auto max-w-7xl mx-auto h-16 px-6 rounded-full transition-all duration-300 flex items-center justify-between gap-4 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-lg border border-slate-200/90'
            : 'bg-white/90 backdrop-blur-xl shadow-sm border border-slate-200/80'
        }`}
      >
        {/* Brand Zone */}
        <a href="#home" className="flex items-center gap-2 group">
          <img
            alt="Liora Logo"
            className="w-8 h-8 rounded-lg object-contain shadow-xs transition-transform group-hover:scale-105"
            src="https://lh3.googleusercontent.com/aida/AEtjO1V4SGvZTYEzo2QDIhAvvdw2XilZab8aI6Y91AATdr-rgPiU_HET8SknpZi2FG-eJuAJ3WKNF_qjxIxJc8BMHOyWwc6w7rxAqqvOkrRi_TNJ97n_SFoDWukVFwfErdRd2ppSHy-6EVgenVKn3ondmOlHIdrbJvbHrspwt3dbyqVyxIjklwblq-FVSI_7TC04keN_guuse6pw2yKtQn4-51-hRJttR-h1V7jDVEcgse5P76LRjxItlAIi-Kc"
            onError={(e) => {
              // Graceful SVG fallback if network asset delays
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.logo-fallback')) {
                const fallback = document.createElement('div');
                fallback.className = 'w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm logo-fallback';
                fallback.innerText = 'L';
                parent.prepend(fallback);
              }
            }}
          />
          <span className="font-bold text-xl tracking-tight text-[#0b1c30]">
            Liora
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#e5eeff] text-[#434655] text-[11px] font-semibold tracking-wide border border-[#c3c6d7]/30">
            v4.5
          </span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-[14px]">
          {navLinks.map((link) => {
            const isActive = activeSection === link.key;
            return (
              <a
                key={link.name}
                href={link.href}
                className={`transition-colors whitespace-nowrap font-medium ${
                  isActive
                    ? 'text-[#0b1c30] font-semibold'
                    : 'text-[#434655] hover:text-[#0b1c30]'
                }`}
              >
                {link.name}
              </a>
            );
          })}
        </nav>

        {/* Right CTA & Profile Zone */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSignIn}
            className="hidden sm:inline-flex text-[14px] text-[#434655] hover:text-[#0b1c30] transition-colors font-medium px-3 py-1.5 rounded-full hover:bg-slate-100"
          >
            Sign In
          </button>
          <button
            onClick={onLaunchConsole}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#2563eb] text-[#eeefff] hover:bg-[#1d4ed8] hover:text-white font-medium text-[14px] shadow-md border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Launch Console</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
          <button
            onClick={onOpenSignIn}
            className="w-8 h-8 rounded-full bg-[#e5eeff] border border-[#c3c6d7]/40 flex items-center justify-center shrink-0 text-[#0b1c30] hover:bg-blue-100 transition-colors"
            title="Account & Operator Profile"
            aria-label="User account"
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
          </button>

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200"
            aria-label="Toggle mobile menu"
          >
            <span className="material-symbols-outlined text-[20px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="pointer-events-auto md:hidden mt-2 max-w-7xl mx-auto rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200 p-4 shadow-xl flex flex-col gap-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 rounded-xl text-slate-700 hover:bg-blue-50 hover:text-blue-600 font-medium text-sm flex items-center justify-between"
            >
              <span>{link.name}</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </a>
          ))}
          <div className="h-px bg-slate-200 my-1" />
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenSignIn();
              }}
              className="flex-1 py-2 text-center rounded-xl bg-slate-100 text-slate-700 text-sm font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onLaunchConsole();
              }}
              className="flex-1 py-2 text-center rounded-xl bg-blue-600 text-white text-sm font-medium shadow-sm"
            >
              Console
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
