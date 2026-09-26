import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>
            <h1 className="text-xl font-bold">
              School Attendance
            </h1>

            <p className="text-sm text-slate-400">
              Admin Dashboard
            </p>
          </div>

          <div className="flex items-center gap-4">

            <div className="text-right">
              <p className="font-medium">
                {user?.name}
              </p>

              <p className="text-xs text-slate-400">
                {user?.role}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium"
            >
              Logout
            </button>

          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        <h2 className="text-2xl font-bold mb-6">
          Dashboard
        </h2>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400">
              Total Employees
            </p>

            <p className="text-3xl font-bold mt-2">
              0
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400">
              Present Today
            </p>

            <p className="text-3xl font-bold mt-2">
              0
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400">
              Absent Today
            </p>

            <p className="text-3xl font-bold mt-2">
              0
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <p className="text-slate-400">
              Late Today
            </p>

            <p className="text-3xl font-bold mt-2">
              0
            </p>
          </div>

        </div>

        {/* ACTIONS */}
        <div className="mt-8">

          <h3 className="text-xl font-semibold mb-4">
            Management
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            <button
              onClick={() =>
                navigate("/admin/employees")
              }
              className="text-left bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-xl p-6 transition"
            >
              <h4 className="text-lg font-semibold">
                Employees
              </h4>

              <p className="text-slate-400 mt-2">
                Manage employees and register faces.
              </p>
            </button>

            <button
              onClick={() =>
                navigate("/admin/attendance")
              }
              className="text-left bg-slate-900 border border-slate-800 hover:border-green-500 rounded-xl p-6 transition"
            >
              <h4 className="text-lg font-semibold">
                Attendance
              </h4>

              <p className="text-slate-400 mt-2">
                View employee attendance.
              </p>
            </button>

            <button
              onClick={() =>
                navigate("/admin/school")
              }
              className="text-left bg-slate-900 border border-slate-800 hover:border-purple-500 rounded-xl p-6 transition"
            >
              <h4 className="text-lg font-semibold">
                School Location
              </h4>

              <p className="text-slate-400 mt-2">
                Manage school GPS location.
              </p>
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}

export default AdminDashboard;