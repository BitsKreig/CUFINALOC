import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import LandingPage from "./pages/LandingPage";
import App from "./pages/App";
import Timetable from "./pages/Timetable";
import { ThemeProvider } from "./useTheme";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/app" element={<App />} />
        <Route path="/timetable" element={<Timetable />} />
      </Routes>
    </BrowserRouter>
  </ThemeProvider>
);