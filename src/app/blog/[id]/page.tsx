
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { convertFromRaw } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';

interface Post {
  ID: number;
  Title: string;
  Content: string;
  PublishedAt: string;
  UserID: number;
}

const renderContent = (content: string) => {
  try {
    const contentState = convertFromRaw(JSON.parse(content));
    return { __html: stateToHTML(contentState) };
  } catch (e) {
    return { __html: content };
  }
};

export default function BlogPost() {
  const params = useParams();
  const postId = params.id as string;

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    const fetchPost = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch post');
        }
        const data: Post = await response.json();
        setPost(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading post...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center min-h-screen text-red-500">Error: {error}</div>;
  }

  if (!post) {
    return <div className="flex justify-center items-center min-h-screen">Post not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <article className="bg-white shadow-md rounded-lg p-6">
        <h1 className="text-4xl font-bold mb-2">{post.Title}</h1>
        <p className="text-gray-600 text-sm mb-4">Published: {new Date(post.PublishedAt).toLocaleDateString()}</p>
        <div className="prose lg:prose-xl max-w-none" dangerouslySetInnerHTML={renderContent(post.Content)} />
      </article>
    </div>
  );
}
