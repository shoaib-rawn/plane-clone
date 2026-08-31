import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings as SettingsIcon,
  User,
  Folder,
  Building2,
  Mail,
  Shield,
  CheckCircle2,
  AlertCircle,
  Archive,
  Trash2,
} from "lucide-react";
import { getCurrentProfile, updateCurrentProfile } from "../features/users/api/userApi";
import {
  getProjects,
  updateProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
  type ProjectItem,
} from "../features/projects/api/projectApi";
import { useAuth } from "../context/AuthContext";

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"profile" | "projects" | "workspace">("profile");

  // 1. Fetch User Profile
  const { data: profileRes, isLoading: loadingProfile } = useQuery<any>({
    queryKey: ["userProfile"],
    queryFn: getCurrentProfile,
  });

  const userData = profileRes?.data?.user;
  const workspaceRole = profileRes?.data?.workspaceRole;
  const workspaceName = profileRes?.data?.workspace?.name || "Acme Corp";
  const workspaceSlug = profileRes?.data?.workspace?.slug || "acme";

  // 2. Fetch Projects (for Project Settings Tab)
  const { data: projectsRes, isLoading: loadingProjects } = useQuery<any>({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  const projects: ProjectItem[] = projectsRes?.data ?? [];

  // Profile Form States
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || "");
      setAvatarUrl(userData.avatarUrl || "");
    }
  }, [userData]);

  const profileMutation = useMutation({
    mutationFn: (payload: { displayName: string; avatarUrl?: string }) =>
      updateCurrentProfile(payload),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      setProfileSuccess("Profile updated successfully!");
      setProfileError(null);
      if (res?.data?.displayName) {
        updateUser({
          displayName: res.data.displayName,
          workspaceRole: workspaceRole || "MEMBER",
        });
      }
    },
    onError: (err: any) => {
      setProfileError(err.message || "Failed to update profile");
      setProfileSuccess(null);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (!displayName.trim()) {
      setProfileError("Display name cannot be empty");
      return;
    }

    profileMutation.mutate({
      displayName: displayName.trim(),
      avatarUrl: avatarUrl.trim() || undefined,
    });
  };

  // Project Settings States
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [projectSuccess, setProjectSuccess] = useState<string | null>(null);
  const [projectError, setProjectError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedProject) {
      setProjectName(selectedProject.name);
      setProjectDesc(selectedProject.description || "");
      if (!selectedProjectId && selectedProject.id) {
        setSelectedProjectId(selectedProject.id);
      }
    }
  }, [selectedProject]);

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);
    const p = projects.find((item) => item.id === id);
    if (p) {
      setProjectName(p.name);
      setProjectDesc(p.description || "");
      setProjectSuccess(null);
      setProjectError(null);
    }
  };

  const projectUpdateMutation = useMutation({
    mutationFn: (payload: { name: string; description: string }) =>
      updateProject(selectedProject.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProjectSuccess("Project settings updated successfully!");
      setProjectError(null);
    },
    onError: (err: any) => {
      setProjectError(err.message || "Failed to update project");
      setProjectSuccess(null);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () =>
      selectedProject?.archivedAt
        ? unarchiveProject(selectedProject.id)
        : archiveProject(selectedProject.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProjectSuccess(
        selectedProject?.archivedAt ? "Project unarchived!" : "Project archived!"
      );
      setProjectError(null);
    },
    onError: (err: any) => {
      setProjectError(err.message || "Failed to toggle archive state");
      setProjectSuccess(null);
    },
  });

  const deleteProjMutation = useMutation({
    mutationFn: () => deleteProject(selectedProject.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setProjectSuccess("Project deleted successfully.");
      setSelectedProjectId("");
    },
    onError: (err: any) => {
      setProjectError(err.message || "Failed to delete project");
    },
  });

  const handleProjectSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setProjectError("Project name cannot be empty");
      return;
    }
    projectUpdateMutation.mutate({
      name: projectName.trim(),
      description: projectDesc.trim(),
    });
  };

  if (loadingProfile || loadingProjects) {
    return <div style={{ padding: "32px", color: "#64748B" }}>Loading settings...</div>;
  }

  return (
    <div style={{ padding: "32px", maxWidth: "800px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: "#EDE9FE",
            color: "#6D28D9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1E293B" }}>Settings</h1>
          <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#64748B" }}>
            Manage your account preferences and project settings.
          </p>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div
        style={{
          display: "flex",
          gap: 24,
          borderBottom: "1px solid #E2E8F0",
          marginBottom: 24,
          paddingBottom: 2,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 4px 12px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "profile" ? "2px solid #8B5CF6" : "2px solid transparent",
            color: activeTab === "profile" ? "#6D28D9" : "#64748B",
            fontWeight: activeTab === "profile" ? 600 : 500,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <User size={16} />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("projects")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 4px 12px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "projects" ? "2px solid #8B5CF6" : "2px solid transparent",
            color: activeTab === "projects" ? "#6D28D9" : "#64748B",
            fontWeight: activeTab === "projects" ? 600 : 500,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Folder size={16} />
          <span>Project Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("workspace")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 4px 12px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "workspace" ? "2px solid #8B5CF6" : "2px solid transparent",
            color: activeTab === "workspace" ? "#6D28D9" : "#64748B",
            fontWeight: activeTab === "workspace" ? 600 : 500,
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <Building2 size={16} />
          <span>Workspace Info</span>
        </button>
      </div>

      {/* TAB 1: Account Profile */}
      {activeTab === "profile" && (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          {profileSuccess && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                backgroundColor: "#ECFDF5",
                color: "#065F46",
                border: "1px solid #A7F3D0",
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              <CheckCircle2 size={16} />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                backgroundColor: "#FEF2F2",
                color: "#991B1B",
                border: "1px solid #FECACA",
                borderRadius: 8,
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              <AlertCircle size={16} />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Email Address
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  color: "#64748B",
                  fontSize: 14,
                }}
              >
                <Mail size={16} style={{ color: "#94A3B8" }} />
                <span>{userData?.email || "user@example.com"}</span>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Workspace Role
              </label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  backgroundColor: "#F8FAFC",
                  border: "1px solid #E2E8F0",
                  borderRadius: 8,
                  color: "#334155",
                  fontSize: 13,
                }}
              >
                <Shield size={16} style={{ color: "#6D28D9" }} />
                <span
                  style={{
                    backgroundColor: "#EDE9FE",
                    color: "#6D28D9",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                  }}
                >
                  {workspaceRole || "MEMBER"}
                </span>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  fontSize: 14,
                  color: "#1E293B",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                Avatar Image URL (Optional)
              </label>
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.png"
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  fontSize: 14,
                  color: "#1E293B",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginTop: 6 }}>
              <button
                type="submit"
                disabled={profileMutation.isPending}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#8B5CF6",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: profileMutation.isPending ? "not-allowed" : "pointer",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7C3AED")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8B5CF6")}
              >
                {profileMutation.isPending ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Project Settings */}
      {activeTab === "projects" && (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          {projects.length === 0 ? (
            <div style={{ color: "#94A3B8", fontSize: 14, padding: "16px 0" }}>
              No projects available to manage.
            </div>
          ) : (
            <>
              {projectSuccess && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    backgroundColor: "#ECFDF5",
                    color: "#065F46",
                    border: "1px solid #A7F3D0",
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 20,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{projectSuccess}</span>
                </div>
              )}

              {projectError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    backgroundColor: "#FEF2F2",
                    color: "#991B1B",
                    border: "1px solid #FECACA",
                    borderRadius: 8,
                    fontSize: 13,
                    marginBottom: 20,
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{projectError}</span>
                </div>
              )}

              {/* Project Selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                  Select Project to Configure
                </label>
                <select
                  value={selectedProject?.id || ""}
                  onChange={(e) => handleProjectSelect(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    fontSize: 14,
                    color: "#1E293B",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name} ({proj.key}) {proj.archivedAt ? "[Archived]" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedProject && (
                <form onSubmit={handleProjectSave} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                      Project Name
                    </label>
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
                        fontSize: 14,
                        color: "#1E293B",
                        boxSizing: "border-box",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                      Project Identifier Key
                    </label>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 14px",
                        backgroundColor: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: 8,
                        color: "#64748B",
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          backgroundColor: "#EDE9FE",
                          color: "#6D28D9",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 12,
                        }}
                      >
                        {selectedProject.key}
                      </span>
                      <span>(Project keys cannot be changed after creation)</span>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                      Description
                    </label>
                    <textarea
                      rows={3}
                      value={projectDesc}
                      onChange={(e) => setProjectDesc(e.target.value)}
                      placeholder="Enter project description"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: 8,
                        border: "1px solid #E2E8F0",
                        fontSize: 14,
                        color: "#1E293B",
                        boxSizing: "border-box",
                        resize: "vertical",
                      }}
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={projectUpdateMutation.isPending}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#8B5CF6",
                        color: "#FFFFFF",
                        border: "none",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: projectUpdateMutation.isPending ? "not-allowed" : "pointer",
                      }}
                    >
                      {projectUpdateMutation.isPending ? "Saving..." : "Save Project Changes"}
                    </button>
                  </div>

                  {/* Danger Zone */}
                  {(selectedProject.myRole === "ADMIN" || workspaceRole === "ADMIN") && (
                    <div
                      style={{
                        marginTop: 20,
                        paddingTop: 20,
                        borderTop: "1px solid #F1F5F9",
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#DC2626" }}>
                        Danger Zone
                      </h4>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: 14,
                          border: "1px solid #FEE2E2",
                          borderRadius: 8,
                          backgroundColor: "#FEF2F2",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 13, color: "#991B1B" }}>
                            {selectedProject.archivedAt ? "Unarchive Project" : "Archive Project"}
                          </strong>
                          <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#B91C1C" }}>
                            {selectedProject.archivedAt
                              ? "Restore project to active workspace view"
                              : "Hide project and mark all tickets as read-only"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => archiveMutation.mutate()}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            backgroundColor: "#FFFFFF",
                            color: "#DC2626",
                            border: "1px solid #FCA5A5",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <Archive size={14} />
                          <span>{selectedProject.archivedAt ? "Unarchive" : "Archive"}</span>
                        </button>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: 14,
                          border: "1px solid #FEE2E2",
                          borderRadius: 8,
                          backgroundColor: "#FEF2F2",
                        }}
                      >
                        <div>
                          <strong style={{ fontSize: 13, color: "#991B1B" }}>Delete Project</strong>
                          <p style={{ margin: "2px 0 0 0", fontSize: 12, color: "#B91C1C" }}>
                            Permanently delete this project and all its tickets.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Permanently delete "${selectedProject.name}"?`)) {
                              deleteProjMutation.mutate();
                            }
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "8px 14px",
                            backgroundColor: "#DC2626",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 3: Workspace Info */}
      {activeTab === "workspace" && (
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            padding: 24,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
          }}
        >
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#1E293B" }}>
            Workspace Overview
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, color: "#64748B", minWidth: 120 }}>Workspace:</span>
              <strong style={{ fontSize: 15, color: "#1E293B" }}>{workspaceName}</strong>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, color: "#64748B", minWidth: 120 }}>Workspace Slug:</span>
              <span
                style={{
                  backgroundColor: "#EDE9FE",
                  color: "#6D28D9",
                  fontSize: 12,
                  fontWeight: 700,
                  padding: "3px 10px",
                  borderRadius: 6,
                  border: "1px solid #DDD6FE",
                }}
              >
                {workspaceSlug}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, color: "#64748B", minWidth: 120 }}>Your Access:</span>
              <span
                style={{
                  color: workspaceRole === "ADMIN" ? "#047857" : "#6D28D9",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {workspaceRole === "ADMIN" ? "Full Administrator" : "Workspace Member"}
              </span>
            </div>
          </div>

          <p style={{ margin: "24px 0 0 0", fontSize: 13, color: "#94A3B8" }}>
            To invite and manage workspace members, head over to the <strong>Members</strong> tab on the sidebar.
          </p>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
