import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjects, createProject, getProjectTickets } from "../api";
import type { ProjectItem, TicketDetails } from "../types";
import CreateTicketModal from "../components/CreateTicketModal";
import TicketDetailModal from "../components/TicketDetailModal";
import { useAuth } from "../auth";
import {
  Layers,
  Plus,
  ChevronDown,
  ChevronUp,
  Ticket,
  Shield,
  Archive,
  Kanban,
} from "lucide-react";

interface ProjectTicketsListProps {
  projectId: string;
  onSelectTicket: (ticketId: string) => void;
}

const ProjectTicketsList: React.FC<ProjectTicketsListProps> = ({
  projectId,
  onSelectTicket,
}) => {
  const { data, isLoading } = useQuery<any>({
    queryKey: ["projectTickets", projectId],
    queryFn: () => getProjectTickets(projectId),
    enabled: !!projectId,
  });

  const tickets: TicketDetails[] = data?.data ?? [];

  if (isLoading) {
    return (
      <div style={{ fontSize: 13, color: "#64748B", padding: "12px 16px" }}>
        Loading project tickets...
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div style={{ fontSize: 13, color: "#94A3B8", padding: "12px 16px", fontStyle: "italic" }}>
        No tickets created in this project yet.
      </div>
    );
  }

  return (
    <div style={{ margin: "12px 0 0 0", borderTop: "1px solid #F1F5F9", paddingTop: 12 }}>
      <h4 style={{ margin: "0 0 10px 0", fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>
        Tickets ({tickets.length})
      </h4>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {tickets.map((t) => (
          <div
            key={t.id}
            onClick={() => onSelectTicket(t.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderRadius: 6,
              backgroundColor: "#F8FAFC",
              cursor: "pointer",
              transition: "background-color 0.15s",
              border: "1px solid #E2E8F0",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EEF2F6")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700, color: "#0284C7", backgroundColor: "#E0F6FF", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>{t.key}</span>
              <span style={{ fontSize: 13, color: "#1E293B", fontWeight: 500 }}>{t.title}</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {t.state && (
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 10,
                    backgroundColor: t.state.colour ? `${t.state.colour}15` : "#E2E8F0",
                    color: t.state.colour ?? "#475569",
                    fontWeight: 500,
                    border: `1px solid ${t.state.colour ? `${t.state.colour}30` : "#CBD5E1"}`,
                  }}
                >
                  {t.state.name}
                </span>
              )}
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontWeight: 600,
                  backgroundColor: "#F1F5F9",
                  color: "#475569",
                }}
              >
                {t.priority}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery<{ data: ProjectItem[] }>({
    queryKey: ["projects"],
    queryFn: () => getProjects(),
  });

  const { workspaceRole } = useAuth();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [ticketModalProj, setTicketModalProj] = useState<ProjectItem | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; key: string; description?: string }) =>
      createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setName("");
      setKey("");
      setDescription("");
      setError(null);
      setShowCreateForm(false);
    },
    onError: (err: any) => {
      setError(err.message || "Create project failed");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !key.trim()) {
      setError("Project name and key are required");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      key: key.trim().toUpperCase(),
      description: description.trim(),
    });
  };

  const toggleTickets = (projectId: string) => {
    setExpandedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  const projects = data?.data ?? [];

  return (
    <div style={{ padding: "28px", maxWidth: "1000px" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              backgroundColor: "#EDE9FE",
              color: "#6D28D9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Layers size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#1E293B" }}>
              Workspace Projects
            </h1>
            <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#64748B" }}>
              Manage your projects, tickets, and membership permissions
            </p>
          </div>
        </div>

        {workspaceRole === "ADMIN" && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              backgroundColor: "#8B5CF6",
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "9px 16px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              transition: "background-color 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7C3AED")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8B5CF6")}
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>
        )}
      </div>

      {/* Inline Create Form */}
      {showCreateForm && (
        <section
          style={{
            marginBottom: 24,
            backgroundColor: "#FFFFFF",
            padding: 20,
            borderRadius: 12,
            border: "1px solid #E5E7EB",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 14, fontSize: 15, fontWeight: 600, color: "#1E293B" }}>
            Create New Project
          </h2>

          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 500 }}>
            <input
              placeholder="Project Name (e.g. Mobile App)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 14 }}
            />
            <input
              placeholder="Key identifier (e.g. MOB)"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 14 }}
            />
            <textarea
              rows={2}
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #CBD5E1", borderRadius: 6, fontSize: 14, fontFamily: "inherit" }}
            />

            {error && <div style={{ color: "#DC2626", fontSize: 13 }}>{error}</div>}

            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                alignSelf: "flex-start",
                padding: "9px 18px",
                backgroundColor: "#8B5CF6",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                transition: "background-color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7C3AED")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8B5CF6")}
            >
              {createMutation.isPending ? "Creating..." : "Save Project"}
            </button>
          </form>
        </section>
      )}

      {/* Projects List */}
      <section
        style={{
          backgroundColor: "#FFFFFF",
          padding: 24,
          borderRadius: 12,
          border: "1px solid #E5E7EB",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600, color: "#1E293B" }}>
          Active Projects ({projects.length})
        </h2>

        {isLoading && <div style={{ fontSize: 14, color: "#64748B" }}>Loading projects...</div>}
        {isError && <div style={{ color: "#DC2626", fontSize: 14 }}>Unable to load projects</div>}

        {!isLoading && projects.length === 0 && (
          <div style={{ color: "#94A3B8", fontSize: 14, padding: "16px 0" }}>
            No projects found in this workspace. Create your first project above!
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {projects.map((project: ProjectItem) => {
            const isArchived = !!project.archivedAt;

            return (
              <div
                key={project.id}
                style={{
                  border: "1px solid #E5E7EB",
                  borderRadius: 10,
                  padding: "16px 20px",
                  backgroundColor: isArchived ? "#F9FAFB" : "#FFFFFF",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
                  transition: "all 0.15s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ flex: "1 1 300px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong
                        onClick={() => navigate(`/projects/${project.id}/tickets`)}
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          color: "#1E293B",
                          cursor: "pointer",
                          transition: "color 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#6D28D9")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#1E293B")}
                        title="Open Kanban Board"
                      >
                        {project.name}
                      </strong>
                      <span
                        style={{
                          backgroundColor: "#EDE9FE",
                          color: "#6D28D9",
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 4,
                          border: "1px solid #DDD6FE",
                        }}
                      >
                        {project.key}
                      </span>
                      {project.myRole && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#6D28D9",
                            backgroundColor: "#EDE9FE",
                            border: "1px solid #DDD6FE",
                            padding: "2px 8px",
                            borderRadius: 4,
                          }}
                        >
                          <Shield size={12} />
                          {project.myRole}
                        </span>
                      )}
                      {isArchived && (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#EA580C",
                            backgroundColor: "#FFF7ED",
                            padding: "2px 8px",
                            borderRadius: 4,
                            border: "1px solid #FED7AA",
                          }}
                        >
                          <Archive size={12} /> Archived
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: 13, color: "#64748B", margin: "6px 0 0 0" }}>
                      {project.description || "No description provided."}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button
                      onClick={() => navigate(`/projects/${project.id}/tickets`)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        height: 34,
                        padding: "0 14px",
                        backgroundColor: "#EDE9FE",
                        border: "1px solid #DDD6FE",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#6D28D9",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#DDD6FE")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#EDE9FE")}
                      title="Open Kanban Ticket Board"
                    >
                      <Kanban size={14} />
                      <span>Kanban Board</span>
                    </button>

                    <button
                      onClick={() => toggleTickets(project.id)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        height: 34,
                        padding: "0 12px",
                        backgroundColor: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#334155",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F1F5F9")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#F8FAFC")}
                    >
                      <Ticket size={14} />
                      <span>{expandedProjects[project.id] ? "Hide List" : "Quick List"}</span>
                      {expandedProjects[project.id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {!isArchived && project.myRole !== "VIEWER" && (
                      <button
                        onClick={() => setTicketModalProj(project)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          height: 34,
                          padding: "0 14px",
                          backgroundColor: "#8B5CF6",
                          color: "#FFFFFF",
                          border: "none",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#7C3AED")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#8B5CF6")}
                      >
                        <Plus size={14} />
                        <span>Create Ticket</span>
                      </button>
                    )}
                  </div>
                </div>

                {expandedProjects[project.id] && (
                  <ProjectTicketsList
                    projectId={project.id}
                    onSelectTicket={(ticketId) => setSelectedTicketId(ticketId)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Create Ticket Modal */}
      {ticketModalProj && (
        <CreateTicketModal
          projectId={ticketModalProj.id}
          projectStates={ticketModalProj.states ?? []}
          onClose={() => setTicketModalProj(null)}
        />
      )}

      {/* Ticket Details & Discussion Modal */}
      {selectedTicketId && (
        <TicketDetailModal
          issueId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
