import React from "react";
import { useDroppable } from "@dnd-kit/core";
import KanbanCard from "./KanbanCard";
import type { TicketDetails } from "../../features/tickets/api/ticketApi";

export type ColumnId = "todo" | "in_progress" | "complete";

interface KanbanColumnProps {
  id: ColumnId;
  title: string;
  tickets: TicketDetails[];
  onSelectTicket: (ticketId: string) => void;
  updatingTicketId: string | null;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tickets,
  onSelectTicket,
  updatingTicketId,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      columnId: id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? "is-over" : ""}`}
    >
      {/* Column Header */}
      <div className="kanban-column-header">
        <div className="column-title-group">
          <span className={`column-indicator ${id}`} />
          <h2 className="kanban-column-title">{title}</h2>
        </div>
        <span className="column-count-badge">{tickets.length}</span>
      </div>

      {/* Tickets List */}
      <div className="kanban-card-list">
        {tickets.length === 0 ? (
          <div className="empty-column-placeholder">No tickets in {title}</div>
        ) : (
          tickets.map((ticket) => (
            <KanbanCard
              key={ticket.id}
              ticket={ticket}
              onClick={onSelectTicket}
              isUpdating={updatingTicketId === ticket.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
