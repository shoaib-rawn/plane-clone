import { useState } from "react";
import { CheckSquare, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";

import {
  hasMinimumPasswordLength,
  isValidEmail,
} from "../features/auth/utils/validation";

import "../styling/LoginPage.css";
import { useLogin } from "../features/auth/hooks/useLogin";

interface FieldErrors {
  email?: string;
  password?: string;
}

const LoginPage = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const loginMutation = useLogin();

  const handleSignIn = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    // Clear old errors
    setError("");
    setFieldErrors({});

    // Required fields
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    // Email validation
    if (!isValidEmail(email)) {
      setFieldErrors({
        email: "Please enter a valid email address.",
      });
      return;
    }

    // Password validation
    if (!hasMinimumPasswordLength(password)) {
      setFieldErrors({
        password: "Password must be at least 8 characters.",
      });
      return;
    }

    // API call
    loginMutation.mutate(
      {
        email: email.trim(),
        password,
      },
      {
        onSuccess: () => {
          setError("");
          setFieldErrors({});
          navigate("/dashboard");
        },

        onError: (error) => {
          setError(error.message);
        },
      },
    );
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
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");

              setFieldErrors((previous) => ({
                ...previous,
                email: undefined,
              }));
            }}
          />

          <FormInput
            id="password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            autoComplete="current-password"
            error={fieldErrors.password}
            showPasswordToggle
            isPasswordVisible={showPassword}
            onTogglePassword={() => setShowPassword((current) => !current)}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");

              setFieldErrors((previous) => ({
                ...previous,
                password: undefined,
              }));
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "-6px", marginBottom: "6px" }}>
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              style={{
                background: "none",
                border: "none",
                color: "#2563EB",
                fontSize: "13px",
                fontWeight: 500,
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

        <div className="register-text">
          <span>No account yet?</span>

          <button type="button" onClick={() => navigate("/register")}>
            Create one
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
