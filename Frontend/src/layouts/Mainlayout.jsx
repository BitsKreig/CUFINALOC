import { Outlet } from "react-router-dom";
import Footer from "../components/Footer";

const MainLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <div className="flex-grow">
        <Outlet /> {/* This is where the current page content will load */}
      </div>
      <Footer /> {/* This stays fixed at the bottom of all pages */}
    </div>
  );
};

export default MainLayout;
