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

  // Login API
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

    // Successful login
    onSuccess: (data) => {
      console.log("Login successful:", data);

      setError("");
      setFieldErrors({});

      /*
        Backend response expected:

        data.data.token
        data.data.user.displayName
      */

      const token = data.data.token;
      const userName = data.data.user.displayName;

      // Store token
      localStorage.setItem("token", token);

      // Store authentication information in Redux
      dispatch(
        login({
          token,
          userName,
        }),
      );

      // Navigate after successful login
      navigate("/dashboard");
    },

    // API error
    onError: (error: ApiError) => {
      console.log("Login error:", error);

      setError("");
      setFieldErrors({});

      // 422 = validation errors
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

      // Other server errors
      setError(error.message || "Something went wrong. Please try again.");
    },
  });

  const handleSignIn = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();

    setError("");
    setFieldErrors({});

    /*
      Email validation

      Examples:

      john@gmail.com       ✅
      john123@gmail.com    ✅
      farhan.qureshi@gmail.com ✅

      123john@gmail.com    ❌
      @gmail.com           ❌
      john@gmail           ❌
      john@gmail.xyz       ❌

      First character must be a letter.
      After that letters/numbers/dot/underscore/etc are allowed.
      Domain must contain .com
    */

    const emailRegex = /^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z][A-Za-z0-9-]*\.com$/;

    // Empty fields
    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    // Email validation
    if (!emailRegex.test(email)) {
      setFieldErrors({
        email: "Please enter a valid email address.",
      });

      return;
    }

    // Password validation
    if (password.length < 8) {
      setFieldErrors({
        password: "Password must be at least 8 characters.",
      });

      return;
    }

    // API call
    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  return (
    <div className="signin-page">
      <div className="signin-card">
        {/* Logo & Brand */}
        <div className="brand">
          <div className="brand-logo">
            <CheckSquare size={28} strokeWidth={2.5} />
          </div>

          <h1>Miniplan</h1>
        </div>

        {/* Heading */}
        <div className="signin-heading">
          <h2>Sign in to your workspace</h2>

          <p>Welcome back! Please enter your details.</p>
        </div>

        {/* Form */}
        <form className="signin-form" onSubmit={handleSignIn}>
          {/* Email */}
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

            {/* Email field error */}
            {fieldErrors.email && (
              <p className="field-error">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
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

            {/* Password field error */}
            {fieldErrors.password && (
              <p className="field-error">{fieldErrors.password}</p>
            )}
          </div>

          {/* General Server Error */}
          {error && <p className="error-message">{error}</p>}

          {/* Sign In Button */}
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

        {/* Register */}
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
