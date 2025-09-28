import React from "react";
import { useNavigate, Link } from "react-router-dom";
import BackButton from "./components/BackButton";
import useTheme from "./useTheme";

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-ink-100">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="font-display text-2xl md:text-3xl tracking-tight">
              <span className="text-brand-700">Opti</span>
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">Class</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="btn-ghost text-sm"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
            <nav className="hidden sm:flex items-center gap-3 text-sm">
              <Link to="/landing" className="btn-ghost">Home</Link>
              <button onClick={() => navigate('/app')} className="btn-primary">Open Scheduler</button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-5xl leading-tight text-ink-900">
              Schedule smarter. Teach better.
            </h2>
            <p className="mt-4 text-ink-600 text-base md:text-lg">
              OptiClass generates optimized class timetables for your batches and phases—
              fast, conflict-free, and easy to share.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button className="btn-primary" onClick={() => navigate('/app')}>Get Started</button>
              <a className="btn-ghost" href="#features">Learn more</a>
            </div>
          </div>
          <div className="card p-6 shadow-card">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center">1</div>
                <div>
                  <div className="font-medium">Define batches & phases</div>
                  <div className="text-sm text-ink-600">Tell us how your classes are grouped.</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center">2</div>
                <div>
                  <div className="font-medium">Add subjects & credits</div>
                  <div className="text-sm text-ink-600">We optimize around your load.</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center">3</div>
                <div>
                  <div className="font-medium">Generate & export</div>
                  <div className="text-sm text-ink-600">Share as PDF or Excel in one click.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[{
            title: 'Optimized schedules',
            body: 'Automatic conflict resolution across phases and options.'
          }, {
            title: 'Share-ready exports',
            body: 'Export beautiful PDFs and structured Excel sheets.'
          }, {
            title: 'Clean, interactive UI',
            body: 'Scroll by batch, phase, and option without losing context.'
          }].map((f, i) => (
            <div key={i} className="card p-5">
              <div className="text-brand-700 font-semibold mb-1">{f.title}</div>
              <div className="text-ink-600 text-sm">{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-20">
        <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="font-display text-xl text-ink-900">Ready to build your timetable?</div>
            <div className="text-ink-600 text-sm">Jump into the scheduler and generate optimized plans.</div>
          </div>
          <button className="btn-primary" onClick={() => navigate('/app')}>Open Scheduler</button>
        </div>
      </section>
    </div>
  );
}
