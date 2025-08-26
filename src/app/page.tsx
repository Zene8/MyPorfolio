import ProjectCard from '@/components/ProjectCard';

async function getProjects() {
  // This will be replaced with a fetch to the Go API
  // For now, we use the dummy data from the Go backend
  const res = await fetch('http://localhost:3000/api/projects', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch projects');
  }
  return res.json();
}

export default async function Home() {
  const projects = await getProjects();

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">My Portfolio</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project: any) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </main>
  );
}