import { useState } from "react";
import { CheckSquare, LoaderCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import FormInput from "../components/FormInput";
import {
  isStrongPassword,
  isValidEmail,
} from "../features/auth/utils/validation";
import "../styling/LoginPage.css";
import { useRegister } from "../features/auth/hooks/useRegister";

const RegisterPage = () => {
  const navigate = useNavigate();

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Error message
  const [error, setError] = useState("");

  // Register API
  const registerMutation = useRegister();

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Clear previous error
    setError("");

    // 1. Check empty fields
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    // 2. Check email
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // 3. Check password strength
    if (!isStrongPassword(password)) {
      setError(
        "Password must have 8+ characters, uppercase, lowercase, number and special character.",
      );
      return;
    }

    // 4. Check password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // 5. Send registration request
    registerMutation.mutate(
      {
        email: email.trim(),
        password,
        displayName: name.trim(),
      },
      {
        onSuccess: () => {
          setError("");
          navigate("/login");
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
        {/* Brand */}
        <div className="brand">
          <div className="brand-logo">
            <CheckSquare size={28} strokeWidth={2.5} />
          </div>

          <h1>Planora</h1>
        </div>

        {/* Heading */}
        <div className="signin-heading">
          <h2>Create your account</h2>
          <p>Get started by creating your workspace account.</p>
        </div>

        {/* Form */}
        <form className="signin-form" onSubmit={handleRegister}>
          {/* Name */}
          <FormInput
            id="name"
            label="Full name"
            placeholder="Enter your name"
            value={name}
            autoComplete="name"
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
          />

          {/* Email */}
          <FormInput
            id="email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            value={email}
            autoComplete="email"
            onChange={(event) => {
              setEmail(event.target.value);
              setError("");
            }}
          />

          {/* Password */}
          <FormInput
            id="password"
            label="Password"
            type="password"
            placeholder="Create a password"
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

          {/* Confirm Password */}
          <FormInput
            id="confirmPassword"
            label="Confirm password"
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            autoComplete="new-password"
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

          {/* Error */}
          {error && <p className="error-message">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            className="signin-button"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <LoaderCircle size={18} className="spinner" />
                <span>Creating account...</span>
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="register-text">
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
