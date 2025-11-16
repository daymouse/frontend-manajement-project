import { Outlet } from "react-router-dom";
import SidebarUser from "../../components/SidebarUser";
import NavbarUser from "../../components/NavbarUser";
import { useState } from "react";

function UserApp() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-200 font-poppins" style={{ height: '100vh' }}>
      <SidebarUser 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar} 
      />
      <div className="flex-1 p-2 min-h-screen"> 
        <div className="bg-gray-200 overflow-auto rounded-3xl p-4" style={{ height: 'calc(100vh - 1rem)' }}>
        <NavbarUser onMenuClick={handleMenuClick} />
        <Outlet /> 
        </div>
      </div>
    </div>
  );
}

export default UserApp;