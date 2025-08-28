package main

import (
	"time"

	"gorm.io/gorm"
)

// User represents a user in the database
type User struct {
	gorm.Model
	Username string `gorm:"unique;not null"`
	Email    string `gorm:"unique;not null"`
	Password string `gorm:"not null"`
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
	Theme       string `gorm:"default:'default'"` // New field for theme selection
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
}

// Achievement represents an achievement in a portfolio
type Achievement struct {
	gorm.Model
	PortfolioID uint      `gorm:"not null"`
	Title       string    `gorm:"not null"`
	Description string
	Date        time.Time // Date of the achievement
}