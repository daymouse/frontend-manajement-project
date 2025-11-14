// src/components/Sidebar.jsx
import { Home, ClipboardList, Settings, BarChart2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const Sidebar = () => {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Collapse otomatis jika di halaman user/board
  useEffect(() => {
    console.log("🔍 Current path:", pathname);
    if (pathname.startsWith("/user/board")) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [pathname]);

  const menus = [
    { name: "Dashboard", icon: <Home size={18} />, path: "/user/dashboard" },
    { name: "Task", icon: <ClipboardList size={18} />, path: "/user/task" },
  ];

  return (
    <div
      className={`h-screen bg-white flex flex-col justify-between shadow-md font-poppins transition-all duration-300
        ${collapsed ? "w-14" : "w-56"}`}
    >
      {/* Logo */}
      <div>
        <div
          className={`p-4 text-xl font-bold whitespace-nowrap transition-opacity duration-300 ${
            collapsed ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          ManPro<span className="text-purple-600">.</span>
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
                    ? "bg-purple-100 text-purple-600"
                    : "text-gray-600 hover:bg-gray-100"
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
                  <div className="absolute left-full ml-2 hidden group-hover:block bg-white shadow-lg px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap z-50">
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
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
          className={`bg-purple-600 text-white w-full py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-all duration-300
            ${collapsed ? "flex justify-center" : ""}`}
        >
          {collapsed ? <Settings size={18} /> : "Logout"}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
