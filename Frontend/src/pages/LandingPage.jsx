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
          if (entry.isIntersecting) entry.target.classList.add("in-view");
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
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      sessionStorage.removeItem("authToken");
    } catch (_) {}
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
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
              <Link to="/landing" className="btn-ghost transition-colors duration-300">
                Home
              </Link>
              <button
                onClick={() => navigate("/app")}
                className="btn-primary transition-colors duration-300"
              >
                Open Scheduler
              </button>
            </nav>

            <button
              className="btn-ghost text-sm transition-colors duration-300"
              onClick={handleLogout}
              title="Log out"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-14 md:py-20 transition-colors duration-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h2
              className="font-display text-3xl md:text-5xl leading-tight text-gray-900 dark:text-gray-100 reveal-y reveal-delay transition-colors duration-300"
              style={{ "--delay": "0ms" }}
            >
              Schedule smarter. Teach better.
            </h2>
            <p
              className="mt-4 text-gray-700 dark:text-gray-300 text-base md:text-lg reveal-y reveal-delay transition-colors duration-300"
              style={{ "--delay": "80ms" }}
            >
              OptiClass generates optimized class timetables for your batches
              and phases—fast, conflict-free, and easy to share.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="btn-primary hover-lift reveal-y reveal-delay transition-colors duration-300"
                style={{ "--delay": "140ms" }}
                onClick={() => navigate("/app")}
              >
                Get Started
              </button>

              <a
                className="btn-ghost hover-lift reveal-y reveal-delay transition-colors duration-300"
                style={{ "--delay": "180ms" }}
                href="#features"
              >
                Learn more
              </a>
            </div>
          </div>

          <div
            className="card p-6 shadow-card reveal-x hover-lift bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors duration-300"
            style={{ "--delay": "220ms" }}
          >
            <div className="space-y-3">
              {[
                ["1", "Define batches & phases", "Tell us how your classes are grouped."],
                ["2", "Add subjects & credits", "We optimize around your load."],
                ["3", "Generate & export", "Share as PDF or Excel in one click."],
              ].map(([num, title, body], i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 reveal-y reveal-delay transition-colors duration-300"
                  style={{ "--delay": `${i * 80}ms` }}
                >
                  <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center float-slow">
                    {num}
                  </div>
                  <div>
                    <div className="font-medium">{title}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container pb-16 transition-colors duration-300">
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
              className="card p-5 hover-lift reveal-y reveal-delay bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300"
              style={{ "--delay": `${i * 100}ms` }}
            >
              <div className="text-brand-700 font-semibold mb-1">{f.title}</div>
              <div className="text-gray-700 dark:text-gray-300 text-sm">
                {f.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container pb-20 transition-colors duration-300">
        <div className="card p-6 flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 shadow-md transition-colors duration-300 hover-lift">
          <div>
            <div className="font-display text-xl text-gray-900 dark:text-gray-100 transition-colors duration-300">
              Ready to build your timetable?
            </div>
            <div className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
              Jump into the scheduler and generate optimized plans.
            </div>
          </div>
          <button
            className="btn-primary hover-lift transition-colors duration-300"
            onClick={() => navigate("/app")}
          >
            Open Scheduler
          </button>
        </div>
      </section>
    </div>
  );
}
