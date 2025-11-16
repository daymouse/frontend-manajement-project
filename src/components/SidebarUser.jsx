// src/components/SidebarUser.jsx
import { Home, ClipboardList, LogOut, X, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const SidebarUser = ({ isOpen, onClose }) => {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Collapse otomatis jika di halaman user/board (hanya desktop)
  useEffect(() => {
    console.log("🔍 Current path:", pathname);
    if (!isMobile && pathname.startsWith("/user/board")) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [pathname, isMobile]);

  const menus = [
    { name: "Dashboard", icon: <Home size={18} />, path: "/user/dashboard" },
    { name: "Task", icon: <ClipboardList size={18} />, path: "/user/task" },
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
    <div
      className={`h-screen bg-white flex-col justify-between shadow-md font-poppins transition-all duration-300 hidden md:flex
        ${collapsed ? "w-14" : "w-56"}`}
    >
      {/* Logo */}
      <div>
        <div
          className={`p-4 text-xl font-bold whitespace-nowrap transition-opacity duration-300 ${
            collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ManPro<span className="text-indigo-600">.</span>
          </span>
        </div>

        {/* Menu Items */}
        <nav className="mt-4 space-y-1 mx-2">
          {menus.map((menu, idx) => {
            const isActive = pathname === menu.path;
            return (
              <div
                key={idx}
                className={`group relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition 
                ${
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                    : "text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-600"
                }`}
              >
                <Link
                  to={menu.path}
                  className={`flex items-center w-full ${collapsed ? "justify-center" : ""}`}
                >
                  {menu.icon}
                  {!collapsed && <span className="ml-3">{menu.name}</span>}
                </Link>

                {/* Tooltip saat collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 hidden group-hover:block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap z-50 shadow-lg">
                    {menu.name}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* Logout Section */}
      <div className="p-4">
        <button
          onClick={handleLogout}
          className={`bg-gradient-to-r from-blue-600 to-indigo-600 text-white w-full py-2.5 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2
            ${collapsed ? "" : ""}`}
        >
          {collapsed ? <LogOut size={18} /> : (
            <>
              <LogOut size={18} />
              Logout
            </>
          )}
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

export default SidebarUser;