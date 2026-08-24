import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjects, getProjectMembers, addProjectMember, updateProjectMemberRole, removeProjectMember } from "../features/projects/api/projectApi";
import { getAllUsers } from "../features/users/api/userApi";

const MembersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: projectsData } = useQuery<any>({ queryKey: ["projects"], queryFn: () => getProjects() });
  const projects: any[] = projectsData?.data ?? [];

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id ?? null);

  // Members for selected project
  const membersQuery = useQuery<any>({
    queryKey: ["projectMembers", selectedProjectId],
    queryFn: () => (selectedProjectId ? getProjectMembers(selectedProjectId) : Promise.resolve({ data: [] })),
    enabled: !!selectedProjectId,
  });
  const membersData = membersQuery.data;
  const refetchMembers = membersQuery.refetch;

  // All users for adding members
  const usersQuery = useQuery<any>({ queryKey: ["allUsers"], queryFn: () => getAllUsers() });
  const usersData = usersQuery.data;
  const users: any[] = usersData?.data ?? [];

  const [error, setError] = useState<string | null>(null);

  const addMemberMutation = useMutation<any, any, { projectId: string; userId: string; role: any }>({
    mutationFn: (payload) => addProjectMember(payload.projectId, { userId: payload.userId, role: payload.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", selectedProjectId] });
      refetchMembers();
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to add project member");
    },
  });

  const updateRoleMutation = useMutation<any, any, { projectId: string; memberId: string; role: any }>({
    mutationFn: (payload) => updateProjectMemberRole(payload.projectId, payload.memberId, { role: payload.role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", selectedProjectId] });
      refetchMembers();
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to update member role");
    },
  });

  const removeMemberMutation = useMutation<any, any, { projectId: string; memberId: string }>({
    mutationFn: (payload) => removeProjectMember(payload.projectId, payload.memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectMembers", selectedProjectId] });
      refetchMembers();
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to remove member");
    },
  });

  const [selectedUserToAdd, setSelectedUserToAdd] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("MEMBER");

  // Keep selectedProjectId in sync when projects load
  React.useEffect(() => {
    if (!selectedProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
  }, [projects, selectedProjectId]);

  // Keep selectedUserToAdd in sync when users list loads
  React.useEffect(() => {
    if (!selectedUserToAdd && users.length > 0) {
      setSelectedUserToAdd(users[0].id);
    }
  }, [users, selectedUserToAdd]);

  const members: any[] = membersData?.data ?? [];
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const myRole = selectedProject?.myRole;
  const isProjectAdmin = myRole === "ADMIN";

  return (
    <div>
      <h1>Project Members</h1>

      <section style={{ marginBottom: 20 }}>
        <label>
          Select project:
          <select value={selectedProjectId ?? ""} onChange={(e) => {
            setSelectedProjectId(e.target.value);
            setError(null);
          }}>
            <option value="">-- choose project --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </label>
      </section>

      {isProjectAdmin && (
        <section style={{ marginBottom: 20 }}>
          <h2>Add member</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-start" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={selectedUserToAdd ?? ""} onChange={(e) => setSelectedUserToAdd(e.target.value)}>
                <option value="">-- choose user --</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.displayName || u.email}</option>
                ))}
              </select>

              <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                <option value="MEMBER">MEMBER</option>
                <option value="ADMIN">ADMIN</option>
                <option value="VIEWER">VIEWER</option>
              </select>

              <button
                onClick={() => {
                  if (!selectedProjectId || !selectedUserToAdd) return;
                  setError(null);
                  (addMemberMutation as any).mutate({ projectId: selectedProjectId, userId: selectedUserToAdd, role: newRole });
                }}
                disabled={(addMemberMutation as any).isLoading}
              >
                {(addMemberMutation as any).isLoading ? "Adding..." : "Add member"}
              </button>
            </div>
            {error && <div style={{ color: "red", fontSize: 13 }}>{error}</div>}
          </div>
        </section>
      )}

      <section>
        <h2>Members</h2>
        {members.length === 0 && <div>No members found for this project.</div>}

        <ul>
          {members.map((m: any) => (
            <li key={m.id} style={{ marginBottom: 12, borderBottom: "1px solid #F3F4F6", paddingBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{m.user?.displayName ?? m.user?.email ?? 'Unknown'}</strong>
                  <div style={{ fontSize: 13, color: "#666" }}>Role: {m.role}</div>
                </div>

                {isProjectAdmin && m.userId !== selectedProject?.createdById && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <select
                      value={m.role}
                      onChange={(e) => (updateRoleMutation as any).mutate({ projectId: selectedProjectId!, memberId: m.id, role: e.target.value })}
                      style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #D1D5DB" }}
                    >
                      <option value="MEMBER">MEMBER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>

                    <button
                      onClick={() => (removeMemberMutation as any).mutate({ projectId: selectedProjectId!, memberId: m.id })}
                      style={{
                        padding: "4px 10px",
                        backgroundColor: "#FEE2E2",
                        color: "#DC2626",
                        border: "1px solid #FEB2B2",
                        borderRadius: 6,
                        cursor: "pointer"
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default MembersPage;
