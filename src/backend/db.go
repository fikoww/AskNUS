package main

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite"
)

var db *sql.DB

func initDB() error {
	var err error

	db, err = sql.Open("sqlite", "./forum.db")
	if err != nil {
		return err
	}

	// 🔑 Enable foreign keys (REQUIRED in SQLite)
	if _, err := db.Exec("PRAGMA foreign_keys = ON;"); err != nil {
		return err
	}

	if err := db.Ping(); err != nil {
		return err
	}

	log.Println("SQLite connected")

	return seedTopics()
}

func createTables() error {
	queries := []string{

		// ---------- TOPICS ----------
		`
		CREATE TABLE IF NOT EXISTS topics (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			code TEXT NOT NULL UNIQUE,
			title TEXT NOT NULL
		);
		`,

		// ---------- QUESTIONS ----------
		`
		CREATE TABLE IF NOT EXISTS questions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			topic_id INTEGER NOT NULL,
			author TEXT NOT NULL,
			FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
		);
		`,

		// ---------- COMMENTS ----------
		`
		CREATE TABLE IF NOT EXISTS comments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			question_id INTEGER NOT NULL,
			text TEXT NOT NULL,
			author TEXT NOT NULL,
			role TEXT NOT NULL,
			FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
		);
		`,

		// ---------- MATERIALS ----------
		`
		CREATE TABLE IF NOT EXISTS materials (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			topic_id INTEGER NOT NULL,
			title TEXT NOT NULL,
			file TEXT NOT NULL,
			author TEXT NOT NULL,
			FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
		);
		`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return err
		}
	}

	log.Println("Database tables created / verified")
	return nil
}

func seedTopics() error {
	topics := []struct {
		Code  string
		Title string
	}{
		{"CS1101S", "Programming Methodology"},
		{"CS2030S", "Programming Methodology II"},
		{"CS2040S", "Data Structures and Algorithms"},
		{"CS2100", "Computer Organisation"},
		{"CS2103T", "Software Engineering"},
		{"CS2106", "Operating Systems"},
		{"CS3230", "Design and Analysis of Algorithms"},
	}

	for _, t := range topics {
		_, err := db.Exec(`
			INSERT OR IGNORE INTO topics (code, title)
			VALUES (?, ?)
		`, t.Code, t.Title)

		if err != nil {
			return err
		}
	}

	log.Println("Default CS topics seeded")
	return nil
}
