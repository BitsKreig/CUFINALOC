// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-16 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="container mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left side — Brand */}
        <div className="flex items-center gap-2">
          <h1 className="font-display text-xl tracking-tight">
            <span className="text-cyan-600 dark:text-cyan-400 font-semibold">
              Opti
            </span>
            <span className="text-gray-900 dark:text-white font-semibold">
              Class
            </span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>

        {/* Center — Navigation Links */}
        <div className="flex flex-wrap justify-end gap-4 text-sm">
          <Link
            to="/landing"
            className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-300"
          >
            Home
          </Link>
          <Link
            to="/app"
            className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-300"
          >
            Scheduler
          </Link>
          <a
            href="/schema_template.csv"
            download
            className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-300"
          >
            DB Template
          </a>
          <Link
            to="/register"
            className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-300"
          >
            Register
          </Link>
          <Link
            to="/"
            className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-300"
          >
            Login
          </Link>
        </div>

        {/* Right side — Social Links */}
        <div className="flex gap-4">
          {/* GitHub */}
          <a
            href="https://github.com/BitsKreig"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors-transform duration-300 hover:scale-110"
            aria-label="GitHub"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-6 h-6"
            >
              <path d="M12 0C5.37 0 0 5.373 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.263.82-.582 0-.288-.01-1.05-.016-2.06-3.338.726-4.042-1.612-4.042-1.612-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.776.42-1.304.763-1.604-2.665-.305-5.466-1.333-5.466-5.932 0-1.31.467-2.382 1.235-3.222-.124-.303-.535-1.524.118-3.176 0 0 1.008-.322 3.3 1.23A11.48 11.48 0 0 1 12 5.8a11.48 11.48 0 0 1 3.006.404c2.29-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.233 1.912 1.233 3.222 0 4.61-2.804 5.624-5.476 5.922.43.37.823 1.102.823 2.222 0 1.604-.015 2.896-.015 3.293 0 .322.218.7.825.58C20.565 21.796 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
          </a>

          {/* LinkedIn */}
          <a
            href="https://linkedin.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors-transform duration-300 hover:scale-110"
            aria-label="LinkedIn"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
              viewBox="0 0 24 24"
              className="w-6 h-6"
            >
              <path d="M19 0h-14C2.239 0 0 2.239 0 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5V5c0-2.761-2.238-5-5-5zM8.339 18.339H5.667V9.667h2.672v8.672zM7.003 8.498a1.551 1.551 0 1 1 0-3.103 1.551 1.551 0 0 1 0 3.103zm11.336 9.841h-2.672v-4.083c0-.974-.017-2.228-1.357-2.228-1.359 0-1.567 1.061-1.567 2.158v4.153h-2.672V9.667h2.564v1.183h.036c.357-.675 1.23-1.387 2.533-1.387 2.71 0 3.209 1.785 3.209 4.104v4.772z" />
            </svg>
          </a>
        </div>

      </div>
    </footer>
  );
};

export default Footer;