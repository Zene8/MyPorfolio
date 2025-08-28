'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

interface Portfolio {
  ID: number;
  Title: string;
  Description: string;
  AboutMe: string;
  ContactInfo: string;
  Projects: Project[];
  Achievements: Achievement[];
}

interface Project {
  ID: number;
  Title: string;
  Description: string;
  Technologies: string;
  Link: string;
  ImageURL: string;
}

interface Achievement {
  ID: number;
  Title: string;
  Description: string;
  Date: string; // Assuming ISO string format from backend
}

export default function UserPortfolio() {
  const params = useParams();
  const username = params.username as string;

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (username) {
      const fetchPortfolio = async () => {
        try {
          const response = await fetch(`/api/portfolio/${username}`);
          if (!response.ok) {
            throw new Error('Portfolio not found');
          }
          const data: Portfolio = await response.json();
          setPortfolio(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchPortfolio();
    }
  }, [username]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading portfolio...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  if (!portfolio) {
    return <div className="flex justify-center items-center min-h-screen">No portfolio found for this user.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">{portfolio.Title || `${username}'s Portfolio`}</h1>
        <p className="text-xl text-gray-600">{portfolio.Description}</p>
      </header>

      <section className="bg-white shadow-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">About Me</h2>
        <div className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: portfolio.AboutMe || 'No information provided.' }} />
      </section>

      {portfolio.Projects.length > 0 && (
        <section className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Projects</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.Projects.map((project) => (
              <div key={project.ID} className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {project.ImageURL && (
                  <img src={project.ImageURL} alt={project.Title} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{project.Title}</h3>
                  <div className="text-gray-600 text-sm mb-3" dangerouslySetInnerHTML={{ __html: project.Description || '' }} />
                  {project.Technologies && (
                    <p className="text-gray-500 text-xs mb-3">
                      <strong>Technologies:</strong> {project.Technologies}
                    </p>
                  )}
                  {project.Link && (
                    <a
                      href={project.Link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded-md transition duration-300"
                    >
                      View Project
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {portfolio.Achievements.length > 0 && (
        <section className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.Achievements.map((achievement) => (
              <div key={achievement.ID} className="border border-gray-200 rounded-lg shadow-sm p-4">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{achievement.Title}</h3>
                <div className="text-gray-600 text-sm mb-2" dangerouslySetInnerHTML={{ __html: achievement.Description || '' }} />
                {achievement.Date && (
                  <p className="text-gray-500 text-xs">
                    <strong>Date:</strong> {new Date(achievement.Date).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {portfolio.ContactInfo && (
        <section className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Contact Information</h2>
          <p className="text-gray-700">{portfolio.ContactInfo}</p>
        </section>
      )}
    </div>
  );
}