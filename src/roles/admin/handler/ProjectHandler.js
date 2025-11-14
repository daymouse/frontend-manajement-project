// src/pages/admin/Project/ProjectHandler.js
import { useState, useEffect } from "react";
import { apiFetch } from "../../../Server";

export const useProjectHandler = (navigate) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [users, setUsers] = useState([]);
  const [boards, setBoards] = useState({});
  const [errorMsg, setErrorMsg] = useState("");

  // === FETCH DATA ===
  const fetchProjects = async () => {
    try {
      const res = await apiFetch("/project/projects", { method: "GET" });
      setProjects(res);
    } catch (err) {
      console.error("❌ Error fetchProjects:", err);
    }
  };

  const fetchBoards = async () => {
    try {
      const res = await apiFetch("/board/boards", { method: "GET" });
      const map = {};
      res.forEach((b) => (map[b.project_id] = b));
      setBoards(map);
    } catch (err) {
      console.error("❌ Error fetchBoards:", err);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await apiFetch("/users/member", { method: "GET" });
      setUsers(res.data || []);
    } catch (err) {
      console.error("❌ Error fetchMembers:", err);
    }
  };

  const fetchLeaders = async () => {
    try {
      const res = await apiFetch("/users/leader", { method: "GET" });
      setLeaders(res.data || []);
    } catch (err) {
      console.error("❌ Error fetchLeaders:", err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchBoards();
    fetchMembers();
    fetchLeaders();
  }, []);

  // === DELETE PROJECT ===
  const handleDeleteProject = async (project_id) => {
    if (!window.confirm("Yakin ingin menghapus project ini?")) return;

    try {
      const res = await apiFetch(`/project/project/${project_id}`, {
        method: "DELETE",
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setErrorMsg("");
        fetchProjects();
        fetchBoards();
      }
    } catch (err) {
      console.error("❌ Error delete project:", err);
      const msg =
        err.message?.includes("masih memiliki board") ||
        err.error?.includes("masih memiliki board")
          ? "Tidak bisa menghapus project karena masih memiliki board."
          : "Terjadi kesalahan saat menghapus project.";
      setErrorMsg(msg);
    }
  };

  // === OPEN DETAIL MODAL ===
  const handleOpenDetail = async (project) => {
    try {
      const res = await apiFetch(
        `/project/project-members/${project.project_id}`
      );
      setSelectedProject({
        ...project,
        members: res.members || [],
      });
    } catch (err) {
      console.error("❌ Error fetch project detail:", err);
      setSelectedProject({ ...project, members: [] });
    }
  };

  // === NAVIGATE TO BOARD ===
  const handleGoToBoard = (e, project_id) => {
    e.stopPropagation();
    navigate(`/admin/projects/${project_id}`);
  };

  return {
    isOpen,
    setIsOpen,
    selectedProject,
    setSelectedProject,
    projects,
    leaders,
    users,
    boards,
    errorMsg,
    fetchProjects,
    handleDeleteProject,
    handleOpenDetail,
    handleGoToBoard,
  };
};
