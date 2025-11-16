// src/components/Sidebar.jsx
import { Home, ClipboardList, Users, LogOut, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const Sidebar = ({ isOpen, onClose }) => {
  const { pathname } = useLocation();
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

  const menus = [
    { name: "Dashboard", icon: <Home size={18} />, path: "/admin/dashboard" },
    { name: "Project", icon: <ClipboardList size={18} />, path: "/admin/projects" },
    { name: "User Management", icon: <Users size={18} />, path: "/admin/users" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  // Mobile Sidebar Overlay
  const MobileSidebar = () => (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && isMobile && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onClose}
          />
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-white z-50 shadow-lg transform transition-transform md:hidden">
            {/* Header dengan tombol close */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ManPro<span className="text-indigo-600">.</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Items */}
            <nav className="mt-4 space-y-1 mx-4">
              {menus.map((menu, idx) => {
                const isActive = pathname === menu.path;
                return (
                  <Link
                    key={idx}
                    to={menu.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-sm font-medium transition 
                      ${
                        isActive
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                          : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600"
                      }`}
                  >
                    {menu.icon}
                    {menu.name}
                  </Link>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="absolute bottom-4 left-4 right-4">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-full py-2.5 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/25"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );

  // Desktop sidebar component
  const DesktopSidebar = () => (
    <div className="h-screen w-56 bg-white flex-col justify-between shadow-md font-poppins hidden md:flex">
      {/* Logo */}
      <div>
        <div className="p-4 text-xl font-bold">
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ManPro<span className="text-indigo-600">.</span>
          </span>
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
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                      : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600"
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
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-full py-2.5 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/25"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <>
      <MobileSidebar />
      <DesktopSidebar />
    </>
  );
};

export default Sidebar;