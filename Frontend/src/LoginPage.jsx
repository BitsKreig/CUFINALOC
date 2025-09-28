import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "./components/BackButton";
import useTheme from "./useTheme";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogin = (e) => {
    e.preventDefault();
    // Dummy check — you can skip this if you just want redirect
    if (username.trim() && password.trim()) {
      navigate("/landing"); // Redirect to landing page first
    } else {
      alert("Enter username & password!");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-ink-100">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <BackButton fallback="/landing" />
            <h1 className="font-display text-2xl md:text-3xl tracking-tight">
              <span className="text-brand-700">Opti</span>
              <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 bg-clip-text text-transparent">Class</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink-600">
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="btn-ghost"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
            </button>
          </div>
        </div>
      </header>
      <div className="flex items-center justify-center py-10">
      <div className="card p-8 w-full max-w-md shadow-card">
        <div className="text-center mb-6">
          <h2 className="font-display text-2xl text-ink-900">Welcome back</h2>
          <p className="text-sm text-ink-600 mt-1">Sign in to continue</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="label" htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              placeholder="Enter username"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary w-full">Login</button>
        </form>
      </div>
      </div>
    </div>
  );
}