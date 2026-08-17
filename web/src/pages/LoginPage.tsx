import { useState } from "react";
import { Eye, EyeOff, CheckSquare, LoaderCircle } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";

import "../styling/LoginPage.css";

import { login } from "../store/slices/authSlice";

interface FieldErrors {
  email?: string;
  password?: string;
}

interface ApiError extends Error {
  status?: number;
  data?: {
    errors?: {
      email?: string | string[];
      password?: string | string[];
    };
  };
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
    mutationFn: async (userData: { email: string; password: string }) => {
      const response = await fetch("http://localhost:4000/api/v1/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(userData),
      });

      const data = await response.json();

      console.log("Login API response:", data);

      if (!response.ok) {
        const apiError = new Error(
          data.message || "Invalid email or password.",
        ) as ApiError;

        apiError.status = response.status;
        apiError.data = data;

        throw apiError;
      }

      return data;
    },

    onSuccess: (data) => {
      console.log("Login successful:", data);

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
      console.log("Login error:", error);

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

    const emailRegex = /^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z][A-Za-z0-9-]*\.com$/;

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    if (!emailRegex.test(email)) {
      setFieldErrors({
        email: "Please enter a valid email address.",
      });

      return;
    }

    if (password.length < 8) {
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
          <div className="input-group">
            <label htmlFor="email">Email</label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              autoComplete="email"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setEmail(e.target.value);

                setError("");

                setFieldErrors((previous) => ({
                  ...previous,
                  email: undefined,
                }));
              }}
            />

            {fieldErrors.email && (
              <p className="field-error">{fieldErrors.email}</p>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>

            <div className="password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                autoComplete="current-password"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setPassword(e.target.value);

                  setError("");

                  setFieldErrors((previous) => ({
                    ...previous,
                    password: undefined,
                  }));
                }}
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {fieldErrors.password && (
              <p className="field-error">{fieldErrors.password}</p>
            )}
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
