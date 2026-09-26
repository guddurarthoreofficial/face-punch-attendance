import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";

function Employees() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/employees");

      setEmployees(data.employees || []);
    } catch (error) {
      console.error("Get Employees Error:", error);
      setError(error.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>
            <h1 className="text-xl font-bold">
              Employees
            </h1>

            <p className="text-sm text-slate-400">
              Manage school employees
            </p>
          </div>

          <button
            onClick={() => navigate("/admin")}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>

        </div>
      </header>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        <div className="flex justify-between items-center mb-6">

          <div>
            <h2 className="text-2xl font-bold">
              Employee List
            </h2>

            <p className="text-slate-400 mt-1">
              Total employees: {employees.length}
            </p>
          </div>

          <button
            onClick={fetchEmployees}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Refresh
          </button>

        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-5">
            {error}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="text-center py-10 text-slate-400">
            Loading employees...
          </div>
        )}

        {/* EMPTY */}
        {!loading && employees.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
            <p className="text-slate-400">
              No employees found.
            </p>
          </div>
        )}

        {/* EMPLOYEES */}
        {!loading && employees.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead className="bg-slate-800">
                  <tr>
                    <th className="text-left px-6 py-4">
                      Name
                    </th>

                    <th className="text-left px-6 py-4">
                      Email
                    </th>

                    <th className="text-left px-6 py-4">
                      Phone
                    </th>

                    <th className="text-left px-6 py-4">
                      Face
                    </th>

                    <th className="text-left px-6 py-4">
                      Status
                    </th>

                    <th className="text-left px-6 py-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>

                  {employees.map((employee) => (

                    <tr
                      key={employee._id}
                      className="border-t border-slate-800 hover:bg-slate-800/50"
                    >

                      <td className="px-6 py-4 font-medium">
                        {employee.name}
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {employee.email}
                      </td>

                      <td className="px-6 py-4 text-slate-300">
                        {employee.phone}
                      </td>

                      <td className="px-6 py-4">

                        {employee.faceData &&
                        employee.faceData.length === 128 ? (
                          <span className="text-green-400 font-medium">
                            Registered ✅
                          </span>
                        ) : (
                          <span className="text-yellow-400 font-medium">
                            Not Registered
                          </span>
                        )}

                      </td>

                      <td className="px-6 py-4">

                        {employee.isActive ? (
                          <span className="text-green-400">
                            Active
                          </span>
                        ) : (
                          <span className="text-red-400">
                            Inactive
                          </span>
                        )}

                      </td>

                      <td className="px-6 py-4">

                        <button
                          onClick={() =>
                            navigate(
                              `/admin/employees/${employee._id}/face`
                            )
                          }
                          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-medium"
                        >
                          {employee.faceData &&
                          employee.faceData.length === 128
                            ? "Update Face"
                            : "Register Face"}
                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </main>

    </div>
  );
}

export default Employees;