import { Outlet, Routes, Route, Navigate } from "react-router-dom";
import BoardLeader from "./pages/admin/BoardUser";
import NavbarBoardLeader from "../components/BoardNavbarLeader";
import Statistik from "./pages/admin/Statistik";
import CalendarComponent from "./pages/admin/Calender";
import Chat from "./pages/admin/Chats";

export default function BoardAdminApp() {
  return (
    <div className="flex min-h-screen bg-gray-200">
      <main className="flex-1 bg-gray-200">
         <NavbarBoardLeader />
        <Routes>
          <Route index element={<BoardLeader />} />
           <Route path="calendar" element={<CalendarComponent />} />
           <Route path="chat" element={<Chat />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>
        <Outlet />
      </main>
    </div>
  );
}
