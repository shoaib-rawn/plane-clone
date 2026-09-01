import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyTickets } from "../api";
import type { TicketDetails } from "../types";
import { ListTodo, AlertCircle, Calendar } from "lucide-react";
import TicketDetailModal from "../components/TicketDetailModal";

const MyTicketsPage: React.FC = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{ data: TicketDetails[] }>({
    queryKey: ["myTickets"],
    queryFn: getMyTickets,
  });

  const tickets = data?.data ?? [];

  const getStateClass = (stateName?: string, stateGroup?: string) => {
    const group = (stateGroup || "").toLowerCase();
    const name = (stateName || "").toLowerCase();

    if (group === "unstarted" || group === "backlog" || name === "todo" || name === "backlog") {
      return "state-badge state-todo";
    }
    if (group === "started" || name.includes("progress") || name.includes("doing") || name.includes("in progress")) {
      return "state-badge state-in-progress";
    }
    if (group === "completed" || name === "done" || name.includes("complete")) {
      return "state-badge state-done";
    }
    if (group === "cancelled" || name === "cancelled") {
      return "state-badge state-cancelled";
    }
    return "state-badge state-todo";
  };

  const getPriorityClass = (priority: string) => {
    const p = (priority || "none").toLowerCase();
    return `priority-badge priority-${p}`;
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: "#EDE9FE",
            color: "#6D28D9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ListTodo size={22} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#1E293B" }}>
            My Assigned Tickets
          </h1>
          <p style={{ margin: "2px 0 0 0", fontSize: 13, color: "#64748B" }}>
            Tickets assigned to you across all projects in the workspace
          </p>
        </div>
      </div>

      {isLoading && (
        <div style={{ fontSize: 14, color: "#64748B", padding: "16px 0" }}>
          Loading assigned tickets...
        </div>
      )}

      {isError && (
        <div
          style={{
            padding: 16,
            color: "#DC2626",
            backgroundColor: "#FEE2E2",
            borderRadius: 8,
            marginBottom: 16,
            border: "1px solid #FCA5A5",
          }}
        >
          Failed to load assigned tickets. Please check your connection.
        </div>
      )}

      {!isLoading && !isError && tickets.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 0",
            color: "#6B7280",
            backgroundColor: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
          }}
        >
          <AlertCircle size={40} strokeWidth={1.5} style={{ marginBottom: 12, color: "#9CA3AF" }} />
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500 }}>No tickets assigned to you.</p>
        </div>
      )}

      {tickets.length > 0 && (
        <div
          style={{
            overflowX: "auto",
            border: "1px solid #E5E7EB",
            borderRadius: 12,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "12px 16px", color: "#4B5563", fontWeight: 600, fontSize: 13 }}>
                  Key
                </th>
                <th style={{ padding: "12px 16px", color: "#4B5563", fontWeight: 600, fontSize: 13 }}>
                  Title
                </th>
                <th style={{ padding: "12px 16px", color: "#4B5563", fontWeight: 600, fontSize: 13 }}>
                  Project
                </th>
                <th style={{ padding: "12px 16px", color: "#4B5563", fontWeight: 600, fontSize: 13 }}>
                  State
                </th>
                <th style={{ padding: "12px 16px", color: "#4B5563", fontWeight: 600, fontSize: 13 }}>
                  Priority
                </th>
                <th style={{ padding: "12px 16px", color: "#4B5563", fontWeight: 600, fontSize: 13 }}>
                  Due Date
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket: TicketDetails) => (
                <tr
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  style={{
                    borderBottom: "1px solid #F1F5F9",
                    cursor: "pointer",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FAF5FF")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  title="Click to view details, discussion & activity"
                >
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <span
                      style={{
                        backgroundColor: "#EDE9FE",
                        color: "#6D28D9",
                        padding: "2px 6px",
                        borderRadius: 4,
                        fontWeight: 700,
                        border: "1px solid #DDD6FE",
                      }}
                    >
                      {ticket.key}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#1E293B", fontSize: 14, fontWeight: 500 }}>
                    {ticket.title}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#4B5563", fontSize: 13 }}>
                    {ticket.project?.name ?? "Unknown"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <span className={getStateClass(ticket.state?.name, ticket.state?.group)}>
                      {ticket.state?.name ?? "Todo"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <span className={getPriorityClass(ticket.priority)}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#64748B", fontSize: 13 }}>
                    {ticket.dueDate ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={14} />
                        <span>{new Date(ticket.dueDate).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

export default MyTicketsPage;
