import React, { useState } from "react";
import { UserPlus, CheckCircle2, AlertCircle, LoaderCircle, Shield } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import FormInput from "../components/FormInput";
import { isStrongPassword, isValidEmail, registerUser } from "../auth";

const CreateMemberPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      setSuccess(`Member "${name.trim()}" created successfully!`);
      setError(null);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      queryClient.invalidateQueries({ queryKey: ["allUsers"] });
      queryClient.invalidateQueries({ queryKey: ["workspaceMembers"] });
    },
    onError: (err: any) => {
      setError(err.message || "Failed to create member");
      setSuccess(null);
    },
  });

  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isStrongPassword(password)) {
      setError(
        "Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters."
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
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "32px 20px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: "#EDE9FE",
              color: "#7C3AED",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <UserPlus size={20} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#0F172A", margin: 0 }}>
            Create Member
          </h1>
          <span
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "4px 10px",
              borderRadius: 20,
              backgroundColor: "#F1F5F9",
              color: "#475569",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            <Shield size={13} style={{ color: "#7C3AED" }} />
            Admin Only
          </span>
        </div>
        <p style={{ color: "#64748B", fontSize: 14, margin: 0 }}>
          Add a new member to your workspace with access to projects and tickets.
        </p>
      </div>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 12,
          padding: 28,
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        {success && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              backgroundColor: "#ECFDF5",
              border: "1px solid #A7F3D0",
              borderRadius: 8,
              color: "#065F46",
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            <CheckCircle2 size={18} style={{ color: "#059669", flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              backgroundColor: "#FEF2F2",
              border: "1px solid #FECACA",
              borderRadius: 8,
              color: "#991B1B",
              fontSize: 14,
              marginBottom: 20,
            }}
          >
            <AlertCircle size={18} style={{ color: "#DC2626", flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreateMember} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <FormInput
            id="name"
            label="Full Name"
            placeholder="e.g. Jane Doe"
            value={name}
            autoComplete="name"
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
          />

          <FormInput
            id="email"
            label="Email Address"
            type="email"
            placeholder="e.g. member@company.com"
            value={email}
            autoComplete="email"
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
          />

          <FormInput
            id="password"
            label="Temporary / Initial Password"
            type="password"
            placeholder="Create password"
            value={password}
            autoComplete="new-password"
            showPasswordToggle
            isPasswordVisible={showPassword}
            onTogglePassword={() => setShowPassword((prev) => !prev)}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
          />

          <FormInput
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            autoComplete="new-password"
            showPasswordToggle
            isPasswordVisible={showConfirmPassword}
            onTogglePassword={() => setShowConfirmPassword((prev) => !prev)}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
          />

          <button
            type="submit"
            disabled={registerMutation.isPending}
            style={{
              marginTop: 10,
              height: 42,
              backgroundColor: "#7C3AED",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: registerMutation.isPending ? "not-allowed" : "pointer",
              opacity: registerMutation.isPending ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            {registerMutation.isPending ? (
              <>
                <LoaderCircle size={18} className="spinner" style={{ animation: "spin 1s linear infinite" }} />
                <span>Creating Member...</span>
              </>
            ) : (
              <>
                <UserPlus size={16} />
                <span>Create Member</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateMemberPage;
