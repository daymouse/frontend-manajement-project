import { useParams } from "react-router-dom";
import { useEffect, useState, Suspense, lazy } from "react";
import { apiFetch } from "../../Server";

// Lazy load normal untuk pemisahan bundle (tidak berdasarkan role)
const BoardsAdminApp = lazy(() => import("../../board/BoardsAdminApp.jsx"));
const BoardsMemberApp = lazy(() => import("../../board/BoardsMemberApp.jsx"));

export default function ProjectRoleRoute() {
  const { board_id } = useParams();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const data = await apiFetch(`/project/${board_id}/member-role`, "GET");
        const userRole = data.role || data.data?.role;

        console.log("🎯 Role ditemukan:", userRole);
        setRole(userRole);
      } catch (err) {
        console.error("🔥 Gagal ambil role:", err);
        setRole("denied");
      } finally {
        setLoading(false);
      }
    };

    checkRole();
  }, [board_id]);

  if (loading) return <div>Checking access...</div>;

  return (
    <Suspense fallback={<div>Loading Board...</div>}>
      {role === "admin" || role === "super_admin" ? (
        <BoardsAdminApp />
      ) : role === "member" ? (
        <BoardsMemberApp />
      ) : (
        <div>Access Denied</div>
      )}
    </Suspense>
  );
}
