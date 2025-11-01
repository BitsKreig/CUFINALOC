import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import ThemeToggle from "../components/ThemeToggle";
import useTheme from "../useTheme";

export default function LoginPage() {
  const [formData, setFormData] = useState({ username: "", password: "", email: "" });
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Login successful!");
        navigate("/landing");
      } else {
        alert(data.message || "Invalid credentials");
      }
    } catch (error) {
      alert("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (response.ok) {
        alert("Password reset link sent!");
        setForgotMode(false);
      } else {
        alert(data.message || "Email not found");
      }
    } catch (error) {
      alert("Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-500">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <BackButton fallback="/landing" />
            <h1 className="font-display text-3xl tracking-tight">
              <span className="text-blue-700 dark:text-cyan-400 font-bold">Opti</span>
              <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent font-bold">
                Class
              </span>
            </h1>
          </div>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </header>

      {/* Main Card */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6 transition-all duration-500 hover:shadow-2xl">
          <h2 className="text-center font-display text-2xl">
            {forgotMode ? "Forgot Password" : "Welcome Back"}
          </h2>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {forgotMode
              ? "Enter your registered email to reset your password."
              : "Login to access your dashboard."}
          </p>

          <form
            onSubmit={forgotMode ? handleForgotPassword : handleLogin}
            className="space-y-4"
          >
            {!forgotMode && (
              <>
                <div>
                  <label htmlFor="username" className="block mb-1">Username</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block mb-1">Password</label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                    placeholder="Enter password"
                  />
                </div>
              </>
            )}

            {forgotMode && (
              <div>
                <label htmlFor="email" className="block mb-1">Registered Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                  placeholder="Enter your email"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all"
            >
              {loading ? "Processing..." : forgotMode ? "Send Reset Link" : "Login"}
            </button>
          </form>

          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            {forgotMode ? (
              <button
                onClick={() => setForgotMode(false)}
                className="text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Back to Login
              </button>
            ) : (
              <button
                onClick={() => setForgotMode(true)}
                className="text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Forgot Password?
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
