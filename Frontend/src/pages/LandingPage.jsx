import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import useTheme from "../useTheme";
import ThemeToggle from "../components/ThemeToggle";
export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".reveal-y, .reveal-x"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            entry.target.classList.add("in-view");
          else entry.target.classList.remove("in-view");
        }
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleLogout = () => {
    try {
      // Clear common auth artifacts if present
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
    } catch (_) {}

    navigate("/");
  };

  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-ink-100">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl md:text-3xl tracking-tight">
              <span className="text-brand-700">Opti</span>
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">
                Class
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

            <nav className="hidden sm:flex items-center gap-3 text-sm">
              <Link to="/landing" className="btn-ghost">
                Home
              </Link>
              <button
                onClick={() => navigate("/app")}
                className="btn-primary"
              >
                Open Scheduler
              </button>
            </nav>

            <button
              className="btn-ghost text-sm"
              onClick={handleLogout}
              title="Log out"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-14 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2
              className="font-display text-3xl md:text-5xl leading-tight text-ink-900 reveal-y reveal-delay"
              style={{ "--delay": "0ms" }}
            >
              Schedule smarter. Teach better.
            </h2>
            <p
              className="mt-4 text-ink-600 text-base md:text-lg reveal-y reveal-delay"
              style={{ "--delay": "80ms" }}
            >
              OptiClass generates optimized class timetables for your batches
              and phases—fast, conflict-free, and easy to share.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="btn-primary hover-lift reveal-y reveal-delay"
                style={{ "--delay": "140ms" }}
                onClick={() => navigate("/app")}
              >
                Get Started
              </button>

              <a
                className="btn-ghost hover-lift reveal-y reveal-delay"
                style={{ "--delay": "180ms" }}
                href="#features"
              >
                Learn more
              </a>
            </div>
          </div>

          <div
            className="card p-6 shadow-card reveal-x hover-lift"
            style={{ "--delay": "220ms" }}
          >
            <div className="space-y-3">
              <div
                className="flex items-center gap-3 reveal-y reveal-delay"
                style={{ "--delay": "0ms" }}
              >
                <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center float-slow">
                  1
                </div>
                <div>
                  <div className="font-medium">Define batches & phases</div>
                  <div className="text-sm text-ink-600">
                    Tell us how your classes are grouped.
                  </div>
                </div>
              </div>

              <div
                className="flex items-center gap-3 reveal-y reveal-delay"
                style={{ "--delay": "80ms" }}
              >
                <div
                  className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center float-slow"
                  style={{ animationDelay: "400ms" }}
                >
                  2
                </div>
                <div>
                  <div className="font-medium">Add subjects & credits</div>
                  <div className="text-sm text-ink-600">
                    We optimize around your load.
                  </div>
                </div>
              </div>

              <div
                className="flex items-center gap-3 reveal-y reveal-delay"
                style={{ "--delay": "160ms" }}
              >
                <div
                  className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center float-slow"
                  style={{ animationDelay: "800ms" }}
                >
                  3
                </div>
                <div>
                  <div className="font-medium">Generate & export</div>
                  <div className="text-sm text-ink-600">
                    Share as PDF or Excel in one click.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Optimized schedules",
              body: "Automatic conflict resolution across phases and options.",
            },
            {
              title: "Share-ready exports",
              body: "Export beautiful PDFs and structured Excel sheets.",
            },
            {
              title: "Clean, interactive UI",
              body: "Scroll by batch, phase, and option without losing context.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="card p-5 hover-lift reveal-y reveal-delay"
              style={{ "--delay": `${i * 100}ms` }}
            >
              <div className="text-brand-700 font-semibold mb-1">
                {f.title}
              </div>
              <div className="text-ink-600 text-sm">{f.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container pb-20">
        <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4 reveal-y hover-lift">
          <div>
            <div className="font-display text-xl text-ink-900">
              Ready to build your timetable?
            </div>
            <div className="text-ink-600 text-sm">
              Jump into the scheduler and generate optimized plans.
            </div>
          </div>
          <button
            className="btn-primary hover-lift"
            onClick={() => navigate("/app")}
          >
            Open Scheduler
          </button>
        </div>
      </section>
    </div>
  );
}
