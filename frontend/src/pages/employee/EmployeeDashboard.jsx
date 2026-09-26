import { useNavigate } from "react-router-dom";

function EmployeeDashboard() {
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

      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

          <div>
            <h1 className="text-xl font-bold">
              School Attendance
            </h1>

            <p className="text-sm text-slate-400">
              Employee Dashboard
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg"
          >
            Logout
          </button>

        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        <h2 className="text-2xl font-bold">
          Welcome, {user?.name}
        </h2>

        <div className="grid md:grid-cols-2 gap-5 mt-8">

          <button
            onClick={() =>
              navigate("/employee/attendance")
            }
            className="text-left bg-slate-900 border border-slate-800 hover:border-green-500 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold">
              Mark Attendance
            </h3>

            <p className="text-slate-400 mt-2">
              Verify your face and school location.
            </p>
          </button>

          <button
            onClick={() =>
              navigate("/employee/history")
            }
            className="text-left bg-slate-900 border border-slate-800 hover:border-blue-500 rounded-xl p-6"
          >
            <h3 className="text-xl font-semibold">
              Attendance History
            </h3>

            <p className="text-slate-400 mt-2">
              View your previous attendance.
            </p>
          </button>

        </div>

      </main>

    </div>
  );
}

export default EmployeeDashboard;