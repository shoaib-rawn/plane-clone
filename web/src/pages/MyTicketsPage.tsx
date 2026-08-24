import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyTickets } from "../features/tickets/api/ticketApi";
import { Ticket, Calendar, AlertCircle } from "lucide-react";

const MyTicketsPage: React.FC = () => {
  const { data, isLoading, isError } = useQuery<any>({
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
        return { color: "#1E3A8A", backgroundColor: "#DBEAFE", border: "1px solid #93C5FD" };
      case "LOW":
        return { color: "#374151", backgroundColor: "#F3F4F6", border: "1px solid #E5E7EB" };
      default:
        return { color: "#6B7280", backgroundColor: "#F9FAFB", border: "1px solid #E5E7EB" };
    }
  };

  return (
    <div style={{ padding: "24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Ticket size={28} />
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>My Assigned Tickets</h1>
      </div>

      {isLoading && <div style={{ fontSize: 16, color: "#666" }}>Loading assigned tickets...</div>}

      {isError && (
        <div style={{ padding: 16, color: "red", backgroundColor: "#FEE2E2", borderRadius: 6, marginBottom: 16 }}>
          Failed to load assigned tickets. Please check your connection.
        </div>
      )}

      {!isLoading && !isError && tickets.length === 0 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 0", color: "#666" }}>
          <AlertCircle size={48} strokeWidth={1.5} style={{ marginBottom: 12 }} />
          <p style={{ margin: 0, fontSize: 16 }}>No tickets assigned to you.</p>
        </div>
      )}

      {tickets.length > 0 && (
        <div style={{ overflowX: "auto", border: "1px solid #E5E7EB", borderRadius: 8, backgroundColor: "#fff" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                <th style={{ padding: "12px 16px", color: "#4B5563", fontWeight: 600, fontSize: 14 }}>Key</th>
                <th style={{ padding: "12px 16px", color: "#4B5563", fontWeight: 600, fontSize: 14 }}>Title</th>
                <th style={{ padding: "12px 16px", color: "#4B5563", fontWeight: 600, fontSize: 14 }}>Project</th>
                <th style={{ padding: "12px 16px", color: "#4B5563", fontWeight: 600, fontSize: 14 }}>State</th>
                <th style={{ padding: "12px 16px", color: "#4B5563", fontWeight: 600, fontSize: 14 }}>Priority</th>
                <th style={{ padding: "12px 16px", color: "#4B5563", fontWeight: 600, fontSize: 14 }}>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket: any) => (
                <tr key={ticket.id} style={{ borderBottom: "1px solid #E5E7EB", transition: "background-color 0.2s" }} className="ticket-row">
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827", fontSize: 14 }}>
                    {ticket.key}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#374151", fontSize: 14 }}>
                    {ticket.title}
                  </td>
                  <td style={{ padding: "12px 16px", color: "#4B5563", fontSize: 14 }}>
                    {ticket.project?.name ?? "Unknown"}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: ticket.state?.colour ? `${ticket.state.colour}22` : "#E5E7EB",
                      color: ticket.state?.colour ?? "#374151",
                      border: `1px solid ${ticket.state?.colour ?? "#D1D5DB"}33`
                    }}>
                      {ticket.state?.name ?? "Unknown"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      ...getPriorityStyle(ticket.priority)
                    }}>
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
    </div>
  );
};

export default MyTicketsPage;
