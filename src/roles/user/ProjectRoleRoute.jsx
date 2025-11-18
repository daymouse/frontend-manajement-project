import { useParams } from "react-router-dom";
import { useEffect, useState, Suspense } from "react";
import { apiFetch } from "../../Server";

export default function ProjectRoleRoute() {
  const { board_id } = useParams();
  const [RoleApp, setRoleApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // ⬅️ tambah error state

  useEffect(() => {
    let mounted = true;

    const checkRole = async () => {
      try {
        const data = await apiFetch(`/project/${board_id}/member-role`);

        console.log("✅ Dapatkan data role:", data);
        const userRole = data.role || data.data?.role;
        console.log("🎯 Role:", userRole);

        // Cek role & load komponen
        if (userRole === "admin" || userRole === "super_admin") {
          const { default: AdminApp } = await import("../../board/BoardsAdminApp.jsx");
          if (mounted) setRoleApp(() => AdminApp);
        } else if (userRole === "member") {
          const { default: MemberApp } = await import("../../board/BoardsMemberApp.jsx");
          if (mounted) setRoleApp(() => MemberApp);
        } else {
          if (mounted) {
            setError("🚫 Anda tidak memiliki akses ke board ini.");
            setRoleApp(null);
          }
        }

      } catch (err) {
        console.error("🔥 Gagal ambil role:", err);
        if (mounted) {
          setError("❌ Terjadi kesalahan memeriksa akses.");
          setRoleApp(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkRole();
    return () => (mounted = false);
  }, [board_id]);

  if (loading) return <div>Checking access...</div>;

  // ⛔ Tampilkan halaman error jika tidak punya akses
  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "40px", fontSize: "20px", color: "red" }}>
        {error}
      </div>
    );
  }

  const RoleComponent = RoleApp;
  return (
    <Suspense fallback={<div>Loading Board...</div>}>
      {RoleComponent ? <RoleComponent /> : <div>Access denied</div>}
    </Suspense>
  );
}
