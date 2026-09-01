import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Send,
  Trash2,
  Edit2,
  Check,
  Clock,
  MessageSquare,
  Activity,
  Calendar,
  User,
  AlertCircle,
  FolderKanban,
  Shield,
} from "lucide-react";
import {
  getIssueById,
  updateIssue,
  deleteIssue,
  getIssueComments,
  addIssueComment,
  updateIssueComment,
  deleteIssueComment,
  getIssueActivities,
  getAllUsers,
  getCurrentProfile,
  getProjectDetails,
} from "../api";
import type { IssuePriority, IssueComment, IssueActivity } from "../types";
import { useAuth } from "../auth";
import "../styling/TicketDetailModal.css";

interface TicketDetailModalProps {
  issueId: string;
  onClose: () => void;
  onUpdated?: () => void;
}

const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  issueId,
  onClose,
  onUpdated,
}) => {
  const queryClient = useQueryClient();
  const { workspaceRole } = useAuth();

  const [activeTab, setActiveTab] = useState<"comments" | "activities">("comments");
  const [commentText, setCommentText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState("");

  // 1. Fetch Current User Profile
  const { data: profileRes } = useQuery<any>({
    queryKey: ["userProfile"],
    queryFn: getCurrentProfile,
  });
  const currentUserId = profileRes?.data?.user?.id;

  // 2. Fetch Issue Details
  const {
    data: issueRes,
    isLoading: loadingIssue,
    isError: errorIssue,
  } = useQuery({
    queryKey: ["issue", issueId],
    queryFn: () => getIssueById(issueId),
    enabled: !!issueId,
  });

  const issue = issueRes?.data;
  const projectId = issue?.project?.id;

  // 3. Fetch Project Details for States & Role
  const { data: projectRes } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => (projectId ? getProjectDetails(projectId) : Promise.resolve(null)),
    enabled: !!projectId,
  });
  const projectStates = projectRes?.data?.states ?? [];
  const projectRole = projectRes?.data?.myRole;

  // Permissions:
  // - Admin (workspace or project) can edit everything and delete tickets
  // - Member can edit title, description, properties, and delete tickets
  // - Viewer can only view details and comment (cannot edit properties or delete)
  const canEdit = workspaceRole === "ADMIN" || projectRole === "ADMIN" || projectRole === "MEMBER";

  // 4. Fetch Comments
  const { data: commentsRes, isLoading: loadingComments } = useQuery({
    queryKey: ["issueComments", issueId],
    queryFn: () => getIssueComments(issueId),
    enabled: !!issueId,
  });
  const comments = commentsRes?.data ?? [];

  // 5. Fetch Activities
  const { data: activitiesRes, isLoading: loadingActivities } = useQuery({
    queryKey: ["issueActivities", issueId],
    queryFn: () => getIssueActivities(issueId),
    enabled: !!issueId,
  });
  const activities = activitiesRes?.data ?? [];

  // 6. Fetch Users for Assignment
  const { data: usersRes } = useQuery({
    queryKey: ["allUsers"],
    queryFn: getAllUsers,
  });
  const users: any[] = (usersRes as any)?.data ?? [];

  // Mutations
  const updateIssueMutation = useMutation({
    mutationFn: (payload: any) => updateIssue(issueId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issue", issueId] });
      queryClient.invalidateQueries({ queryKey: ["issueActivities", issueId] });
      queryClient.invalidateQueries({ queryKey: ["projectTickets"] });
      queryClient.invalidateQueries({ queryKey: ["myTickets"] });
      onUpdated?.();
    },
  });

  const deleteIssueMutation = useMutation({
    mutationFn: () => deleteIssue(issueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projectTickets"] });
      queryClient.invalidateQueries({ queryKey: ["myTickets"] });
      onUpdated?.();
      onClose();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (body: string) => addIssueComment(issueId, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issueComments", issueId] });
      queryClient.invalidateQueries({ queryKey: ["issueActivities", issueId] });
      setCommentText("");
    },
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, body }: { commentId: string; body: string }) =>
      updateIssueComment(issueId, commentId, { body }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issueComments", issueId] });
      setEditingCommentId(null);
      setEditingCommentText("");
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteIssueComment(issueId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issueComments", issueId] });
    },
  });

  // Handlers
  const handleSaveTitle = () => {
    if (titleDraft.trim() && titleDraft.trim() !== issue?.title) {
      updateIssueMutation.mutate({ title: titleDraft.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleSaveDesc = () => {
    updateIssueMutation.mutate({ description: descDraft });
    setIsEditingDesc(false);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    addCommentMutation.mutate(commentText.trim());
  };

  const handleStartEditComment = (comment: IssueComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.body);
  };

  const handleSaveComment = (commentId: string) => {
    if (!editingCommentText.trim()) return;
    updateCommentMutation.mutate({ commentId, body: editingCommentText.trim() });
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loadingIssue) {
    return (
      <div className="ticket-modal-overlay" onClick={onClose}>
        <div className="ticket-modal-card loading-state" onClick={(e) => e.stopPropagation()}>
          <div className="ticket-spinner" />
          <p>Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (errorIssue || !issue) {
    return (
      <div className="ticket-modal-overlay" onClick={onClose}>
        <div className="ticket-modal-card error-state" onClick={(e) => e.stopPropagation()}>
          <AlertCircle size={36} color="#DC2626" />
          <h3>Failed to load ticket</h3>
          <p>The ticket could not be found or you do not have permission.</p>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-modal-overlay" onClick={onClose}>
      <div className="ticket-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Top Header */}
        <div className="ticket-modal-header">
          <div className="ticket-breadcrumb">
            <FolderKanban size={16} />
            <span>{issue.project?.name || "Project"}</span>
            <span className="breadcrumb-separator">/</span>
            <span className="ticket-key-badge">{issue.key}</span>
            {projectRole && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  color: "#64748B",
                  backgroundColor: "#F1F5F9",
                  padding: "2px 6px",
                  borderRadius: 4,
                  marginLeft: 8,
                }}
              >
                <Shield size={11} /> {projectRole}
              </span>
            )}
          </div>

          <button className="ticket-close-btn" onClick={onClose} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Main Body Grid */}
        <div className="ticket-modal-body">
          {/* Left Main Content */}
          <div className="ticket-main-content">
            {/* Title Section */}
            <div className="ticket-title-section">
              {canEdit && isEditingTitle ? (
                <div className="inline-edit-box">
                  <input
                    type="text"
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    autoFocus
                    className="ticket-title-input"
                  />
                  <div className="inline-edit-actions">
                    <button className="btn-icon save" onClick={handleSaveTitle}>
                      <Check size={16} />
                    </button>
                    <button className="btn-icon cancel" onClick={() => setIsEditingTitle(false)}>
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`ticket-title-display ${canEdit ? "clickable-edit" : ""}`}
                  onClick={() => {
                    if (canEdit) {
                      setTitleDraft(issue.title);
                      setIsEditingTitle(true);
                    }
                  }}
                  title={canEdit ? "Click to edit title" : "Read-only"}
                >
                  <h2>{issue.title}</h2>
                  {canEdit && <Edit2 size={16} className="edit-hint-icon" />}
                </div>
              )}
            </div>

            {/* Description Section */}
            <div className="ticket-description-section">
              <label className="section-label">Description</label>
              {canEdit && isEditingDesc ? (
                <div className="inline-desc-edit">
                  <textarea
                    rows={4}
                    value={descDraft}
                    onChange={(e) => setDescDraft(e.target.value)}
                    placeholder="Add a detailed description..."
                    className="ticket-desc-textarea"
                  />
                  <div className="inline-desc-buttons">
                    <button className="btn-primary-sm" onClick={handleSaveDesc}>
                      Save
                    </button>
                    <button className="btn-secondary-sm" onClick={() => setIsEditingDesc(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={`ticket-desc-display ${canEdit ? "clickable-edit" : ""}`}
                  onClick={() => {
                    if (canEdit) {
                      setDescDraft(issue.description || "");
                      setIsEditingDesc(true);
                    }
                  }}
                  title={canEdit ? "Click to edit description" : "Read-only"}
                >
                  {issue.description ? (
                    <p>{issue.description}</p>
                  ) : (
                    <span className="placeholder-text">
                      {canEdit ? "Add a description..." : "No description provided."}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tabs Header: Comments vs Activities */}
            <div className="ticket-tabs-header">
              <button
                className={`ticket-tab-btn ${activeTab === "comments" ? "active" : ""}`}
                onClick={() => setActiveTab("comments")}
              >
                <MessageSquare size={16} />
                <span>Comments ({comments.length})</span>
              </button>

              <button
                className={`ticket-tab-btn ${activeTab === "activities" ? "active" : ""}`}
                onClick={() => setActiveTab("activities")}
              >
                <Activity size={16} />
                <span>Activity History ({activities.length})</span>
              </button>
            </div>

            {/* Tab 1: Comments */}
            {activeTab === "comments" && (
              <div className="comments-container">
                {/* Comments List */}
                <div className="comments-list">
                  {loadingComments ? (
                    <p className="subtext">Loading discussion comments...</p>
                  ) : comments.length === 0 ? (
                    <p className="subtext no-comments">No comments yet. Start the conversation!</p>
                  ) : (
                    comments.map((comment: IssueComment) => {
                      const isAuthor =
                        comment.author?.id === currentUserId || comment.authorId === currentUserId;
                      const canDeleteComment =
                        isAuthor || workspaceRole === "ADMIN" || projectRole === "ADMIN";

                      return (
                        <div key={comment.id} className="comment-item">
                          <div className="comment-avatar">
                            <User size={16} />
                          </div>

                          <div className="comment-content-box">
                            <div className="comment-header">
                              <span className="author-name">
                                {comment.author?.displayName || comment.author?.email || "User"}
                              </span>
                              <span className="comment-date">
                                {formatTimestamp(comment.createdAt)}
                                {comment.editedAt && " (edited)"}
                              </span>

                              <div className="comment-actions">
                                {isAuthor && (
                                  <button
                                    className="action-btn"
                                    onClick={() => handleStartEditComment(comment)}
                                    title="Edit comment"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                )}
                                {canDeleteComment && (
                                  <button
                                    className="action-btn delete"
                                    onClick={() => deleteCommentMutation.mutate(comment.id)}
                                    title="Delete comment"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {editingCommentId === comment.id ? (
                              <div className="comment-edit-box">
                                <textarea
                                  value={editingCommentText}
                                  onChange={(e) => setEditingCommentText(e.target.value)}
                                  rows={2}
                                  className="comment-edit-textarea"
                                />
                                <div className="comment-edit-buttons">
                                  <button
                                    className="btn-primary-xs"
                                    onClick={() => handleSaveComment(comment.id)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    className="btn-secondary-xs"
                                    onClick={() => setEditingCommentId(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="comment-body">{comment.body}</p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Comment Input */}
                <form className="add-comment-form" onSubmit={handleAddComment}>
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="add-comment-input"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || addCommentMutation.isPending}
                    className="send-comment-btn"
                  >
                    <Send size={15} />
                    <span>{addCommentMutation.isPending ? "Posting..." : "Comment"}</span>
                  </button>
                </form>
              </div>
            )}

            {/* Tab 2: Activity Log Timeline */}
            {activeTab === "activities" && (
              <div className="activities-container">
                {loadingActivities ? (
                  <p className="subtext">Loading audit timeline...</p>
                ) : activities.length === 0 ? (
                  <p className="subtext">No activity logged for this ticket yet.</p>
                ) : (
                  <div className="activity-timeline">
                    {activities.map((act: IssueActivity) => (
                      <div key={act.id} className="timeline-item">
                        <div className="timeline-bullet">
                          <Clock size={12} />
                        </div>
                        <div className="timeline-content">
                          <p className="timeline-text">
                            <strong>{act.actor?.displayName || "Someone"}</strong>{" "}
                            {act.verb === "created" ? (
                              <span>created this ticket</span>
                            ) : act.verb === "commented" ? (
                              <span>added a comment</span>
                            ) : (
                              <span>
                                changed <code>{act.field || "field"}</code>
                                {act.oldValue ? ` from "${act.oldValue}"` : ""}
                                {act.newValue ? ` to "${act.newValue}"` : ""}
                              </span>
                            )}
                          </p>
                          <span className="timeline-time">{formatTimestamp(act.createdAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar Properties */}
          <aside className="ticket-sidebar-properties">
            <h4 className="properties-title">Properties</h4>

            {/* State / Status Dropdown */}
            <div className="property-row">
              <label>Status</label>
              <select
                value={issue.state?.id || issue.stateId || ""}
                onChange={(e) => updateIssueMutation.mutate({ stateId: e.target.value })}
                disabled={!canEdit}
                className="property-select"
              >
                {projectStates.length > 0 ? (
                  projectStates.map((st: any) => (
                    <option key={st.id} value={st.id}>
                      {st.name}
                    </option>
                  ))
                ) : (
                  <option value={issue.state?.id}>{issue.state?.name || "Select State"}</option>
                )}
              </select>
            </div>

            {/* Priority Dropdown */}
            <div className="property-row">
              <label>Priority</label>
              <select
                value={issue.priority || "NONE"}
                onChange={(e) =>
                  updateIssueMutation.mutate({ priority: e.target.value as IssuePriority })
                }
                disabled={!canEdit}
                className={`property-select priority-${(issue.priority || "none").toLowerCase()}`}
              >
                <option value="URGENT">Urgent 🔴</option>
                <option value="HIGH">High 🟠</option>
                <option value="MEDIUM">Medium 🟡</option>
                <option value="LOW">Low 🟢</option>
                <option value="NONE">None ⚪</option>
              </select>
            </div>

            {/* Assignee Dropdown */}
            <div className="property-row">
              <label>Assignee</label>
              <select
                value={issue.assignee?.id || issue.assigneeId || ""}
                onChange={(e) =>
                  updateIssueMutation.mutate({
                    assigneeId: e.target.value === "" ? null : e.target.value,
                  })
                }
                disabled={!canEdit}
                className="property-select"
              >
                <option value="">Unassigned</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName || u.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Picker */}
            <div className="property-row">
              <label>Due Date</label>
              <div className="date-input-wrapper">
                <Calendar size={14} className="date-icon" />
                <input
                  type="date"
                  value={issue.dueDate ? issue.dueDate.substring(0, 10) : ""}
                  onChange={(e) =>
                    updateIssueMutation.mutate({
                      dueDate: e.target.value ? e.target.value : null,
                    })
                  }
                  disabled={!canEdit}
                  className="property-date-input"
                />
              </div>
            </div>

            {/* Delete Ticket Action (Visible only for ADMIN and MEMBER) */}
            {canEdit && (
              <div className="sidebar-danger-zone">
                <button
                  className="btn-danger-outline"
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this ticket?")) {
                      deleteIssueMutation.mutate();
                    }
                  }}
                  disabled={deleteIssueMutation.isPending}
                >
                  <Trash2 size={14} />
                  <span>{deleteIssueMutation.isPending ? "Deleting..." : "Delete Ticket"}</span>
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailModal;
