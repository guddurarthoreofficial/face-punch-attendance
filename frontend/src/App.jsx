import { useState } from "react";
import Login from "./pages/Login";
import FaceCamera from "./components/FaceCamera";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div>
      <div className="bg-slate-900 px-6 py-4 flex justify-between items-center">
        <h2 className="text-white font-bold">
          School Attendance
        </h2>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      <FaceCamera />
    </div>
  );
}

export default App;