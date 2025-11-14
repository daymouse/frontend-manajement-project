import { useState, useEffect, lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./auth/Login";
import Register from "./auth/Register";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // modul dinamis
  const [AdminModules, setAdminModules] = useState(null);
  const [UserModules, setUserModules] = useState(null);

  // Cek autentikasi
  useEffect(() => {
    console.log("🔍 [App] Checking authentication...");

    fetch("http://localhost:3000/auth/check-auth", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json();
        if (data.authenticated) {
          console.log("✅ [App] Authenticated user:", data.user);
          setUser(data.user);
        } else {
          console.warn("⚠️ [App] User not authenticated, redirecting to login.");
          setUser(null);
        }
      })
      .catch((err) => {
        console.error("🔥 [App] Error while checking auth:", err);
        setUser(null);
      })
      .finally(() => {
        console.log("🕓 [App] Auth check completed.");
        setLoading(false);
      });
  }, []);

  // 🧩 Load modul ADMIN saat user admin
  useEffect(() => {
    if (user?.is_admin) {
      console.log("🏢 [App] Loading admin modules dynamically...");
      Promise.all([
        import("./roles/admin/AdminApp.jsx"),
        import("./roles/admin/pages/Project.jsx"),
        import("./roles/admin/pages/UserManajemen.jsx"),
        import("./roles/admin/pages/Dashboard.jsx"),
        import("./roles/admin/pages/DetailProject.jsx")
      ])
        .then(([AdminApp, Project, UserManagement,Dashboard, DetailProject]) => {
          setAdminModules({
            AdminApp: AdminApp.default,
            Project: Project.default,
            UserManagement: UserManagement.default,
            Dashboard: Dashboard.default,
            DetailProject: DetailProject.default
          });
        })
        .catch((err) => console.error("🔥 [App] Failed to load admin modules:", err));
    }

    // 🧩 Load modul USER saat user bukan admin
    if (user && !user.is_admin) {
      console.log("👨‍💻 [App] Loading user modules dynamically...");
      Promise.all([
        import("./roles/user/UserApp.jsx"),
        import("./roles/user/pages/Tasks.jsx"),
        import("./roles/user/ProjectRoleRoute.jsx"),
        import("./roles/user/pages/HomeDashboard.jsx"),
      ])
        .then(([UserApp, Task, ProjectRoleRoute, HomeDashboard]) => {
          setUserModules({
            UserApp: UserApp.default,
            Task: Task.default,
            ProjectRoleRoute: ProjectRoleRoute.default,
            HomeDashboard: HomeDashboard.default,
          });
        })
        .catch((err) => console.error("🔥 [App] Failed to load user modules:", err));
    }
  }, [user]);

  if (loading) {
    console.log("⏳ [App] Still loading authentication state...");
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Checking authentication...</p>
      </div>
    );
  }

  console.log("👤 [App] Current user:", user);
  console.log("🧭 [App] is_admin:", user?.is_admin);

  return (
    <Suspense fallback={<div>Loading Page...</div>}>
      <Routes>
        {/* ======================= AUTH ROUTES ======================= */}
        <Route
          path="/login"
          element={
            <Login
              onLogin={(u) => {
                console.log("✅ [App] User logged in:", u);
                setUser(u);
              }}
            />
          }
        />
        <Route path="/register" element={<Register />} />

        {/* ======================= ADMIN ROUTES ======================= */}
        {user && user.is_admin && (
          <>
            {!AdminModules ? (
              <Route
                path="*"
                element={
                  <div className="flex items-center justify-center h-screen">
                    <p>Loading admin modules...</p>
                  </div>
                }
              />
            ) : (
              <Route path="/admin" element={<AdminModules.AdminApp />}>
                <Route
                  path="projects"
                  element={<AdminModules.Project />}
                />
                <Route
                  path="users"
                  element={<AdminModules.UserManagement />}
                />
                <Route 
                  path="dashboard"
                  element={<AdminModules.Dashboard />}
                />
                <Route 
                  path="projects/:projectId"
                  element={<AdminModules.DetailProject />}
                />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Route>
            )}
          </>
        )}

        {/* ======================= USER ROUTES ======================= */}
        {user && !user.is_admin && (
          <>
            {!UserModules ? (
              <Route
                path="*"
                element={
                  <div className="flex items-center justify-center h-screen">
                    <p>Loading user modules...</p>
                  </div>
                }
              />
            ) : (
              <Route path="/user/*" element={<UserModules.UserApp />}>
                <Route
                  path="dashboard"
                  element={<UserModules.HomeDashboard />}
                />
                <Route
                  path="task"
                  element={<UserModules.Task />}
                />
                <Route
                  path="board/:board_id/*"
                  element={<UserModules.ProjectRoleRoute />}
                />
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Route>
            )}
          </>
        )}

        {/* ======================= DEFAULT FALLBACK ======================= */}
        {!user && (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </Suspense>
  );
}

export default App;
