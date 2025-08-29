package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"io"
	"os"
	"path/filepath"

	"github.com/gorilla/mux"
	"github.com/google/uuid"
)

// getUserIDFromContext retrieves the UserID from the request context.
func getUserIDFromContext(r *http.Request) (uint, error) {
	userID, ok := r.Context().Value("userID").(uint)
	if !ok {
		return 0, http.ErrMissingHeader // Or a custom error
	}
	return userID, nil
}

// RegisterUser handles user registration.
func RegisterUser(w http.ResponseWriter, r *http.Request) {
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	hashedPassword, err := HashPassword(user.Password)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}
	user.Password = hashedPassword

	if result := DB.Create(&user); result.Error != nil {
		http.Error(w, result.Error.Error(), http.StatusInternalServerError)
		return
	}

	// Create an empty portfolio for the new user
	portfolio := Portfolio{
		UserID:      user.ID,
		Title:       user.Username + "'s Portfolio",
		Description: "A place to showcase my work.",
	}
	if result := DB.Create(&portfolio); result.Error != nil {
		// Log the error but don't fail registration, as portfolio can be created later
		// In a real app, you might want to handle this more robustly (e.g., retry, queue)
		// For now, we'll just log it.
		// log.Printf("Failed to create portfolio for user %d: %v", user.ID, result.Error)
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
}

// LoginUser handles user login.
func LoginUser(w http.ResponseWriter, r *http.Request) {
	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	var user User
	if result := DB.Where("username = ?", creds.Username).First(&user); result.Error != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if !CheckPasswordHash(creds.Password, user.Password) {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token, err := GenerateJWT(user.ID, user.Username)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"token": token,
	})
}

// GetPortfolio handles getting a user's public portfolio by username.

type PublicPortfolio struct {
	Portfolio
	User PublicUser `json:"user"`
	Projects []PublicProject `json:"projects"`
}

type PublicProject struct {
	Project
	LikesCount int64 `json:"likes_count"`
	LikedByUser bool `json:"liked_by_user"`
}

type PublicUser struct {
	Username string `json:"username"`
	Bio string `json:"bio"`
	SocialMediaLinks string `json:"social_media_links"`
	ProfilePictureURL string `json:"profile_picture_url"`
}

func GetPortfolio(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	username := vars["username"]
	currentUserID, _ := getUserIDFromContext(r)

	var user User
	if result := DB.Where("username = ?", username).First(&user); result.Error != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	var portfolio Portfolio
	if result := DB.Preload("Projects.Likes").Preload("Achievements").Where("user_id = ?", user.ID).First(&portfolio); result.Error != nil {
		http.Error(w, "Portfolio not found", http.StatusNotFound)
		return
	}

	publicProjects := make([]PublicProject, len(portfolio.Projects))
	for i, p := range portfolio.Projects {
		publicProjects[i] = PublicProject{
			Project: p,
			LikesCount: int64(len(p.Likes)),
			LikedByUser: false, // Default to false
		}
		for _, like := range p.Likes {
			if like.UserID == currentUserID {
				publicProjects[i].LikedByUser = true
				break
			}
		}
	}

	publicPortfolio := PublicPortfolio{
		Portfolio: portfolio,
		User: PublicUser{
			Username: user.Username,
			Bio: user.Bio,
			SocialMediaLinks: user.SocialMediaLinks,
			ProfilePictureURL: user.ProfilePictureURL,
		},
		Projects: publicProjects,
	}

	json.NewEncoder(w).Encode(publicPortfolio)
}

