'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';

interface Project {
  ID: number;
  Title: string;
  Description: string;
}

export default function Dashboard() {
  const { token, logout } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProject, setNewProject] = useState({ title: '', description: '' });

  useEffect(() => {
    if (token) {
      axios
        .get('/api/auth/projects', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => setProjects(response.data))
        .catch((error) => console.error('Failed to fetch projects', error));
    }
  }, [token]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        '/api/auth/projects',
        { Title: newProject.title, Description: newProject.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProjects([...projects, response.data]);
      setNewProject({ title: '', description: '' });
    } catch (error) {
      console.error('Failed to create project', error);
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(projects.filter((p) => p.ID !== id));
    } catch (error) {
      console.error('Failed to delete project', error);
    }
  };

  if (!token) {
    return <p>Please log in to view your dashboard.</p>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={logout}>Logout</button>

      <h2>Your Projects</h2>
      <ul>
        {projects.map((project) => (
          <li key={project.ID}>
            <h3>{project.Title}</h3>
            <p>{project.Description}</p>
            <button onClick={() => handleDeleteProject(project.ID)}>Delete</button>
          </li>
        ))}
      </ul>

      <h2>Create New Project</h2>
      <form onSubmit={handleCreateProject}>
        <input
          type="text"
          placeholder="Title"
          value={newProject.title}
          onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
        />
        <textarea
          placeholder="Description"
          value={newProject.description}
          onChange={(e) =>
            setNewProject({ ...newProject, description: e.target.value })
          }
        />
        <button type="submit">Create</button>
      </form>
    </div>
  );
}
