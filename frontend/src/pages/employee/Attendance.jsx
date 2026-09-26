import { useNavigate } from "react-router-dom";
import AttendanceCamera from "../../components/AttendanceCamera";

function Attendance() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      <header className="bg-slate-900 border-b border-slate-800">

        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>
            <h1 className="text-xl font-bold">
              Mark Attendance
            </h1>

            <p className="text-sm text-slate-400">
              Face verification + GPS verification
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/employee")
            }
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>

        </div>

      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        <div className="mb-6">

          <h2 className="text-2xl font-bold">
            Today's Attendance
          </h2>

          <p className="text-slate-400 mt-1">
            Your face and current location will be
            verified before marking attendance.
          </p>

        </div>

        <AttendanceCamera />

      </main>

    </div>
  );
}

export default Attendance;