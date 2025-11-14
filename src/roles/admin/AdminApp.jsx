// AdminApp.jsx
import { Outlet } from "react-router-dom";
import SidebarAdmin from "../../components/SidebarAdmin";
import NavbarAdmin from "../../components/NavbarAdmin";

function AdminApp() {
  return (
    <div className="flex min-h-screen bg-gray-200">
      <SidebarAdmin />
      <main className="flex-1 m-4 bg-gray-200">
        <Outlet /> 
      </main>
    </div>
  );
}

export default AdminApp;
