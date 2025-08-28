package main

import "gorm.io/gorm"

// User represents a user in the database
	ype User struct {
	gorm.Model
	Username string `gorm:"unique"`
	Password string
	Projects []Project
}

// Project represents a project in the database
	ype Project struct {
	gorm.Model
	Title       string
	Description string
	UserID      uint
}
