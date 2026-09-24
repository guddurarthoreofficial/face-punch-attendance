import { useState } from "react";

const API_URL = "http://localhost:5000/api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      console.log("Login Response:", data);

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Save JWT token
      localStorage.setItem("token", data.token);

      // Save user information
      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      setError("");

      onLogin(data.user);
    } catch (error) {
      console.error("Login Error:", error);

      setError(
        "Unable to connect to server. Please check backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        <div className="bg-slate-900 rounded-2xl p-8 shadow-xl">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">
              School Attendance
            </h1>

            <p className="text-slate-400 mt-2">
              Login to continue
            </p>
          </div>

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
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}

export default Login;