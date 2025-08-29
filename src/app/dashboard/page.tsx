'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { EditorState, ContentState, convertToRaw, convertFromRaw } from 'draft-js';
import RichTextEditor from '@/components/RichTextEditor';
import { useTheme } from '@/context/ThemeContext';

interface Portfolio {
  ID: number;
  Title: string;
  Description: string;
  AboutMe: string;
  ContactInfo: string;
  Layout: string;
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
  Featured: boolean;
  ImageFile?: File; // Optional: for file upload
}

interface Achievement {
  ID: number;
  Title: string;
  Description: string;
  Date: string; // Assuming ISO string format from backend
}

interface Post {
  ID: number;
  Title: string;
  Content: string;
  PublishedAt: string;
  UserID: number;
}

export default function Dashboard() {
  const { token, user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editPortfolio, setEditPortfolio] = useState(false);
  const [newPortfolioData, setNewPortfolioData] = useState<Partial<Portfolio>>({});

  const [showAddProjectForm, setShowAddProjectForm] = useState(false);
  const [newProjectData, setNewProjectData] = useState<Partial<Project>>({
    Title: '',
    Description: '',
    Technologies: '',
    Link: '',
    ImageURL: '',
  });

  const [showAddAchievementForm, setShowAddAchievementForm] = useState(false);
  const [newAchievementData, setNewAchievementData] = useState<Partial<Achievement>>({
    Title: '',
    Description: '',
    Date: '',
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [showAddPostForm, setShowAddPostForm] = useState(false);
  const [newPostData, setNewPostData] = useState<Partial<Post>>({
    Title: '',
    Content: '',
  });
  const [postContentEditorState, setPostContentEditorState] = useState(() => EditorState.createEmpty());
  const [aboutMeEditorState, setAboutMeEditorState] = useState(() => EditorState.createEmpty());
  const [projectDescriptionEditorState, setProjectDescriptionEditorState] = useState(() => EditorState.createEmpty());
  const [achievementDescriptionEditorState, setAchievementDescriptionEditorState] = useState(() => EditorState.createEmpty());
  const [sortOrder, setSortOrder] = useState('date-desc');
  const [techFilter, setTechFilter] = useState('');

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchPortfolio = async () => {
      try {
        const response = await fetch(`/api/portfolio/${user?.username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio');
        }
        const data: Portfolio = await response.json();
        setPortfolio(data);
        setNewPortfolioData(data); // Initialize form with current data
        if (data.AboutMe) {
          try {
            const contentState = convertFromRaw(JSON.parse(data.AboutMe));
            setAboutMeEditorState(EditorState.createWithContent(contentState));
          } catch (e) {
            setAboutMeEditorState(EditorState.createWithContent(ContentState.createFromText(data.AboutMe)));
          }
        }

        // Fetch posts for the authenticated user
        const postsResponse = await fetch('/api/auth/posts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!postsResponse.ok) {
          throw new Error('Failed to fetch posts');
        }
        const postsData: Post[] = await postsResponse.json();
        setPosts(postsData);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [token, user, router]);

  const handleUpdatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const aboutMeContent = JSON.stringify(convertToRaw(aboutMeEditorState.getCurrentContent()));
      const response = await fetch('/api/auth/portfolio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newPortfolioData, AboutMe: aboutMeContent }),
      });
      if (!response.ok) {
        throw new Error('Failed to update portfolio');
      }
      const updatedData: Portfolio = await response.json();
      setPortfolio(updatedData);
      setEditPortfolio(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      let imageUrl = newProjectData.ImageURL;

      if (newProjectData.ImageFile) {
        const formData = new FormData();
        formData.append('image', newProjectData.ImageFile);

        const uploadResponse = await fetch('/api/auth/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.error || 'Failed to upload image');
        }
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.image_url;
      }

      const descriptionContent = JSON.stringify(convertToRaw(projectDescriptionEditorState.getCurrentContent()));

      const projectToCreate = {
        Title: newProjectData.Title,
        Description: descriptionContent,
        Technologies: newProjectData.Technologies,
        Link: newProjectData.Link,
        ImageURL: imageUrl, // Use the uploaded image URL or existing one
        Featured: newProjectData.Featured,
      };

      const response = await fetch('/api/auth/portfolio/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(projectToCreate),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create project');
      }
      const createdProject: Project = await response.json();
      setPortfolio((prev) => {
        if (!prev) return null;
        return { ...prev, Projects: [...prev.Projects, createdProject] };
      });
      setNewProjectData({ Title: '', Description: '', Technologies: '', Link: '', ImageURL: '', ImageFile: undefined });
      setShowAddProjectForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    setError(null);
    try {
      const response = await fetch(`/api/auth/portfolio/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete project');
      }
      setPortfolio((prev) => {
        if (!prev) return null;
        return { ...prev, Projects: prev.Projects.filter((p) => p.ID !== projectId) };
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const descriptionContent = JSON.stringify(convertToRaw(achievementDescriptionEditorState.getCurrentContent()));
      const response = await fetch('/api/auth/portfolio/achievements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...newAchievementData, Description: descriptionContent }),
      });
      if (!response.ok) {
        throw new Error('Failed to create achievement');
      }
      const createdAchievement: Achievement = await response.json();
      setPortfolio((prev) => {
        if (!prev) return null;
        return { ...prev, Achievements: [...prev.Achievements, createdAchievement] };
      });
      setNewAchievementData({ Title: '', Description: '', Date: '' });
      setAchievementDescriptionEditorState(EditorState.createEmpty());
      setShowAddAchievementForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAchievement = async (achievementId: number) => {
    setError(null);
    try {
      const response = await fetch(`/api/auth/portfolio/achievements/${achievementId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete achievement');
      }
      setPortfolio((prev) => {
        if (!prev) return null;
        return { ...prev, Achievements: prev.Achievements.filter((a) => a.ID !== achievementId) };
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const content = JSON.stringify(convertToRaw(postContentEditorState.getCurrentContent()));
      const postToCreate = {
        Title: newPostData.Title,
        Content: content,
      };

      const response = await fetch('/api/auth/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(postToCreate),
      });
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      const createdPost: Post = await response.json();
      setPosts((prev) => [...prev, createdPost]);
      setNewPostData({ Title: '', Content: '' });
      setPostContentEditorState(EditorState.createEmpty());
      setShowAddPostForm(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeletePost = async (postId: number) => {
    setError(null);
    try {
      const response = await fetch(`/api/auth/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to delete post');
      }
      setPosts((prev) => prev.filter((post) => post.ID !== postId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  if (!portfolio) {
    return <div className="flex justify-center items-center min-h-screen">No portfolio found.</div>;
  }

  const sortedAndFilteredProjects = portfolio.Projects
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Welcome, {user?.username}!</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push('/dashboard/profile')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Profile Settings
          </button>
          <button
            onClick={() => router.push(`/users/${user?.username}`)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            View Public Profile
          </button>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Portfolio Details */}
      <section className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Your Portfolio</h2>
        {editPortfolio ? (
          <form onSubmit={handleUpdatePortfolio} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={newPortfolioData.Title || ''}
                onChange={(e) => setNewPortfolioData({ ...newPortfolioData, Title: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                value={newPortfolioData.Description || ''}
                onChange={(e) => setNewPortfolioData({ ...newPortfolioData, Description: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                rows={3}
              ></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">About Me</label>
              <RichTextEditor
                editorState={aboutMeEditorState}
                onChange={setAboutMeEditorState}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contact Info</label>
              <input
                type="text"
                value={newPortfolioData.ContactInfo || ''}
                onChange={(e) => setNewPortfolioData({ ...newPortfolioData, ContactInfo: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Layout</label>
              <select
                value={newPortfolioData.Layout || 'default'}
                onChange={(e) => setNewPortfolioData({ ...newPortfolioData, Layout: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="default">Default</option>
                <option value="compact">Compact</option>
                <option value="grid">Grid</option>
              </select>
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Save Portfolio
              </button>
              <button
                type="button"
                onClick={() => setEditPortfolio(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p><strong>Title:</strong> {portfolio.Title}</p>
            <p><strong>Description:</strong> {portfolio.Description}</p>
            <p><strong>About Me:</strong> {portfolio.AboutMe || 'Not set'}</p>
            <p><strong>Contact Info:</strong> {portfolio.ContactInfo || 'Not set'}</p>
            <div>
              <label className="block text-sm font-medium text-gray-700">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <button
              onClick={() => setEditPortfolio(true)}
              className="mt-4 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Edit Portfolio
            </button>
          </div>
        )}
      </section>

      {/* Projects Section */}
      <section className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Your Projects</h2>
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Filter by technology"
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div className="flex items-center space-x-4">
              <label htmlFor="sort-order" className="text-sm font-medium text-gray-700">Sort by:</label>
              <select
                id="sort-order"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm p-2"
              >
                <option value="date-desc">Date Added (Newest)</option>
                <option value="date-asc">Date Added (Oldest)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>
            </div>
          </div>
        <button
          onClick={() => setShowAddProjectForm(!showAddProjectForm)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          {showAddProjectForm ? 'Cancel Add Project' : 'Add New Project'}
        </button>

        {showAddProjectForm && (
          <form onSubmit={handleCreateProject} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={newProjectData.Title || ''}
                onChange={(e) => setNewProjectData({ ...newProjectData, Title: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <RichTextEditor
                editorState={projectDescriptionEditorState}
                onChange={setProjectDescriptionEditorState}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Technologies (comma-separated)</label>
              <input
                type="text"
                value={newProjectData.Technologies || ''}
                onChange={(e) => setNewProjectData({ ...newProjectData, Technologies: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Link</label>
              <input
                type="url"
                value={newProjectData.Link || ''}
                onChange={(e) => setNewProjectData({ ...newProjectData, Link: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Image Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setNewProjectData({ ...newProjectData, ImageFile: e.target.files[0] });
                  }
                }}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            <div className="flex items-center">
              <input
                id="featured"
                name="featured"
                type="checkbox"
                checked={newProjectData.Featured || false}
                onChange={(e) => setNewProjectData({ ...newProjectData, Featured: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="featured" className="ml-2 block text-sm text-gray-900">
                Featured Project
              </label>
            </div>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Create Project
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAndFilteredProjects.length === 0 ? (
            <p>No projects added yet.</p>
          ) : (
            sortedAndFilteredProjects.map((project) => (
              <div key={project.ID} className="border p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">{project.Title}</h3>
                <p className="text-gray-600 text-sm mb-2">{project.Description}</p>
                {project.Technologies && <p className="text-gray-500 text-xs mb-1">Tech: {project.Technologies}</p>}
                {project.Link && <a href={project.Link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm block mb-1">View Project</a>}
                {project.ImageURL && <img src={project.ImageURL} alt={project.Title} className="w-full h-32 object-cover rounded-md mb-2" />}
                <button
                  onClick={() => handleDeleteProject(project.ID)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Achievements Section */}
      <section className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Your Achievements</h2>
        <button
          onClick={() => setShowAddAchievementForm(!showAddAchievementForm)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          {showAddAchievementForm ? 'Cancel Add Achievement' : 'Add New Achievement'}
        </button>

        {showAddAchievementForm && (
          <form onSubmit={handleCreateAchievement} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={newAchievementData.Title || ''}
                onChange={(e) => setNewAchievementData({ ...newAchievementData, Title: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <RichTextEditor
                editorState={achievementDescriptionEditorState}
                onChange={setAchievementDescriptionEditorState}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={newAchievementData.Date || ''}
                onChange={(e) => setNewAchievementData({ ...newAchievementData, Date: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Create Achievement
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolio.Achievements.length === 0 ? (
            <p>No achievements added yet.</p>
          ) : (
            portfolio.Achievements.map((achievement) => (
              <div key={achievement.ID} className="border p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">{achievement.Title}</h3>
                <p className="text-gray-600 text-sm mb-2">{achievement.Description}</p>
                {achievement.Date && <p className="text-gray-500 text-xs">Date: {new Date(achievement.Date).toLocaleDateString()}</p>}
                <button
                  onClick={() => handleDeleteAchievement(achievement.ID)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm mt-2"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Blog Posts Section */}
      <section className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Your Blog Posts</h2>
        <button
          onClick={() => setShowAddPostForm(!showAddPostForm)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          {showAddPostForm ? 'Cancel Add Post' : 'Add New Post'}
        </button>

        {showAddPostForm && (
          <form onSubmit={handleCreatePost} className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={newPostData.Title || ''}
                onChange={(e) => setNewPostData({ ...newPostData, Title: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Content</label>
              <RichTextEditor
                editorState={postContentEditorState}
                onChange={setPostContentEditorState}
              />
            </div>
            <button
              type="submit"
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Create Post
            </button>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.length === 0 ? (
            <p>No blog posts added yet.</p>
          ) : (
            posts.map((post) => (
              <div key={post.ID} className="border p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">{post.Title}</h3>
                <p className="text-gray-600 text-sm mb-2">{new Date(post.PublishedAt).toLocaleDateString()}</p>
                <button
                  onClick={() => handleDeletePost(post.ID)}
                  className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm mt-2"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}