import React, { useState, useEffect, useRef } from 'react';
import { LioraLogo } from './components/LioraLogo';
import {
  ArrowRight,
  User,
  PlayCircle,
  Star,
  CheckCircle2,
  ShieldCheck,
  BadgeCheck,
  Timer,
  Shield,
  FolderGit2,
  GitFork,
  Brain,
  Sparkles,
  Copy,
  Share2,
  CheckSquare,
  Network,
  Coins,
  CheckCheck,
  Clock,
  Zap,
  MapPin,
  Compass,
  Activity,
  Key,
  CloudOff,
  HeartHandshake,
  Lock,
} from 'lucide-react';
import { getSession, clearSession, UserSession } from './lib/session';
import { AuthPage, AuthMode } from './views/auth/AuthPage';

export default function App() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [scale, setScale] = useState(1);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);
  const [session, setSession] = useState<UserSession | null>(() => getSession());
  const [view, setView] = useState<'landing' | 'auth'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view');
      if (v === 'auth') {
        return 'auth';
      }
    }
    return 'landing';
  });
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [isPastGradient, setIsPastGradient] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync dark mode class & URL parameter with current view (Landing & Auth are light mode as in design, Overview & Chat are dark mode)
  useEffect(() => {
    if (view === 'landing' || view === 'auth') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    try {
      const url = new URL(window.location.href);
      if (view === 'landing') {
        url.searchParams.delete('view');
      } else {
        url.searchParams.set('view', view);
      }
      window.history.replaceState({}, '', url.toString());
    } catch (_) {}
  }, [view]);

  // Sync session on custom auth events
  useEffect(() => {
    const handleAuthChange = (e: any) => {
      setSession(e.detail || null);
    };
    window.addEventListener('auth-changed', handleAuthChange);
    return () => window.removeEventListener('auth-changed', handleAuthChange);
  }, []);

  // Dynamic scale calculation to keep exact same screen on all displays (desktop, tablet, mobile)
  useEffect(() => {
    const updateScaling = () => {
      const windowWidth = window.innerWidth;
      const baseWidth = 1280;
      if (windowWidth < baseWidth) {
        const calculatedScale = Math.max(windowWidth / baseWidth, 0.2);
        setScale(calculatedScale);
        if (contentRef.current) {
          setContainerHeight(contentRef.current.offsetHeight * calculatedScale);
        }
      } else {
        setScale(1);
        setContainerHeight(undefined);
      }
    };

    updateScaling();
    window.addEventListener('resize', updateScaling);

    let observer: ResizeObserver | null = null;
    if (contentRef.current && window.ResizeObserver) {
      observer = new ResizeObserver(() => {
        updateScaling();
      });
      observer.observe(contentRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateScaling);
      if (observer) observer.disconnect();
    };
  }, []);

  // Detect when scroll passes the hero blue gradient to turn navbar solid blue
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const heroEl = document.getElementById('home');
          if (heroEl) {
            const rect = heroEl.getBoundingClientRect();
            // The hero gradient completes its fade to white at ~48% of the hero section height.
            // When that point reaches the navbar (~80px from top), turn the navbar solid blue.
            setIsPastGradient(rect.top + rect.height * 0.48 <= 80);
          } else {
            setIsPastGradient(window.scrollY > 400);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const switchBilling = (cycle: 'monthly' | 'annual') => {
    setBillingCycle(cycle);
  };

  // If user is in Auth Page (Sign In / Register with OTP / Forgot Password)
  if (view === 'auth') {
    return (
      <AuthPage
        initialMode={authMode}
        onSuccess={(email) => {
          setSession(getSession());
          // Stay on auth page showing green tick, as explicitly requested
        }}
        onGoToLanding={() => setView('landing')}
      />
    );
  }

  return (
    <div
      className="w-full bg-surface text-on-surface antialiased overflow-x-hidden relative"
      style={{
        height: containerHeight ? `${containerHeight}px` : 'auto',
      }}
    >
      <div
        ref={contentRef}
        style={{
          width: scale < 1 ? '1280px' : '100%',
          transform: scale < 1 ? `scale(${scale})` : 'none',
          transformOrigin: 'top left',
          position: scale < 1 ? 'absolute' : 'relative',
          top: 0,
          left: 0,
        }}
        className="w-full bg-surface text-on-surface"
      >
        {/* HEADER BAR - Turns solid full blue smoothly once hero gradient ends */}
        <header className="fixed top-0 left-0 w-full z-50 pt-4 px-margin pointer-events-none">
          <div
            style={{ willChange: 'background-color, border-color' }}
            className={`pointer-events-auto max-w-7xl mx-auto h-16 px-6 rounded-full flex items-center justify-between gap-space-md border transition-colors duration-700 ease-in-out ${
              isPastGradient
                ? 'bg-[#1B4EF5] border-blue-400/30'
                : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <LioraLogo className="w-8 h-8" />
              <span
                className={`font-headline-sm text-headline-sm tracking-tight transition-colors duration-700 ease-in-out ${
                  isPastGradient ? 'text-white' : 'text-on-surface'
                }`}
              >
                Liora
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-label-sm text-label-sm border transition-colors duration-700 ease-in-out ${
                  isPastGradient
                    ? 'bg-white/20 text-white border-white/30'
                    : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
                }`}
              >
                v1.0
              </span>
            </div>
            <nav className="flex items-center gap-space-lg" data-active-classes="text-on-surface font-semibold">
              <a
                aria-current="page"
                className={`font-label-lg text-label-lg font-semibold transition-colors duration-700 ease-in-out ${
                  isPastGradient ? 'text-white' : 'text-on-surface'
                }`}
                data-path="home"
                href="#home"
              >
                Home
              </a>
              <a
                className={`font-label-lg text-label-lg font-medium transition-colors duration-700 ease-in-out ${
                  isPastGradient
                    ? 'text-white/80 hover:text-white'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                data-path="architecture"
                href="#architecture"
              >
                Architecture
              </a>
              <a
                className={`font-label-lg text-label-lg font-medium transition-colors duration-700 ease-in-out ${
                  isPastGradient
                    ? 'text-white/80 hover:text-white'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                data-path="benchmark"
                href="#benchmark"
              >
                Benchmark
              </a>
              <a
                className={`font-label-lg text-label-lg font-medium transition-colors duration-700 ease-in-out ${
                  isPastGradient
                    ? 'text-white/80 hover:text-white'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                data-path="pricing"
                href="#pricing"
              >
                Pricing
              </a>
            </nav>
            <div className="flex items-center gap-space-md">
              {/* Separate dedicated Sign In button */}
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setView('auth');
                }}
                className={`px-4 py-2 rounded-full font-label-lg text-label-lg font-medium transition-colors duration-700 ease-in-out cursor-pointer ${
                  isPastGradient
                    ? 'text-white/90 hover:text-white hover:bg-white/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Sign In
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('create');
                  setView('auth');
                }}
                className={`group inline-flex items-center gap-2 px-space-lg py-2.5 rounded-full font-label-lg text-label-lg border transition-colors duration-700 ease-in-out cursor-pointer shadow-none ${
                  isPastGradient
                    ? 'bg-white text-[#1B4EF5] hover:bg-blue-50 border-white/40 font-semibold'
                    : 'bg-primary-container text-on-primary-container hover:bg-secondary hover:text-on-secondary border-transparent'
                }`}
                data-path="launch-console"
              >
                <span>Launch Console</span>
                <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
              </button>
              <button 
                onClick={() => {
                  setAuthMode('signin');
                  setView('auth');
                }}
                className={`w-8 h-8 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-700 ease-in-out cursor-pointer ${
                  isPastGradient
                    ? 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                    : 'bg-surface-container border-outline-variant/30 text-on-surface hover:bg-surface-container-high'
                }`}
                aria-label="User account"
                title={session ? `Signed in as (${session.email})` : 'Sign In'}
              >
                {session ? (
                  <span className={`font-bold text-xs ${isPastGradient ? 'text-white' : 'text-[#1B4EF5]'}`}>
                    {session.firstName ? session.firstName.charAt(0) : session.email.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className={`w-4.5 h-4.5 transition-colors duration-700 ease-in-out ${isPastGradient ? 'text-white' : 'text-slate-700'}`} />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* MAIN BODY CONTENT */}
        <main className="w-full bg-surface min-h-[calc(100vh-16rem)]">
          <div className="flex flex-col w-full">
            {/* HERO SECTION */}
            <section
              id="home"
              className="relative w-full overflow-hidden px-margin pb-24 bg-surface pt-24"
              style={{
                background:
                  'linear-gradient(rgb(27, 78, 245) 0%, rgb(27, 78, 245) 14%, rgba(27, 78, 245, 0.7) 24%, rgb(219, 234, 254) 38%, rgb(255, 255, 255) 48%, rgb(255, 255, 255) 100%)',
              }}
            >
              <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10 pt-16">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-label-sm font-semibold tracking-wide uppercase mb-6 shadow-sm border border-white/20">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
                  </span>
                  <span className="text-white">Deterministic Engine v1.0</span>
                  <span className="text-white/40">•</span>
                  <span className="text-sky-300 font-medium">Sub-50ms Verification</span>
                </div>

                <h1 className="font-display-xl text-display-xl max-w-4xl text-white tracking-tight mb-6 leading-tight drop-shadow-sm">
                  One Place for{' '}
                  <span
                    className="inline-flex items-center font-bold italic tracking-normal text-white"
                    style={{
                      display: 'inline-block',
                      background: 'rgba(255, 255, 255, 0.12)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      padding: '4px 20px',
                      borderRadius: '9999px',
                      color: 'rgb(255, 255, 255)',
                      textShadow: 'rgba(0, 0, 0, 0.15) 0px 1px 2px',
                      boxShadow: 'rgba(255, 255, 255, 0.4) 0px 1px 1px inset, rgba(0, 0, 0, 0.06) 0px 4px 16px',
                    }}
                  >
                    Everything You Need to Know.
                  </span>
                </h1>

                <p
                  className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-10 leading-relaxed font-normal"
                  style={{
                    color: 'rgb(255, 255, 255)',
                    textShadow: 'rgba(0, 0, 0, 0.2) 0px 1px 2px',
                    opacity: 0.95,
                  }}
                >
                  Bring your documents and knowledge together. Liora finds the relevant information and turns it into clear, grounded answers.
                </p>

                <div className="flex flex-row items-center justify-center gap-4 mb-12">
                  <a
                    className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-primary-container text-on-primary-container font-label-lg text-label-lg shadow-[0_10px_25px_-5px_rgba(37,99,235,0.6)] hover:bg-secondary transition-all transform hover:-translate-y-0.5 border border-white/20"
                    href="#pricing"
                  >
                    <span>Start Free with BYO API</span>
                    <ArrowRight className="w-4.5 h-4.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </a>
                  <a
                    className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-surface-container-lowest text-on-surface border border-outline-variant/30 font-label-lg text-label-lg shadow-sm hover:bg-surface-container transition-all"
                    href="#workbench-preview"
                  >
                    <PlayCircle className="w-4.5 h-4.5 text-primary shrink-0" />
                    <span>Explore Live Interactive Demo</span>
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-y-3 gap-x-8 text-on-surface-variant font-label-sm text-label-sm pt-2 pb-6">
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-0.5 text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                      ))}
                    </div>
                    <span className="font-semibold text-on-surface">4.95/5</span>
                    <span className="text-on-surface-variant">(280+ engineering teams)</span>
                  </div>
                  <span className="text-outline-variant">•</span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-on-surface">Bring your own API key free forever</span>
                  </div>
                  <span className="text-outline-variant">•</span>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-on-surface">FIPS 140-3 &amp; SOC 2 Type II compliant</span>
                  </div>
                </div>

                {/* WORKBENCH PREVIEW CARD */}
                <div className="w-full mt-6 relative max-w-6xl" id="workbench-preview">
                  {/* Floating Badges */}
                  <div className="flex absolute -left-8 top-20 z-20 items-center gap-3 px-4 py-3 rounded-2xl bg-surface-container-lowest shadow-xl border border-slate-300/70 text-left">
                    <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-primary">
                      <BadgeCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-label-sm text-label-sm font-semibold text-on-surface">100% Deterministic</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Zero speculative tokens</div>
                    </div>
                  </div>

                  <div className="flex absolute -right-6 top-16 z-20 items-center gap-3 px-4 py-3 rounded-2xl bg-surface-container-lowest shadow-xl border border-slate-300/70 text-left">
                    <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                      <Timer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-label-sm text-label-sm font-semibold text-on-surface">42ms Latency</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">P95 retrieval + proving</div>
                    </div>
                  </div>

                  <div className="flex absolute -right-8 bottom-28 z-20 items-center gap-3 px-4 py-3 rounded-2xl bg-surface-container-lowest shadow-xl border border-slate-300/70 text-left">
                    <div className="w-9 h-9 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-label-sm text-label-sm font-semibold text-on-surface">0 Hallucination Drift</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant">Merkle root verified</div>
                    </div>
                  </div>

                  {/* Window Box */}
                  <div
                    className="w-full rounded-3xl bg-white shadow-2xl overflow-hidden text-left border-t"
                    style={{
                      borderTop: '1.5px solid rgba(148, 163, 184, 0.55)',
                      borderLeft: 'none',
                      borderRight: 'none',
                      borderBottom: 'none',
                    }}
                  >
                    <div className="px-6 py-3.5 bg-surface-container-low flex items-center justify-between gap-3 border-b border-outline-variant/20">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full bg-error/70"></span>
                        <span className="w-3 h-3 rounded-full bg-tertiary-fixed-dim"></span>
                        <span className="w-3 h-3 rounded-full bg-secondary-fixed"></span>
                        <div className="h-4 w-px bg-outline-variant/40 mx-1"></div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                          <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight text-[16px]">
                            Mutual TLS Certificate Rotation &amp; Regional Failover
                          </span>
                          <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                            THREAD-8492
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 font-label-sm text-label-sm">
                        <span className="text-on-surface-variant flex items-center gap-1.5">
                          <FolderGit2 className="w-4 h-4 text-primary shrink-0" />
                          <span>Corpus: Aegis Core Vault</span>
                          <span className="text-outline-variant">(42,910 fragments)</span>
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container-highest text-secondary font-medium">
                          Sync Active
                        </span>
                        <button className="px-3 py-1 rounded-full bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-colors shadow-sm flex items-center gap-1 font-label-sm text-label-sm border border-outline-variant/30">
                          <GitFork className="w-3.5 h-3.5 text-on-surface-variant shrink-0" />
                          <span>Branch Thread</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 min-h-[460px]">
                      {/* Left Column (8 cols) */}
                      <div className="col-span-8 p-6 lg:p-8 flex flex-col gap-6 bg-surface-container-lowest border-r border-outline-variant/20">
                        {/* Question Bubble */}
                        <div className="flex items-start gap-3.5 bg-surface-container-low p-4 rounded-2xl">
                          <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
                            <Brain className="w-4.5 h-4.5 text-on-primary shrink-0" />
                          </div>
                          <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center justify-between">
                              <span className="font-headline-sm text-headline-sm text-[15px] text-on-surface font-semibold">
                                Dr. Marcus Vance
                              </span>
                              <span className="font-label-sm text-label-sm text-on-surface-variant">
                                11:42:08 UTC • Operator
                              </span>
                            </div>
                            <p className="font-body-md text-body-md text-on-surface text-[15px] leading-relaxed">
                              In our high-availability deployment, how does Envoy's dynamic Secret Discovery Service (SDS) maintain continuous mTLS integrity during a dual-region split-brain failover?
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                              <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                                #envoy-sds
                              </span>
                              <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                                #split-brain
                              </span>
                              <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant">
                                #mtls-fallback
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Synthesized Response */}
                        <div className="flex items-start gap-3.5 bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20">
                          <div className="w-9 h-9 rounded-xl bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                            <Sparkles className="w-4.5 h-4.5 text-on-secondary shrink-0" />
                          </div>
                          <div className="flex flex-col gap-3 w-full">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-headline-sm text-headline-sm text-[15px] text-on-surface font-semibold">
                                  Synthesized Verification &amp; Operational Path
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm font-semibold">
                                  DETERMINISTIC
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-on-surface-variant">
                                <Copy className="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
                                <Share2 className="w-4 h-4 cursor-pointer hover:text-primary transition-colors" />
                              </div>
                            </div>
                            <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                              Envoy guarantees zero downtime during asymmetric split-brain partitions through its{' '}
                              <strong className="text-primary font-semibold">Warm Secret Staging Pipeline</strong> and decoupled SDS gRPC streaming architecture{' '}
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded bg-surface-container text-secondary font-semibold text-xs">
                                [1]
                              </span>
                              .
                            </p>
                            <div className="flex flex-col gap-2.5 pt-1">
                              <div className="flex items-start gap-2.5 bg-surface-container-low p-3 rounded-xl">
                                <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-primary font-label-sm text-label-sm font-bold">
                                  01
                                </span>
                                <div className="text-xs text-on-surface leading-relaxed">
                                  <span className="font-semibold text-on-surface">Atomic Cache Preservation:</span> Retains pre-rotation TLS context while accepting certificates from either CA bundle via dual-bundle trust anchor overlay{' '}
                                  <span className="text-secondary font-semibold">[2]</span>.
                                </div>
                              </div>
                              <div className="flex items-start gap-2.5 bg-surface-container-low p-3 rounded-xl">
                                <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-primary font-label-sm text-label-sm font-bold">
                                  02
                                </span>
                                <div className="text-xs text-on-surface leading-relaxed">
                                  <span className="font-semibold text-on-surface">Circuit Severing Guard:</span> SDS suppresses upstream resets without renegotiation until peer verifies reciprocal support{' '}
                                  <span className="text-secondary font-semibold">[3]</span>.
                                </div>
                              </div>
                            </div>
                            <div className="rounded-xl bg-surface-container-low p-3.5 font-label-sm text-label-sm text-on-surface space-y-1 border border-outline-variant/20">
                              <div className="text-secondary font-semibold text-[11px] uppercase tracking-wider">
                                envoy.transport_sockets.tls.sds_failover.yaml
                              </div>
                              <pre className="overflow-x-auto text-[12px] leading-tight text-on-surface-variant font-label-sm">
                                trusted_ca: &#123; filename: "/etc/envoy/certs/dual_trust_anchors.pem" &#125;
                                <br />
                                validation_context_sds_secret_config: &#123; api_type: GRPC &#125;
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Column (4 cols) */}
                      <div className="col-span-4 p-6 bg-surface-container-low flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-2">
                          <div className="flex items-center gap-1.5">
                            <CheckSquare className="w-4.5 h-4.5 text-primary shrink-0" />
                            <span className="font-headline-sm text-headline-sm text-[14px] text-on-surface font-semibold">
                              Evidence Inspector
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
                            3 Verified Sources
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-surface-container-lowest shadow-sm flex items-center justify-between border border-outline-variant/20">
                          <div>
                            <div className="font-label-sm text-label-sm text-on-surface-variant">Grounding Fidelity</div>
                            <div className="font-headline-md text-headline-md text-secondary font-bold">99.82%</div>
                            <div className="font-label-sm text-label-sm text-outline">0 Hallucination Drift</div>
                          </div>
                          <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                            <svg className="w-8 h-8" viewBox="0 0 36 36">
                              <path
                                className="text-surface-variant"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3.5"
                              ></path>
                              <path
                                className="text-secondary"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                fill="none"
                                stroke="currentColor"
                                strokeDasharray="99.8, 100"
                                strokeLinecap="round"
                                strokeWidth="3.5"
                              ></path>
                            </svg>
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-1.5 border border-outline-variant/20">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-secondary font-bold">
                              [1] Aegis-SDS-Arch-v3.2.pdf
                            </span>
                            <span className="text-on-surface-variant font-label-sm text-label-sm">Page 41</span>
                          </div>
                          <p className="font-body-sm text-body-sm text-[12px] text-on-surface-variant line-clamp-3 italic">
                            "...in non-convergent partition events, Envoy SDS pipelines must not sever downstream keep-alives..."
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-label-sm text-label-sm text-primary font-medium">Sim: 0.962</span>
                            <span className="font-label-sm text-label-sm text-outline">SHA256: 4b9a...1ef8</span>
                          </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-surface-container-lowest shadow-sm flex flex-col gap-1.5 border border-outline-variant/20">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-secondary font-bold">
                              [2] envoy_core_proxy.md
                            </span>
                            <span className="text-on-surface-variant font-label-sm text-label-sm">Sec 8.4</span>
                          </div>
                          <p className="font-body-sm text-body-sm text-[12px] text-on-surface-variant line-clamp-2 italic">
                            "Validation context SDS configs ensure root CA updates are non-destructive and retain fallback keychains until confirmed."
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-label-sm text-label-sm text-primary font-medium">Sim: 0.941</span>
                            <span className="font-label-sm text-label-sm text-outline">SHA256: 8a0c...93d2</span>
                          </div>
                        </div>

                        <div className="mt-auto p-3 rounded-2xl bg-surface-container-lowest flex items-center gap-2.5 border border-outline-variant/20">
                          <BadgeCheck className="w-5 h-5 text-primary shrink-0" />
                          <div className="text-[12px] leading-tight text-on-surface">
                            <div className="font-semibold">Cryptographic Receipt Signed</div>
                            <span className="text-on-surface-variant text-[11px]">Hardware Enclave Node #EU-WEST-4</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="px-6 py-2.5 bg-surface-container-low flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant border-t border-outline-variant/20">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                          <span>
                            p95 Latency: <strong>42ms flat</strong>
                          </span>
                        </span>
                        <span>
                          Tokens Synthesized: <strong>384 tokens</strong>
                        </span>
                        <span>
                          Grounding Pass Rate: <strong>100%</strong>
                        </span>
                      </div>
                      <div className="text-secondary font-medium">Zero transport reset signals recorded</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SOCIAL PROOF / TRUSTED BY LOGOS */}
            <section className="w-full py-12 px-margin bg-surface-container-low border-y border-outline-variant/20">
              <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
                <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
                  Trusted by high-assurance infrastructure &amp; AI teams worldwide
                </span>
                <div className="flex items-center justify-center gap-14 text-on-surface">
                  <span className="font-headline-sm text-headline-sm tracking-tighter text-on-surface font-bold">
                    DATADOG
                  </span>
                  <span className="font-headline-sm text-headline-sm tracking-tighter text-on-surface font-bold">
                    Figma
                  </span>
                  <span className="font-headline-sm text-headline-sm tracking-tighter text-on-surface font-bold lowercase">
                    stripe
                  </span>
                  <span className="font-headline-sm text-headline-sm tracking-tighter text-on-surface font-bold">
                    Notion
                  </span>
                  <span className="font-headline-sm text-headline-sm tracking-tighter text-on-surface font-bold">
                    ▲ Vercel
                  </span>
                  <span className="font-headline-sm text-headline-sm tracking-tighter text-on-surface font-bold lowercase">
                    snowflake
                  </span>
                  <span className="font-headline-sm text-headline-sm tracking-tighter text-on-surface font-bold">
                    CLOUDFLARE
                  </span>
                </div>
              </div>
            </section>

            {/* VALUE PILLARS & ARCHITECTURAL RIGOR */}
            <section className="w-full py-24 px-margin bg-surface" id="architecture">
              <div className="max-w-7xl mx-auto flex flex-col gap-16">
                <div className="flex md:flex-row md:items-end justify-between gap-6">
                  <div className="max-w-2xl flex flex-col gap-3">
                    <span className="font-label-md text-label-md uppercase tracking-wider text-primary font-semibold">
                      Deterministic Engine Architecture
                    </span>
                    <h2 className="font-display-lg text-display-lg text-on-surface tracking-tight">
                      Built for environments where a 1% hallucination rate is unacceptable.
                    </h2>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                    Standard RAG stitches stochastic guesses together. Liora treats enterprise knowledge as a cryptographic ledger with strict mathematical verification boundaries.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-8">
                  {/* Pillar 1 */}
                  <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-300/70 flex flex-col justify-between transition-all group">
                    <div className="flex flex-col gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                        <Network className="w-7 h-7" />
                      </div>
                      <h3 className="font-headline-md text-headline-md text-on-surface">
                        Hierarchical Vector Graph Traversal
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Synthesizes across tens of thousands of fragmented documents using multi-hop graph indices and zero-tolerance cosine thresholds.
                      </p>
                    </div>
                    <div className="mt-8 pt-6 bg-surface-container-low/40 rounded-2xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-on-surface-variant">Cosine Parity Gate</span>
                        <span className="text-secondary font-bold">&gt; 0.942 Thresh</span>
                      </div>
                      <div className="w-full bg-surface-container-highest rounded-full h-2">
                        <div className="bg-secondary h-2 rounded-full w-[94%]"></div>
                      </div>
                      <span className="font-label-sm text-label-sm text-outline">
                        Rejects ungrounded speculative tokens automatically
                      </span>
                    </div>
                  </div>

                  {/* Pillar 2 */}
                  <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-300/70 flex flex-col justify-between transition-all group">
                    <div className="flex flex-col gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                        <Coins className="w-7 h-7" />
                      </div>
                      <h3 className="font-headline-md text-headline-md text-on-surface">
                        Cryptographic Provenance Receipts
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Every token synthesized carries an immutable SHA-256 Merkle root tied to source text byte offsets for regulatory audibility.
                      </p>
                    </div>
                    <div className="mt-8 p-4 rounded-2xl bg-surface-container-low/60 font-label-sm text-label-sm text-on-surface space-y-1">
                      <div className="text-primary font-semibold text-[11px]">MERKLE ROOT RECEIPT</div>
                      <div className="text-[11px] text-on-surface-variant truncate font-mono">
                        0x74f2b9...e3089d71a
                      </div>
                      <div className="flex items-center gap-2 pt-1 text-[11px] text-secondary">
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Byte-Range Parity Validated</span>
                      </div>
                    </div>
                  </div>

                  {/* Pillar 3 */}
                  <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-xl border border-slate-300/70 flex flex-col justify-between transition-all group">
                    <div className="flex flex-col gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-tertiary group-hover:bg-tertiary-container group-hover:text-on-tertiary transition-colors">
                        <Clock className="w-7 h-7" />
                      </div>
                      <h3 className="font-headline-md text-headline-md text-on-surface">
                        Air-Gapped &amp; Sovereign Deployment
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Deploy in AWS Nitro Enclaves, private Kubernetes, or locally with Ollama and vLLM. Zero customer tokens ever leave your designated boundary.
                      </p>
                    </div>
                    <div className="mt-8 p-4 rounded-2xl bg-surface-container-low/60 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                          Zero Data Retention
                        </span>
                        <span className="text-[11px] text-on-surface-variant">Ephemeral RAM Flushes</span>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold">
                        FIPS 140-3
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* BENCHMARK COMPARISON TABLE */}
            <section className="w-full py-24 px-margin bg-surface-container-low/30 border-y border-slate-200/80" id="benchmark">
              <div className="max-w-7xl mx-auto flex flex-col gap-12">
                <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/95 border border-slate-200 text-primary text-label-sm font-semibold tracking-wider uppercase">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span>EMPIRICAL EVALUATION &amp; LAB BENCHMARKS</span>
                  </div>
                  <h2 className="font-display-lg text-display-lg text-on-surface tracking-tight">
                    Mathematical grounding replaces probabilistic guesswork.
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Benchmarked over 120,000 multi-hop enterprise queries across regulatory, financial, and infrastructure corpora with strict zero-shadow lab precision.
                  </p>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {/* Metric 1 */}
                  <div className="p-6 rounded-2xl bg-white/95 border border-slate-200/90 flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-mono text-[11px] font-semibold border border-primary/20">
                        HALLUCINATION RATE
                      </span>
                      <ShieldCheck className="w-4.5 h-4.5 text-primary shrink-0" />
                    </div>
                    <div>
                      <div className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
                        &lt; 0.05%
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                        Zero speculative hallucination drift across verified test sets.
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-outline">
                      <span className="text-primary font-bold">99.82% pass rate</span>
                      <span>vs 18.4% baseline</span>
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className="p-6 rounded-2xl bg-white/95 border border-slate-200/90 flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-secondary font-mono text-[11px] font-semibold border border-secondary/20">
                        DETERMINISTIC LATENCY
                      </span>
                      <Zap className="w-4.5 h-4.5 text-secondary shrink-0" />
                    </div>
                    <div>
                      <div className="font-headline-md text-headline-md font-bold text-secondary tracking-tight">
                        42ms
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                        P95 retrieval &amp; zero-knowledge proving in AWS Nitro Enclaves.
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-outline">
                      <span className="text-secondary font-semibold">FIPS 140-3 verified</span>
                      <span>EU-WEST &amp; US-EAST</span>
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div className="p-6 rounded-2xl bg-white/95 border border-slate-200/90 flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-tertiary font-mono text-[11px] font-semibold border border-tertiary/20">
                        CRYPTOGRAPHIC PROOF
                      </span>
                      <MapPin className="w-4.5 h-4.5 text-tertiary shrink-0" />
                    </div>
                    <div>
                      <div className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
                        100% Byte Audit
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                        Every synthesized token tied to source byte offsets via SHA-256.
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-outline">
                      <span className="text-tertiary font-medium truncate">0x74f2b9...9d71a</span>
                      <span>Immutable Root</span>
                    </div>
                  </div>

                  {/* Metric 4 */}
                  <div className="p-6 rounded-2xl bg-white/95 border border-slate-200/90 flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-mono text-[11px] font-semibold border border-primary/20">
                        MULTI-HOP REASONING
                      </span>
                      <Network className="w-4.5 h-4.5 text-primary shrink-0" />
                    </div>
                    <div>
                      <div className="font-headline-md text-headline-md font-bold text-on-surface tracking-tight">
                        99.4%
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant mt-1">
                        Cross-document synthesis depth with zero context truncation.
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-outline">
                      <span className="text-primary font-semibold">Zero Truncation</span>
                      <span>Depth = 8 Hops</span>
                    </div>
                  </div>
                </div>

                {/* Telemetry Matrix & Benchmark Lab Box */}
                <div className="rounded-3xl bg-white/95 border border-slate-200/90 overflow-hidden flex flex-col">
                  <div className="px-6 py-4 bg-surface-container-low/60 border-b border-slate-200 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                        <span className="font-headline-sm text-headline-sm text-[16px] text-on-surface font-bold">
                          Telemetry Matrix &amp; Benchmark Lab
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-on-surface-variant font-mono text-[11px]">
                        Multi-Tenant Stress Test N=120,000
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-xs font-label-sm text-on-surface-variant">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-0.5 bg-error rounded-full"></span>
                        <span>Standard Vector RAG (Stochastic)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-0.5 bg-primary rounded-full"></span>
                        <span className="text-primary font-semibold">Liora Deterministic Engine</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 grid grid-cols-12 gap-8 items-stretch">
                    {/* Left: Radar Stress Test (6 cols) */}
                    <div className="col-span-6 p-6 rounded-2xl bg-surface-container-low/40 border border-slate-200/90 flex flex-col justify-between gap-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Compass className="w-5 h-5 text-primary shrink-0" />
                            <span className="font-headline-sm text-headline-sm text-[15px] font-bold text-on-surface">
                              Grounding Architecture Radar &amp; Stress Test
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[10px] font-semibold border border-primary/20">
                            5-AXIS AUDIT
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                          Evaluation across 5 rigorous cryptographic &amp; semantic integrity vectors under high contention.
                        </p>
                        <div className="p-4 rounded-xl bg-white/95 border border-slate-200/90 flex flex-col items-center justify-center">
                          <svg className="w-full max-w-[320px] h-60 overflow-visible" viewBox="0 0 320 240">
                            <polygon fill="none" points="160,30 265,75 225,185 95,185 55,75" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1"></polygon>
                            <polygon fill="none" points="160,60 230,90 205,165 115,165 90,90" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1"></polygon>
                            <polygon fill="none" points="160,90 195,105 185,145 135,145 125,105" stroke="#e2e8f0" strokeDasharray="3 3" strokeWidth="1"></polygon>
                            <line stroke="#cbd5e1" strokeWidth="1" x1="160" x2="160" y1="120" y2="30"></line>
                            <line stroke="#cbd5e1" strokeWidth="1" x1="160" x2="265" y1="120" y2="75"></line>
                            <line stroke="#cbd5e1" strokeWidth="1" x1="160" x2="225" y1="120" y2="185"></line>
                            <line stroke="#cbd5e1" strokeWidth="1" x1="160" x2="95" y1="120" y2="185"></line>
                            <line stroke="#cbd5e1" strokeWidth="1" x1="160" x2="55" y1="120" y2="75"></line>
                            <polygon fill="rgba(239, 68, 68, 0.12)" points="160,82 205,102 180,148 128,155 105,100" stroke="#ef4444" strokeDasharray="3 2" strokeWidth="1.8"></polygon>
                            <polygon fill="rgba(0, 74, 198, 0.18)" points="160,36 260,78 221,180 99,180 60,78" stroke="#004ac6" strokeWidth="2.2"></polygon>
                            <circle cx="160" cy="36" fill="#004ac6" r="4" stroke="#ffffff" strokeWidth="1.5"></circle>
                            <circle cx="260" cy="78" fill="#004ac6" r="4" stroke="#ffffff" strokeWidth="1.5"></circle>
                            <circle cx="221" cy="180" fill="#004ac6" r="4" stroke="#ffffff" strokeWidth="1.5"></circle>
                            <circle cx="99" cy="180" fill="#004ac6" r="4" stroke="#ffffff" strokeWidth="1.5"></circle>
                            <circle cx="60" cy="78" fill="#004ac6" r="4" stroke="#ffffff" strokeWidth="1.5"></circle>
                            <text fill="#0b1c30" fontFamily="'Geist', monospace" fontSize="10" fontWeight="600" textAnchor="middle" x="160" y="20">
                              Citation Precision (99.8%)
                            </text>
                            <text fill="#0b1c30" fontFamily="'Geist', monospace" fontSize="10" fontWeight="600" textAnchor="start" x="272" y="78">
                              Multi-hop Depth
                            </text>
                            <text fill="#0b1c30" fontFamily="'Geist', monospace" fontSize="10" fontWeight="600" textAnchor="start" x="230" y="200">
                              Enclave Isolation
                            </text>
                            <text fill="#0b1c30" fontFamily="'Geist', monospace" fontSize="10" fontWeight="600" textAnchor="end" x="90" y="200">
                              Latency Consistency
                            </text>
                            <text fill="#0b1c30" fontFamily="'Geist', monospace" fontSize="10" fontWeight="600" textAnchor="end" x="48" y="78">
                              Zero-Hallucination
                            </text>
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200/90 text-[11px] font-mono text-on-surface">
                          100k Multi-hop Queries
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200/90 text-[11px] font-mono text-on-surface">
                          Zero-Drift Threshold (&gt;0.942)
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-white border border-slate-200/90 text-[11px] font-mono text-on-surface">
                          Split-Brain Failover
                        </span>
                      </div>
                    </div>

                    {/* Right: Timeline (6 cols) */}
                    <div className="col-span-6 p-6 rounded-2xl bg-white/95 border border-slate-200/90 flex flex-col justify-between gap-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-secondary shrink-0" />
                            <span className="font-headline-sm text-headline-sm text-[15px] font-bold text-on-surface">
                              Live Trace &amp; Proof Synthesis Timeline
                            </span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-secondary font-mono text-[10px] font-semibold border border-secondary/20">
                            REAL-TIME PIPELINE
                          </span>
                        </div>
                        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                          Step-by-step cryptographic traversal path executed inside hardware-isolated enclaves.
                        </p>
                        <div className="flex flex-col gap-3">
                          <div className="p-3.5 rounded-xl bg-surface-container-low/40 border border-slate-200/90 flex items-start gap-3">
                            <span className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-primary font-bold text-[11px]">
                              01
                            </span>
                            <div className="flex flex-col gap-0.5 text-xs">
                              <div className="font-semibold text-on-surface">Query Ingestion &amp; Sharded Embeddings</div>
                              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                                Raw query parsed; 512-token chunks mapped to deterministic vector coordinate space.
                              </p>
                            </div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-surface-container-low/40 border border-slate-200/90 flex items-start gap-3">
                            <span className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-primary font-bold text-[11px]">
                              02
                            </span>
                            <div className="flex flex-col gap-0.5 text-xs">
                              <div className="font-semibold text-on-surface">Deterministic Sub-graph Traversal</div>
                              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                                Hierarchical HNSW traversal with cosine parity gate ≥ 0.942, pruning 99.2% irrelevant branches.
                              </p>
                            </div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-surface-container-low/40 border border-slate-200/90 flex items-start gap-3">
                            <span className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-secondary font-bold text-[11px]">
                              03
                            </span>
                            <div className="flex flex-col gap-0.5 text-xs">
                              <div className="font-semibold text-on-surface">Ephemeral Cryptographic Merkle Proof</div>
                              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                                SHA-256 byte offset leaf hashing executed inside isolated AWS Nitro Enclave memory.
                              </p>
                            </div>
                          </div>
                          <div className="p-3.5 rounded-xl bg-surface-container-low/40 border border-slate-200/90 flex items-start gap-3">
                            <span className="px-1.5 py-0.5 rounded bg-primary text-on-primary font-mono font-bold text-[11px]">
                              04
                            </span>
                            <div className="flex flex-col gap-0.5 text-xs">
                              <div className="font-semibold text-on-surface">Synthesized Answer with Proof Receipt</div>
                              <p className="text-on-surface-variant text-[11px] leading-relaxed">
                                100% verified citation tags [1][2], zero speculative tokens, signed with hardware key.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-xl bg-surface-container-low border border-slate-200/90 flex items-center justify-between text-xs font-label-sm">
                        <div className="flex items-center gap-1.5 text-on-surface font-mono text-[11px]">
                          <CheckCheck className="w-4 h-4 text-primary shrink-0" />
                          <span>Pipeline Verified: 0 tokens ungrounded</span>
                        </div>
                        <span className="text-primary font-semibold font-mono text-[11px]">42ms Total</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-surface-container-low/60 border-t border-slate-200/90 flex items-center justify-between gap-4 font-label-sm text-label-sm">
                    <span className="font-semibold text-on-surface text-xs uppercase tracking-wider">
                      Benchmark Dataset Validation:
                    </span>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <div className="px-3 py-1 rounded-full bg-white border border-slate-200/90">
                        <span className="text-on-surface-variant">FinanceBench: </span>
                        <span className="text-primary font-bold">99.8%</span>
                        <span className="text-outline-variant"> vs 64.2%</span>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-white border border-slate-200/90">
                        <span className="text-on-surface-variant">LegalBench: </span>
                        <span className="text-primary font-bold">99.4%</span>
                        <span className="text-outline-variant"> vs 58.1%</span>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-white border border-slate-200/90">
                        <span className="text-on-surface-variant">BioMedQA: </span>
                        <span className="text-primary font-bold">99.9%</span>
                        <span className="text-outline-variant"> vs 71.3%</span>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-white border border-slate-200/90">
                        <span className="text-on-surface-variant">RFC/Infra Spec: </span>
                        <span className="text-primary font-bold">100%</span>
                        <span className="text-outline-variant"> vs 62.0%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2 text-on-surface-variant font-label-sm text-label-sm">
                  <span className="font-semibold text-on-surface">Seamless foundation model support:</span>
                  <span className="px-3.5 py-1 rounded-full bg-white border border-slate-200/90 text-on-surface font-medium">
                    Claude 3.5 Sonnet
                  </span>
                  <span className="px-3.5 py-1 rounded-full bg-white border border-slate-200/90 text-on-surface font-medium">
                    GPT-4o
                  </span>
                  <span className="px-3.5 py-1 rounded-full bg-white border border-slate-200/90 text-on-surface font-medium">
                    DeepSeek-R1
                  </span>
                  <span className="px-3.5 py-1 rounded-full bg-white border border-slate-200/90 text-on-surface font-medium">
                    Llama 3.3 (vLLM)
                  </span>
                  <span className="px-3.5 py-1 rounded-full bg-white border border-slate-200/90 text-on-surface font-medium">
                    Ollama Air-Gapped
                  </span>
                </div>
              </div>
            </section>

            {/* TRANSPARENT SAAS PRICING SECTION */}
            <section className="w-full py-24 px-margin bg-surface" id="pricing">
              <div className="max-w-7xl mx-auto flex flex-col gap-16">
                <div className="text-center max-w-3xl mx-auto flex flex-col gap-3">
                  <span className="font-label-md text-label-md uppercase tracking-wider text-primary font-semibold">
                    Predictable &amp; Sovereign Pricing
                  </span>
                  <h2 className="font-display-lg text-display-lg text-on-surface tracking-tight">
                    Built for production reliability at any scale.
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Zero token markups on your own models. Choose fully autonomous hosting or managed enclave acceleration.
                  </p>
                  <div className="inline-flex items-center gap-2 p-1.5 rounded-full bg-surface-container-low border border-slate-300/70 mx-auto mt-4">
                    <button
                      className={`px-5 py-2 rounded-full font-label-sm text-label-sm transition-all ${
                        billingCycle === 'monthly'
                          ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                      onClick={() => switchBilling('monthly')}
                    >
                      Monthly Billing
                    </button>
                    <button
                      className={`px-5 py-2 rounded-full font-label-sm text-label-sm transition-all ${
                        billingCycle === 'annual'
                          ? 'bg-surface-container-lowest text-on-surface font-semibold shadow-sm'
                          : 'text-on-surface-variant hover:text-on-surface'
                      }`}
                      onClick={() => switchBilling('annual')}
                    >
                      Annual (Save 20%)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8 items-center">
                  {/* Plan 1 */}
                  <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-300/70 flex flex-col justify-between h-full">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                          BYO Keys
                        </span>
                        <span className="px-3 py-1 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold border border-outline-variant/30">
                          Developer
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Free forever when using your own LLM API keys and local embedding models.
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display-lg text-display-lg text-on-surface font-bold">$0</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">/ month forever</span>
                      </div>
                      <div className="h-px bg-outline-variant/20 w-full"></div>
                      <div className="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>Up to 10,000 query verifications/mo</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>Connect OpenAI, Anthropic &amp; Ollama</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>Single-hop vector graph traversal</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>Community Discord &amp; GitHub issues</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8">
                      <a
                        className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-label-lg text-label-lg transition-all border border-slate-300/70"
                        href="#workbench-preview"
                      >
                        <span>Get Started Free</span>
                        <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </a>
                    </div>
                  </div>

                  {/* Plan 2: Pro */}
                  <div className="p-8 lg:p-10 rounded-3xl bg-white/95 backdrop-blur-xl border-2 border-primary/40 flex flex-col justify-between relative shadow-md lg:-translate-y-4 lg:py-12">
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-on-primary font-label-sm text-label-sm font-semibold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                      <span>Most Popular</span>
                    </div>
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                          Managed Team
                        </span>
                        <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-semibold border border-primary/20">
                          Pro Engine
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        High-throughput deterministic verification for fast-growing engineering teams.
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display-lg text-display-lg text-primary font-bold">
                          {billingCycle === 'annual' ? '$39' : '$49'}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          {billingCycle === 'annual' ? '/ month, billed annually' : '/ month'}
                        </span>
                      </div>
                      <div className="h-px bg-outline-variant/20 w-full"></div>
                      <div className="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span className="font-semibold">Unlimited deterministic verifications</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>42ms p95 hardware enclave routing</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>Multi-hop cryptographic Merkle proofs</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>Corpus sync: GitHub, Notion, Confluence</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>Dedicated Slack support channel</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8">
                      <a
                        className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-primary text-on-primary hover:bg-secondary font-label-lg text-label-lg shadow-md transition-all"
                        href="#workbench-preview"
                      >
                        <span>Start 14-Day Free Trial</span>
                        <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </a>
                    </div>
                  </div>

                  {/* Plan 3: Enterprise */}
                  <div className="p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-300/70 flex flex-col justify-between h-full">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                          Enterprise Sovereign
                        </span>
                        <span className="px-3 py-1 rounded-full bg-surface-container text-tertiary font-label-sm text-label-sm font-semibold border border-outline-variant/30">
                          Custom
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Air-gapped deployment inside AWS Nitro Enclaves, private Kubernetes, or bare metal.
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="font-display-lg text-display-lg text-on-surface font-bold">Custom</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">annual contracts</span>
                      </div>
                      <div className="h-px bg-outline-variant/20 w-full"></div>
                      <div className="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>100% On-Premise &amp; Air-Gapped deploy</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>Enforceable Zero Data Retention SLA</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>FIPS 140-3 &amp; SOC 2 Type II attestation</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4.5 h-4.5 text-primary shrink-0" />
                          <span>Custom fine-tuned embeddings &amp; 24/7 SLA</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8">
                      <a
                        className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface font-label-lg text-label-lg transition-all border border-slate-300/70"
                        href="#workbench-preview"
                      >
                        <span>Contact Enterprise Sales</span>
                        <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECURITY SPECIFICATIONS */}
            <section className="w-full py-20 px-margin bg-surface-container-low/40">
              <div className="max-w-5xl mx-auto flex flex-col gap-12">
                <div className="text-center flex flex-col items-center gap-3">
                  <span className="font-label-md text-label-md uppercase tracking-wider text-primary font-semibold">
                    Hardened Architecture
                  </span>
                  <h2 className="font-display-lg text-display-lg text-on-surface tracking-tight">
                    Frequently Answered Security Specifications
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-3xl bg-surface-container-lowest/80 backdrop-blur-xl shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2.5 text-primary">
                      <Key className="w-5 h-5 shrink-0" />
                      <h3 className="font-headline-sm text-headline-sm text-[16px] text-on-surface font-semibold">
                        How does BYO API key security work?
                      </h3>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Your personal or organization API keys are handled inside hardware-isolated enclaves in ephemeral RAM. Keys are never written to disk, never logged in telemetry, and completely invisible even to our root infrastructure operators.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-surface-container-lowest/80 backdrop-blur-xl shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2.5 text-secondary">
                      <BadgeCheck className="w-5 h-5 shrink-0" />
                      <h3 className="font-headline-sm text-headline-sm text-[16px] text-on-surface font-semibold">
                        What is Cryptographic Merkle Provenance?
                      </h3>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Every output token generated by Liora points directly to a hash-linked byte range in your raw documents. If an answer cannot be mathematically grounded in the Merkle leaf nodes, the engine refuses speculative synthesis.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-surface-container-lowest/80 backdrop-blur-xl shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2.5 text-tertiary">
                      <Sparkles className="w-5 h-5 shrink-0" />
                      <h3 className="font-headline-sm text-headline-sm text-[16px] text-on-surface font-semibold">
                        What is your Zero Data Retention (ZDR) policy?
                      </h3>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Our contracts include an enforceable Zero Data Retention SLA. Once a verification query completes, the ephemeral memory frame is wiped. We do not use customer data to train or fine-tune public models.
                    </p>
                  </div>

                  <div className="p-6 rounded-3xl bg-surface-container-lowest/80 backdrop-blur-xl shadow-sm flex flex-col gap-2 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2.5 text-primary">
                      <CloudOff className="w-5 h-5 shrink-0" />
                      <h3 className="font-headline-sm text-headline-sm text-[16px] text-on-surface font-semibold">
                        Can we run completely air-gapped on-premise?
                      </h3>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      Yes. Enterprise licenses include self-contained Docker and Helm charts compatible with Red Hat OpenShift, AWS EKS, and isolated bare-metal servers paired with local inference engines like vLLM and Ollama.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* CALL TO ACTION */}
            <section className="w-full py-24 px-margin bg-surface relative overflow-hidden">
              <div className="max-w-5xl mx-auto">
                <div className="w-full rounded-3xl p-16 flex flex-col items-center text-center">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-surface-container text-secondary text-label-sm font-semibold border border-outline-variant/30 mb-6">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span>Deterministic Knowledge Engine</span>
                  </div>
                  <h2 className="font-display-lg text-display-lg text-on-surface tracking-tight leading-tight max-w-3xl mb-4">
                    Ready to eliminate hallucinations in your knowledge workflows?
                  </h2>
                  <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mb-8 leading-relaxed">
                    Deploy Liora into your sovereign environment in minutes or test our isolated sandbox.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      alert('Deploying evaluation sandbox. Instructions have been dispatched.');
                    }}
                    className="w-full max-w-md flex flex-row items-center gap-3 mb-6"
                  >
                    <input
                      className="w-full px-5 py-3.5 rounded-full bg-surface-container-low text-on-surface placeholder:text-outline-variant text-body-sm font-body-sm border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                      placeholder="Enter your work email..."
                      type="email"
                      required
                    />
                    <button
                      className="group whitespace-nowrap px-7 py-3.5 rounded-full bg-primary text-on-primary font-label-lg text-label-lg hover:bg-secondary transition-all flex items-center justify-center gap-2 shrink-0 shadow-md cursor-pointer"
                      type="submit"
                    >
                      <span>Deploy Sandbox</span>
                      <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </form>
                  <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-3 text-on-surface-variant font-label-sm text-label-sm">
                    <span>Instant 14-day evaluation environment</span>
                    <span className="text-outline-variant">•</span>
                    <span>No credit card required</span>
                    <span className="text-outline-variant">•</span>
                    <span>SOC 2 Type II Compliant</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="w-full bg-surface-container-lowest text-on-surface pt-16 pb-12 border-t border-outline-variant/30 select-none">
          <div className="max-w-7xl mx-auto px-margin flex flex-col gap-12">
            <div className="grid grid-cols-5 gap-space-lg pb-10 border-b border-outline-variant/20">
              <div className="col-span-2 flex flex-col gap-space-sm pr-space-lg">
                <div className="flex items-center gap-space-sm">
                  <LioraLogo className="h-7 w-7" />
                  <span className="font-headline-sm text-headline-sm tracking-tight text-on-surface">
                    Liora
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
                  High-clarity knowledge intelligence and synthesis engine built for precision research, cross-domain verification, and enterprise-scale optical retrieval.
                </p>
                <div className="flex items-center gap-2 pt-space-xs">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/30">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    <span className="font-label-sm text-label-sm text-on-surface font-medium">
                      All Systems Operational
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-space-sm">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold">
                  Platform
                </span>
                <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#workbench-preview">
                  Product Overview
                </a>
                <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#benchmark">
                  Synthetics &amp; Benchmarks
                </a>
                <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#architecture">
                  Connectors &amp; Integrations
                </a>
                <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#pricing">
                  Enterprise Pricing
                </a>
              </div>

              <div className="flex flex-col gap-space-sm">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold">
                  Architecture
                </span>
                <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#architecture">
                  Core Engine Whitepaper
                </a>
                <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#architecture">
                  Vector Consensus Spec
                </a>
                <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#benchmark">
                  Optical Retrieval Graph
                </a>
                <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" href="#workbench-preview">
                  Intelligence API
                </a>
              </div>

              <div className="flex flex-col gap-space-sm">
                <span className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold">
                  Assurance
                </span>
                <div className="flex flex-col gap-1.5 pt-0.5">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface font-label-sm text-label-sm w-fit">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>SOC2 Type II</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface font-label-sm text-label-sm w-fit">
                    <HeartHandshake className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>HIPAA Ready</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface font-label-sm text-label-sm w-fit">
                    <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>FIPS 140-3</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-space-sm text-on-surface-variant text-body-sm">
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                © 2026 Liora Intelligence Systems Inc. All rights reserved.
              </p>
              <div className="flex items-center gap-space-md">
                <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                  Privacy Policy
                </a>
                <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                  Terms of Service
                </a>
                <a className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors" href="#">
                  Trust Center
                </a>
              </div>
            </div>
          </div>
        </footer>

        {/* GIANT TYPOGRAPHIC LIORA WORDMARK */}
        <section className="w-full bg-white overflow-hidden select-none pb-12 pt-8 border-t border-outline-variant/20">
          <div className="w-full px-12 max-w-7xl mx-auto flex items-center justify-center">
            <svg
              className="w-full h-auto select-none block"
              fill="none"
              preserveAspectRatio="xMidYMid meet"
              viewBox="0 0 1140 280"
              xmlns="http://www.w3.org/2000/svg"
            >
              <text
                fill="#1B4EF5"
                fontFamily="'Plus Jakarta Sans', 'Arial Black', sans-serif"
                fontSize="260"
                fontWeight="900"
                lengthAdjust="spacingAndGlyphs"
                letterSpacing="-0.04em"
                textLength="100%"
                x="0"
                y="230"
              >
                LIORA
              </text>
            </svg>
          </div>
        </section>
      </div>
    </div>
  );
}
