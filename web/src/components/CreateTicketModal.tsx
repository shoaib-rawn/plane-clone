import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTicket } from "../features/tickets/api/ticketApi";
import { getProjectMembers } from "../features/projects/api/projectApi";
import { X, LoaderCircle } from "lucide-react";

interface CreateTicketModalProps {
  projectId: string;
  projectStates: { id: string; name: string }[];
  onClose: () => void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ projectId, projectStates, onClose }) => {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stateId, setStateId] = useState(projectStates[0]?.id ?? "");
  const [priority, setPriority] = useState<"URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE">("MEDIUM");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch project members for Assignee selection
  const { data: membersData } = useQuery<any>({
    queryKey: ["projectMembers", projectId],
    queryFn: () => getProjectMembers(projectId),
    enabled: !!projectId,
  });

  const members = membersData?.data ?? [];

  const createMutation = useMutation<any, any, any>({
    mutationFn: (payload) => createTicket(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTickets", projectId] });
      queryClient.invalidateQueries({ queryKey: ["myTickets"] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || "Failed to create ticket");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    createMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      stateId: stateId || undefined,
      priority,
      assigneeId: assigneeId || null,
      dueDate: dueDate || null,
    });
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: "#fff",
        borderRadius: 8,
        width: "100%",
        maxWidth: "500px",
        padding: "24px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        position: "relative",
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#6B7280"
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ marginTop: 0, marginBottom: 20, fontSize: 18, fontWeight: 600 }}>Create Ticket</h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Title *</label>
            <input
              placeholder="e.g. Fix mobile safari layout"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 14 }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Description</label>
            <textarea
              placeholder="Describe the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 14, fontFamily: "inherit", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>State</label>
              <select
                value={stateId}
                onChange={(e) => setStateId(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 14 }}
              >
                {projectStates.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 14 }}
              >
                <option value="NONE">NONE</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Assignee</label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 14 }}
              >
                <option value="">-- Unassigned --</option>
                {members.map((m: any) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.displayName || m.user.email}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 6, fontSize: 14 }}
              />
            </div>
          </div>

          {error && <div style={{ color: "#DC2626", fontSize: 13, marginTop: 4 }}>{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                border: "1px solid #D1D5DB",
                borderRadius: 6,
                backgroundColor: "#fff",
                cursor: "pointer",
                fontSize: 14
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                padding: "8px 16px",
                border: "none",
                borderRadius: 6,
                backgroundColor: "#2563EB",
                color: "#fff",
                cursor: "pointer",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {createMutation.isPending && <LoaderCircle size={16} className="spinner" />}
              <span>{createMutation.isPending ? "Creating..." : "Create Ticket"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;
