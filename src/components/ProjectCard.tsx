import Image from 'next/image';

const ProjectCard = ({ project }: { project: any }) => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-lg">
      <Image src={project.imageURL} alt={project.name} width={500} height={300} className="w-full h-48 object-cover" />
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">{project.name}</h2>
        <p className="text-gray-700 mb-4">{project.description}</p>
        <a href={project.youtubeURL} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
          Watch Demo
        </a>
      </div>
    </div>
  );
};

export default ProjectCard;
