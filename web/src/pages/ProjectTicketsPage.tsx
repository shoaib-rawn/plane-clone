import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  AlertCircle,
  LoaderCircle,
  Users,
  Search,
  CheckCircle2,
  Clock,
  ListTodo,
} from "lucide-react";
import {
  getProjectDetails,
  type ProjectItem,
} from "../features/projects/api/projectApi";
import {
  getProjectTickets,
  type TicketDetails,
} from "../features/tickets/api/ticketApi";
import KanbanBoard from "../components/kanban/KanbanBoard";
import CreateTicketModal from "../components/CreateTicketModal";
import TicketDetailModal from "../components/TicketDetailModal";
import "../styling/KanbanBoard.css";

interface MemberWorkload {
  id: string;
  name: string;
  avatarUrl?: string | null;
  totalTickets: number;
  inProgressTickets: number;
  doneTickets: number;
}

export const ProjectTicketsPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAssigneeId, setFilterAssigneeId] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");

  const queryClient = useQueryClient();

  // 1. Fetch Project Details (Reads immediately from cache if available)
  const {
    data: projectResponse,
    isLoading: isProjectLoading,
  } = useQuery<{ data: ProjectItem }>({
    queryKey: ["project", projectId],
    queryFn: () => getProjectDetails(projectId!),
    initialData: () => {
      const cached = queryClient.getQueryData<{ data: ProjectItem[] }>(["projects"]);
      const found = cached?.data?.find((p) => p.id === projectId);
      return found ? { data: found } : undefined;
    },
    enabled: !!projectId,
    retry: 1,
  });

  // 2. Fetch Project Tickets
  const {
    data: ticketsResponse,
    isLoading: isTicketsLoading,
    isError: isTicketsError,
  } = useQuery<{ data: TicketDetails[] }>({
    queryKey: ["projectTickets", projectId],
    queryFn: () => getProjectTickets(projectId!),
    enabled: !!projectId,
  });

  const project = projectResponse?.data;
  const allTickets = ticketsResponse?.data ?? [];

  // 3. Compute Project Metrics & Progress
  const totalCount = allTickets.length;

  const todoCount = allTickets.filter((t) => {
    const group = t.state?.group?.toLowerCase();
    const name = t.state?.name?.toLowerCase();
    return (
      group === "unstarted" ||
      group === "backlog" ||
      name === "todo" ||
      name === "backlog"
    );
  }).length;

  const inProgressCount = allTickets.filter((t) => {
    const group = t.state?.group?.toLowerCase();
    const name = t.state?.name?.toLowerCase();
    return group === "started" || name === "in progress";
  }).length;

  const completedCount = allTickets.filter((t) => {
    const group = t.state?.group?.toLowerCase();
    const name = t.state?.name?.toLowerCase();
    return (
      group === "completed" ||
      name === "done" ||
      name === "complete" ||
      name === "completed"
    );
  }).length;

  const completionPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 4. Compute Team Workload ("Who is working on what")
  const teamWorkloadList = useMemo(() => {
    const map = new Map<string, MemberWorkload>();

    for (const ticket of allTickets) {
      if (ticket.assignee) {
        const { id, displayName, avatarUrl } = ticket.assignee;
        if (!map.has(id)) {
          map.set(id, {
            id,
            name: displayName,
            avatarUrl,
            totalTickets: 0,
            inProgressTickets: 0,
            doneTickets: 0,
          });
        }
        const member = map.get(id)!;
        member.totalTickets += 1;

        const group = ticket.state?.group?.toLowerCase();
        const name = ticket.state?.name?.toLowerCase();
        if (group === "started" || name === "in progress") {
          member.inProgressTickets += 1;
        } else if (
          group === "completed" ||
          name === "done" ||
          name === "complete"
        ) {
          member.doneTickets += 1;
        }
      }
    }

    return Array.from(map.values());
  }, [allTickets]);

  // Unassigned count
  const unassignedCount = allTickets.filter((t) => !t.assigneeId).length;

  // 5. Apply Active Filters to Tickets
  const filteredTickets = useMemo(() => {
    return allTickets.filter((ticket) => {
      // Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = ticket.title.toLowerCase().includes(query);
        const matchKey = ticket.key?.toLowerCase().includes(query);
        if (!matchTitle && !matchKey) {
          return false;
        }
      }

      // Assignee Filter
      if (filterAssigneeId !== "ALL") {
        if (filterAssigneeId === "UNASSIGNED") {
          if (ticket.assigneeId) {
            return false;
          }
        } else if (ticket.assigneeId !== filterAssigneeId) {
          return false;
        }
      }

      // Priority Filter
      if (filterPriority !== "ALL") {
        if (ticket.priority !== filterPriority) {
          return false;
        }
      }

      return true;
    });
  }, [allTickets, searchQuery, filterAssigneeId, filterPriority]);

  // Loading State
  if (isProjectLoading || isTicketsLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          gap: "12px",
          color: "#64748b",
        }}
      >
        <LoaderCircle size={32} className="spinner" />
        <p style={{ fontSize: "14px", fontWeight: 500 }}>
          Loading project tickets...
        </p>
      </div>
    );
  }

  // Error / Invalid Project State
  if (!project) {
    return (
      <div className="project-tickets-page">
        <div
          style={{
            backgroundColor: "#fff",
            border: "1px solid #fee2e2",
            borderRadius: "12px",
            padding: "36px 24px",
            textAlign: "center",
            maxWidth: "500px",
            margin: "60px auto",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.08)",
          }}
        >
          <AlertCircle
            size={40}
            color="#ef4444"
            style={{ marginBottom: "12px" }}
          />
          <h2
            style={{
              margin: "0 0 8px 0",
              fontSize: "18px",
              color: "#1e293b",
              fontWeight: 600,
            }}
          >
            Project Not Found
          </h2>
          <p
            style={{
              margin: "0 0 20px 0",
              fontSize: "14px",
              color: "#64748b",
            }}
          >
            The project you are trying to view does not exist or you do not have
            access.
          </p>
          <button
            onClick={() => navigate("/projects")}
            className="back-link"
            style={{
              display: "inline-flex",
              justifyContent: "center",
              backgroundColor: "#e0f2fe",
              padding: "8px 16px",
            }}
          >
            <ArrowLeft size={16} />
            <span>Return to Projects</span>
          </button>
        </div>
      </div>
    );
  }

  const isArchived = !!project.archivedAt;
  const canCreateTicket = !isArchived && project.myRole !== "VIEWER";

  return (
    <div className="project-tickets-page">
      {/* Back to Projects Navigation */}
      <div className="project-header-top">
        <button
          type="button"
          onClick={() => navigate("/projects")}
          className="back-link"
        >
          <ArrowLeft size={16} />
          <span>Back to Projects</span>
        </button>
      </div>

      {/* Project Header */}
      <div className="project-header-main">
        <div className="project-title-area">
          <div className="project-title-row">
            <h1>{project.name}</h1>
            <span className="project-key-badge">{project.key}</span>
          </div>
          {project.description && (
            <p className="project-desc">{project.description}</p>
          )}
        </div>

        <div className="project-actions">
          {canCreateTicket && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="create-ticket-btn"
            >
              <Plus size={16} />
              <span>Create Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* Project Workload & Progress Metrics Panel */}
      <section className="project-metrics-panel">
        {/* Top Row: Quick Stats & Progress Bar */}
        <div className="metrics-row">
          <div className="metrics-stat-chips">
            <div className="stat-chip">
              <ListTodo size={15} color="#64748b" />
              <span>Total:</span>
              <strong>{totalCount}</strong>
            </div>

            <div className="stat-chip todo-chip">
              <Clock size={15} color="#2563eb" />
              <span>Todo:</span>
              <strong>{todoCount}</strong>
            </div>

            <div className="stat-chip in-progress-chip">
              <Clock size={15} color="#d97706" />
              <span>In Progress:</span>
              <strong>{inProgressCount}</strong>
            </div>

            <div className="stat-chip complete-chip">
              <CheckCircle2 size={15} color="#059669" />
              <span>Completed:</span>
              <strong>{completedCount}</strong>
            </div>
          </div>

          {/* Progress Bar Widget */}
          <div className="progress-widget">
            <div className="progress-header">
              <span>Project Velocity</span>
              <span>{completionPercent}% Done</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Row: Team Workload (Who is working on what) */}
        <div className="team-workload-section">
          <div className="team-workload-title">
            <Users size={14} />
            <span>Team Workload & Assigned Members ({teamWorkloadList.length})</span>
          </div>

          <div className="team-members-list">
            {/* Filter: All Members */}
            <button
              type="button"
              className={`member-workload-card ${
                filterAssigneeId === "ALL" ? "active-filter" : ""
              }`}
              onClick={() => setFilterAssigneeId("ALL")}
            >
              <span className="member-name-text">All Tickets</span>
              <span className="member-ticket-count">{totalCount}</span>
            </button>

            {/* Each Member Workload */}
            {teamWorkloadList.map((member) => (
              <button
                key={member.id}
                type="button"
                className={`member-workload-card ${
                  filterAssigneeId === member.id ? "active-filter" : ""
                }`}
                onClick={() =>
                  setFilterAssigneeId(
                    filterAssigneeId === member.id ? "ALL" : member.id
                  )
                }
                title={`${member.name}: ${member.inProgressTickets} in progress, ${member.doneTickets} done`}
              >
                <div className="member-mini-avatar">
                  {member.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="member-name-text">{member.name}</span>
                <span className="member-ticket-count">
                  {member.totalTickets}
                </span>
              </button>
            ))}

            {/* Unassigned Workload */}
            {unassignedCount > 0 && (
              <button
                type="button"
                className={`member-workload-card ${
                  filterAssigneeId === "UNASSIGNED" ? "active-filter" : ""
                }`}
                onClick={() =>
                  setFilterAssigneeId(
                    filterAssigneeId === "UNASSIGNED" ? "ALL" : "UNASSIGNED"
                  )
                }
              >
                <span className="member-name-text">Unassigned</span>
                <span className="member-ticket-count">{unassignedCount}</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Search & Filter Toolbar */}
      <div className="kanban-toolbar">
        <div className="kanban-search-box">
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search tickets by title or key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="kanban-filter-selects">
          <select
            className="filter-select"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="NONE">None</option>
          </select>
        </div>
      </div>

      {/* Tickets Query Error Notification (if any) */}
      {isTicketsError && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          Unable to fetch latest project tickets. Please refresh or check connection.
        </div>
      )}

      {/* Kanban Board */}
      <KanbanBoard
        projectId={project.id}
        projectStates={project.states ?? []}
        tickets={filteredTickets}
        onSelectTicket={(ticketId) => setSelectedTicketId(ticketId)}
      />

      {/* Create Ticket Modal */}
      {isCreateModalOpen && (
        <CreateTicketModal
          projectId={project.id}
          projectStates={project.states ?? []}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {/* Ticket Details Modal */}
      {selectedTicketId && (
        <TicketDetailModal
          issueId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </div>
  );
};

export default ProjectTicketsPage;
