package api

import (
	"encoding/json"
	"net/http"
)

// Project defines the structure for a portfolio project.
// In a real application, this would be stored in a MongoDB collection.
type Project struct {
	ID          string `json:"id,omitempty" bson:"_id,omitempty"`
	Name        string `json:"name" bson:"name"`
	Description string `json:"description" bson:"description"`
	YouTubeURL  string `json:"youtubeURL" bson:"youtubeURL"`
	ImageURL    string `json:"imageURL" bson:"imageURL"`
}

// ProjectsHandler is a Vercel serverless function that handles requests for projects.
func ProjectsHandler(w http.ResponseWriter, r *http.Request) {
	// Set the content type to JSON
	w.Header().Set("Content-Type", "application/json")

	// In a real application, you would connect to MongoDB here.
	// For now, we'll return some dummy data.
	projects := []Project{
		{ID: "1", Name: "Project Alpha", Description: "A project about something.", YouTubeURL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", ImageURL: "/alpha.png"},
		{ID: "2", Name: "Project Beta", Description: "Another project.", YouTubeURL: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", ImageURL: "/beta.png"},
	}

	switch r.Method {
	case http.MethodGet:
		// Get all projects
		json.NewEncoder(w).Encode(projects)
	case http.MethodPost:
		// Create a new project
		// You would parse the request body and save the new project to the database.
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(projects[0]) // Return a dummy project
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
