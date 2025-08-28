package main

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
)

// Helper function to get user from context
func getUserFromContext(r *http.Request) (*User, error) {
	username := r.Context().Value("username").(string)
	var user User
	if result := DB.Where("username = ?", username).First(&user); result.Error != nil {
		return nil, result.Error
	}
	return &user, nil
}

// RegisterUser handles user registration.
func RegisterUser(w http.ResponseWriter, r *http.Request) {
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	hashedPassword, err := HashPassword(user.Password)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	user.Password = hashedPassword

	if result := DB.Create(&user); result.Error != nil {
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": result.Error.Error()})
		return
	}

	w.WriteHeader(http.StatusCreated)
}

// LoginUser handles user login.
func LoginUser(w http.ResponseWriter, r *http.Request) {
	var creds User
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var user User
	if result := DB.Where("username = ?", creds.Username).First(&user); result.Error != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	if !CheckPasswordHash(creds.Password, user.Password) {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	token, err := GenerateJWT(user.Username)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"token": token,
	})
}

// GetProjects handles getting all projects for a user.
func GetProjects(w http.ResponseWriter, r *http.Request) {
	user, err := getUserFromContext(r)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var projects []Project
	if result := DB.Where("user_id = ?", user.ID).Find(&projects); result.Error != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(projects)
}

// CreateProject handles creating a new project.
func CreateProject(w http.ResponseWriter, r *http.Request) {
	user, err := getUserFromContext(r)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	var project Project
	err = json.NewDecoder(r.Body).Decode(&project)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	project.UserID = user.ID
	if result := DB.Create(&project); result.Error != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(project)
}

// UpdateProject handles updating a project.
func UpdateProject(w http.ResponseWriter, r *http.Request) {
	user, err := getUserFromContext(r)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	projectID := vars["id"]

	var project Project
	if result := DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project); result.Error != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	var updatedProject Project
	err = json.NewDecoder(r.Body).Decode(&updatedProject)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	project.Title = updatedProject.Title
	project.Description = updatedProject.Description
	DB.Save(&project)

	json.NewEncoder(w).Encode(project)
}

// DeleteProject handles deleting a project.
func DeleteProject(w http.ResponseWriter, r *http.Request) {
	user, err := getUserFromContext(r)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	projectID := vars["id"]

	var project Project
	if result := DB.Where("id = ? AND user_id = ?", projectID, user.ID).First(&project); result.Error != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	DB.Delete(&project)
	w.WriteHeader(http.StatusNoContent)
}

// GetUserProjects handles getting all projects for a specific user (public).
func GetUserProjects(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]

	var user User
	if result := DB.Where("username = ?", username).First(&user); result.Error != nil {
		w.WriteHeader(http.StatusNotFound)
		return
	}

	var projects []Project
	if result := DB.Where("user_id = ?", user.ID).Find(&projects); result.Error != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(projects)
}
