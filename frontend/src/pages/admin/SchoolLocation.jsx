import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/api";

function SchoolLocation() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    latitude: "",
    longitude: "",
    radius: 150,
    gpsAccuracyLimit: 50,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [locationAccuracy, setLocationAccuracy] =
    useState(null);

  // ==========================================
  // GET CURRENT SCHOOL
  // ==========================================

  const fetchSchool = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiRequest("/school");

      const school = data.school;

      setForm({
        name: school.name || "",
        latitude: school.latitude ?? "",
        longitude: school.longitude ?? "",
        radius: school.radius ?? 150,
        gpsAccuracyLimit:
          school.gpsAccuracyLimit ?? 50,
      });
    } catch (error) {
      console.error("Get School Error:", error);

      setError(
        error.message ||
          "Failed to load school location"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchool();
  }, []);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setSuccess("");
    setError("");
  };

  // ==========================================
  // GET CURRENT LOCATION
  // ==========================================

  const getCurrentLocation = () => {
    setError("");
    setSuccess("");

    if (!navigator.geolocation) {
      setError(
        "Geolocation is not supported by this browser."
      );

      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        const accuracy =
          position.coords.accuracy;

        setForm((previous) => ({
          ...previous,
          latitude: latitude.toFixed(8),
          longitude: longitude.toFixed(8),
        }));

        setLocationAccuracy(accuracy);

        setSuccess(
          `Current location detected successfully. Accuracy: ${Math.round(
            accuracy
          )}m`
        );

        setGettingLocation(false);
      },

      (error) => {
        console.error(
          "Get Location Error:",
          error
        );

        let message =
          "Unable to get current location.";

        if (error.code === 1) {
          message =
            "Location permission denied. Please allow location access.";
        }

        if (error.code === 2) {
          message =
            "Location unavailable. Please try again.";
        }

        if (error.code === 3) {
          message =
            "Location request timed out. Please try again.";
        }

        setError(message);
        setGettingLocation(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // ==========================================
  // SAVE SCHOOL LOCATION
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const latitude = Number(form.latitude);
    const longitude = Number(form.longitude);
    const radius = Number(form.radius);
    const gpsAccuracyLimit =
      Number(form.gpsAccuracyLimit);

    // Basic validation

    if (!form.name.trim()) {
      setError("School name is required.");
      return;
    }

    if (
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      setError("Please enter a valid latitude.");
      return;
    }

    if (
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      setError("Please enter a valid longitude.");
      return;
    }

    if (
      !Number.isFinite(radius) ||
      radius < 20
    ) {
      setError(
        "Radius must be at least 20 meters."
      );
      return;
    }

    if (
      !Number.isFinite(gpsAccuracyLimit) ||
      gpsAccuracyLimit < 10 ||
      gpsAccuracyLimit > 500
    ) {
      setError(
        "GPS accuracy limit must be between 10 and 500 meters."
      );
      return;
    }

    try {
      setSaving(true);

      const data = await apiRequest("/school", {
        method: "PUT",
        body: JSON.stringify({
          name: form.name.trim(),
          latitude,
          longitude,
          radius,
          gpsAccuracyLimit,
        }),
      });

      console.log(
        "Update School Response:",
        data
      );

      setSuccess(
        "School location updated successfully ✅"
      );

      setForm({
        name: data.school.name,
        latitude: data.school.latitude,
        longitude: data.school.longitude,
        radius: data.school.radius,
        gpsAccuracyLimit:
          data.school.gpsAccuracyLimit,
      });
    } catch (error) {
      console.error(
        "Update School Error:",
        error
      );

      setError(
        error.message ||
          "Failed to update school location."
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-slate-400">
          Loading school location...
        </p>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* HEADER */}

      <header className="bg-slate-900 border-b border-slate-800">

        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">

          <div>
            <h1 className="text-xl font-bold">
              School Location
            </h1>

            <p className="text-sm text-slate-400">
              Manage school GPS and geofence settings
            </p>
          </div>

          <button
            onClick={() =>
              navigate("/admin")
            }
            className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-medium"
          >
            Back to Dashboard
          </button>

        </div>

      </header>

      {/* MAIN */}

      <main className="max-w-5xl mx-auto px-6 py-8">

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">

          <div className="mb-8">

            <h2 className="text-2xl font-bold">
              School GPS Configuration
            </h2>

            <p className="text-slate-400 mt-2">
              Set the exact school location used for
              employee attendance verification.
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div className="mb-6 bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="mb-6 bg-green-900/40 border border-green-700 text-green-300 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* SCHOOL NAME */}

            <div className="mb-6">

              <label className="block text-sm font-medium text-slate-300 mb-2">
                School Name
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter school name"
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
              />

            </div>

            {/* COORDINATES */}

            <div className="grid md:grid-cols-2 gap-6">

              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Latitude
                </label>

                <input
                  type="number"
                  name="latitude"
                  value={form.latitude}
                  onChange={handleChange}
                  step="any"
                  placeholder="26.123456"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                />

              </div>

              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Longitude
                </label>

                <input
                  type="number"
                  name="longitude"
                  value={form.longitude}
                  onChange={handleChange}
                  step="any"
                  placeholder="85.123456"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                />

              </div>

            </div>

            {/* CURRENT LOCATION */}

            <div className="mt-4">

              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 px-5 py-3 rounded-lg font-semibold"
              >
                {gettingLocation
                  ? "Getting Location..."
                  : "📍 Use Current Location"}
              </button>

              {locationAccuracy !== null && (
                <p className="text-sm text-slate-400 mt-2">
                  Current GPS accuracy:{" "}
                  <span className="text-white font-medium">
                    {Math.round(
                      locationAccuracy
                    )}
                    m
                  </span>
                </p>
              )}

            </div>

            {/* RADIUS + ACCURACY */}

            <div className="grid md:grid-cols-2 gap-6 mt-8">

              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Allowed Radius (meters)
                </label>

                <input
                  type="number"
                  name="radius"
                  value={form.radius}
                  onChange={handleChange}
                  min="20"
                  step="1"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                />

                <p className="text-xs text-slate-500 mt-2">
                  Employees must be within this distance
                  from the school.
                </p>

              </div>

              <div>

                <label className="block text-sm font-medium text-slate-300 mb-2">
                  GPS Accuracy Limit (meters)
                </label>

                <input
                  type="number"
                  name="gpsAccuracyLimit"
                  value={form.gpsAccuracyLimit}
                  onChange={handleChange}
                  min="10"
                  max="500"
                  step="1"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white outline-none focus:border-blue-500"
                />

                <p className="text-xs text-slate-500 mt-2">
                  Lower value means more accurate GPS is
                  required.
                </p>

              </div>

            </div>

            {/* CURRENT CONFIGURATION */}

            <div className="mt-8 bg-slate-800/70 border border-slate-700 rounded-xl p-5">

              <h3 className="font-semibold text-lg mb-4">
                Current Configuration
              </h3>

              <div className="grid sm:grid-cols-3 gap-4">

                <div>
                  <p className="text-xs text-slate-400">
                    Radius
                  </p>

                  <p className="text-lg font-semibold mt-1">
                    {form.radius}m
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    GPS Accuracy Limit
                  </p>

                  <p className="text-lg font-semibold mt-1">
                    {form.gpsAccuracyLimit}m
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Status
                  </p>

                  <p className="text-lg font-semibold text-green-400 mt-1">
                    Active
                  </p>
                </div>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8 pt-6 border-t border-slate-800">

              <button
                type="button"
                onClick={() =>
                  navigate("/admin")
                }
                className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 font-semibold"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 font-semibold"
              >
                {saving
                  ? "Saving..."
                  : "Save School Location"}
              </button>

            </div>

          </form>

        </div>

      </main>

    </div>
  );
}

export default SchoolLocation;