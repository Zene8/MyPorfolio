'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

interface Project {
  ID: number;
  Title: string;
  Description: string;
}

export default function UserPortfolio() {
  const params = useParams();
  const username = params.username as string;
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (username) {
      axios
        .get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${username}/projects`)
        .then((response) => setProjects(response.data))
        .catch(() => setError('User not found'));
    }
  }, [username]);

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h1>{username}'s Portfolio</h1>
      {projects.map((project) => (
        <div key={project.ID}>
          <h2>{project.Title}</h2>
          <p>{project.Description}</p>
        </div>
      ))}
    </div>
  );
}
