import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjects,
  getProjectMembers,
  addProjectMember,
  updateProjectMemberRole,
  removeProjectMember,
  type ProjectItem,
} from "../features/projects/api/projectApi";
import { getAllUsers } from "../features/users/api/userApi";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  AlertCircle,
  FolderKanban,
  CheckCircle2,
} from "lucide-react";

const MembersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { workspaceRole } = useAuth();

  // 1. Fetch Projects list
  const { data: projectsData } = useQuery<{ data: ProjectItem[] }>({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
  });
  const projects = projectsData?.data ?? [];

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Auto-select first project once loaded
  useEffect(() => {
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
  }, [projects, selectedProjectId]);

  // 2. Fetch Members for selected project
  const {
    data: membersData,
    isLoading: loadingMembers,
    isError: errorMembers,
  } = useQuery<any>({
    queryKey: ["projectMembers", selectedProjectId],
    queryFn: () =>
      selectedProjectId ? getProjectMembers(selectedProjectId) : Promise.resolve({ data: [] }),
    enabled: !!selectedProjectId,
  });

  // 3. Fetch All Workspace Users
  const { data: usersData } = useQuery<any>({
    queryKey: ["allUsers"],
    queryFn: () => getAllUsers(),
  });
  const users: any[] = usersData?.data ?? [];

  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string>("");
  const [newRole, setNewRole] = useState<"ADMIN" | "MEMBER" | "VIEWER">("MEMBER");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Mutations
  const addMemberMutation = useMutation({
    mutationFn: (payload: { projectId: string; userId: string; role: any }) =>
      addProjectMember(payload.projectId, { userId: payload.userId, role: payload.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", selectedProjectId] });
      setSuccess("Member added successfully!");
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to add project member");
      setSuccess(null);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: (payload: { projectId: string; memberId: string; role: any }) =>
      updateProjectMemberRole(payload.projectId, payload.memberId, { role: payload.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", selectedProjectId] });
      setSuccess("Role updated successfully!");
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to update member role");
      setSuccess(null);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (payload: { projectId: string; memberId: string }) =>
      removeProjectMember(payload.projectId, payload.memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", selectedProjectId] });
      setSuccess("Member removed from project!");
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to remove member");
      setSuccess(null);
    },
  });

  // Keep first available user selected in dropdown
  useEffect(() => {
    if (!selectedUserToAdd && users.length > 0) {
      setSelectedUserToAdd(users[0].id);
    }
  }, [users, selectedUserToAdd]);

  const members: any[] = membersData?.data ?? [];
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const myRole = selectedProject?.myRole;

  // Role Permissions (Backend Matrix):
  // - Admin (workspace or project) can add/remove members and change roles
  // - Member & Viewer can only view members list
  const canManageMembers = workspaceRole === "ADMIN" || myRole === "ADMIN";

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !selectedUserToAdd) return;
    setError(null);
    setSuccess(null);
    addMemberMutation.mutate({
      projectId: selectedProjectId,
      userId: selectedUserToAdd,
      role: newRole,
    });
  };

  return (
    <div style={{ padding: "28px", maxWidth: "900px" }}>
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            backgroundColor: "#E0F6FF",
            color: "#0284C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Users size={22} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#334155" }}>
            Project Members
          </h1>
          <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#64748B" }}>
            Manage team assignments and project permissions
          </p>
        </div>
      </div>

      {/* Select Project Filter */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E0F2FE",
          borderRadius: 10,
          padding: "16px 20px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 14,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <FolderKanban size={18} color="#0284C7" />
        <label style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>
          Active Project:
        </label>
        <select
          value={selectedProjectId ?? ""}
          onChange={(e) => {
            setSelectedProjectId(e.target.value);
            setError(null);
            setSuccess(null);
          }}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #CBD5E1",
            fontSize: 14,
            outline: "none",
            backgroundColor: "#F8FAFC",
            fontWeight: 500,
            color: "#334155",
            cursor: "pointer",
            minWidth: "220px",
          }}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.key})
            </option>
          ))}
        </select>

        {myRole && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 12,
              backgroundColor: "#E0F6FF",
              color: "#0284C7",
              border: "1px solid #BAE6FD",
              padding: "4px 10px",
              borderRadius: 6,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Shield size={13} />
            Project Role: {myRole}
          </span>
        )}
      </div>

      {/* Alerts */}
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

      {/* Add Member Card (Visible to ADMIN and MEMBER) */}
      {canManageMembers && (
        <section
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E0F2FE",
            borderRadius: 12,
            padding: 20,
            marginBottom: 24,
            boxShadow: "0 4px 12px rgba(48, 175, 255, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <UserPlus size={18} color="#0284C7" />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: "#334155" }}>
              Add Member to Project
            </h2>
          </div>

          <form onSubmit={handleAddMember} style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <select
              value={selectedUserToAdd}
              onChange={(e) => setSelectedUserToAdd(e.target.value)}
              style={{
                flex: "1",
                minWidth: "200px",
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #CBD5E1",
                fontSize: 14,
                outline: "none",
              }}
            >
              {users.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.displayName || u.email} ({u.email})
                </option>
              ))}
            </select>

            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #CBD5E1",
                fontSize: 14,
                outline: "none",
                fontWeight: 500,
              }}
            >
              <option value="MEMBER">MEMBER (Can edit & add)</option>
              <option value="ADMIN">ADMIN (Full control)</option>
              <option value="VIEWER">VIEWER (Read-only)</option>
            </select>

            <button
              type="submit"
              disabled={addMemberMutation.isPending || !selectedProjectId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "9px 18px",
                background: "linear-gradient(135deg, #008be3 0%, #30AFFF 100%)",
                color: "white",
                border: "none",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(48, 175, 255, 0.25)",
              }}
            >
              <UserPlus size={15} />
              <span>{addMemberMutation.isPending ? "Adding..." : "Add Member"}</span>
            </button>
          </form>
        </section>
      )}

      {/* Members List */}
      <section
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: 10,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}
      >
        <h2 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 600, color: "#334155" }}>
          Current Members ({members.length})
        </h2>

        {loadingMembers && (
          <div style={{ color: "#64748B", fontSize: 14, padding: "12px 0" }}>
            Loading project members...
          </div>
        )}

        {errorMembers && (
          <div style={{ color: "#DC2626", fontSize: 14, padding: "12px 0" }}>
            Unable to load members for this project.
          </div>
        )}

        {!loadingMembers && members.length === 0 && (
          <div style={{ color: "#94A3B8", fontSize: 14, padding: "16px 0", fontStyle: "italic" }}>
            No members assigned to this project yet.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {members.map((m: any) => (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                borderRadius: 8,
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    backgroundColor: "#E2E8F0",
                    color: "#475569",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  {(m.user?.displayName || m.user?.email || "U").charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "#334155", fontSize: 14 }}>
                    {m.user?.displayName || m.user?.email}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B" }}>{m.user?.email}</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {canManageMembers ? (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) =>
                        updateRoleMutation.mutate({
                          projectId: selectedProjectId!,
                          memberId: m.id,
                          role: e.target.value,
                        })
                      }
                      style={{
                        padding: "4px 8px",
                        borderRadius: 6,
                        border: "1px solid #CBD5E1",
                        fontSize: 13,
                        fontWeight: 500,
                        backgroundColor: "#FFFFFF",
                        cursor: "pointer",
                      }}
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>

                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove ${m.user?.displayName || m.user?.email} from this project?`
                          )
                        ) {
                          removeMemberMutation.mutate({
                            projectId: selectedProjectId!,
                            memberId: m.id,
                          });
                        }
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "5px 10px",
                        backgroundColor: "#FEE2E2",
                        color: "#DC2626",
                        border: "1px solid #FCA5A5",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                      title="Remove member from project"
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </>
                ) : (
                  <span
                    style={{
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 6,
                      backgroundColor: "#E2E8F0",
                      color: "#334155",
                      fontWeight: 600,
                    }}
                  >
                    {m.role}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MembersPage;
