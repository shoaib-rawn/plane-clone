import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User } from "lucide-react";
import type { TicketDetails } from "../../features/tickets/api/ticketApi";

interface KanbanCardProps {
  ticket: TicketDetails;
  onClick: (ticketId: string) => void;
  isUpdating?: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  ticket,
  onClick,
  isUpdating = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: ticket.id,
      data: {
        ticket,
      },
      disabled: isUpdating,
    });

  // Apply drag transform
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
  };

  const priorityLower = ticket.priority.toLowerCase();

  // Helper to format due date nicely
  const formattedDueDate = ticket.dueDate
    ? new Date(ticket.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  // Get assignee initials
  const assigneeInitials = ticket.assignee?.displayName
    ? ticket.assignee.displayName.slice(0, 2).toUpperCase()
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(ticket.id)}
      className={`kanban-card ${isDragging ? "is-dragging" : ""} ${
        isUpdating ? "is-updating" : ""
      }`}
    >
      {/* Header: Ticket Key + Priority */}
      <div className="kanban-card-header">
        <span className="card-ticket-key">{ticket.key}</span>
        <span className={`card-priority-badge ${priorityLower}`}>
          {ticket.priority}
        </span>
      </div>

      {/* Title */}
      <h3 className="kanban-card-title">{ticket.title}</h3>

      {/* Footer: Assignee + Due Date */}
      <div className="kanban-card-footer">
        <div className="card-assignee">
          {assigneeInitials ? (
            <div className="assignee-avatar" title={ticket.assignee?.displayName}>
              {assigneeInitials}
            </div>
          ) : (
            <div className="assignee-avatar" title="Unassigned">
              <User size={12} />
            </div>
          )}
          <span className="assignee-name">
            {ticket.assignee?.displayName || "Unassigned"}
          </span>
        </div>

        {formattedDueDate && (
          <div className="card-due-date" title={`Due: ${formattedDueDate}`}>
            <Calendar size={12} />
            <span>{formattedDueDate}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
