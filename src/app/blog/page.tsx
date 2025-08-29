
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Post {
  ID: number;
  Title: string;
  Content: string;
  PublishedAt: string;
  UserID: number;
}

export default function BlogList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch('/api/posts');
        if (!response.ok) {
          throw new Error('Failed to fetch posts');
        }
        const data: Post[] = await response.json();
        setPosts(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading posts...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Blog Posts</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.length === 0 ? (
          <p className="col-span-full text-center">No blog posts yet.</p>
        ) : (
          posts.map((post) => (
            <div key={post.ID} className="bg-white shadow-md rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-2">{post.Title}</h2>
              <p className="text-gray-600 text-sm mb-4">Published: {new Date(post.PublishedAt).toLocaleDateString()}</p>
              <p className="text-gray-700 mb-4 line-clamp-3">{post.Content}</p>
              <Link href={`/blog/${post.ID}`} className="text-blue-500 hover:underline">
                Read More
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
