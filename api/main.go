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
	api.HandleFunc("/portfolio/{username}", GetPortfolio).Methods("GET") // Public portfolio view

	// Authenticated routes
	auth := r.PathPrefix("/api/auth").Subrouter()
	auth.Use(AuthMiddleware)

	// Portfolio routes
	auth.HandleFunc("/portfolio", UpdatePortfolio).Methods("PUT") // Update authenticated user's portfolio

	// Project routes (for authenticated user's portfolio)
	auth.HandleFunc("/portfolio/projects", CreateProject).Methods("POST")
	auth.HandleFunc("/portfolio/projects", GetProjects).Methods("GET")
	auth.HandleFunc("/portfolio/projects/{id}", UpdateProject).Methods("PUT")
	auth.HandleFunc("/portfolio/projects/{id}", DeleteProject).Methods("DELETE")

	// Achievement routes (for authenticated user's portfolio)
	auth.HandleFunc("/portfolio/achievements", CreateAchievement).Methods("POST")
	auth.HandleFunc("/portfolio/achievements", GetAchievements).Methods("GET")
	auth.HandleFunc("/portfolio/achievements/{id}", UpdateAchievement).Methods("PUT")
	auth.HandleFunc("/portfolio/achievements/{id}", DeleteAchievement).Methods("DELETE")

	// User profile routes
	auth.HandleFunc("/user", UpdateUser).Methods("PUT")
	auth.HandleFunc("/user/password", ChangePassword).Methods("PUT")

	// Image upload route
	auth.HandleFunc("/upload", UploadImage).Methods("POST")

	// Serve static files from the "public/uploads" directory
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("./public/uploads"))))

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