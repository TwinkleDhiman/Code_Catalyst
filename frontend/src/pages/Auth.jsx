import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../App";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(
    searchParams.get("mode") === "signup"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { login, token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) navigate("/dashboard");
  }, [token, navigate]);

  useEffect(() => {
    setIsSignUp(searchParams.get("mode") === "signup");
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const endpoint = isSignUp ? "/api/auth/register" : "/api/auth/login";
      const payload = isSignUp
        ? { fullname, email, password }
        : { email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const { token: jwtToken, user: userData } = result.data || result;
        login(jwtToken, userData);
        navigate("/dashboard");
      } else {
        setError(result.message || "Authentication failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Network error. Please make sure the backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-gray-100 flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20"></div>

          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            CodeCatalyst
          </h2>

          <p className="text-xs text-gray-400 font-medium">
            Rule-Based Developer Intelligence &amp; Repository Analysis
          </p>
        </div>

        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white font-semibold transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="glass-panel rounded-3xl p-8 border border-gray-800 shadow-2xl relative">
          <h3 className="text-xl font-bold mb-2">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h3>

          <p className="text-xs text-gray-400 mb-6 font-medium">
            {isSignUp
              ? "Sign up to perform static repository analysis."
              : "Enter your credentials to access the CodeCatalyst platform."}
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-900/60 flex items-start gap-2.5 text-xs text-red-300 font-semibold">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs text-gray-400 font-bold tracking-wide">
                  Full Name
                </label>

                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Jane Doe"
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    className="w-full bg-gray-950/50 border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-primary-500 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-bold tracking-wide">
                Email Address
              </label>

              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-950/50 border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400 font-bold tracking-wide">
                Password
              </label>

              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-950/50 border border-gray-800 rounded-xl py-3 pl-11 pr-4 text-sm focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-primary-500/15 hover:shadow-primary-500/30 transition-all flex items-center justify-center gap-2 group mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>{isSignUp ? "Create Account" : "Access Console"}</>
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-xs text-gray-400 hover:text-white font-semibold transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign In"
                : "New here? Create an account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;