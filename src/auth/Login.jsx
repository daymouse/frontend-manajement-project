import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../Server";

function Login({ onLogin }) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false, // ✅ default false
  });
  const [message, setMessage] = useState("");
  const [loginData, setLoginData] = useState(null);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(form), // ✅ kirim email, password, remember
        credentials: "include", 
      });

      if (data.errors) {
        setMessage("❌ " + data.errors.map((err) => err.msg).join(", "));
        setLoginData(null);
      } else if (data.error) {
        setMessage("⚠️ " + data.error);
        setLoginData(null);
      } else {
      setMessage("✅ " + data.message);

      // simpan user ke state global
      setLoginData(data);
      onLogin(data.user);

      // ✅ redirect sesuai role
      if (data.user.is_admin) {
        navigate("/admin");
      } else {
        navigate("/user");
      }
    }
    } catch (err) {
      setMessage("⚠️ Gagal koneksi server: " + err.message);
      setLoginData(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 font-poppins">
      <div className="bg-white p-6 rounded-2xl shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-600 font-doto">
          Login
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
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

          {/* ✅ Checkbox Remember Me */}
          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              id="remember"
              name="remember"
              checked={form.remember}
              onChange={(e) =>
                setForm({ ...form, remember: e.target.checked })
              }
              className="mr-2"
            />
            <label htmlFor="remember">Remember Me</label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-doto p-2 rounded hover:bg-blue-700 transition-colors duration-300"
          >
            Login
          </button>
        </form>

        {message && <p className="mt-3 text-center">{message}</p>}
      </div>
    </div>
  );
}

export default Login;
