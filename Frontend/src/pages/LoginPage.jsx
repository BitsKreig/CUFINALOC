import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useTheme from "../useTheme";
import ThemeToggle from "../components/ThemeToggle";

export default function LoginPage() {
  const [form, setForm] = useState({
    instituteCode: "",
    userId: "",
    password: "",
    role: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.instituteCode || !form.userId || !form.password || !form.role) {
      alert("Please fill in all required fields before logging in.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Login successful!");
        navigate("/app");
      } else {
        alert(data.message || "Institute not registered. Redirecting to Sign Up...");
        navigate("/RegisterPage");
      }
    } catch (err) {
      console.error(err);
      alert("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-700">
      {/* Floating gradient blob */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[80%] h-[50%] bg-gradient-to-r from-cyan-300/30 to-blue-300/20 blur-3xl rounded-full pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <h1 className="font-display text-3xl tracking-tight relative">
            <span className="text-blue-700 dark:text-cyan-400 font-bold">Opti</span>
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent font-bold">
              Class
            </span>
            <span className="absolute bottom-0 left-0 w-16 h-[3px] bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full"></span>
          </h1>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 items-center justify-center p-8 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center w-full max-w-6xl">
          {/* Left illustration */}
          <div className="hidden md:flex justify-center items-center relative">
            <img
              src="/images/Mathematics-bro.svg"
              alt="Login Page Illustration"
              className="w-4/5 h-auto rounded-2xl drop-shadow-2xl animate-fadeInSlow glow-animate float-animate hover:scale-[1.03] transition-transform duration-700"
            />
          </div>

          {/* Login Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6 hover:shadow-2xl transition-all duration-500">
            <h2 className="text-2xl font-semibold mb-4 text-center text-gray-900 dark:text-gray-100">
              Institute Login
            </h2>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="text"
                name="instituteCode"
                placeholder="Institute Code"
                value={form.instituteCode}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                required
              />

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                required
              >
                <option value="">Select Role</option>
                <option value="Admin">Admin</option>
                <option value="Faculty">Faculty</option>
                <option value="Student">Student</option>
              </select>

              <input
                type="text"
                name="userId"
                placeholder="User ID"
                value={form.userId}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 p-3 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
              >
                {loading ? "Verifying..." : "Login"}
              </button>
            </form>

            <p className="text-center mt-4 text-sm text-gray-700 dark:text-gray-300">
              Not registered?{" "}
              <button
                onClick={() => navigate("/register")}

                className="text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Register your Institute
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
