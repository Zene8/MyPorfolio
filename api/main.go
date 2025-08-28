package main

import (
	"log"
	"net/http"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("Error loading .env file, using environment variables")
	}

	// Initialize database
	ConnectDB()

	// Initialize router
	r := mux.NewRouter()

	// API routes
	// Public routes
	api := r.PathPrefix("/api").Subrouter()
	api.HandleFunc("/register", RegisterUser).Methods("POST")
	api.HandleFunc("/login", LoginUser).Methods("POST")
	api.HandleFunc("/users/{username}/projects", GetUserProjects).Methods("GET")

	// Authenticated routes
	auth := r.PathPrefix("/api/auth").Subrouter()
	auth.Use(AuthMiddleware)
	auth.HandleFunc("/projects", GetProjects).Methods("GET")
	auth.HandleFunc("/projects", CreateProject).Methods("POST")
	auth.HandleFunc("/projects/{id}", UpdateProject).Methods("PUT")
	auth.HandleFunc("/projects/{id}", DeleteProject).Methods("DELETE")

	// CORS headers
	headers := handlers.AllowedHeaders([]string{"X-Requested-With", "Content-Type", "Authorization"})
	methods := handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE"})
	origins := handlers.AllowedOrigins([]string{"*"}) // Replace with your frontend URL in production

	// Start server
	log.Println("Starting server on :8080")
	if err := http.ListenAndServe(":8080", handlers.CORS(headers, methods, origins)(r)); err != nil {
		log.Fatal(err)
	}
}
