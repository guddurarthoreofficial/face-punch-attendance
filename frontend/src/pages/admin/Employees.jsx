import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";

function Employees() {
  const navigate = useNavigate();

  // ==========================================
  // EMPLOYEES
  // ==========================================

  const [employees, setEmployees] = useState([]);

  // ==========================================
  // SEARCH
  // ==========================================

  const [search, setSearch] = useState("");

  // ==========================================
  // LOADING / ERROR
  // ==========================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // ADD EMPLOYEE MODAL
  // ==========================================

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [adding, setAdding] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  // ==========================================
  // FETCH EMPLOYEES
  // ==========================================

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest(
        "/employees"
      );

      setEmployees(data.employees || []);
    } catch (error) {
      console.error(
        "Get Employees Error:",
        error
      );

      setError(
        error.message ||
          "Failed to load employees"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ==========================================
  // OPEN ADD MODAL
  // ==========================================

  const openAddModal = () => {
    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
    });

    setError("");
    setSuccess("");
    setShowAddModal(true);
  };

  // ==========================================
  // CLOSE ADD MODAL
  // ==========================================

  const closeAddModal = () => {
    if (adding) return;

    setShowAddModal(false);

    setForm({
      name: "",
      email: "",
      phone: "",
      password: "",
    });
  };

  // ==========================================
  // CREATE EMPLOYEE
  // ==========================================

  const handleAddEmployee = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();
    const password = form.password;

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!name) {
      setError("Employee name is required.");
      return;
    }

    if (!email) {
      setError("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!phone) {
      setError("Phone number is required.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError(
        "Phone number must contain exactly 10 digits."
      );
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    // ------------------------------------------
    // API
    // ------------------------------------------

    try {
      setAdding(true);

      await apiRequest("/employees", {
        method: "POST",

        body: JSON.stringify({
          name,
          email,
          phone,
          password,
        }),
      });

      setSuccess(
        "Employee created successfully ✅"
      );

      setShowAddModal(false);

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
      });

      await fetchEmployees();
    } catch (error) {
      console.error(
        "Create Employee Error:",
        error
      );

      setError(
        error.message ||
          "Failed to create employee."
      );
    } finally {
      setAdding(false);
    }
  };

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  const filteredEmployees = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return employees;
    }

    return employees.filter((employee) => {
      return (
        employee.name
          ?.toLowerCase()
          .includes(query) ||
        employee.email
          ?.toLowerCase()
          .includes(query) ||
        employee.phone
          ?.toLowerCase()
          .includes(query)
      );
    });
  }, [employees, search]);

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ======================================
          HEADER
      ======================================= */}

      <header className="border-b border-slate-800 bg-slate-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">

          <div>
            <h1 className="text-xl font-bold">
              Employees
            </h1>

            <p className="text-sm text-slate-400">
              Manage school employees
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              navigate("/admin")
            }
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium transition hover:bg-slate-600"
          >
            Back to Dashboard
          </button>

        </div>
      </header>

      {/* ======================================
          MAIN
      ======================================= */}

      <main className="mx-auto max-w-7xl px-6 py-8">

        {/* TOP SECTION */}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h2 className="text-2xl font-bold">
              Employee List
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Showing{" "}
              <span className="font-semibold text-white">
                {filteredEmployees.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-white">
                {employees.length}
              </span>{" "}
              employees
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">

            {/* SEARCH */}

            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search employee..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 sm:w-64"
              />
            </div>

            {/* REFRESH */}

            <button
              type="button"
              onClick={fetchEmployees}
              disabled={loading}
              className="rounded-lg bg-slate-700 px-4 py-2.5 text-sm font-medium transition hover:bg-slate-600 disabled:opacity-50"
            >
              ↻ Refresh
            </button>

            {/* ADD */}

            <button
              type="button"
              onClick={openAddModal}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-blue-500"
            >
              + Add Employee
            </button>

          </div>
        </div>

        {/* SUCCESS */}

        {success && (
          <div className="mb-5 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3">
            <p className="text-sm text-green-300">
              {success}
            </p>
          </div>
        )}

        {/* ERROR */}

        {error && !showAddModal && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 py-12 text-center">
            <p className="text-slate-400">
              Loading employees...
            </p>
          </div>
        )}

        {/* EMPTY */}

        {!loading &&
          filteredEmployees.length === 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center">

              <div className="text-4xl">
                👤
              </div>

              <p className="mt-3 font-semibold text-white">
                {search
                  ? "No employees found"
                  : "No employees yet"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {search
                  ? "Try a different search."
                  : "Add your first employee to get started."}
              </p>

              {!search && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-500"
                >
                  + Add Employee
                </button>
              )}

            </div>
          )}

        {/* ======================================
            EMPLOYEE TABLE
        ======================================= */}

        {!loading &&
          filteredEmployees.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[900px]">

                  <thead className="bg-slate-800">

                    <tr>

                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Name
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Email
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Phone
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Face
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Status
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredEmployees.map(
                      (employee) => (
                        <tr
                          key={employee._id}
                          className="border-t border-slate-800 transition hover:bg-slate-800/50"
                        >

                          {/* NAME */}

                          <td className="px-6 py-4">

                            <div className="flex items-center gap-3">

                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 font-semibold text-blue-400">
                                {employee.name
                                  ?.charAt(0)
                                  ?.toUpperCase() ||
                                  "?"}
                              </div>

                              <div>
                                <p className="font-semibold">
                                  {employee.name}
                                </p>

                                <p className="text-xs text-slate-500">
                                  Employee
                                </p>
                              </div>

                            </div>

                          </td>

                          {/* EMAIL */}

                          <td className="px-6 py-4 text-sm text-slate-300">
                            {employee.email}
                          </td>

                          {/* PHONE */}

                          <td className="px-6 py-4 text-sm text-slate-300">
                            {employee.phone}
                          </td>

                          {/* FACE */}

                          <td className="px-6 py-4">

                            {employee.faceRegistered ? (
                              <span className="font-medium text-green-400">
                                Registered ✅
                              </span>
                            ) : (
                              <span className="font-medium text-yellow-400">
                                Not Registered
                              </span>
                            )}

                          </td>

                          {/* STATUS */}

                          <td className="px-6 py-4">

                            {employee.isActive ? (
                              <span className="inline-flex rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                                Inactive
                              </span>
                            )}

                          </td>

                          {/* ACTION */}

                          <td className="px-6 py-4">

                            <button
                              type="button"
                              onClick={() =>
                                navigate(
                                  `/admin/employees/${employee._id}/face`
                                )
                              }
                              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium transition hover:bg-purple-500"
                            >
                              {employee.faceRegistered
                                ? "Update Face"
                                : "Register Face"}
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>

            </div>
          )}

      </main>

      {/* ======================================
          ADD EMPLOYEE MODAL
      ======================================= */}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

              <div>
                <h2 className="text-xl font-bold text-white">
                  Add Employee
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Create a new employee account.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                disabled={adding}
                className="text-2xl text-slate-500 transition hover:text-white disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* MODAL FORM */}

            <form
              onSubmit={handleAddEmployee}
              className="space-y-5 p-6"
            >

              {/* MODAL ERROR */}

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <p className="text-sm text-red-300">
                    {error}
                  </p>
                </div>
              )}

              {/* NAME */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="Enter employee name"
                  maxLength={100}
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* EMAIL */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="employee@school.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* PHONE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Phone Number
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={(e) => {
                    const value =
                      e.target.value.replace(
                        /\D/g,
                        ""
                      );

                    if (value.length <= 10) {
                      setForm((previous) => ({
                        ...previous,
                        phone: value,
                      }));
                    }

                    setError("");
                    setSuccess("");
                  }}
                  placeholder="10 digit mobile number"
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {/* PASSWORD */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />

                <p className="mt-2 text-xs text-slate-500">
                  The employee will use this password
                  to log in.
                </p>
              </div>

              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={adding}
                  className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={adding}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adding
                    ? "Creating..."
                    : "Create Employee"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Employees;