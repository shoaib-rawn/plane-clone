import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Mail, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { getCurrentProfile, updateCurrentProfile } from "../api";
import { useAuth } from "../auth";

const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  const { data: profileRes, isLoading } = useQuery<any>({
    queryKey: ["userProfile"],
    queryFn: getCurrentProfile,
  });

  const userData = profileRes?.data?.user;
  const workspaceRole = profileRes?.data?.workspaceRole;

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || "");
      setAvatarUrl(userData.avatarUrl || "");
    }
  }, [userData]);

  const updateMutation = useMutation({
    mutationFn: (payload: { displayName: string; avatarUrl?: string }) =>
      updateCurrentProfile(payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setSuccess("Profile updated successfully!");
      setError(null);
      if (res?.data?.displayName) {
        updateUser({
          displayName: res.data.displayName,
          workspaceRole: workspaceRole || "MEMBER",
        });
      }
    },
    onError: (err: any) => {
      setError(err.message || "Failed to update profile");
      setSuccess(null);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (!displayName.trim()) {
      setError("Display name cannot be empty");
      return;
    }

    updateMutation.mutate({
      displayName: displayName.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
    });
  };

  if (isLoading) {
    return (
      <div style={{ padding: "32px", color: "#64748B" }}>
        Loading profile details...
      </div>
    );
  }

  return (
    <div style={{ padding: "32px", maxWidth: "680px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: "#EDE9FE",
            color: "#6D28D9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User size={22} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#1E293B" }}>
            Account Profile
          </h1>
          <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#64748B" }}>
            Manage your personal credentials and workspace details
          </p>
        </div>
      </div>

      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E5E7EB",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
        }}
      >
        {success && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              backgroundColor: "#DCFCE7",
              color: "#15803D",
              borderRadius: 6,
              fontSize: 13,
              marginBottom: 16,
              border: "1px solid #86EFAC",
            }}
          >
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              backgroundColor: "#FEE2E2",
              color: "#B91C1C",
              borderRadius: 6,
              fontSize: 13,
              marginBottom: 16,
              border: "1px solid #FCA5A5",
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Email Read-only */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>
              Email Address
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#F8FAFC",
                border: "1px solid #E5E7EB",
                padding: "8px 12px",
                borderRadius: 6,
                color: "#64748B",
                fontSize: 14,
              }}
            >
              <Mail size={16} />
              <span>{userData?.email}</span>
            </div>
          </div>

          {/* Role Read-only */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#475569" }}>
              Workspace Role
            </label>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                backgroundColor: "#F8FAFC",
                border: "1px solid #E5E7EB",
                padding: "8px 12px",
                borderRadius: 6,
                color: "#64748B",
                fontSize: 14,
              }}
            >
              <Shield size={16} />
              <span
                style={{
                  fontWeight: 600,
                  backgroundColor: "#EDE9FE",
                  color: "#6D28D9",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  border: "1px solid #DDD6FE",
                }}
              >
                {workspaceRole || userData?.role || "MEMBER"}
              </span>
            </div>
          </div>

          {/* Display Name Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#1E293B" }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                fontSize: 14,
                outline: "none",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#8B5CF6";
                e.target.style.boxShadow = "0 0 0 3px #EDE9FE";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E5E7EB";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Avatar URL Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#1E293B" }}>
              Avatar Image URL (Optional)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: "1px solid #E5E7EB",
                fontSize: 14,
                outline: "none",
                transition: "all 0.15s ease",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#8B5CF6";
                e.target.style.boxShadow = "0 0 0 3px #EDE9FE";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E5E7EB";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            style={{
              alignSelf: "flex-start",
              padding: "10px 22px",
              backgroundColor: "#8B5CF6",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              marginTop: 6,
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7C3AED")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8B5CF6")}
          >
            {updateMutation.isPending ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
