import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">Loading profile...</p>
      </div>
    );
  }

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "Not available";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">
              My Profile
            </h1>

            <p className="text-sm text-slate-400 mt-1">
              View your account information
            </p>
          </div>

          <button
            onClick={() => navigate("/employee")}
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            Back
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 sm:p-8 border-b border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold shadow-lg">
                {user.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  {user.name || "Employee"}
                </h2>

                <p className="text-slate-400 mt-1">
                  {user.email || "No email available"}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-medium">
                    Employee
                  </span>

                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                    {user.isActive !== false
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="p-6 sm:p-8">
            <h3 className="text-lg font-semibold mb-5">
              Account Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Name */}
              <div className="bg-slate-800/60 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">
                  Full Name
                </p>

                <p className="font-medium">
                  {user.name || "Not available"}
                </p>
              </div>

              {/* Email */}
              <div className="bg-slate-800/60 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">
                  Email Address
                </p>

                <p className="font-medium break-all">
                  {user.email || "Not available"}
                </p>
              </div>

              {/* Phone */}
              <div className="bg-slate-800/60 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">
                  Phone Number
                </p>

                <p className="font-medium">
                  {user.phone || "Not available"}
                </p>
              </div>

              {/* Role */}
              <div className="bg-slate-800/60 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">
                  Account Role
                </p>

                <p className="font-medium capitalize">
                  {user.role || "employee"}
                </p>
              </div>

              {/* Status */}
              <div className="bg-slate-800/60 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">
                  Account Status
                </p>

                <p
                  className={
                    user.isActive !== false
                      ? "font-medium text-emerald-400"
                      : "font-medium text-red-400"
                  }
                >
                  {user.isActive !== false
                    ? "Active"
                    : "Inactive"}
                </p>
              </div>

              {/* Joined Date */}
              <div className="bg-slate-800/60 rounded-xl p-4">
                <p className="text-xs text-slate-400 mb-1">
                  Joined Date
                </p>

                <p className="font-medium">
                  {joinedDate}
                </p>
              </div>
            </div>
          </div>

          {/* Security */}
          <div className="p-6 sm:p-8 border-t border-slate-800">
            <h3 className="text-lg font-semibold">
              Security
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              Your password is securely protected.
            </p>

            <div className="mt-4">
              <button
                disabled
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-500 cursor-not-allowed"
              >
                Change Password
              </button>

              <p className="text-xs text-slate-500 mt-2">
                Password change will be available in a future update.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;