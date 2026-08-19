import { useState } from "react";
import { CheckSquare, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import FormInput from "../components/FormInput";
import { registerUser, type ApiError } from "../features/auth/api/authApi";
import {
  isStrongPassword,
  isValidEmail,
} from "../features/auth/utils/validation";
import "../styling/RegisterPage.css";

interface RegisterError extends Error {
  status?: number;
}

const RegisterPage = () => {
  const navigate = useNavigate();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);

  const [error, setError] = useState<string>("");

  const registerMutation = useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      displayName: string;
    }) => registerUser(userData),

    onSuccess: () => {
      setError("");
      navigate("/login");
    },

    onError: (error: RegisterError & ApiError) => {
      if (error.status === 409) {
        setError(
          "User already exists with this email. Please use another email address.",
        );

        return;
      }

      const message = error.message.toLowerCase();

      if (
        message.includes("already exists") ||
        message.includes("already registered") ||
        message.includes("duplicate") ||
        message.includes("email already")
      ) {
        setError(
          "User already exists with this email. Please use another email address.",
        );

        return;
      }

      setError(error.message || "Registration failed. Please try again.");
    },
  });

  const handleRegister = (): void => {
    setError("");

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isStrongPassword(password)) {
      setError(
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    registerMutation.mutate({
      email: email.trim(),
      password,
      displayName: name.trim(),
    });
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-brand">
          <div className="register-logo">
            <CheckSquare size={27} strokeWidth={2.5} />
          </div>

          <h1>Miniplan</h1>
        </div>

        <div className="register-heading">
          <h2>Create your account</h2>
          <p>Get started by creating your workspace account.</p>
        </div>

        <div className="register-form">
          <FormInput
            id="name"
            label="Full name"
            placeholder="Enter your name"
            value={name}
            autoComplete="name"
            containerClassName="register-input-group"
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
          />

          <FormInput
            id="email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            autoComplete="email"
            containerClassName="register-input-group"
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
          />

          <FormInput
            id="password"
            label="Password"
            type="password"
            placeholder="Create a password"
            value={password}
            autoComplete="new-password"
            containerClassName="register-input-group"
            passwordWrapperClassName="register-password-wrapper"
            passwordToggleClassName="register-password-toggle"
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
            label="Confirm password"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            autoComplete="new-password"
            containerClassName="register-input-group"
            passwordWrapperClassName="register-password-wrapper"
            passwordToggleClassName="register-password-toggle"
            showPasswordToggle
            isPasswordVisible={showConfirmPassword}
            onTogglePassword={() =>
              setShowConfirmPassword((current) => !current)
            }
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setError("");
            }}
          />

          {error && <p className="register-error">{error}</p>}

          <button
            type="button"
            className="register-button"
            onClick={handleRegister}
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <LoaderCircle size={18} className="register-spinner" />
                <span>Creating account...</span>
              </>
            ) : (
              "Create account"
            )}
          </button>
        </div>

        <div className="login-text">
          <span>Already have an account?</span>
          <button type="button" onClick={() => navigate("/login")}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
