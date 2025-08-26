package api

import (
	"encoding/json"
	"net/http"
)

// About defines the structure for the About Me page content.
// This would be stored in a MongoDB collection.
type About struct {
	Name  string `json:"name" bson:"name"`
	Title string `json:"title" bson:"title"`
	Bio   string `json:"bio" bson:"bio"`
}

// AboutHandler is a Vercel serverless function that handles requests for the About Me page.
func AboutHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Dummy data
	about := About{
		Name:  "Nath",
		Title: "Full Stack Developer",
		Bio:   "I'm a passionate developer who loves building things with Next.js and Go. I'm excited to share my work with you.",
	}

	switch r.Method {
	case http.MethodGet:
		json.NewEncoder(w).Encode(about)
	case http.MethodPut:
		// You would parse the request body and update the about info in the database.
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(about)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
