import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, ListTodo, Timer, Flame } from "lucide-react";
import { getProjects } from "../features/projects/api/projectApi";
import { getMyTickets } from "../features/tickets/api/ticketApi";
import TicketDetailModal from "../components/TicketDetailModal";
import { useAuth } from "../context/AuthContext";
import "../styling/Dashboard.css";

const Dashboard: React.FC = () => {
  const { userName } = useAuth();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // 1. Fetch projects list
  const { data: projectsRes, isLoading: loadingProjects } = useQuery<any>({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

  // 2. Fetch my tickets list
  const { data: ticketsRes, isLoading: loadingTickets } = useQuery<any>({
    queryKey: ["myTickets"],
    queryFn: getMyTickets,
  });

  const projects = projectsRes?.data ?? [];
  const tickets = ticketsRes?.data ?? [];

  // Compute stats
  const totalProjects = projects.length;
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t: any) => {
    const g = t.state?.group?.toLowerCase();
    return (
      g === "backlog" ||
      g === "unstarted" ||
      g === "started" ||
      g === "todo" ||
      g === "in_progress" ||
      g === "in progress"
    );
  }).length;

  const urgentTickets = tickets.filter(
    (t: any) => t.priority === "URGENT" || t.priority === "HIGH"
  ).length;

  const formatDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loadingProjects || loadingTickets) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Welcome Banner */}
      <header className="dashboard-header">
        <div className="header-text">
          <h1>Welcome back, {userName || "Developer"}! 👋</h1>
          <p className="date-subtitle">{formatDate()}</p>
        </div>
      </header>

      {/* Stats Grid */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper projects-bg">
            <Layers size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Active Projects</span>
            <h2 className="stat-value">{totalProjects}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper tickets-bg">
            <ListTodo size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">My Tickets</span>
            <h2 className="stat-value">{totalTickets}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper open-bg">
            <Timer size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Open Work</span>
            <h2 className="stat-value">{openTickets}</h2>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper urgent-bg">
            <Flame size={20} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Urgent / High</span>
            <h2 className="stat-value">{urgentTickets}</h2>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="dashboard-content">
        {/* Left: My Tickets */}
        <section className="dashboard-section main-section">
          <div className="section-header">
            <h3>My Assigned Tickets</h3>
            <span className="badge-count">{totalTickets}</span>
          </div>

          {tickets.length === 0 ? (
            <div className="empty-state">
              <p>No tickets assigned to you yet.</p>
            </div>
          ) : (
            <ul className="ticket-list">
              {tickets.slice(0, 8).map((ticket: any) => (
                <li
                  key={ticket.id}
                  className="ticket-row clickable"
                  onClick={() => setSelectedTicketId(ticket.id)}
                  title="Click to view details, discussion & activity"
                  style={{ cursor: "pointer" }}
                >
                  <span className="ticket-key">
                    {ticket.key || `${ticket.project?.key}-${ticket.sequenceId}`}
                  </span>
                  <div className="ticket-details">
                    <span className="ticket-title">{ticket.title}</span>
                    <div className="ticket-meta">
                      <span className={`priority-badge ${(ticket.priority || "NONE").toLowerCase()}`}>
                        {ticket.priority || "NONE"}
                      </span>
                      {ticket.state && (
                        <span
                          className="state-indicator"
                          style={{
                            borderColor: ticket.state.colour,
                            backgroundColor: `${ticket.state.colour}10`,
                            color: ticket.state.colour,
                          }}
                        >
                          {ticket.state.name}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right: Workspace Projects */}
        <section className="dashboard-section sidebar-section">
          <div className="section-header">
            <h3>Projects Overview</h3>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state">
              <p>No projects found in this workspace.</p>
            </div>
          ) : (
            <ul className="project-list">
              {projects.map((proj: any) => (
                <li key={proj.id} className="project-row-item">
                  <div className="project-row-header">
                    <h4>{proj.name}</h4>
                    <span className="project-key-tag">{proj.key}</span>
                  </div>
                  <p className="project-row-desc">
                    {proj.description || "No description provided."}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

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

export default Dashboard;
