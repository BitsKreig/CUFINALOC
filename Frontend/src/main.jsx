import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./useTheme";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import App from "./pages/App";
import Timetable from "./pages/TimeTable";
// import Register from "./pages/Register"; // if you have this page
import MainLayout from "./layouts/MainLayout"; // ✅ Import the layout
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
          {/* <Route path="/register" element={<Register />} /> */}
        </Route>
      </Routes>
    </ThemeProvider>
  </BrowserRouter>
);