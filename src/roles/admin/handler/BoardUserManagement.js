import { useEffect, useState } from "react";
import { apiFetch } from "../../../Server";

export default function useUserManagement(board_id) {
  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 🔹 Ambil project berdasarkan board_id
  const fetchProjectByBoard = async () => {
    try {
      const res = await apiFetch(`/board/${board_id}`, "GET");
      if (res.data) setProject(res.data);
    } catch (err) {
      console.error("❌ Gagal fetch project:", err);
    }
  };

  // 🔹 Ambil daftar member project
  const fetchMembers = async () => {
    try {
      const res = await apiFetch(`/project/board-members/${board_id}`, "GET");
      if (res.members) setMembers(res.members);
    } catch (err) {
      console.error("❌ Gagal fetch members:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Ambil semua user
  const fetchAllUsers = async () => {
    try {
      const res = await apiFetch("/users/member", "GET");
      if (res.data) setUsers(res.data);
    } catch (err) {
      console.error("❌ Gagal fetch users:", err);
    }
  };

  // 🔹 Tambah member
  const addMember = async (user_id) => {
    try {
      const res = await apiFetch(`/project/${board_id}/add`, {
        method: "POST",
        body: JSON.stringify({ user_id }),
      });
      if (res.success) fetchMembers();
    } catch (err) {
      console.error("❌ Gagal tambah member:", err);
    }
  };

  // 🔹 Hapus member
  const removeMember = async (user_id) => {
    if (!confirm("Yakin ingin menghapus member ini?")) return;
    try {
      const res = await apiFetch(`/project/${board_id}/remove/${user_id}`, {
        method: "DELETE",
      });
      if (res.success) fetchMembers();
    } catch (err) {
      console.error("❌ Gagal hapus member:", err);
    }
  };

  // 🔹 Drag & Drop
  const handleDragStart = (e, user_id) => {
    e.dataTransfer.setData("user_id", user_id);
  };
  const handleDrop = (e) => {
    const user_id = e.dataTransfer.getData("user_id");
    addMember(user_id);
  };
  const handleDragOver = (e) => e.preventDefault();

  // 🔄 Initial Load
  useEffect(() => {
    if (board_id) {
      fetchProjectByBoard();
      fetchMembers();
      fetchAllUsers();
    }
  }, [board_id]);

  return {
    project,
    members,
    users,
    loading,
    isModalOpen,
    setIsModalOpen,
    addMember,
    removeMember,
    handleDragStart,
    handleDrop,
    handleDragOver,
  };
}
