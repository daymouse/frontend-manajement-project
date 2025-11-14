import { useState } from "react";
import { apiFetch } from "../Server";
import { useNavigate } from "react-router-dom"; 

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    password: "",
    full_name: "",
    email: "",
  });

  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // handle input
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const data = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(form),
      });

       if (data.errors) {
        setMessage("❌ " + data.errors.map((err) => err.msg).join(", "));
      } else if (data.error) {
        setMessage("⚠️ " + data.error);
      } else {
        setMessage("✅ " + data.message);

        setForm({ username: "", password: "", full_name: "", email: "" });

        setTimeout(() => {
          navigate("/"); // ✅ redirect ke halaman login
        }, 1500);
      }
    } catch (err) {
      setMessage("⚠️ Gagal koneksi server: " + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl shadow-md w-96"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Register</h2>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          required
        />

        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-3"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Register
        </button>

        {message && (
          <p className="mt-3 text-center text-sm text-gray-700">{message}</p>
        )}
      </form>
    </div>
  );
}
