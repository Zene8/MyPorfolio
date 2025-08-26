async function getAbout() {
  const res = await fetch('http://localhost:3000/api/about', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error('Failed to fetch about info');
  }
  return res.json();
}

export default async function AboutPage() {
  const about = await getAbout();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{about.name}</h1>
      <h2 className="text-2xl text-gray-600 mb-8">{about.title}</h2>
      <p className="text-lg">{about.bio}</p>
    </div>
  );
}
