import Link from 'next/link';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-4xl font-bold mb-8">Welcome to the Multi-User Portfolio Platform</h1>
      <p className="mb-4">Showcase your projects and discover others'.</p>
      <div className="space-x-4">
        <Link href="/auth/signup" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Sign Up
        </Link>
        <Link href="/auth/login" className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
          Login
        </Link>
      </div>
    </main>
  );
}
