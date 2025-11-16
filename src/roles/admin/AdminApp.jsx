// AdminApp.jsx
import { Outlet } from "react-router-dom";
import SidebarAdmin from "../../components/SidebarAdmin";
import NavbarAdmin from "../../components/NavbarAdmin";
import { useState } from "react";

function AdminApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex  bg-gray-200 font-poppins" style={{ height: '100vh' }}>
      <SidebarAdmin 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
      />
      <div className="flex-1 p-2 min-h-screen"> 
        <div className="bg-gray-200 overflow-auto rounded-3xl p-4" style={{ height: 'calc(100vh - 1rem)' }}>
          <NavbarAdmin onMenuClick={handleMenuClick} />
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminApp;