import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Settings, Archive, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import {
  updateProject,
  archiveProject,
  unarchiveProject,
  deleteProject,
} from "../api";
import type { ProjectItem } from "../types";
import "../styling/ProjectSettingsModal.css";

interface ProjectSettingsModalProps {
  project: ProjectItem;
  onClose: () => void;
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ project, onClose }) => {
  const queryClient = useQueryClient();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isArchived = !!project.archivedAt;

  // 1. Update Details Mutation
  const updateMutation = useMutation({
    mutationFn: (payload: { name: string; description: string }) =>
      updateProject(project.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSuccess("Project settings updated successfully!");
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to update project");
      setSuccess(null);
    },
  });

  // 2. Archive / Unarchive Mutation
  const archiveMutation = useMutation({
    mutationFn: () => (isArchived ? unarchiveProject(project.id) : archiveProject(project.id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSuccess(isArchived ? "Project unarchived!" : "Project archived!");
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to toggle archive state");
      setSuccess(null);
    },
  });

  // 3. Delete Project Mutation
  const deleteMutation = useMutation({
    mutationFn: () => deleteProject(project.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.message || "Failed to delete project");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Project name cannot be empty");
      return;
    }

    updateMutation.mutate({ name: name.trim(), description: description.trim() });
  };

  return (
    <div className="project-settings-overlay" onClick={onClose}>
      <div className="project-settings-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="project-settings-header">
          <div className="header-title-box">
            <Settings size={18} />
            <h3>Project Settings — {project.name} ({project.key})</h3>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="project-settings-content">
          {error && <div className="alert-box error">{error}</div>}
          {success && <div className="alert-box success">{success}</div>}

          {/* Edit Form */}
          <form onSubmit={handleSave} className="settings-form">
            <div className="form-group">
              <label>Project Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                placeholder="e.g. Website Redesign"
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="form-textarea"
                placeholder="Brief summary of this project..."
              />
            </div>

            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-save-project"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </button>
          </form>

          <hr className="divider" />

          {/* Danger Zone */}
          <div className="danger-zone">
            <h4 className="danger-title">
              <AlertTriangle size={16} /> Danger Zone
            </h4>

            {/* Archive toggle */}
            <div className="danger-action-row">
              <div>
                <strong>{isArchived ? "Unarchive Project" : "Archive Project"}</strong>
                <p className="danger-desc">
                  {isArchived
                    ? "Restore this project so members can create and edit tickets again."
                    : "Make this project read-only. Members will not be able to create new tickets."}
                </p>
              </div>

              <button
                type="button"
                className={`btn-action-warning ${isArchived ? "unarchive" : ""}`}
                onClick={() => archiveMutation.mutate()}
                disabled={archiveMutation.isPending}
              >
                {isArchived ? <RefreshCw size={14} /> : <Archive size={14} />}
                <span>
                  {archiveMutation.isPending
                    ? "Updating..."
                    : isArchived
                    ? "Unarchive"
                    : "Archive"}
                </span>
              </button>
            </div>

            {/* Delete Project */}
            <div className="danger-action-row delete-row">
              <div>
                <strong>Delete Project</strong>
                <p className="danger-desc">
                  Soft-delete this project. Its tickets and data will no longer appear in views.
                </p>
              </div>

              <button
                type="button"
                className="btn-action-danger"
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to delete "${project.name}"? This action cannot be undone.`
                    )
                  ) {
                    deleteMutation.mutate();
                  }
                }}
                disabled={deleteMutation.isPending}
              >
                <Trash2 size={14} />
                <span>{deleteMutation.isPending ? "Deleting..." : "Delete Project"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettingsModal;
