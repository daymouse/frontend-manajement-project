// components/CardModal/handlers.js
import { useState } from "react";
import { apiFetch } from "../../Server";

export function useCardHandlers(board_id, onCreated, onClose) {
  const [form, setForm] = useState({
    card_title: "",
    description: "",
    due_date: "",
    priority: "medium",
    estimated_hours: "",
  });

  const [users, setUsers] = useState([]);
  const [taskOwner, setTaskOwner] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [subtasks, setSubtasks] = useState([]);

  const [activeRole, setActiveRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const fetchMembers = async (roleType) => {
    try {
      const data = await apiFetch(`/card/board/${board_id}/members`);
      setUsers(data.data || []);
      setActiveRole(roleType);
    } catch (err) {
      console.error("❌ Gagal fetch members:", err);
    }
  };

  const handleSelectUser = (user) => {
    if (activeRole === "owner") {
      setTaskOwner(user);
    } else {
      if (!contributors.find((c) => c.user_id === user.user_id)) {
        setContributors([...contributors, user]);
      }
    }
  };

  const handleRemoveContributor = (userId) => {
    setContributors(contributors.filter((u) => u.user_id !== userId));
  };

  const handleAddSubtask = (title) => {
    if (title.trim()) setSubtasks([...subtasks, { title }]);
  };

  const handleRemoveSubtask = (index) => {
    setSubtasks(subtasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        status: "todo",
        task_owner_id: taskOwner?.user_id || null,
        contributor_ids: contributors.map((u) => u.user_id),
        subtasks: subtasks.map((s) => s.title),
      };

      await apiFetch(`/card/board/${board_id}`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onCreated();
      onClose();

    } catch (err) {
      console.error("❌ Gagal buat card:", err);
    }
  };

  return {
    form,
    users,
    taskOwner,
    contributors,
    subtasks,
    activeRole,
    searchTerm,
    setSearchTerm,
    handleChange,
    fetchMembers,
    handleSelectUser,
    handleRemoveContributor,
    handleAddSubtask,
    handleRemoveSubtask,
    handleSubmit,
  };
}
