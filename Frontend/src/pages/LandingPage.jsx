import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import useTheme from "../useTheme";
import ThemeToggle from "../components/ThemeToggle";

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // --- For reveal animations (already correct) ---
  useEffect(() => {
    const els = Array.from(document.querySelectorAll(".reveal-y, .reveal-x"));
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target); // ✅ prevents flicker
          }
        }
      },
      { threshold: 0.12 }
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let scrollPos = 0;
    const handleScroll = (e) => {
      e.preventDefault();
      scrollPos += e.deltaY * 1; // lower = slower
      window.scrollTo({
        top: scrollPos,
        behavior: "smooth",
      });
    };
    window.addEventListener("wheel", handleScroll, { passive: false });
    return () => window.removeEventListener("wheel", handleScroll);
  }, []);

  // --- For institute counter animation ---
  useEffect(() => {
    const counterEl = document.getElementById("institute-counter");
    const target = 126; // Final number
    let animationFrame;

    const countUp = () => {
      let current = 0;
      const increment = target / 100; // Controls speed

      const animate = () => {
        if (current < target) {
          current += increment;
          counterEl.textContent = Math.floor(current);
          animationFrame = requestAnimationFrame(animate);
        } else {
          counterEl.textContent = target;
          cancelAnimationFrame(animationFrame);
        }
      };
      animate();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            countUp(); // 🔁 run each time it enters view
          } else {
            // optional reset to 0 when it leaves the screen
            counterEl.textContent = "0";
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% of section is visible
    );

    const section = document.getElementById("institutes-section");
    if (section) observer.observe(section);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
    };
  }, []);
  return (
    <div
      className="relative min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-hidden"
    >
      {/* Background image layer */}
      <div
        className="absolute inset-0 bg-cover bg-center filter blur-sm scale-105"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?auto=format&fit=crop&w=1600&q=80')",
        }}
      ></div>

      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
        <div className="container flex flex-wrap items-center justify-between h-16 px-4">
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
              <Link
                to="/landing"
                className="btn-ghost transition-colors duration-300"
              >
                Home
              </Link>
            </nav>

            {/* Login and Register Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/")}
                className="btn-ghost text-sm transition-colors duration-300"
              >
                Login
              </button>
              <button
                onClick={() => navigate("/register")}
                className="btn-primary text-sm transition-colors duration-300"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-14 md:py-20 transition-colors duration-300 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div className="bg-white/70 dark:bg-gray-800/70 p-6 rounded-xl backdrop-blur-sm">
            <h2
              className="font-display text-3xl md:text-5xl leading-tight text-gray-900 dark:text-gray-100 reveal-y reveal-delay transition-colors duration-300"
              style={{ "--delay": "0ms" }}
            >
              Smarter Scheduling. Better Learning.
            </h2>
            <p
              className="mt-4 text-gray-700 dark:text-gray-300 text-base md:text-lg reveal-y reveal-delay transition-colors duration-300"
              style={{ "--delay": "80ms" }}
            >
              OptiClass uses your institute’s database to automatically build
              optimized, conflict-free timetables — reducing stress for
              administrators, faculty, and students alike.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="btn-primary hover-lift reveal-y reveal-delay transition-colors duration-300"
                style={{ "--delay": "140ms" }}
                onClick={() => navigate("/")}
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

          {/* Updated 3-step Card */}
          <div
            className="card p-6 shadow-card reveal-x hover-lift bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 backdrop-blur-sm transition-colors duration-300"
            style={{ "--delay": "220ms" }}
          >
            <div className="space-y-3">
              {[
                [
                  "1",
                  "Seamless Data Integration",
                  "Automatically fetches class, faculty, and subject details directly from your institute’s database — no manual entry needed.",
                ],
                [
                  "2",
                  "Optimized, Clash-Free Timetables",
                  "Our intelligent scheduling algorithm eliminates class and faculty clashes while ensuring efficient use of time and resources.",
                ],
                [
                  "3",
                  "Stress-Free Planning for All",
                  "Students and faculty both benefit from balanced loads, smarter distribution, and perfectly optimized timetables.",
                ],
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
      <section id="features" className="container pb-16 transition-colors duration-300 relative z-10">
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
              className="card p-5 hover-lift reveal-y reveal-delay bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-300 backdrop-blur-sm"
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

      {/* Database Schema Template Section */}
      <section className="container pb-16 transition-colors duration-300 relative z-10">
        <div className="bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-md backdrop-blur-sm text-center">
          <h2 className="text-2xl font-semibold mb-3 text-brand-700">
            Database Schema Template
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Download the CSV template to set up your institute’s database schema.
          </p>
          <a
            href="/schema_template.csv"
            download
            className="btn-primary hover-lift transition-colors duration-300"
          >
            Download Template (.csv)
          </a>
        </div>
      </section>

      {/* Registered Institutes Section */}
      <section className="container pb-20 transition-colors duration-300 relative z-10">
        <div
          id="institutes-section"
          className="bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-md text-center backdrop-blur-sm"
        >
          <h2 className="text-2xl font-semibold text-brand-700 mb-2">
            Institutes Using OptiClass
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Join our growing network of educational institutions.
          </p>
          <div id="institute-counter" className="text-4xl font-bold text-brand-700">
            0
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            institutes and counting 🚀
          </p>
        </div>
      </section>
    </div>
  );
}
