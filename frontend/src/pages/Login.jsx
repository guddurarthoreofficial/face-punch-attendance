import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  // ==========================================
  // LOGIN
  // ==========================================
  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",

        body: JSON.stringify({
          email,
          password,
        }),
      });

      console.log("Login Response:", data);

      // ==========================================
      // SAVE JWT TOKEN
      // ==========================================
      localStorage.setItem("token", data.token);

      // ==========================================
      // SAVE USER
      // ==========================================
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      // ==========================================
      // ROLE BASED REDIRECT
      // ==========================================
      if (data.user?.role === "admin") {
        navigate("/admin");
      } else if (data.user?.role === "employee") {
        navigate("/employee");
      } else {
        setError("Invalid user role");
      }

    } catch (error) {
      console.error("Login Error:", error);

      setError(
        error.message ||
        "Unable to connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">

      <div className="w-full max-w-md">

        <div className="bg-slate-900 rounded-2xl p-8 shadow-xl">

          {/* HEADER */}
          <div className="text-center mb-8">

            <h1 className="text-3xl font-bold text-white">
              School Attendance
            </h1>

            <p className="text-slate-400 mt-2">
              Login to continue
            </p>

          </div>

          {/* FORM */}
          <form onSubmit={handleLogin}>

            {/* EMAIL */}
            <div className="mb-5">

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="admin@school.com"
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
              />

            </div>

            {/* PASSWORD */}
            <div className="mb-5">

              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter password"
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
              />

            </div>

            {/* ERROR */}
            {error && (
              <div className="mb-5 bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white py-3 rounded-lg font-semibold transition"
            >
              {loading
                ? "Logging in..."
                : "Login"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}

export default Login;