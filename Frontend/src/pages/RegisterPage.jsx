import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useTheme from "../useTheme";
import ThemeToggle from "../components/ThemeToggle";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    instituteName: "",
    instituteEmail: "",
    databaseDetails: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.instituteName.trim() ||
      !formData.instituteEmail.trim() ||
      !formData.databaseDetails.trim() ||
      !formData.password.trim() ||
      !formData.confirmPassword.trim()
    ) {
      return setError("⚠️ Please fill in all required fields.");
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.instituteEmail)) {
      return setError("⚠️ Please enter a valid email address.");
    }

    // Password match check
    if (formData.password !== formData.confirmPassword) {
      return setError("⚠️ Passwords do not match.");
    }

    // Create JSON object
    const payload = {
      instituteName: formData.instituteName,
      instituteEmail: formData.instituteEmail,
      databaseDetails: formData.databaseDetails, // keep as string
      password: formData.password,
    };

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ Registration successful!");
        navigate("/login");
      } else {
        setError(data.message || "❌ Registration failed.");
      }
    } catch (err) {
      console.error(err);
      setError("❌ Server error. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-all">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <h1 className="font-display text-3xl tracking-tight">
            <span className="text-blue-700 dark:text-cyan-400 font-bold">Opti</span>
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent font-bold">
              Class
            </span>
          </h1>
          <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        </div>
      </header>

      {/* Main Form */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6 transition-all duration-500 hover:shadow-2xl">
          <h2 className="text-center font-display text-2xl text-gray-900 dark:text-gray-100">
            Register Your Institute
          </h2>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Fill out the details to get started.
          </p>

          {error && (
            <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-gray-900 p-2 rounded-md text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="instituteName" className="block mb-1">Institute Name</label>
              <input
                type="text"
                id="instituteName"
                name="instituteName"
                value={formData.instituteName}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                placeholder="Enter institute name"
              />
            </div>

            <div>
              <label htmlFor="instituteEmail" className="block mb-1">Institute Email</label>
              <input
                type="email"
                id="instituteEmail"
                name="instituteEmail"
                value={formData.instituteEmail}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                placeholder="Enter official email"
              />
            </div>

            <div>
              <label htmlFor="databaseDetails" className="block mb-1">Database Details</label>
              <textarea
                id="databaseDetails"
                name="databaseDetails"
                value={formData.databaseDetails}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                placeholder='Enter DB details (e.g. {"host":"localhost","port":5432})'
                rows="3"
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
                placeholder="Create password"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block mb-1">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
