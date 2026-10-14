
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../services/api";

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await apiRequest("/employees/me");

        if (isMounted) {
          setEmployee(response.employee);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "Unable to load your profile.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Not available";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const displayValue = (value) => {
    if (value === undefined || value === null || value === "") {
      return "Not available";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (Array.isArray(value)) {
      return value.length ? value.join(", ") : "Not available";
    }

    return String(value);
  };

  const maskAccountNumber = (value) => {
    if (!value) return "Not available";

    const account = String(value);

    if (account.length <= 4) {
      return "•".repeat(account.length);
    }

    return `${"•".repeat(Math.min(account.length - 4, 8))}${account.slice(-4)}`;
  };

  const DetailSection = ({ title, description, fields }) => (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => {
          const value = field.format
            ? field.format(field.value)
            : displayValue(field.value);

          return (
            <div
              key={field.label}
              className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/60 p-4"
            >
              <p className="text-xs font-medium text-slate-500">
                {field.label}
              </p>

              <p
                className={`mt-2 break-words text-sm font-medium ${field.status
                    ? field.value === false
                      ? "text-red-400"
                      : "text-emerald-400"
                    : "text-slate-200"
                  } ${field.capitalize ? "capitalize" : ""}`}
              >
                {value}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-400">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-white">
          Unable to load profile
        </h2>

        <p className="mt-2 text-sm text-red-400">
          {error || "Employee profile was not found."}
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Try Again
          </button>

          <button
            onClick={() => navigate("/employee")}
            className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm text-white hover:bg-slate-800"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  const joinedDate = employee.createdAt;
  const updatedDate = employee.updatedAt;
  const bank = employee.bankDetails || {};

  const personalFields = [
    { label: "Full Name", value: employee.name },
    { label: "Email Address", value: employee.email },
    { label: "Phone Number", value: employee.phone },
    {
      label: "Employee ID",
      value: employee.employeeId || employee._id || employee.id,
    },
    {
      label: "Date of Birth",
      value: employee.dateOfBirth,
      format: formatDate,
    },
    {
      label: "Account Role",
      value: employee.role,
      capitalize: true,
    },
    {
      label: "Account Status",
      value: employee.isActive,
      format: (value) =>
        value === false ? "Inactive" : value === true ? "Active" : "Unknown",
      status: true,
    },
    {
      label: "Account Created",
      value: joinedDate,
      format: formatDate,
    },
    {
      label: "Last Updated",
      value: updatedDate,
      format: formatDate,
    },
  ];

  const addressFields = [
    { label: "Current Address", value: employee.currentAddress },
    { label: "Permanent Address", value: employee.permanentAddress },
  ];

  const educationFields = [
    { label: "Qualification", value: employee.qualification },
    { label: "Specialization", value: employee.specialization },
  ];

  const employmentFields = [
    { label: "Designation", value: employee.designation },
    {
      label: "Class Teacher",
      value: employee.isClassTeacher,
    },
    { label: "Assigned Class", value: employee.classTeacherClass },
    { label: "Class Section", value: employee.classTeacherSection },
    { label: "Subjects", value: employee.subjects },
  ];

  const bankFields = [
    { label: "Account Holder", value: bank.accountHolderName },
    { label: "Bank Name", value: bank.bankName },
    {
      label: "Account Number",
      value: bank.accountNumber,
      format: maskAccountNumber,
    },
    { label: "IFSC Code", value: bank.ifscCode },
    {
      label: "UPI ID", value: bank.upiId, format: (value) => {
        if (!value) return "Not available";
        const parts = String(value).split("@");
        if (parts.length !== 2) return "••••••";
        return `${parts[0].slice(0, 2)}••••@${parts[1]}`;
      }
    },
  ];

  const faceRegistered =
    employee.faceRegistered === true ||
    (Array.isArray(employee.faceData) && employee.faceData.length > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-400">Employee Portal / Account</p>

          <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
            My Profile
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            View your personal, professional and account information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/employee")}
          className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Back to Dashboard
        </button>
      </div>

      {/* PROFILE HEADER */}
      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-3xl font-bold text-white shadow-lg shadow-indigo-600/20">
            {employee.name?.charAt(0)?.toUpperCase() || "E"}
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="break-words text-2xl font-bold text-white">
              {employee.name || "Employee"}
            </h2>

            <p className="mt-1 break-all text-sm text-slate-400">
              {employee.email || "No email available"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium capitalize text-indigo-400">
                {employee.designation || employee.role || "Employee"}
              </span>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium ${employee.isActive === false
                    ? "border-red-500/20 bg-red-500/10 text-red-400"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  }`}
              >
                {employee.isActive === false ? "Inactive" : "Active"}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 sm:min-w-36">
            <p className="text-xs text-slate-500">Face Verification</p>
            <p
              className={`mt-2 text-sm font-semibold ${faceRegistered ? "text-emerald-400" : "text-amber-400"
                }`}
            >
              {faceRegistered ? "Registered" : "Not registered"}
            </p>
          </div>
        </div>
      </section>

      <DetailSection
        title="Personal & Account Information"
        description="Your registered identity and account details."
        fields={personalFields}
      />

      <DetailSection
        title="Address Information"
        description="Your current and permanent address."
        fields={addressFields}
      />

      <DetailSection
        title="Qualification & Education"
        description="Your educational background."
        fields={educationFields}
      />

      <DetailSection
        title="Employment & Teaching Details"
        description="Your designation, class assignment and subjects."
        fields={employmentFields}
      />

      <DetailSection
        title="Bank & Payment Information"
        description="Sensitive details are masked for privacy."
        fields={bankFields}
      />

      {/* FACE VERIFICATION */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-white">Face Verification</h3>

        <p className="mt-1 text-sm text-slate-400">
          Used by the attendance system to verify your registered face.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${faceRegistered
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                : "border-amber-500/20 bg-amber-500/10 text-amber-400"
              }`}
          >
            {faceRegistered
              ? "Face Data Registered"
              : "Face Registration Not Confirmed"}
          </span>
        </div>
      </section>

      {/* SECURITY */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-white">Account Security</h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          Your account is protected by the application's authentication system.
          Never share your password or login token with anyone.
        </p>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <p className="text-sm font-medium text-white">Password Management</p>

          <p className="mt-1 text-sm text-slate-400">
            For password assistance, contact your administrator.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Profile;
