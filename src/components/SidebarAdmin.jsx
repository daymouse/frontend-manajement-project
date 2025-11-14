// src/components/Sidebar.jsx
import { Home, ClipboardList, Settings, BarChart2, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

const Sidebar = () => {
  const { pathname } = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Close sidebar when route changes on mobile
  useEffect(() => {
    if (isMobile && isOpen) {
      setIsOpen(false);
    }
  }, [pathname, isMobile]);

  const menus = [
    { name: "Dashboard", icon: <Home size={18} />, path: "/admin/dashboard" },
    { name: "Project", icon: <ClipboardList size={18} />, path: "/admin/projects" },
    { name: "User Management", icon: <ClipboardList size={18} />, path: "/admin/users" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Mobile navbar component
  const MobileNavbar = () => (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 md:hidden">
      <div className="flex items-center justify-between p-4">
        <div className="text-xl font-bold">
          ManPro<span className="text-purple-600">.</span>
        </div>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-16 left-0 bottom-0 w-64 bg-white z-50 shadow-lg transform transition-transform">
            <nav className="mt-4 space-y-1 mx-4">
              {menus.map((menu, idx) => {
                const isActive = pathname === menu.path;
                return (
                  <Link
                    key={idx}
                    to={menu.path}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition 
                      ${
                        isActive
                          ? "bg-purple-100 text-purple-600"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    {menu.icon}
                    {menu.name}
                  </Link>
                );
              })}
            </nav>

            <div className="absolute bottom-4 left-4 right-4">
              <button
                onClick={handleLogout}
                className="bg-purple-600 text-white w-full py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
              >
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Desktop sidebar component
  const DesktopSidebar = () => (
    <div className="h-screen w-56 bg-white  flex-col justify-between shadow-md font-poppins hidden md:flex">
      {/* Logo */}
      <div>
        <div className="p-4 text-xl font-bold">
          ManPro<span className="text-purple-600">.</span>
        </div>

        {/* Menu Items */}
        <nav className="mt-4 space-y-1 mx-4">
          {menus.map((menu, idx) => {
            const isActive = pathname === menu.path;
            return (
              <Link
                key={idx}
                to={menu.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition 
                  ${
                    isActive
                      ? "bg-purple-100 text-purple-600"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                {menu.icon}
                {menu.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout Section */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className="bg-purple-600 text-white w-full py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
        >
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <MobileNavbar />
      <DesktopSidebar />
      
      {/* Add padding top for mobile to account for fixed navbar */}
      {isMobile && <div className="h-16 md:h-0"></div>}
    </>
  );
};

export default Sidebar;