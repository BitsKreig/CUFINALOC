import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useTheme from "../useTheme";
import ThemeToggle from "../components/ThemeToggle";
import confetti from "canvas-confetti";
import { FaUniversity, FaEnvelope, FaDatabase, FaLock } from "react-icons/fa";

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.instituteEmail)) {
      return setError("⚠️ Please enter a valid email address.");
    }

    if (formData.password !== formData.confirmPassword) {
      return setError("⚠️ Passwords do not match.");
    }

    const payload = {
      instituteName: formData.instituteName,
      instituteEmail: formData.instituteEmail,
      databaseDetails: formData.databaseDetails,
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
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        alert("✅ Registration successful!");
        navigate("/");
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
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-700">
      {/* Decorative gradient blob */}
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

      {/* Content */}
      <div className="flex flex-1 items-center justify-center p-8 animate-fadeIn">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center w-full max-w-6xl">
          {/* Left Illustration with Floating Glow Animation */}
            <div className="hidden md:flex justify-center items-center relative">
        <img
        src="/images/Learning-amico.svg"
        alt="AI Education Illustration"
        className="w-4/5 h-auto rounded-2xl drop-shadow-2xl animate-fadeInSlow glow-animate float-animate hover:scale-[1.03] transition-transform duration-700"
            />
    </div>


          {/* Registration Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-6 transform transition-all duration-500 hover:shadow-2xl">
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
              {/* Institute Name */}
              <div className="relative">
                <FaUniversity className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  name="instituteName"
                  placeholder="Institute Name"
                  value={formData.instituteName}
                  onChange={handleChange}
                  className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  name="instituteEmail"
                  placeholder="Institute Email"
                  value={formData.instituteEmail}
                  onChange={handleChange}
                  className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              {/* Database Details */}
              <div className="relative">
                <FaDatabase className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <textarea
                  name="databaseDetails"
                  placeholder='Database Details (e.g. {"host":"localhost","port":5432})'
                  value={formData.databaseDetails}
                  onChange={handleChange}
                  rows="3"
                  className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <FaLock className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 w-full border border-gray-300 dark:border-gray-600 rounded-md p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg"
              >
                {loading ? "Registering..." : "Register"}
              </button>

              {/* Back to Login */}
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Already registered?{" "}
                <button
                  onClick={() => navigate("/")}
                  className="text-cyan-600 hover:underline dark:text-cyan-400"
                >
                  Go to Login
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
