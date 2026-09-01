import React, { useState } from "react";
import { CheckSquare, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormInput from "../components/FormInput";
import { isValidEmail, hasMinimumPasswordLength, loginUser, useAuth } from "../auth";
import "../styling/LoginPage.css";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (res) => {
      const user = res.data.user;
      const workspaceRole = res.data.workspaceRole;

      queryClient.setQueryData(["currentUser"], {
        data: { user, workspaceRole },
      });

      login({
        displayName: user.displayName,
        workspaceRole,
      });

      navigate("/dashboard");
    },
    onError: (err: any) => {
      setError(err.message || "Invalid credentials");
    },
  });

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!isValidEmail(email)) {
      setFieldErrors({ email: "Please enter a valid email address." });
      return;
    }

    if (!hasMinimumPasswordLength(password, 8)) {
      setFieldErrors({ password: "Password must be at least 8 characters." });
      return;
    }

    loginMutation.mutate({
      email: email.trim(),
      password,
    });
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
          <h2>Sign in to your workspace</h2>
          <p>Welcome back! Please enter your details.</p>
        </div>

        <form className="signin-form" onSubmit={handleSignIn}>
          <FormInput
            id="email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            autoComplete="email"
            error={fieldErrors.email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
          />

          <FormInput
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            autoComplete="current-password"
            showPasswordToggle
            isPasswordVisible={showPassword}
            error={fieldErrors.password}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-4px" }}>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              style={{
                background: "none",
                border: "none",
                color: "#6D28D9",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button
            type="submit"
            className="signin-button"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <LoaderCircle size={18} className="spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