// UpdatePortfolio handles updating the authenticated user's portfolio.
func UpdatePortfolio(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var updatedPortfolio Portfolio
	err = json.NewDecoder(r.Body).Decode(&updatedPortfolio)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	var portfolio Portfolio
	if result := DB.Where("user_id = ?", userID).First(&portfolio); result.Error != nil {
		http.Error(w, "Portfolio not found", http.StatusNotFound)
		return
	}

	// Update fields that are allowed to be updated
	portfolio.Title = updatedPortfolio.Title
	portfolio.Description = updatedPortfolio.Description
	portfolio.AboutMe = updatedPortfolio.AboutMe
	portfolio.ContactInfo = updatedPortfolio.ContactInfo
	portfolio.Layout = updatedPortfolio.Layout

	if result := DB.Save(&portfolio); result.Error != nil {
		http.Error(w, "Failed to update portfolio", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(portfolio)
}

// CreateProject handles creating a new project for the authenticated user's portfolio.
func CreateProject(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var portfolio Portfolio
	if result := DB.Where("user_id = ?", userID).First(&portfolio); result.Error != nil {
		http.Error(w, "Portfolio not found for user", http.StatusNotFound)
		return
	}

	var project Project
	err = json.NewDecoder(r.Body).Decode(&project)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	project.PortfolioID = portfolio.ID
	if result := DB.Create(&project); result.Error != nil {
		http.Error(w, "Failed to create project", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(project)
}

// GetProjects handles getting all projects for the authenticated user's portfolio.
func GetProjects(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var portfolio Portfolio
	if result := DB.Where("user_id = ?", userID).First(&portfolio); result.Error != nil {
		http.Error(w, "Portfolio not found for user", http.StatusNotFound)
		return
	}

	var projects []Project
	if result := DB.Where("portfolio_id = ?", portfolio.ID).Find(&projects); result.Error != nil {
		http.Error(w, "Failed to retrieve projects", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(projects)
}

// UpdateProject handles updating a project belonging to the authenticated user's portfolio.
func UpdateProject(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	projectIDStr := vars["id"]
	projectID, err := strconv.ParseUint(projectIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return	}

	var portfolio Portfolio
	if result := DB.Where("user_id = ?", userID).First(&portfolio); result.Error != nil {
		http.Error(w, "Portfolio not found for user", http.StatusNotFound)
		return
	}

	var project Project
	if result := DB.Where("id = ? AND portfolio_id = ?", projectID, portfolio.ID).First(&project); result.Error != nil {
		http.Error(w, "Project not found or not authorized", http.StatusNotFound)
		return
		}

	var updatedProject Project
	err = json.NewDecoder(r.Body).Decode(&updatedProject)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	project.Title = updatedProject.Title
	project.Description = updatedProject.Description
	project.Technologies = updatedProject.Technologies
	project.Link = updatedProject.Link
	project.ImageURL = updatedProject.ImageURL
	project.Featured = updatedProject.Featured

	if result := DB.Save(&project); result.Error != nil {
		http.Error(w, "Failed to update project", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(project)
}

// DeleteProject handles deleting a project belonging to the authenticated user's portfolio.
func DeleteProject(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	projectIDStr := vars["id"]
	projectID, err := strconv.ParseUint(projectIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	var portfolio Portfolio
	if result := DB.Where("user_id = ?", userID).First(&portfolio); result.Error != nil {
		http.Error(w, "Portfolio not found for user", http.StatusNotFound)
		return
	}

	if result := DB.Where("id = ? AND portfolio_id = ?", projectID, portfolio.ID).Delete(&Project{}); result.Error != nil {
		http.Error(w, "Failed to delete project or not authorized", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// CreateAchievement handles creating a new achievement for the authenticated user's portfolio.
func CreateAchievement(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var portfolio Portfolio
	if result := DB.Where("user_id = ?", userID).First(&portfolio); result.Error != nil {
		http.Error(w, "Portfolio not found for user", http.StatusNotFound)
		return
	}

	var achievement Achievement
	err = json.NewDecoder(r.Body).Decode(&achievement)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	achievement.PortfolioID = portfolio.ID
	if result := DB.Create(&achievement); result.Error != nil {
		http.Error(w, "Failed to create achievement", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(achievement)
}

// GetAchievements handles getting all achievements for the authenticated user's portfolio.
func GetAchievements(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var portfolio Portfolio
	if result := DB.Where("user_id = ?", userID).First(&portfolio); result.Error != nil {
		http.Error(w, "Portfolio not found for user", http.StatusNotFound)
		return
	}

	var achievements []Achievement
	if result := DB.Where("portfolio_id = ?", portfolio.ID).Find(&achievements); result.Error != nil {
		http.Error(w, "Failed to retrieve achievements", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(achievements)
}

// UpdateAchievement handles updating an achievement belonging to the authenticated user's portfolio.
func UpdateAchievement(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	achievementIDStr := vars["id"]
	achievementID, err := strconv.ParseUint(achievementIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid achievement ID", http.StatusBadRequest)
		return
	}

	var portfolio Portfolio
	if result := DB.Where("user_id = ?", userID).First(&portfolio); result.Error != nil {
		http.Error(w, "Portfolio not found for user", http.StatusNotFound)
		return
	}

	var achievement Achievement
	if result := DB.Where("id = ? AND portfolio_id = ?", achievementID, portfolio.ID).First(&achievement); result.Error != nil {
		http.Error(w, "Achievement not found or not authorized", http.StatusNotFound)
		return
	}

	var updatedAchievement Achievement
	err = json.NewDecoder(r.Body).Decode(&updatedAchievement)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	achievement.Title = updatedAchievement.Title
	achievement.Description = updatedAchievement.Description
	achievement.Date = updatedAchievement.Date

	if result := DB.Save(&achievement); result.Error != nil {
		http.Error(w, "Failed to update achievement", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(achievement)
}

// DeleteAchievement handles deleting an achievement belonging to the authenticated user's portfolio.
func DeleteAchievement(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	achievementIDStr := vars["id"]
	achievementID, err := strconv.ParseUint(achievementIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid achievement ID", http.StatusBadRequest)
		return
	}

	var portfolio Portfolio
	if result := DB.Where("user_id = ?", userID).First(&portfolio); result.Error != nil {
		http.Error(w, "Portfolio not found for user", http.StatusNotFound)
		return	}

	if result := DB.Where("id = ? AND portfolio_id = ?", achievementID, portfolio.ID).Delete(&Achievement{}); result.Error != nil {
		http.Error(w, "Failed to delete achievement or not authorized", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// UpdateUser handles updating the authenticated user's username and email.
func UpdateUser(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var updatedUser User
	err = json.NewDecoder(r.Body).Decode(&updatedUser)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	var user User
	if result := DB.First(&user, userID); result.Error != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Update fields
	user.Username = updatedUser.Username
	user.Email = updatedUser.Email
	user.Bio = updatedUser.Bio
	user.SocialMediaLinks = updatedUser.SocialMediaLinks
	user.ProfilePictureURL = updatedUser.ProfilePictureURL

	if result := DB.Save(&user); result.Error != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "User updated successfully"})
}

// ChangePassword handles changing the authenticated user's password.
func ChangePassword(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		OldPassword string `json:"old_password"`
		NewPassword string `json:"new_password"`
	}
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	var user User
	if result := DB.First(&user, userID); result.Error != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	if !CheckPasswordHash(req.OldPassword, user.Password) {
		http.Error(w, "Old password does not match", http.StatusUnauthorized)
		return
	}

	hashedPassword, err := HashPassword(req.NewPassword)
	if err != nil {
		http.Error(w, "Failed to hash new password", http.StatusInternalServerError)
		return
	}
	user.Password = hashedPassword

	if result := DB.Save(&user); result.Error != nil {
		http.Error(w, "Failed to change password", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Password changed successfully"})
}

// UploadImage handles image uploads.
func UploadImage(w http.ResponseWriter, r *http.Request) {
	// Maximum upload of 10 MB files
	r.ParseMultipartForm(10 << 20)

	file, handler, err := r.FormFile("image")
	if err != nil {
		http.Error(w, "Error retrieving the file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// Create a unique filename
	fileName := uuid.New().String() + filepath.Ext(handler.Filename)
	filePath := "./public/uploads/" + fileName // Assuming a public/uploads directory

	// Create the uploads directory if it doesn't exist
	if _, err := os.Stat("./public/uploads"); os.IsNotExist(err) {
		os.MkdirAll("./public/uploads", 0755)
	}

	dst, err := os.Create(filePath)
	if err != nil {
		http.Error(w, "Error creating the file on server", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Error saving the file", http.StatusInternalServerError)
		return
	}

	// Return the URL of the uploaded image
	imageURL := "/uploads/" + fileName // This URL will be relative to the server's root
	json.NewEncoder(w).Encode(map[string]string{"image_url": imageURL})
}

// LikeProject handles liking a project.
func LikeProject(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	projectIDStr := vars["id"]
	projectID, err := strconv.ParseUint(projectIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	like := Like{
		UserID:    userID,
		ProjectID: uint(projectID),
	}

	if result := DB.Create(&like); result.Error != nil {
		http.Error(w, "Failed to like project", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "Project liked successfully"})
}

// UnlikeProject handles unliking a project.
func UnlikeProject(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	projectIDStr := vars["id"]
	projectID, err := strconv.ParseUint(projectIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid project ID", http.StatusBadRequest)
		return
	}

	if result := DB.Where("user_id = ? AND project_id = ?", userID, projectID).Delete(&Like{}); result.Error != nil {
		http.Error(w, "Failed to unlike project", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ContactForm handles submissions from the contact form.
func ContactForm(w http.ResponseWriter, r *http.Request) {
	var contactData struct {
		Name    string `json:"name"`
		Email   string `json:"email"`
		Subject string `json:"subject"`
		Message string `json:"message"`
	}

	err := json.NewDecoder(r.Body).Decode(&contactData)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	// For now, just log the data. In a real application, you would send an email.
	log.Printf("Contact Form Submission:\nName: %s\nEmail: %s\nSubject: %s\nMessage: %s\n",
		contactData.Name, contactData.Email, contactData.Subject, contactData.Message)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Message sent successfully!"})
}

// CreatePost handles creating a new blog post.
func CreatePost(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var post Post
	err = json.NewDecoder(r.Body).Decode(&post)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	post.UserID = userID
	post.PublishedAt = time.Now()

	if result := DB.Create(&post); result.Error != nil {
		http.Error(w, "Failed to create post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(post)
}

// GetPosts handles getting all blog posts.
func GetPosts(w http.ResponseWriter, r *http.Request) {
	var posts []Post
	if result := DB.Find(&posts); result.Error != nil {
		http.Error(w, "Failed to retrieve posts", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(posts)
}

// GetPost handles getting a single blog post by ID.
func GetPost(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	postIDStr := vars["id"]
	postID, err := strconv.ParseUint(postIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	var post Post
	if result := DB.First(&post, postID); result.Error != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	json.NewEncoder(w).Encode(post)
}

// UpdatePost handles updating a blog post.
func UpdatePost(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	postIDStr := vars["id"]
	postID, err := strconv.ParseUint(postIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	var post Post
	if result := DB.Where("user_id = ?", userID).First(&post, postID); result.Error != nil {
		http.Error(w, "Post not found or not authorized", http.StatusNotFound)
		return
	}

	var updatedPost Post
	err = json.NewDecoder(r.Body).Decode(&updatedPost)
	if err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	post.Title = updatedPost.Title
	post.Content = updatedPost.Content

	if result := DB.Save(&post); result.Error != nil {
		http.Error(w, "Failed to update post", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(post)
}

// DeletePost handles deleting a blog post.
func DeletePost(w http.ResponseWriter, r *http.Request) {
	userID, err := getUserIDFromContext(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	vars := mux.Vars(r)
	postIDStr := vars["id"]
	postID, err := strconv.ParseUint(postIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	var post Post
	if result := DB.Where("user_id = ?", userID).First(&post, postID); result.Error != nil {
		http.Error(w, "Post not found or not authorized", http.StatusNotFound)
		return
	}

	if result := DB.Delete(&post); result.Error != nil {
		http.Error(w, "Failed to delete post", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
