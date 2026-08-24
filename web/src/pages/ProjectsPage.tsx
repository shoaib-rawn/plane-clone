import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjects, createProject } from "../features/projects/api/projectApi";
import { getProjectTickets } from "../features/tickets/api/ticketApi";
import CreateTicketModal from "../components/CreateTicketModal";
import { useSelector } from "react-redux";
import type { RootState } from "../store/store";

const ProjectTicketsList: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["projectTickets", projectId],
    queryFn: () => getProjectTickets(projectId),
    enabled: !!projectId,
  });

  const tickets = data?.data ?? [];

  if (isLoading) return <div style={{ fontSize: 13, color: "#666", padding: "4px 12px" }}>Loading tickets...</div>;
  if (tickets.length === 0) return <div style={{ fontSize: 13, color: "#666", padding: "4px 12px" }}>No tickets found.</div>;

  return (
    <div style={{ margin: "8px 0 16px 20px", borderLeft: "2px solid #E5E7EB", paddingLeft: "12px" }}>
      <h4 style={{ margin: "0 0 8px 0", fontSize: 13, fontWeight: 600, color: "#374151" }}>Project Tickets:</h4>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
        {tickets.map((t: any) => (
          <li key={t.id} style={{ display: "flex", gap: 8, fontSize: 13, color: "#4B5563" }}>
            <span style={{ fontWeight: 600, color: "#111827" }}>{t.key}</span>
            <span>-</span>
            <span>{t.title}</span>
            <span style={{
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 10,
              backgroundColor: t.state?.colour ? `${t.state.colour}22` : "#F3F4F6",
              color: t.state?.colour ?? "#4B5563",
              fontWeight: 500
            }}>{t.state?.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const ProjectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery<any>({ queryKey: ["projects"], queryFn: () => getProjects() });

  const workspaceRole = useSelector((state: RootState) => state.auth.workspaceRole);

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Expanded project ticket view state
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  // Modal target state
  const [ticketModalProj, setTicketModalProj] = useState<any | null>(null);

  const createMutation = useMutation<any, any, { name: string; key: string; description?: string }>({
    mutationFn: (payload) => createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setName("");
      setKey("");
      setDescription("");
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Create project failed");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !key.trim()) {
      setError("Name and key are required");
      return;
    }

    createMutation.mutate({ name: name.trim(), key: key.trim(), description: description.trim() });
  };

  const toggleTickets = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ margin: "0 0 20px 0", fontSize: 24, fontWeight: 600 }}>Projects</h1>

      {workspaceRole === "ADMIN" && (
        <section style={{ marginBottom: 32, backgroundColor: "#fff", padding: 20, borderRadius: 8, border: "1px solid #E5E7EB" }}>
          <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Create project</h2>
          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
            <input
              placeholder="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 14 }}
            />
            <input
              placeholder="Project Key (e.g. WEB)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 14 }}
            />
            <input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 14 }}
            />

            {error && <div style={{ color: "#DC2626", fontSize: 13 }}>{error}</div>}

            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                padding: "8px 16px",
                backgroundColor: "#2563EB",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
                alignSelf: "flex-start"
              }}
            >
              {createMutation.isPending ? "Creating..." : "Create Project"}
            </button>
          </form>
        </section>
      )}

      <section style={{ backgroundColor: "#fff", padding: 20, borderRadius: 8, border: "1px solid #E5E7EB" }}>
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Your projects</h2>

        {isLoading && <div style={{ fontSize: 14, color: "#666" }}>Loading projects...</div>}
        {isError && <div style={{ color: "#DC2626", fontSize: 14 }}>Unable to load projects</div>}

        {data && data.data && Array.isArray(data.data) ? (
          <ul style={{ padding: 0, margin: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 16 }}>
            {data.data.map((p: any) => (
              <li key={p.id} style={{ borderBottom: "1px solid #F3F4F6", paddingBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <strong style={{ fontSize: 16, color: "#111827" }}>{p.name}</strong> <span style={{ color: "#6B7280", fontSize: 14 }}>({p.key})</span>
                    <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{p.description || "No description"}</div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => toggleTickets(p.id)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#F3F4F6",
                        border: "1px solid #D1D5DB",
                        borderRadius: 6,
                        cursor: "pointer",
                        fontSize: 13
                      }}
                    >
                      {expandedProjects[p.id] ? "Hide Tickets" : "View Tickets"}
                    </button>
                    {p.myRole !== "VIEWER" && (
                      <button
                        onClick={() => setTicketModalProj(p)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#2563EB",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 13
                        }}
                      >
                        Create Ticket
                      </button>
                    )}
                  </div>
                </div>

                {expandedProjects[p.id] && (
                  <ProjectTicketsList projectId={p.id} />
                )}
              </li>
            ))}
          </ul>
        ) : (
          !isLoading && <div style={{ fontSize: 14, color: "#666" }}>No projects found.</div>
        )}
      </section>

      {ticketModalProj && (
        <CreateTicketModal
          projectId={ticketModalProj.id}
          projectStates={ticketModalProj.states ?? []}
          onClose={() => setTicketModalProj(null)}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
