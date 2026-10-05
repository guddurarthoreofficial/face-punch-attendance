import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";

function Employees() {
  const navigate = useNavigate();

  // ==========================================
  // EMPLOYEES
  // ==========================================

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileEmployee, setProfileEmployee] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [employees, setEmployees] = useState([]);

  // ==========================================
  // SEARCH
  // ==========================================

  const [search, setSearch] = useState("");

  // ==========================================
  // LOADING / ERROR / SUCCESS
  // ==========================================

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // ADD EMPLOYEE MODAL
  // ==========================================

  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  // ==========================================
  // EDIT EMPLOYEE MODAL
  // ==========================================

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [editingEmployee, setEditingEmployee] =
    useState(null);

  const [updating, setUpdating] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
  });


  // ==========================================
  // STATUS UPDATE
  // ==========================================

  const [statusUpdatingId, setStatusUpdatingId] =
    useState(null);

  // ==========================================
  // FETCH EMPLOYEES
  // ==========================================

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/employees");

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
  // ADD FORM CHANGE
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

    setError("");
  };


  // ==========================================
  // RESET PASSWORD
  // ==========================================

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordEmployee, setPasswordEmployee] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });


  // ==========================================
  // OPEN PASSWORD RESET MODAL
  // ==========================================

  const openPasswordModal = (employee) => {
    setPasswordEmployee(employee);

    setPasswordForm({
      newPassword: "",
      confirmPassword: "",
    });

    setError("");
    setSuccess("");

    setShowPasswordModal(true);
  };

  // ==========================================
  // CLOSE PASSWORD RESET MODAL
  // ==========================================

  const closePasswordModal = () => {
    if (resettingPassword) return;

    setShowPasswordModal(false);
    setPasswordEmployee(null);

    setPasswordForm({
      newPassword: "",
      confirmPassword: "",
    });

    setError("");
  };

  // ==========================================
  // RESET EMPLOYEE PASSWORD
  // ==========================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!passwordEmployee) return;

    setError("");
    setSuccess("");

    const newPassword = passwordForm.newPassword;
    const confirmPassword = passwordForm.confirmPassword;

    // ------------------------------------------
    // VALIDATION
    // ------------------------------------------

    if (!newPassword) {
      setError("New password is required.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm the new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // ------------------------------------------
    // API
    // ------------------------------------------

    try {
      setResettingPassword(true);

      await apiRequest(
        `/employees/${passwordEmployee._id}/password`,
        {
          method: "PATCH",
          body: JSON.stringify({
            newPassword,
          }),
        }
      );

      setSuccess(
        `Password reset successfully for ${passwordEmployee.name} ✅`
      );

      setShowPasswordModal(false);
      setPasswordEmployee(null);

      setPasswordForm({
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error(
        "Reset Employee Password Error:",
        error
      );

      setError(
        error.message ||
        "Failed to reset employee password."
      );
    } finally {
      setResettingPassword(false);
    }
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

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setError(
        "Please enter a valid email address."
      );
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



  const openEmployeeProfile = async (employee) => {
    try {
      setLoadingProfile(true);
      setError("");
      setSuccess("");

      const response = await apiRequest(
        `/employees/${employee._id}`
      );

      setProfileEmployee(response.employee);
      setShowProfileModal(true);
    } catch (error) {
      console.error("Get Employee Profile Error:", error);
      setError(error.message || "Failed to load employee profile.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const closeEmployeeProfile = () => {
    if (loadingProfile) return;

    setShowProfileModal(false);
    setProfileEmployee(null);
  };
  // ==========================================
  // OPEN EDIT MODAL
  // ==========================================

  const openEditModal = (employee) => {
    setEditingEmployee(employee);

    setEditForm({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
    });

    setError("");
    setSuccess("");

    setShowEditModal(true);
  };

  // ==========================================
  // CLOSE EDIT MODAL
  // ==========================================

  const closeEditModal = () => {
    if (updating) return;

    setShowEditModal(false);
    setEditingEmployee(null);

    setEditForm({
      name: "",
      email: "",
      phone: "",
    });

    setError("");
  };

  // ==========================================
  // EDIT FORM CHANGE
  // ==========================================

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // ==========================================
  // UPDATE EMPLOYEE
  // ==========================================

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();

    if (!editingEmployee) return;

    setError("");
    setSuccess("");

    const name = editForm.name.trim();
    const email = editForm.email
      .trim()
      .toLowerCase();
    const phone = editForm.phone.trim();

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

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      setError(
        "Please enter a valid email address."
      );
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      setError(
        "Phone number must contain exactly 10 digits."
      );
      return;
    }

    // ------------------------------------------
    // API
    // ------------------------------------------

    try {
      setUpdating(true);

      await apiRequest(
        `/employees/${editingEmployee._id}`,
        {
          method: "PUT",

          body: JSON.stringify({
            name,
            email,
            phone,
          }),
        }
      );

      setSuccess(
        "Employee updated successfully ✅"
      );

      setShowEditModal(false);
      setEditingEmployee(null);

      setEditForm({
        name: "",
        email: "",
        phone: "",
      });

      await fetchEmployees();
    } catch (error) {
      console.error(
        "Update Employee Error:",
        error
      );

      setError(
        error.message ||
        "Failed to update employee."
      );
    } finally {
      setUpdating(false);
    }
  };

  // ==========================================
  // TOGGLE ACTIVE / INACTIVE
  // ==========================================

  const handleToggleStatus = async (
    employee
  ) => {
    const action = employee.isActive
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${employee.name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setStatusUpdatingId(employee._id);
      setError("");
      setSuccess("");

      await apiRequest(
        `/employees/${employee._id}/status`,
        {
          method: "PATCH",
        }
      );

      setSuccess(
        employee.isActive
          ? "Employee deactivated successfully."
          : "Employee activated successfully."
      );

      await fetchEmployees();
    } catch (error) {
      console.error(
        "Toggle Employee Status Error:",
        error
      );

      setError(
        error.message ||
        "Failed to update employee status."
      );
    } finally {
      setStatusUpdatingId(null);
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

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search employee..."
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500 sm:w-64"
            />

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

        {error &&
          !showAddModal &&
          !showEditModal &&
          !showPasswordModal && (
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

                <table className="w-full min-w-[1100px]">

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
                        Actions
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

                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 font-semibold text-blue-400">
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

                          {/* ACTIONS */}



                          <td className="px-6 py-4">

                            <div className="flex flex-wrap gap-2">

                              {/* EDIT */}

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    employee
                                  )
                                }
                                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium transition hover:bg-blue-500"
                              >
                                Edit
                              </button>

                              {/* FACE */}

                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/admin/employees/${employee._id}/face`
                                  )
                                }
                                className="rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium transition hover:bg-purple-500"
                              >
                                {employee.faceRegistered
                                  ? "Update Face"
                                  : "Register Face"}
                              </button>

                              {/* STATUS */}

                              <button
                                type="button"
                                onClick={() =>
                                  handleToggleStatus(
                                    employee
                                  )
                                }
                                disabled={
                                  statusUpdatingId ===
                                  employee._id
                                }
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${employee.isActive
                                  ? "bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                  : "bg-green-500/10 text-green-300 hover:bg-green-500/20"
                                  }`}
                              >
                                {statusUpdatingId ===
                                  employee._id
                                  ? "Updating..."
                                  : employee.isActive
                                    ? "Deactivate"
                                    : "Activate"}
                              </button>

                              {/* RESET PASSWORD */}

                              <button
                                type="button"
                                onClick={() => openPasswordModal(employee)}
                                className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium transition hover:bg-amber-500"
                              >
                                Reset Password
                              </button>

                              <button
                                type="button"
                                onClick={() => openEmployeeProfile(employee)}
                                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium transition hover:bg-blue-500"
                              >
                                View Details
                              </button>

                            </div>

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

            {/* HEADER */}

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

            {/* FORM */}

            <form
              onSubmit={handleAddEmployee}
              className="space-y-5 p-6"
            >

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

      {/* ======================================
          EDIT EMPLOYEE MODAL
      ======================================= */}

      {showEditModal &&
        editingEmployee && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

            <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

              {/* HEADER */}

              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">

                <div>
                  <h2 className="text-xl font-bold text-white">
                    Edit Employee
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Update employee account information.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={updating}
                  className="text-2xl text-slate-500 transition hover:text-white disabled:opacity-50"
                >
                  ×
                </button>

              </div>

              {/* FORM */}

              <form
                onSubmit={handleUpdateEmployee}
                className="space-y-5 p-6"
              >

                {/* ERROR */}

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
                    value={editForm.name}
                    onChange={handleEditChange}
                    placeholder="Enter employee name"
                    maxLength={100}
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
                    value={editForm.email}
                    onChange={handleEditChange}
                    placeholder="employee@school.com"
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
                    value={editForm.phone}
                    onChange={(e) => {
                      const value =
                        e.target.value.replace(
                          /\D/g,
                          ""
                        );

                      if (value.length <= 10) {
                        setEditForm(
                          (previous) => ({
                            ...previous,
                            phone: value,
                          })
                        );
                      }

                      setError("");
                    }}
                    placeholder="10 digit mobile number"
                    inputMode="numeric"
                    maxLength={10}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                {/* ACTIONS */}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">

                  <button
                    type="button"
                    onClick={closeEditModal}
                    disabled={updating}
                    className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={updating}
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updating
                      ? "Updating..."
                      : "Save Changes"}
                  </button>


                </div>

              </form>

            </div>

          </div>
        )}

      {/* ======================================
          RESET PASSWORD MODAL
      ======================================= */}

      {showPasswordModal && passwordEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Reset Password
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Set a new password for this employee.
                </p>
              </div>

              <button
                type="button"
                onClick={closePasswordModal}
                disabled={resettingPassword}
                className="text-2xl text-slate-500 transition hover:text-white disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleResetPassword}
              className="space-y-5 p-6"
            >

              {/* EMPLOYEE INFO */}

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="font-semibold text-white">
                  {passwordEmployee.name}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {passwordEmployee.email}
                </p>
              </div>

              {/* ERROR */}

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3">
                  <p className="text-sm text-red-300">
                    {error}
                  </p>
                </div>
              )}

              {/* NEW PASSWORD */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  New Password
                </label>

                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => {
                    setPasswordForm((previous) => ({
                      ...previous,
                      newPassword: e.target.value,
                    }));

                    setError("");
                    setSuccess("");
                  }}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-amber-500"
                />
              </div>

              {/* CONFIRM PASSWORD */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => {
                    setPasswordForm((previous) => ({
                      ...previous,
                      confirmPassword: e.target.value,
                    }));

                    setError("");
                    setSuccess("");
                  }}
                  placeholder="Re-enter new password"
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-amber-500"
                />
              </div>

              {/* ACTIONS */}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={resettingPassword}
                  className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {resettingPassword
                    ? "Resetting..."
                    : "Reset Password"}
                </button>

              </div>

            </form>
          </div>
        </div>
      )}


      {/* ======================================
    EMPLOYEE PROFILE MODAL
====================================== */}

      {showProfileModal && profileEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Employee Profile
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Employee details and attendance summary
                </p>
              </div>

              <button
                type="button"
                onClick={closeEmployeeProfile}
                className="text-2xl text-slate-500 transition hover:text-white"
              >
                ×
              </button>
            </div>

            {/* Profile Content */}
            <div className="space-y-6 p-6">

              {/* Employee Basic Information */}
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:flex-row sm:items-center">

                {/* Avatar */}
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white">
                  {profileEmployee.name?.charAt(0)?.toUpperCase() || "E"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-white">
                      {profileEmployee.name}
                    </h3>

                    {profileEmployee.isActive ? (
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                        Active
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                        Inactive
                      </span>
                    )}
                  </div>

                  <p className="mt-2 break-all text-sm text-slate-400">
                    {profileEmployee.email}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    📱 {profileEmployee.phone}
                  </p>
                </div>
              </div>

              {/* Account Information */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Account Information
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">

                  {/* Account Status */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">
                      Account Status
                    </p>

                    <p className="mt-2 font-semibold text-white">
                      {profileEmployee.isActive ? (
                        <span className="text-emerald-400">
                          ● Active
                        </span>
                      ) : (
                        <span className="text-red-400">
                          ● Inactive
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Face Status */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">
                      Face Recognition
                    </p>

                    <p className="mt-2 font-semibold">
                      {profileEmployee.faceRegistered ? (
                        <span className="text-emerald-400">
                          ✓ Registered
                        </span>
                      ) : (
                        <span className="text-amber-400">
                          ⚠ Not Registered
                        </span>
                      )}
                    </p>
                  </div>

                </div>
              </div>

              {/* Attendance Summary */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Attendance Summary
                </h3>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                  {/* Present */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-400">
                      {profileEmployee.attendanceSummary?.present ?? 0}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Present
                    </p>
                  </div>

                  {/* Late */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <p className="text-2xl font-bold text-amber-400">
                      {profileEmployee.attendanceSummary?.late ?? 0}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Late
                    </p>
                  </div>

                  {/* Absent */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <p className="text-2xl font-bold text-red-400">
                      {profileEmployee.attendanceSummary?.absent ?? 0}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Absent
                    </p>
                  </div>

                  {/* Total */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">
                      {profileEmployee.attendanceSummary?.totalAttendanceRecords ?? 0}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Total Records
                    </p>
                  </div>

                </div>
              </div>

              {/* Joining Information */}
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                  Account Timeline
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">
                      Joined On
                    </p>

                    <p className="mt-2 font-semibold text-white">
                      {profileEmployee.createdAt
                        ? new Date(
                          profileEmployee.createdAt
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                        : "—"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs text-slate-500">
                      Last Updated
                    </p>

                    <p className="mt-2 font-semibold text-white">
                      {profileEmployee.updatedAt
                        ? new Date(
                          profileEmployee.updatedAt
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                        : "—"}
                    </p>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end border-t border-slate-800 pt-5">
                <button
                  type="button"
                  onClick={closeEmployeeProfile}
                  className="rounded-xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Employees;