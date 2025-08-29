
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';
import { useAuth } from '@/context/AuthContext';
import DefaultLayout from '@/components/layouts/DefaultLayout';
import CompactLayout from '@/components/layouts/CompactLayout';
import GridLayout from '@/components/layouts/GridLayout';
import ContactForm from '@/components/ContactForm';

interface Portfolio {
  ID: number;
  Title: string;
  Description: string;
  AboutMe: string;
  ContactInfo: string;
  Projects: Project[];
  Achievements: Achievement[];
  user: User;
}

interface Project {
  ID: number;
  Title: string;
  Description: string;
  Technologies: string;
  Link: string;
  ImageURL: string;
  Featured: boolean;
  likes_count: number;
  liked_by_user: boolean;
}

interface Achievement {
  ID: number;
  Title: string;
  Description: string;
  Date: string;
}

interface User {
  username: string;
  bio: string;
  social_media_links: string;
  profile_picture_url: string;
}

export default function UserProfile() {
  const params = useParams();
  const username = params.username as string;

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState('date-desc');
  const [techFilter, setTechFilter] = useState('');

  useEffect(() => {
    if (!username) return;

    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`/api/portfolio/${username}`);
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio');
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
  }, [username]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  if (!portfolio) {
    return <div className="flex justify-center items-center min-h-screen">This user has not created a portfolio yet.</div>;
  }

  const featuredProjects = portfolio.Projects.filter((p) => p.Featured);
  const otherProjects = portfolio.Projects.filter((p) => !p.Featured)
    .filter(p => p.Technologies.toLowerCase().includes(techFilter.toLowerCase()))
    .sort((a, b) => {
      switch (sortOrder) {
        case 'date-asc':
          return a.ID - b.ID;
        case 'title-asc':
          return a.Title.localeCompare(b.Title);
        case 'title-desc':
          return b.Title.localeCompare(a.Title);
        case 'date-desc':
        default:
          return b.ID - a.ID;
      }
    });

  const { token } = useAuth();

  const handleLike = async (projectId: number, liked: boolean) => {
    if (!token) {
      // Or redirect to login
      alert('You must be logged in to like a project.');
      return;
    }

    const method = liked ? 'DELETE' : 'POST';
    const response = await fetch(`/api/auth/portfolio/projects/${projectId}/like`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      // Update the UI
      setPortfolio(prev => {
        if (!prev) return null;
        const newProjects = prev.Projects.map(p => {
          if (p.ID === projectId) {
            return {
              ...p,
              liked_by_user: !liked,
              likes_count: liked ? p.likes_count - 1 : p.likes_count + 1,
            };
          }
          return p;
        });
        return { ...prev, Projects: newProjects };
      });
    } else {
      alert('Failed to update like status.');
    }
  };

  const handleContactSubmit = async (formData: { name: string; email: string; subject: string; message: string }) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message.');
      }

      alert('Message sent successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };
    <div className="container mx-auto p-4">
      <header className="text-center mb-12">
        {portfolio.user.profile_picture_url && (
          <img src={portfolio.user.profile_picture_url} alt={portfolio.user.username} className="w-32 h-32 rounded-full mx-auto mb-4" />
        )}
        <h1 className="text-5xl font-bold mb-2">{portfolio.Title}</h1>
        <p className="text-xl text-gray-600">{portfolio.Description}</p>
        {portfolio.user.bio && <p className="text-lg text-gray-800 mt-4">{portfolio.user.bio}</p>}
        {portfolio.user.social_media_links && (
          <div className="flex justify-center space-x-4 mt-4">
            {portfolio.user.social_media_links.split(',').map((link, index) => {
              const url = link.trim();
              return (
                <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  {url}
                </a>
              );
            })}
          </div>
        )}
      </header>

      {portfolio.Layout === 'compact' && <CompactLayout portfolio={portfolio} featuredProjects={featuredProjects} otherProjects={otherProjects} handleLike={handleLike} />}
      {portfolio.Layout === 'grid' && <GridLayout portfolio={portfolio} featuredProjects={featuredProjects} otherProjects={otherProjects} handleLike={handleLike} />}
      {portfolio.Layout !== 'compact' && portfolio.Layout !== 'grid' && <DefaultLayout portfolio={portfolio} featuredProjects={featuredProjects} otherProjects={otherProjects} handleLike={handleLike} />}

      <ContactForm onSubmit={handleContactSubmit} />

      <footer className="text-center mt-12 py-6 border-t">
        <p className="text-gray-600">{portfolio.ContactInfo}</p>
      </footer>
    </div>
  );
}
