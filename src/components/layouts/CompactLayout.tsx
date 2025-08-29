
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

export default function CompactLayout({ portfolio, featuredProjects, otherProjects, handleLike }) {
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
        <div className="space-y-4">
          {featuredProjects.length > 0 ? (
            featuredProjects.map((project) => (
              <div key={project.ID} className="border p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">{project.Title}</h3>
                <div className="text-gray-600 text-sm mb-2" dangerouslySetInnerHTML={renderDescription(project.Description)} />
                {project.Technologies && <p className="text-gray-500 text-xs mb-1">Tech: {project.Technologies}</p>}
                                                {project.Link && <a href={project.Link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm block mb-1">View Project</a>}
                <div className="flex items-center mt-2">
                  <button onClick={() => handleLike(project.ID, project.liked_by_user)} className={`mr-2 ${project.liked_by_user ? 'text-red-500' : 'text-gray-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <span>{project.likes_count}</span>
                </div>
                <div className="flex items-center mt-2">
                  <button onClick={() => handleLike(project.ID, project.liked_by_user)} className={`mr-2 ${project.liked_by_user ? 'text-red-500' : 'text-gray-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <span>{project.likes_count}</span>
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
        <div className="space-y-4">
          {otherProjects.length > 0 ? (
            otherProjects.map((project) => (
              <div key={project.ID} className="border p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">{project.Title}</h3>
                <div className="text-gray-600 text-sm mb-2" dangerouslySetInnerHTML={renderDescription(project.Description)} />
                {project.Technologies && <p className="text-gray-500 text-xs mb-1">Tech: {project.Technologies}</p>}
                                                {project.Link && <a href={project.Link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm block mb-1">View Project</a>}
                <div className="flex items-center mt-2">
                  <button onClick={() => handleLike(project.ID, project.liked_by_user)} className={`mr-2 ${project.liked_by_user ? 'text-red-500' : 'text-gray-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <span>{project.likes_count}</span>
                </div>
                <div className="flex items-center mt-2">
                  <button onClick={() => handleLike(project.ID, project.liked_by_user)} className={`mr-2 ${project.liked_by_user ? 'text-red-500' : 'text-gray-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <span>{project.likes_count}</span>
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
        <div className="space-y-4">
          {portfolio.Achievements.length > 0 ? (
            portfolio.Achievements.map((achievement) => (
              <div key={achievement.ID} className="border p-4 rounded-lg shadow-sm">
                <h3 className="text-xl font-semibold mb-2">{achievement.Title}</h3>
                {achievement.Date && <p className="text-gray-500 text-xs">Date: {new Date(achievement.Date).toLocaleDateString()}</p>}
                <div className="text-gray-600 text-sm" dangerouslySetInnerHTML={renderDescription(achievement.Description)} />
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
