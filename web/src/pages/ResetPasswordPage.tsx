import React, { useState, useEffect } from "react";
import { CheckSquare, LoaderCircle, CheckCircle2, Lock } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import FormInput from "../components/FormInput";
import { hasMinimumPasswordLength, resetPassword } from "../auth";
import "../styling/LoginPage.css";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const urlToken = searchParams.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!token.trim()) {
      setError("Reset token is required.");
      return;
    }

    if (!hasMinimumPasswordLength(password)) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(token.trim(), password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Token may be invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signin-page">
      <div className="signin-card">
        <div className="brand">
          <div className="brand-logo">
            <CheckSquare size={28} strokeWidth={2.5} />
          </div>
          <h1>Planora</h1>
        </div>

        <div className="signin-heading">
          <h2>Set new password</h2>
          <p>Please enter your new password below.</p>
        </div>

        {success ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "#DCFCE7",
                color: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto",
              }}
            >
              <CheckCircle2 size={28} />
            </div>
            <h3 style={{ fontSize: 16, color: "#1E293B", margin: "0 0 8px 0" }}>
              Password Reset Complete
            </h3>
            <p style={{ fontSize: 13, color: "#64748B", marginBottom: 20 }}>
              Your password has been changed successfully. You may now sign in.
            </p>
            <button
              type="button"
              className="signin-button"
              onClick={() => navigate("/login")}
            >
              Sign in with new password
            </button>
          </div>
        ) : (
          <form className="signin-form" onSubmit={handleResetPassword}>
            {/* If token wasn't in URL query parameter, allow manual entry */}
            {!searchParams.get("token") && (
              <FormInput
                id="token"
                label="Reset Token"
                type="text"
                placeholder="Paste the reset token from your email"
                value={token}
                onChange={(event) => {
                  setToken(event.target.value);
                  setError("");
                }}
              />
            )}

            <FormInput
              id="password"
              label="New Password"
              type="password"
              placeholder="Enter new password (min 8 chars)"
              value={password}
              autoComplete="new-password"
              showPasswordToggle
              isPasswordVisible={showPassword}
              onTogglePassword={() => setShowPassword((current) => !current)}
              onChange={(event) => {
                setPassword(event.target.value);
                setError("");
              }}
            />

            <FormInput
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(event) => {
                setConfirmPassword(event.target.value);
                setError("");
              }}
            />

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="signin-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoaderCircle size={18} className="spinner" />
                  <span>Updating password...</span>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Lock size={16} />
                  <span>Save New Password</span>
                </div>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
