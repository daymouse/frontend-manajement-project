// src/hooks/useHomeDashboard.js
import { useState, useEffect } from 'react';
import { apiFetch } from '../../../Server'; // Wrapper fetch dengan auth

export const useHomeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    projects_led: 0,
    tasks_owned: 0,
    projects_joined: 0,
  });
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const endpoint = "/home-user/home";
        console.log("📡 Fetching dashboard:", endpoint);

        // 🔹 apiFetch sudah otomatis return JSON hasil response
        const data = await apiFetch(endpoint);
        console.log("✅ Dashboard data:", data);

        // 1️⃣ Set summary
        setSummary({
          projects_led: data.projects_led || 0,
          tasks_owned: data.tasks_owned || 0,
          projects_joined: data.projects_joined || 0,
        });

        // 2️⃣ Set projects
        const projectsFormatted = (data.projects || []).map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          created_at: p.created_at ? new Date(p.created_at) : null,
          deadline: p.deadline ? new Date(p.deadline) : null,
        }));

        setProjects(projectsFormatted);

      } catch (err) {
        console.error("🔥 Fetch dashboard error:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return { loading, error, summary, projects };
};
