// main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./useTheme";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LandingPage from "./pages/LandingPage";
import App from "./pages/App";
import Timetable from "./pages/TimeTable";
import MainLayout from "./layouts/MainLayout";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LoginPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/app" element={<App />} />
          <Route path="/timetable" element={<Timetable />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  </BrowserRouter>
);
