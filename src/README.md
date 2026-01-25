# CVWO Course Q&A Forum

A simple forum web application used for learning CS courses in NUS for students, TAs, and professors, built for CVWO.

## Tech Stack
- Frontend: React + TypeScript
- Backend: Go (net/http)
- Database: SQLite (relational, foreign keys enabled)

## Features
- Topics (courses)
- Questions per topic
- Comments per question
- Username-based authentication
- CRUD for topics, questions, comments
- Author-only edit & delete
- Professor-only material upload

## How to run
### Backend
```bash
cd src/backend
go run .

### Frontend
cd src/frontend
npm install
npm run dev