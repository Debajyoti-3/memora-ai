import React, { useState } from "react";
import { toast } from "sonner";
import { authAPI } from "../services/api";
import { SpikeLogo, EyeIcon, EyeOffIcon } from "../components/Icons";

export const Auth = ({ setUser, setView }) => {
  const [authMode, setAuthMode] = useState("login"); // 'login' or 'signup'
  const [authFormData, setAuthFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });
  
  // Password toggle state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Reset password visibility toggle when submitting
    setShowPassword(false);

    try {
      if (authMode === "signup") {
        // Signup call
        const result = await authAPI.signup(
          authFormData.fullName,
          authFormData.email,
          authFormData.password
        );
        
        setAuthMode("login");
        setAuthFormData({ fullName: "", email: "", password: "" });
        toast.success("Signup successful! Please log in.");
      } else {
        // Login call
        const result = await authAPI.login(
          authFormData.email,
          authFormData.password
        );

        const loggedUser = {
          id: result.data._id,
          email: result.data.email,
          fullName: result.data.fullName || result.data.fullNmae, // handle typo in backend payload
        };
        
        localStorage.setItem("memora_user", JSON.stringify(loggedUser));
        setUser(loggedUser);
        setView("dashboard");
        toast.success(`Welcome back, ${loggedUser.fullName || "User"}!`);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Authentication failed. Please check details.";
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card anim-slide-up">
        {/* Back Link to Landing Page */}
        <div style={{ textAlign: "left", marginBottom: "16px" }}>
          <button 
            className="btn btn-text text-link" 
            onClick={() => setView("landing")} 
            style={{ padding: 0, display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "13px" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to homepage
          </button>
        </div>

        <div className="auth-header">
          <div className="auth-logo">
            <SpikeLogo size={36} style={{ color: "var(--color-primary)" }} />
          </div>
          <h1 className="auth-title">Memora AI</h1>
          <p className="auth-subtitle">
            {authMode === "login" 
              ? "Enter your credentials to access your thinking partner" 
              : "Create an account to start remembering and context-chatting"}
          </p>
        </div>

        <form onSubmit={handleAuthSubmit} className="auth-form">
          {authMode === "signup" && (
            <div className="input-group">
              <label className="input-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className="text-input"
                placeholder="e.g. Claude Shannon"
                required
                disabled={isLoading}
                value={authFormData.fullName}
                onChange={(e) => setAuthFormData(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              className="text-input"
              placeholder="you@domain.com"
              required
              disabled={isLoading}
              value={authFormData.email}
              onChange={(e) => setAuthFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="text-input"
                placeholder="••••••••"
                required
                disabled={isLoading}
                value={authFormData.password}
                onChange={(e) => setAuthFormData(prev => ({ ...prev, password: e.target.value }))}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={isLoading}
            style={{ width: "100%", height: "42px", marginTop: "8px" }}
          >
            {isLoading 
              ? "Authenticating..." 
              : authMode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          {authMode === "login" ? (
            <>
              New to Memora?{" "}
              <button 
                className="text-link btn-text" 
                disabled={isLoading} 
                onClick={() => { setAuthMode("signup"); setShowPassword(false); }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Have an account?{" "}
              <button 
                className="text-link btn-text" 
                disabled={isLoading} 
                onClick={() => { setAuthMode("login"); setShowPassword(false); }}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
