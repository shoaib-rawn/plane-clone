import React, { useState } from "react";
import type { TicketDetails } from "../types";

interface TicketDonutChartProps {
  tickets: TicketDetails[];
  selectedFilter: string | null;
  onSelectFilter: (filterKey: string | null) => void;
}

export const TicketDonutChart: React.FC<TicketDonutChartProps> = ({
  tickets,
  selectedFilter,
  onSelectFilter,
}) => {
  const [viewMode, setViewMode] = useState<"status" | "priority">("status");
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const total = tickets.length;

  // 1. Group by Status
  const statusCounts = tickets.reduce(
    (acc, t: any) => {
      const g = (t.state?.group || "").toLowerCase();
      const n = (t.state?.name || "").toLowerCase();

      if (g === "unstarted" || g === "backlog" || n === "todo" || n === "backlog") {
        acc.todo += 1;
      } else if (g === "started" || n.includes("progress") || n.includes("doing") || n.includes("in progress")) {
        acc.inProgress += 1;
      } else if (g === "completed" || n === "done" || n.includes("complete")) {
        acc.done += 1;
      } else {
        acc.todo += 1;
      }
      return acc;
    },
    { todo: 0, inProgress: 0, done: 0 }
  );

  // 2. Group by Priority
  const priorityCounts = tickets.reduce(
    (acc, t: any) => {
      const p = (t.priority || "NONE").toUpperCase();
      if (p === "URGENT") acc.urgent += 1;
      else if (p === "HIGH") acc.high += 1;
      else if (p === "MEDIUM") acc.medium += 1;
      else if (p === "LOW") acc.low += 1;
      else acc.none += 1;
      return acc;
    },
    { urgent: 0, high: 0, medium: 0, low: 0, none: 0 }
  );

  const statusSegments = [
    { key: "todo", label: "Todo", count: statusCounts.todo, color: "#6366F1", bg: "#EEF2FF" },
    { key: "inProgress", label: "In Progress", count: statusCounts.inProgress, color: "#F59E0B", bg: "#FFFBEB" },
    { key: "done", label: "Done", count: statusCounts.done, color: "#10B981", bg: "#ECFDF5" },
  ].filter((s) => s.count > 0 || total === 0);

  const prioritySegments = [
    { key: "urgent", label: "Urgent", count: priorityCounts.urgent, color: "#B91C1C", bg: "#FEE2E2" },
    { key: "high", label: "High", count: priorityCounts.high, color: "#DC2626", bg: "#FEF2F2" },
    { key: "medium", label: "Medium", count: priorityCounts.medium, color: "#D97706", bg: "#FFFBEB" },
    { key: "low", label: "Low", count: priorityCounts.low, color: "#2563EB", bg: "#EFF6FF" },
    { key: "none", label: "None", count: priorityCounts.none, color: "#94A3B8", bg: "#F8FAFC" },
  ].filter((s) => s.count > 0);

  const activeSegments = viewMode === "status" ? statusSegments : prioritySegments;

  // Donut SVG constants
  const size = 200;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;

  const completedCount = statusCounts.done;
  const completionPercentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="donut-chart-container">
      {/* View Mode Toggle Header */}
      <div className="donut-header">
        <div className="donut-title-group">
          <h4>Tickets Breakdown</h4>
          <span className="donut-total-badge">{total} Total</span>
        </div>

        <div className="donut-toggle-pills">
          <button
            type="button"
            className={`donut-pill ${viewMode === "status" ? "active" : ""}`}
            onClick={() => setViewMode("status")}
          >
            By Status
          </button>
          <button
            type="button"
            className={`donut-pill ${viewMode === "priority" ? "active" : ""}`}
            onClick={() => setViewMode("priority")}
          >
            By Priority
          </button>
        </div>
      </div>

      <div className="donut-body">
        {/* SVG Donut Graphic */}
        <div className="donut-svg-wrapper">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="donut-svg">
            <defs>
              <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
              </filter>
            </defs>

            {/* Background Empty Ring */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#E5E7EB"
              strokeWidth={strokeWidth - 4}
            />

            {/* Slices */}
            {total > 0 &&
              activeSegments.map((segment) => {
                const sliceRatio = segment.count / total;
                const dashLength = sliceRatio * circumference;
                const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
                const strokeDashoffset = -cumulativeOffset;
                cumulativeOffset += dashLength;

                const isHovered = hoveredKey === segment.key;
                const isSelected = selectedFilter === segment.key;

                return (
                  <circle
                    key={segment.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={segment.color}
                    strokeWidth={isHovered || isSelected ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="donut-slice"
                    style={{
                      cursor: "pointer",
                      transition: "stroke-width 0.2s ease, opacity 0.2s ease",
                      opacity: selectedFilter && !isSelected ? 0.45 : 1,
                    }}
                    onMouseEnter={() => setHoveredKey(segment.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    onClick={() => onSelectFilter(selectedFilter === segment.key ? null : segment.key)}
                  />
                );
              })}
          </svg>

          {/* Central Counter Display */}
          <div className="donut-center-info">
            <span className="donut-center-value">
              {viewMode === "status" ? `${completionPercentage}%` : total}
            </span>
            <span className="donut-center-label">
              {viewMode === "status" ? "Completed" : "Tickets"}
            </span>
          </div>
        </div>

        {/* Legend / Breakdown List */}
        <div className="donut-legend-list">
          {activeSegments.map((segment) => {
            const percentage = total > 0 ? Math.round((segment.count / total) * 100) : 0;
            const isSelected = selectedFilter === segment.key;
            const isHovered = hoveredKey === segment.key;

            return (
              <div
                key={segment.key}
                className={`donut-legend-item ${isSelected ? "selected" : ""} ${isHovered ? "hovered" : ""}`}
                style={{ cursor: "pointer" }}
                onClick={() => onSelectFilter(selectedFilter === segment.key ? null : segment.key)}
                onMouseEnter={() => setHoveredKey(segment.key)}
                onMouseLeave={() => setHoveredKey(null)}
              >
                <div className="legend-left">
                  <span
                    className="legend-color-dot"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="legend-label">{segment.label}</span>
                </div>

                <div className="legend-right">
                  <span className="legend-count">{segment.count}</span>
                  <span className="legend-percent">{percentage}%</span>
                </div>
              </div>
            );
          })}

          {selectedFilter && (
            <button
              type="button"
              className="donut-clear-btn"
              onClick={() => onSelectFilter(null)}
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDonutChart;
