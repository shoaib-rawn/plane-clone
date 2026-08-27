import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyTickets, type TicketDetails } from "../features/tickets/api/ticketApi";
import { ListTodo, AlertCircle, Calendar } from "lucide-react";
import TicketDetailModal from "../components/TicketDetailModal";

const MyTicketsPage: React.FC = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery<{ data: TicketDetails[] }>({
    queryKey: ["myTickets"],
    queryFn: getMyTickets,
  });

  const tickets = data?.data ?? [];

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return { color: "#C53030", backgroundColor: "#FEE2E2", border: "1px solid #FEB2B2" };
      case "HIGH":
        return { color: "#9A3412", backgroundColor: "#FFEDD5", border: "1px solid #FDBA74" };
      case "MEDIUM":
        return { color: "#0284C7", backgroundColor: "#E0F6FF", border: "1px solid #BAE6FD" };
      case "LOW":
        return { color: "#475569", backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB" };
      default:
        return { color: "#6B7280", backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" };
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: "#E0F6FF",
            color: "#0284C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ListTodo size={22} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#334155" }}>
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
            border: "1px solid #E2E8F0",
            borderRadius: 12,
            backgroundColor: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
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
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F8FBFF")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  title="Click to view details, discussion & activity"
                >
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: "#0284C7", fontSize: 13 }}>
                    <span style={{ backgroundColor: "#E0F6FF", padding: "2px 6px", borderRadius: 4 }}>
                      {ticket.key}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#334155", fontSize: 14, fontWeight: 500 }}>
                    {ticket.title}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#4B5563", fontSize: 13 }}>
                    {ticket.project?.name ?? "Unknown"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: ticket.state?.colour ? `${ticket.state.colour}18` : "#F3F4F6",
                        color: ticket.state?.colour ?? "#374151",
                        border: `1px solid ${ticket.state?.colour ? `${ticket.state.colour}40` : "#D1D5DB"}`,
                      }}
                    >
                      {ticket.state?.name ?? "Unknown"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <span
                      style={{
                        padding: "3px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        ...getPriorityStyle(ticket.priority),
                      }}
                    >
                      {ticket.priority}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", color: "#6B7280", fontSize: 13 }}>
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
