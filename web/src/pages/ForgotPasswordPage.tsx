import React, { useState } from "react";
import { CheckSquare, LoaderCircle, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import { isValidEmail, forgotPassword } from "../auth";
import "../styling/LoginPage.css";

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setIsLoading(true);
      const res = await forgotPassword(email.trim());
      setSuccessMessage(
        res?.data?.message ||
          "If an account with that email exists, a password reset link has been sent to your inbox."
      );
    } catch (err: any) {
      setError(err.message || "Failed to request password reset.");
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
          <h2>Forgot your password?</h2>
          <p>Enter your account email and we'll send you a password reset link.</p>
        </div>

        {successMessage ? (
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
            <p style={{ fontSize: 14, color: "#334155", lineHeight: 1.5, marginBottom: 20 }}>
              {successMessage}
            </p>
            <button
              type="button"
              className="signin-button"
              onClick={() => navigate("/login")}
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form className="signin-form" onSubmit={handleSubmit}>
            <FormInput
              id="email"
              label="Email Address"
              type="email"
              placeholder="Enter your registered email"
              value={email}
              autoComplete="email"
              onChange={(event) => {
                setEmail(event.target.value);
                setError("");
              }}
            />

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="signin-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoaderCircle size={18} className="spinner" />
                  <span>Sending link...</span>
                </>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Mail size={16} />
                  <span>Send Reset Link</span>
                </div>
              )}
            </button>
          </form>
        )}

        <div className="register-text" style={{ marginTop: 18 }}>
          <button
            type="button"
            onClick={() => navigate("/login")}
            style={{ display: "flex", alignItems: "center", gap: 6, margin: "0 auto" }}
          >
            <ArrowLeft size={14} /> Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
