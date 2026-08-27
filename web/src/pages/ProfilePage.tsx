import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Mail, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { getCurrentProfile, updateCurrentProfile } from "../features/users/api/userApi";
import { useAuth } from "../context/AuthContext";

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
      <div style={{ padding: "32px", color: "#64748b" }}>
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
            borderRadius: "50%",
            backgroundColor: "#E0F6FF",
            color: "#0284C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <User size={24} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#334155" }}>
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
          border: "1px solid #E0F2FE",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
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
                border: "1px solid #E2E8F0",
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
                border: "1px solid #E2E8F0",
                padding: "8px 12px",
                borderRadius: 6,
                color: "#64748B",
                fontSize: 14,
              }}
            >
              <Shield size={16} />
              <span style={{ fontWeight: 600, color: "#334155" }}>
                {workspaceRole || userData?.role || "MEMBER"}
              </span>
            </div>
          </div>

          {/* Display Name Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #CBD5E1",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          {/* Avatar URL Input */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
              Avatar Image URL (Optional)
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #CBD5E1",
                fontSize: 14,
                outline: "none",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            style={{
              alignSelf: "flex-start",
              padding: "10px 22px",
              background: "linear-gradient(135deg, #008be3 0%, #30AFFF 100%)",
              color: "white",
              border: "none",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              marginTop: 6,
              boxShadow: "0 4px 12px rgba(48, 175, 255, 0.25)",
            }}
          >
            {updateMutation.isPending ? "Saving..." : "Save Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
