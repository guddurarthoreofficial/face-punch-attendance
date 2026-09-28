import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // RESTORE AUTH SESSION
  // ==========================================
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);

        setToken(savedToken);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Auth Restore Error:", error);

      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================
  const login = (authToken, authUser) => {
    localStorage.setItem("token", authToken);
    localStorage.setItem(
      "user",
      JSON.stringify(authUser)
    );

    setToken(authToken);
    setUser(authUser);
  };

  // ==========================================
  // LOGOUT
  // ==========================================
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==========================================
// CUSTOM HOOK
// ==========================================
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};