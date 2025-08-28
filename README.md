# Portfolio

A personal portfolio website.

## Project Description

This project is a personal portfolio website built with a Next.js frontend and a Go backend. The frontend is a modern, single-page application that showcases personal projects and information. The backend provides a simple API to serve project data.

## Tech Stack

*   **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
*   **Backend:** Go 1.19

## Development Environment Setup

This project uses Docker Compose to run the backend and database in a containerized environment.

### Prerequisites

*   Node.js
*   Docker and Docker Compose

### Instructions

1.  **Backend and Database:**
    *   Navigate to the `api` directory and create a `.env` file from the `.env.example`.
    *   From the root of the `portfolio` directory, run:
        ```bash
        docker-compose up --build
        ```
    *   The backend API will be available at `http://localhost:8080`.

2.  **Frontend:**
    *   In a separate terminal, navigate to the `portfolio` directory.
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   Run the development server:
        ```bash
        npm run dev
        ```
    *   The frontend will be available at `http://localhost:3000`.

## Deployment

### Backend

The backend is a containerized Go application and can be deployed to any cloud provider that supports Docker (e.g., AWS, Google Cloud, Heroku).

1.  **Set up a server:** Provision a virtual machine on a cloud provider of your choice.
2.  **Install Docker and Docker Compose:** Follow the instructions for your chosen OS.
3.  **Set up a managed database:** For production, it is recommended to use a managed PostgreSQL database service (e.g., AWS RDS, Google Cloud SQL).
4.  **Configure environment variables:** Create a `.env` file in the `api` directory on your server with the following variables:
    *   `DATABASE_URL`: The connection string for your managed database.
    *   `JWT_SECRET`: A strong, secret key for signing JWTs.
5.  **Run the application:**
    *   Copy the `docker-compose.yml` file and the `api` directory to your server.
    *   Run the following command:
        ```bash
        docker-compose up -d --build
        ```

### Frontend (Vercel)

1.  **Push to a Git repository:** Push your project to a GitHub, GitLab, or Bitbucket repository.
2.  **Import project on Vercel:**
    *   Sign up for a Vercel account.
    *   From the Vercel dashboard, click "Add New..." -> "Project".
    *   Import your Git repository.
3.  **Configure environment variables:**
    *   In the project settings on Vercel, add the following environment variable:
        *   `NEXT_PUBLIC_API_URL`: The URL of your deployed backend API (e.g., `http://your-backend-domain.com`).
4.  **Deploy:** Click the "Deploy" button. Vercel will automatically build and deploy your Next.js application.

## Future Development

*   **Add more projects:** Populate the portfolio with more projects and detailed descriptions.
*   **Contact Form:** Implement a contact form with email notifications.
*   **Blog Section:** Add a blog to share articles and tutorials.
*   **CMS Integration:** Integrate a headless CMS to manage project and blog content.
*   **Improve Styling:** Enhance the visual design and user experience.
*   **Add Tests:** Implement comprehensive testing for both frontend and backend.