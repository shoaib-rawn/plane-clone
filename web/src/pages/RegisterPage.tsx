import { useState } from "react";
import { Eye, EyeOff, CheckSquare, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

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

  // Register API
  const registerMutation = useMutation({
    mutationFn: async (userData: {
      email: string;
      password: string;
      displayName: string;
    }) => {
      const response = await fetch(
        "http://localhost:4000/api/v1/auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(userData),
        },
      );

      const data = await response.json();

      console.log("Register API response:", data);

      if (!response.ok) {
        const apiError = new Error(
          data.message || "Registration failed",
        ) as RegisterError;

        apiError.status = response.status;

        throw apiError;
      }

      return data;
    },

    // Registration successful
    onSuccess: (data) => {
      console.log("Registration successful:", data);

      setError("");

      navigate("/login");
    },

    // Registration failed
    onError: (error: RegisterError) => {
      console.log("Registration error:", error);

      /*
       * 409 = Conflict
       *
       * Usually backend uses 409 when
       * email already exists.
       */
      if (error.status === 409) {
        setError(
          "User already exists with this email. Please use another email address.",
        );

        return;
      }

      /*
       * If backend sends a duplicate-user
       * message with another status code.
       */
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

      // Other backend errors
      setError(error.message || "Registration failed. Please try again.");
    },
  });

  const handleRegister = (): void => {
    setError("");

    // Empty fields
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    // Email validation
    const emailRegex = /^[A-Za-z][A-Za-z0-9._%+-]*@[A-Za-z][A-Za-z0-9-]*\.com$/;

    // Password validation
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!passwordRegex.test(password)) {
      setError(
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Clear previous error
    setError("");

    // API call
    registerMutation.mutate({
      email: email.trim(),
      password,
      displayName: name.trim(),
    });
  };

  return (
    <div className="register-page">
      <div className="register-card">
        {/* Logo & Brand */}
        <div className="register-brand">
          <div className="register-logo">
            <CheckSquare size={27} strokeWidth={2.5} />
          </div>

          <h1>Miniplan</h1>
        </div>

        {/* Heading */}
        <div className="register-heading">
          <h2>Create your account</h2>

          <p>Get started by creating your workspace account.</p>
        </div>

        {/* Form */}
        <div className="register-form">
          {/* Name */}
          <div className="register-input-group">
            <label htmlFor="name">Full name</label>

            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              autoComplete="name"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setName(e.target.value);
                setError("");
              }}
            />
          </div>

          {/* Email */}
          <div className="register-input-group">
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
              }}
            />
          </div>

          {/* Password */}
          <div className="register-input-group">
            <label htmlFor="password">Password</label>

            <div className="register-password-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
                value={password}
                autoComplete="new-password"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />

              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="register-input-group">
            <label htmlFor="confirmPassword">Confirm password</label>

            <div className="register-password-wrapper">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setConfirmPassword(e.target.value);
                  setError("");
                }}
              />

              <button
                type="button"
                className="register-password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <p className="register-error">{error}</p>}

          {/* Create Account */}
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

        {/* Login */}
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
