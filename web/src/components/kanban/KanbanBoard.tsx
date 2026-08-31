import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateIssue,
  type TicketDetails,
} from "../../features/tickets/api/ticketApi";
import type { ProjectState } from "../../features/projects/api/projectApi";
import KanbanColumn, { type ColumnId } from "./KanbanColumn";
import "../../styling/KanbanBoard.css";

interface KanbanBoardProps {
  projectId: string;
  projectStates: ProjectState[];
  tickets: TicketDetails[];
  onSelectTicket: (ticketId: string) => void;
}

// Columns definition for the Kanban Board
const KANBAN_COLUMNS: Array<{ id: ColumnId; title: string }> = [
  { id: "todo", title: "Todo" },
  { id: "in_progress", title: "In Progress" },
  { id: "complete", title: "Complete" },
];

/**
 * Determine which Kanban column a ticket belongs to
 * based on its state group or name.
 */
const getTicketColumnId = (ticket: TicketDetails): ColumnId => {
  const group = ticket.state?.group?.toLowerCase();
  const name = ticket.state?.name?.toLowerCase();

  if (group === "started" || name === "in progress") {
    return "in_progress";
  }

  if (
    group === "completed" ||
    name === "done" ||
    name === "complete" ||
    name === "completed"
  ) {
    return "complete";
  }

  // Default to todo column (includes unstarted, backlog, etc.)
  return "todo";
};

/**
 * Find the matching project state for a target column
 */
const resolveStateForColumn = (
  columnId: ColumnId,
  states: ProjectState[]
): ProjectState | undefined => {
  if (!states || states.length === 0) {
    return undefined;
  }

  if (columnId === "in_progress") {
    return (
      states.find((s) => s.group?.toLowerCase() === "started") ||
      states.find((s) => s.name.toLowerCase().includes("progress")) ||
      states[0]
    );
  }

  if (columnId === "complete") {
    return (
      states.find((s) => s.group?.toLowerCase() === "completed") ||
      states.find((s) => s.name.toLowerCase() === "done") ||
      states.find((s) => s.name.toLowerCase() === "complete") ||
      states[states.length - 1]
    );
  }

  // Column 'todo': prefer 'unstarted' / 'Todo'
  return (
    states.find((s) => s.group?.toLowerCase() === "unstarted") ||
    states.find((s) => s.name.toLowerCase() === "todo") ||
    states.find((s) => s.group?.toLowerCase() === "backlog") ||
    states[0]
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  projectStates,
  tickets,
  onSelectTicket,
}) => {
  const queryClient = useQueryClient();
  const [activeTicket, setActiveTicket] = useState<TicketDetails | null>(null);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Require small pointer movement before dragging begins
  // to avoid interfering with regular ticket card clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // TanStack React Query mutation with Optimistic Update
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      ticketId,
      targetState,
    }: {
      ticketId: string;
      targetState: ProjectState;
    }) => {
      return updateIssue(ticketId, {
        stateId: targetState.id,
      });
    },

    onMutate: async ({ ticketId, targetState }) => {
      setUpdatingTicketId(ticketId);
      setErrorMessage(null);

      // Cancel outgoing refetches so they don't overwrite optimistic update
      await queryClient.cancelQueries({
        queryKey: ["projectTickets", projectId],
      });

      // Snapshot previous tickets cache
      const previousData = queryClient.getQueryData<{ data: TicketDetails[] }>([
        "projectTickets",
        projectId,
      ]);

      // Optimistically update tickets in cache
      if (previousData?.data) {
        const optimisticTickets = previousData.data.map((item) => {
          if (item.id === ticketId) {
            return {
              ...item,
              stateId: targetState.id,
              state: {
                id: targetState.id,
                name: targetState.name,
                group: targetState.group,
                colour: targetState.colour,
                position: targetState.position,
              },
            };
          }
          return item;
        });

        queryClient.setQueryData(["projectTickets", projectId], {
          ...previousData,
          data: optimisticTickets,
        });
      }

      return { previousData };
    },

    onError: (err: any, _variables, context) => {
      // Rollback to previous state on failure
      if (context?.previousData) {
        queryClient.setQueryData(
          ["projectTickets", projectId],
          context.previousData
        );
      }
      setErrorMessage(
        err?.message || "Failed to update ticket status. Please try again."
      );
      // Auto-hide toast after 4 seconds
      setTimeout(() => setErrorMessage(null), 4000);
    },

    onSettled: () => {
      setUpdatingTicketId(null);
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    const ticket =
      event.active.data.current?.ticket ||
      tickets.find((t) => t.id === event.active.id);

    if (ticket) {
      setActiveTicket(ticket);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTicket(null);

    if (!over) {
      return;
    }

    const draggedTicket =
      active.data.current?.ticket || tickets.find((t) => t.id === active.id);

    if (!draggedTicket) {
      return;
    }

    // Determine target column ID
    let destinationColumnId: ColumnId | null = null;

    if (
      over.id === "todo" ||
      over.id === "in_progress" ||
      over.id === "complete"
    ) {
      destinationColumnId = over.id as ColumnId;
    } else {
      // If dropped over a card instead of directly on the column
      const targetTicket = tickets.find((t) => t.id === over.id);
      if (targetTicket) {
        destinationColumnId = getTicketColumnId(targetTicket);
      }
    }

    if (!destinationColumnId) {
      return;
    }

    const currentColumnId = getTicketColumnId(draggedTicket);

    // If dropped in the same column, do nothing
    if (currentColumnId === destinationColumnId) {
      return;
    }

    // Find the state for target column
    const targetState = resolveStateForColumn(
      destinationColumnId,
      projectStates
    );

    if (!targetState) {
      return;
    }

    // Trigger status update
    updateStatusMutation.mutate({
      ticketId: draggedTicket.id,
      targetState,
    });
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {KANBAN_COLUMNS.map((column) => {
            const columnTickets = tickets.filter(
              (t) => getTicketColumnId(t) === column.id
            );
            return (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tickets={columnTickets}
                onSelectTicket={onSelectTicket}
                updatingTicketId={updatingTicketId}
              />
            );
          })}
        </div>

        {/* Drag Overlay provides smooth visual feedback during dragging */}
        <DragOverlay dropAnimation={null}>
          {activeTicket ? (
            <div className="kanban-card kanban-card-overlay">
              <div className="kanban-card-header">
                <span className="card-ticket-key">{activeTicket.key}</span>
                <span
                  className={`card-priority-badge ${activeTicket.priority.toLowerCase()}`}
                >
                  {activeTicket.priority}
                </span>
              </div>
              <h3 className="kanban-card-title">{activeTicket.title}</h3>
              <div className="kanban-card-footer">
                <div className="card-assignee">
                  <div className="assignee-avatar">
                    {activeTicket.assignee?.displayName
                      ? activeTicket.assignee.displayName.slice(0, 2).toUpperCase()
                      : "U"}
                  </div>
                  <span className="assignee-name">
                    {activeTicket.assignee?.displayName || "Unassigned"}
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Error Toast Notification */}
      {errorMessage && (
        <div className="kanban-toast error">
          <span>{errorMessage}</span>
        </div>
      )}
    </>
  );
};

export default KanbanBoard;
