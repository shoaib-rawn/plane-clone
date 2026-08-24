import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getProjects, createProject } from "../features/projects/api/projectApi";

const ProjectsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery<any>({ queryKey: ["projects"], queryFn: () => getProjects() });

  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation<any, any, { name: string; key: string; description?: string }>({
    mutationFn: (payload) => createProject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setName("");
      setKey("");
      setDescription("");
      setError(null);
    },
    onError: (err: any) => {
      setError(err.message || "Create project failed");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !key.trim()) {
      setError("Name and key are required");
      return;
    }

    createMutation.mutate({ name: name.trim(), key: key.trim(), description: description.trim() });
  };

  return (
    <div>
      <h1>Projects</h1>

      <section style={{ marginBottom: 24 }}>
        <h2>Create project</h2>
        <form onSubmit={handleCreate} style={{ display: "grid", gap: 8, maxWidth: 480 }}>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Key (short)" value={key} onChange={(e) => setKey(e.target.value)} />
          <input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />

          {error && <div style={{ color: "red" }}>{error}</div>}

          <button type="submit" disabled={(createMutation as any).isLoading}>{(createMutation as any).isLoading ? "Creating..." : "Create"}</button>
        </form>
      </section>

      <section>
        <h2>Your projects</h2>

        {isLoading && <div>Loading projects...</div>}
        {isError && <div style={{ color: "red" }}>Unable to load projects</div>}

        {data && data.data && Array.isArray(data.data) ? (
          <ul>
            {data.data.map((p: any) => (
              <li key={p.id} style={{ marginBottom: 8 }}>
                <strong>{p.name}</strong> ({p.key})
                <div style={{ fontSize: 13, color: "#666" }}>{p.description}</div>
              </li>
            ))}
          </ul>
        ) : (
          !isLoading && <div>No projects found.</div>
        )}
      </section>
    </div>
  );
};

export default ProjectsPage;
