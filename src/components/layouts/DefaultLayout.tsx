
import { stateToHTML } from 'draft-js-export-html';
import { convertFromRaw } from 'draft-js';

const renderDescription = (description: string) => {
  try {
    const contentState = convertFromRaw(JSON.parse(description));
    return { __html: stateToHTML(contentState) };
  } catch (e) {
    return { __html: description };
  }
};

export default function DefaultLayout({ portfolio, featuredProjects, otherProjects, handleLike }) {
  return (
    <main>
      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 border-b-2 pb-2">About Me</h2>
        <div className="prose lg:prose-xl max-w-none">
          {portfolio.AboutMe ? (
            <div dangerouslySetInnerHTML={renderDescription(portfolio.AboutMe)} />
          ) : (
            <p>This user has not written an "About Me" section yet.</p>
          )}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 border-b-2 pb-2">Featured Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredProjects.length > 0 ? (
            featuredProjects.map((project) => (
              <div key={project.ID} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                {project.ImageURL && <img src={project.ImageURL} alt={project.Title} className="w-full h-56 object-cover" />}
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{project.Title}</h3>
                  <div className="text-gray-700 mb-4" dangerouslySetInnerHTML={renderDescription(project.Description)} />
                  {project.Technologies && (
                    <div className="mb-4">
                      <h4 className="font-semibold">Technologies Used:</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {project.Technologies.split(',').map((tech, index) => (
                          <span key={index} className="bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.Link && (
                    <a href={project.Link} target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                      View Project
                    </a>
                  )}
                  <div className="flex items-center mt-4">
                    <button onClick={() => handleLike(project.ID, project.liked_by_user)} className={`mr-2 ${project.liked_by_user ? 'text-red-500' : 'text-gray-500'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <span>{project.likes_count}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No featured projects to display.</p>
          )}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-semibold mb-6 border-b-2 pb-2">All Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {otherProjects.length > 0 ? (
            otherProjects.map((project) => (
              <div key={project.ID} className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
                {project.ImageURL && <img src={project.ImageURL} alt={project.Title} className="w-full h-56 object-cover" />}
                <div className="p-6">
                  <h3 className="text-2xl font-bold mb-2">{project.Title}</h3>
                  <div className="text-gray-700 mb-4" dangerouslySetInnerHTML={renderDescription(project.Description)} />
                  {project.Technologies && (
                    <div className="mb-4">
                      <h4 className="font-semibold">Technologies Used:</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {project.Technologies.split(',').map((tech, index) => (
                          <span key={index} className="bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700">
                            {tech.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {project.Link && (
                    <a href={project.Link} target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                      View Project
                    </a>
                  )}
                  <div className="flex items-center mt-4">
                    <button onClick={() => handleLike(project.ID, project.liked_by_user)} className={`mr-2 ${project.liked_by_user ? 'text-red-500' : 'text-gray-500'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    <span>{project.likes_count}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p>No other projects to display.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-semibold mb-6 border-b-2 pb-2">Achievements</h2>
        <div className="space-y-6">
          {portfolio.Achievements.length > 0 ? (
            portfolio.Achievements.map((achievement) => (
              <div key={achievement.ID} className="p-6 bg-white rounded-lg shadow-md">
                <h3 className="text-2xl font-bold">{achievement.Title}</h3>
                {achievement.Date && (
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(achievement.Date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
                <div className="text-gray-700" dangerouslySetInnerHTML={renderDescription(achievement.Description)} />
              </div>
            ))
          ) : (
            <p>No achievements to display.</p>
          )}
        </div>
      </section>
    </main>
  );
}
