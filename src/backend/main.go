package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
)

type Topic struct {
	ID    int    `json:"id"`
	Code  string `json:"code"`
	Title string `json:"title"`
}

type Question struct {
	ID      int    `json:"id"`
	Title   string `json:"title"`
	TopicID int    `json:"topicId"`
	Author  string `json:"author"`
}

type Comment struct {
	ID         int    `json:"id"`
	QuestionID int    `json:"questionId"`
	Text       string `json:"text"`
	Author     string `json:"author"`
	Role       string `json:"role"`
}

type Material struct {
	ID     int    `json:"id"`
	Course string `json:"course"`
	Title  string `json:"title"`
	File   string `json:"file"`
	Author string `json:"author"`
}

func setCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
}

func main() {
	if err := initDB(); err != nil {
		log.Fatal(err)
	}

	_ = os.MkdirAll("./uploads", 0755)

	mux := http.NewServeMux()

	// serve uploaded pdfs
	mux.Handle("/files/", http.StripPrefix("/files/", http.FileServer(http.Dir("./uploads"))))

	// health
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// ---------------- TOPICS ----------------
	mux.HandleFunc("/topics", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		switch r.Method {
		case http.MethodGet:
			rows, err := db.Query("SELECT id, code, title FROM topics ORDER BY id")
			if err != nil {
				http.Error(w, "db error", 500)
				return
			}
			defer rows.Close()

			out := []Topic{}
			for rows.Next() {
				var t Topic
				if err := rows.Scan(&t.ID, &t.Code, &t.Title); err != nil {
					http.Error(w, "db scan error", 500)
					return
				}
				out = append(out, t)
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(out)

		case http.MethodPost:
			var req struct {
				Code  string `json:"code"`
				Title string `json:"title"`
				Role  string `json:"role"`
			}
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "invalid json", 400)
				return
			}
			if req.Role != "professor" {
				http.Error(w, "forbidden", 403)
				return
			}
			if req.Code == "" || req.Title == "" {
				http.Error(w, "missing fields", 400)
				return
			}

			res, err := db.Exec("INSERT INTO topics (code, title) VALUES (?, ?)", req.Code, req.Title)
			if err != nil {
				http.Error(w, "db insert error (maybe duplicate code)", 500)
				return
			}
			id64, _ := res.LastInsertId()

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(Topic{ID: int(id64), Code: req.Code, Title: req.Title})

		default:
			http.Error(w, "method not allowed", 405)
		}
	})

	// ---------------- QUESTIONS ----------------
	mux.HandleFunc("/questions", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w)

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		switch r.Method {
		case http.MethodGet:
			topicIdStr := r.URL.Query().Get("topicId")
			if topicIdStr == "" {
				http.Error(w, "missing topicId", http.StatusBadRequest)
				return
			}

			topicId, err := strconv.Atoi(topicIdStr)
			if err != nil {
				http.Error(w, "invalid topicId", http.StatusBadRequest)
				return
			}

			rows, err := db.Query(`
      SELECT id, title, topic_id, author
      FROM questions
      WHERE topic_id = ?
      ORDER BY id DESC
    `, topicId)
			if err != nil {
				http.Error(w, "db error", http.StatusInternalServerError)
				return
			}
			defer rows.Close()

			result := []Question{}
			for rows.Next() {
				var q Question
				if err := rows.Scan(&q.ID, &q.Title, &q.TopicID, &q.Author); err != nil {
					http.Error(w, "db scan error", http.StatusInternalServerError)
					return
				}
				result = append(result, q)
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(result)

		case http.MethodPost:
			var req struct {
				Title   string `json:"title"`
				TopicID int    `json:"topicId"`
				Author  string `json:"author"`
			}

			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "invalid json", http.StatusBadRequest)
				return
			}
			if req.Title == "" || req.Author == "" || req.TopicID == 0 {
				http.Error(w, "missing fields", http.StatusBadRequest)
				return
			}

			res, err := db.Exec(`
      INSERT INTO questions (title, topic_id, author)
      VALUES (?, ?, ?)
    `, req.Title, req.TopicID, req.Author)
			if err != nil {
				http.Error(w, "db insert error", http.StatusInternalServerError)
				return
			}

			id64, _ := res.LastInsertId()
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(Question{
				ID: int(id64), Title: req.Title, TopicID: req.TopicID, Author: req.Author,
			})

		case http.MethodDelete:
			idStr := r.URL.Query().Get("id")
			author := r.URL.Query().Get("author")
			if idStr == "" || author == "" {
				http.Error(w, "missing id or author", http.StatusBadRequest)
				return
			}

			id, err := strconv.Atoi(idStr)
			if err != nil {
				http.Error(w, "invalid id", http.StatusBadRequest)
				return
			}

			// check author
			var dbAuthor string
			err = db.QueryRow("SELECT author FROM questions WHERE id = ?", id).Scan(&dbAuthor)
			if err == sql.ErrNoRows {
				http.Error(w, "not found", http.StatusNotFound)
				return
			}
			if err != nil {
				http.Error(w, "db error", http.StatusInternalServerError)
				return
			}
			if dbAuthor != author {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}

			// delete comments for that question
			_, _ = db.Exec("DELETE FROM comments WHERE question_id = ?", id)

			// delete question
			_, err = db.Exec("DELETE FROM questions WHERE id = ?", id)
			if err != nil {
				http.Error(w, "db delete error", http.StatusInternalServerError)
				return
			}

			w.WriteHeader(http.StatusNoContent)

		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	// ---------------- COMMENTS ----------------
	mux.HandleFunc("/comments", func(w http.ResponseWriter, r *http.Request) {
		setCORS(w)
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		switch r.Method {

		case http.MethodGet:
			qidStr := r.URL.Query().Get("questionId")
			if qidStr == "" {
				http.Error(w, "missing questionId", http.StatusBadRequest)
				return
			}
			qid, err := strconv.Atoi(qidStr)
			if err != nil {
				http.Error(w, "invalid questionId", http.StatusBadRequest)
				return
			}

			rows, err := db.Query(
				"SELECT id, question_id, text, author, role FROM comments WHERE question_id = ? ORDER BY id DESC",
				qid,
			)
			if err != nil {
				http.Error(w, "db error", http.StatusInternalServerError)
				return
			}
			defer rows.Close()

			out := []Comment{}
			for rows.Next() {
				var c Comment
				if err := rows.Scan(&c.ID, &c.QuestionID, &c.Text, &c.Author, &c.Role); err != nil {
					http.Error(w, "db scan error", http.StatusInternalServerError)
					return
				}
				out = append(out, c)
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(out)

		case http.MethodPost:
			var req Comment
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
				http.Error(w, "invalid json", http.StatusBadRequest)
				return
			}
			if req.QuestionID == 0 || req.Text == "" || req.Author == "" || req.Role == "" {
				http.Error(w, "missing fields", http.StatusBadRequest)
				return
			}

			res, err := db.Exec(
				"INSERT INTO comments (question_id, text, author, role) VALUES (?, ?, ?, ?)",
				req.QuestionID, req.Text, req.Author, req.Role,
			)
			if err != nil {
				http.Error(w, "db insert error", http.StatusInternalServerError)
				return
			}
			id64, _ := res.LastInsertId()
			req.ID = int(id64)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(req)

		case http.MethodPut:
			idStr := r.URL.Query().Get("id")
			author := r.URL.Query().Get("author")
			if idStr == "" || author == "" {
				http.Error(w, "missing id or author", http.StatusBadRequest)
				return
			}
			id, err := strconv.Atoi(idStr)
			if err != nil {
				http.Error(w, "invalid id", http.StatusBadRequest)
				return
			}

			// check ownership
			var dbAuthor string
			err = db.QueryRow("SELECT author FROM comments WHERE id = ?", id).Scan(&dbAuthor)
			if err == sql.ErrNoRows {
				http.Error(w, "not found", http.StatusNotFound)
				return
			}
			if err != nil {
				http.Error(w, "db error", http.StatusInternalServerError)
				return
			}
			if dbAuthor != author {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}

			// parse new text
			var body struct {
				Text string `json:"text"`
			}
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				http.Error(w, "invalid json", http.StatusBadRequest)
				return
			}
			if body.Text == "" {
				http.Error(w, "missing text", http.StatusBadRequest)
				return
			}

			_, err = db.Exec("UPDATE comments SET text = ? WHERE id = ?", body.Text, id)
			if err != nil {
				http.Error(w, "db update error", http.StatusInternalServerError)
				return
			}

			w.WriteHeader(http.StatusNoContent)

		case http.MethodDelete:
			idStr := r.URL.Query().Get("id")
			author := r.URL.Query().Get("author")
			if idStr == "" || author == "" {
				http.Error(w, "missing id or author", http.StatusBadRequest)
				return
			}
			id, err := strconv.Atoi(idStr)
			if err != nil {
				http.Error(w, "invalid id", http.StatusBadRequest)
				return
			}

			var dbAuthor string
			err = db.QueryRow("SELECT author FROM comments WHERE id = ?", id).Scan(&dbAuthor)
			if err == sql.ErrNoRows {
				http.Error(w, "not found", http.StatusNotFound)
				return
			}
			if err != nil {
				http.Error(w, "db error", http.StatusInternalServerError)
				return
			}
			if dbAuthor != author {
				http.Error(w, "forbidden", http.StatusForbidden)
				return
			}

			_, err = db.Exec("DELETE FROM comments WHERE id = ?", id)
			if err != nil {
				http.Error(w, "db delete error", http.StatusInternalServerError)
				return
			}

			w.WriteHeader(http.StatusNoContent)

		default:
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		}
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Println("Backend running on port", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}
