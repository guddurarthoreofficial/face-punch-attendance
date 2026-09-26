import { useNavigate, useParams } from "react-router-dom";
import FaceCamera from "../../components/FaceCamera";

function EmployeeFaceRegistration() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950">

      {/* TOP BAR */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>
            <h1 className="text-xl font-bold text-white">
              Employee Face Registration
            </h1>

            <p className="text-sm text-slate-400">
              Register employee biometric face data
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/employees")}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg"
          >
            Back to Employees
          </button>

        </div>
      </div>

      {/* FACE CAMERA */}
      <FaceCamera employeeId={employeeId} />

    </div>
  );
}

export default EmployeeFaceRegistration;