import { useState } from "react";
import { CheckSquare, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";

import FormInput from "../components/FormInput";
import { loginUser, type ApiError } from "../features/auth/api/authApi";
import {
  hasMinimumPasswordLength,
  isValidEmail,
} from "../features/auth/utils/validation";
import { login } from "../store/slices/authSlice";
import "../styling/LoginPage.css";

interface FieldErrors {
  email?: string;
  password?: string;
}

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const loginMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string }) =>
      loginUser(userData),

    onSuccess: (data) => {
      setError("");
      setFieldErrors({});

      const token = data.data.token;
      const userName = data.data.user.displayName;

      localStorage.setItem("token", token);

      dispatch(
        login({
          token,
          userName,
        }),
      );

      navigate("/dashboard");
    },

    onError: (error: ApiError) => {
      setError("");
      setFieldErrors({});

      if (error.status === 422) {
        const errors = error.data?.errors;

        setFieldErrors({
          email: Array.isArray(errors?.email) ? errors.email[0] : errors?.email,
          password: Array.isArray(errors?.password)
            ? errors.password[0]
            : errors?.password,
        });

        return;
      }

      setError(error.message || "Something went wrong. Please try again.");
    },
  });

  const handleSignIn = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    setError("");
    setFieldErrors({});

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!isValidEmail(email)) {
      setFieldErrors({
        email: "Please enter a valid email address.",
      });

      return;
    }

    if (!hasMinimumPasswordLength(password)) {
      setFieldErrors({
        password: "Password must be at least 8 characters.",
      });

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

          <h1>Miniplan</h1>
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
