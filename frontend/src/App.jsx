import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // sessionStorage is automatically cleared when the browser tab/window is closed,
  // so the user must log in again every new browser session.
  const [token, setToken] = useState(sessionStorage.getItem("p2p_token"));
  const [loading, setLoading] = useState(true);

  // One-time migration: remove any stale token left in localStorage from before
  // this update, so existing sessions are invalidated immediately.
  useEffect(() => {
    if (localStorage.getItem("p2p_token")) {
      localStorage.removeItem("p2p_token");
    }
  }, []);

  // Belt-and-suspenders: also explicitly clear the session token on tab/window unload.
  useEffect(() => {
    const handleUnload = () => {
      sessionStorage.removeItem("p2p_token");
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const result = await res.json();
          setUser(result.data ? result.data.user : result.user);
        } else {
          logout();
        }
      } catch (e) {
        console.error("Failed to authenticate token", e);
        logout();
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [token]);

  const login = (jwtToken, userData) => {
    sessionStorage.setItem("p2p_token", jwtToken);
    setToken(jwtToken);
    setUser(userData);
  };

  const logout = () => {
    sessionStorage.removeItem("p2p_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        <p className="mt-4 text-gray-400 font-medium">
          Verifying credentials...
        </p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
