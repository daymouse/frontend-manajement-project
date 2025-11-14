import { Outlet } from "react-router-dom";
import SidebarUser from "../../components/SidebarUser";
import Navbar from "../../components/NavbarUser";


function UserApp() {
  return (
    <div className="flex min-h-screen bg-gray-200 font-poppins">
      <SidebarUser />
      <main className="flex-1 m-4 bg-gray-200">
        <Outlet /> 
      </main>
    </div>
  );
}

export default UserApp;
