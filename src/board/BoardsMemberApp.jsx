import { Outlet, Routes, Route, Navigate } from "react-router-dom";
import BoardMember from "./pages/member/BoardMember";
import NavbarBoardUser from "../components/BoardNavbarUser";
import CalendarComponent from "./pages/member/Calender";
import Chat from "./pages/member/Chat";

export default function BoardMemberApp() {
  return (
    <div className="flex min-h-screen bg-gray-200">
      <main className="flex-1 bg-gray-200">
        <NavbarBoardUser />
        <Routes>
          {/* Halaman default (list board atau task user) */}
          <Route index element={<BoardMember />} />

          {/* Halaman statistik user */}
          <Route path="calender" element={<CalendarComponent />} />

          <Route path="chat" element={<Chat />} />

          {/* Fallback kalau route tidak cocok */}
          <Route path="*" element={<Navigate to="." replace />} />
        </Routes>

        <Outlet />
      </main>
    </div>
  );
}
