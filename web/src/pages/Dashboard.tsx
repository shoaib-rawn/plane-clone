import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layers, ListTodo, Timer, Flame, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProjects, getMyTickets } from "../api";
import TicketDonutChart from "../components/TicketDonutChart";
import { useAuth } from "../auth";
import "../styling/Dashboard.css";

const Dashboard: React.FC = () => {
  const { userName, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [donutFilter, setDonutFilter] = useState<string | null>(null);

  // 1. Fetch projects list
  const { data: projectsRes, isLoading: loadingProjects } = useQuery<any>({
    queryKey: ["projects"],
    queryFn: getProjects,
    enabled: isAuthenticated,
  });

  // 2. Fetch my tickets list
  const { data: ticketsRes, isLoading: loadingTickets } = useQuery<any>({
    queryKey: ["myTickets"],
    queryFn: getMyTickets,
    enabled: isAuthenticated,
  });

  const projects = projectsRes?.data ?? [];
  const tickets = ticketsRes?.data ?? [];

  // Compute stats
  const totalProjects = projects.length;
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t: any) => {
    const g = (t.state?.group || "").toLowerCase();
    const n = (t.state?.name || "").toLowerCase();
    return (
      g === "backlog" ||
      g === "unstarted" ||
      g === "started" ||
      n === "todo" ||
      n.includes("progress")
    );
  }).length;

  const urgentTickets = tickets.filter((t: any) => {
    const p = (t.priority || "").toUpperCase();
    return p === "URGENT" || p === "HIGH";
  }).length;

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
        {/* Left: Clean Interactive Donut Chart */}
        <section className="dashboard-section main-section" style={{ padding: "16px" }}>
          <TicketDonutChart
            tickets={tickets}
            selectedFilter={donutFilter}
            onSelectFilter={setDonutFilter}
          />
        </section>

        {/* Right: Workspace Projects Overview */}
        <section className="dashboard-section sidebar-section">
          <div className="section-header">
            <h3>Projects Overview</h3>
            <button
              type="button"
              onClick={() => navigate("/projects")}
              style={{
                background: "transparent",
                border: "none",
                color: "#6D28D9",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 6px",
                borderRadius: 4,
              }}
            >
              <span>All Projects</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="empty-state">
              <p>No projects found in this workspace.</p>
            </div>
          ) : (
            <ul className="project-list">
              {projects.map((proj: any) => (
                <li
                  key={proj.id}
                  className="project-row-item"
                  onClick={() => navigate(`/projects/${proj.id}/tickets`)}
                  style={{ cursor: "pointer" }}
                  title="Open Kanban Board"
                >
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
    </div>
  );
};

export default Dashboard;
