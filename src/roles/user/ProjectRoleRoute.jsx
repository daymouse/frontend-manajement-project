import { useParams } from "react-router-dom";
import { useEffect, useState, Suspense } from "react";
import { apiFetch } from "../../Server";

export default function ProjectRoleRoute() {
  const { board_id } = useParams();
  const [RoleApp, setRoleApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      try {
        const data = await apiFetch(`/project/${board_id}/member-role`);
        const userRole = data.role || data.data?.role;
        console.log("🎯 Role:", userRole);

        // Lazy import berdasarkan role
        if (userRole === "admin" || userRole === "super_admin") {
          const { default: AdminApp } = await import("../../board/BoardsAdminApp.jsx");
          if (mounted) setRoleApp(() => AdminApp);
        } else if (userRole === "member") {
          const { default: MemberApp } = await import("../../board/BoardsMemberApp.jsx");
          if (mounted) setRoleApp(() => MemberApp);
        } else {
          if (mounted) setRoleApp(() => () => <div>Access denied</div>);
        }
      } catch (err) {
        console.error("🔥 Gagal ambil role:", err);
        if (mounted) setRoleApp(() => () => <div>Access denied</div>);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkRole();

    return () => {
      mounted = false; // cleanup
    };
  }, [board_id]);

  if (loading) return <div>Checking access...</div>;

  const RoleComponent = RoleApp;
  return (
    <Suspense fallback={<div>Loading Board...</div>}>
      {RoleComponent ? <RoleComponent /> : <div>Access denied</div>}
    </Suspense>
  );
}
