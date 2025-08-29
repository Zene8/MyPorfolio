package main

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the database
type User struct {
	gorm.Model
	Username          string `gorm:"unique;not null"`
	Email             string `gorm:"unique;not null"`
	Password          string `gorm:"not null"`
	Bio               string
	SocialMediaLinks  string // JSON encoded map[string]string
	ProfilePictureURL string
	// A user can have one portfolio
	Portfolio Portfolio `gorm:"foreignKey:UserID"`
}

// Portfolio represents a user's portfolio
type Portfolio struct {
	gorm.Model
	UserID      uint   `gorm:"not null;unique"` // Each user has one portfolio
	Title       string // e.g., "John Doe's Portfolio"
	Description string // A short bio or tagline
	AboutMe     string // Detailed about me section
	ContactInfo string // How to contact the user
	Layout      string `gorm:"default:'default'"`
	Projects    []Project `gorm:"foreignKey:PortfolioID"`
	Achievements []Achievement `gorm:"foreignKey:PortfolioID"`
}

// Project represents a project in a portfolio
type Project struct {
	gorm.Model
	PortfolioID  uint   `gorm:"not null"`
	Title        string `gorm:"not null"`
	Description  string
	Technologies string // Comma-separated list of technologies
	Link         string // Link to the project (e.g., GitHub, live demo)
	ImageURL     string // URL for a project image/thumbnail
	Featured     bool   `gorm:"default:false"`
	Likes        []Like `gorm:"foreignKey:ProjectID"`
}

// Like represents a like on a project

type Like struct {
	gorm.Model
	UserID    uint `gorm:"not null"`
	ProjectID uint `gorm:"not null"`
}

// Achievement represents an achievement in a portfolio
type Achievement struct {
	gorm.Model
	PortfolioID uint      `gorm:"not null"`
	Title       string    `gorm:"not null"`
	Description string
	Date        time.Time // Date of the achievement
}

// Post represents a blog post
type Post struct {
	gorm.Model
	UserID      uint      `gorm:"not null"` // Author of the post
	Title       string    `gorm:"not null"`
	Content     string    `gorm:"type:text"`
	PublishedAt time.Time
}