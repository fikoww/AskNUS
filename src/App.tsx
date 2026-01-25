import { useEffect, useState } from "react";
import Login from "./Login";
import Topics from "./Topics";
import Questions from "./Questions";
import Comments from "./Comments";

type Role = "student" | "tutor" | "professor";
type User = { username: string; role: Role };

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedTopicCode, setSelectedTopicCode] = useState<string | null>(null);

  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("user");
      }
    }
  }, []);

  function handleLogin(u: User) {
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
  }

  function handleLogout() {
    localStorage.removeItem("user");
    setUser(null);
    setSelectedTopicId(null);
    setSelectedTopicCode(null);
    setSelectedQuestionId(null);
  }

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="container">
      <div className="hero">
        <div>
          <div className="badge">
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: "#22c55e",
                display: "inline-block",
              }}
            />
            Live Q&A for NUS CS modules
          </div>

          <h1 style={{ margin: "10px 0 6px" }}>NUS Course Q&A</h1>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            Ask questions, share answers, and learn together.
          </p>
        </div>

        <div className="row">
          <div className="badge">
            <b>{user.username}</b> · {user.role}
          </div>
          <button className="btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        {/* 1) TOPICS PAGE */}
        {selectedTopicId === null ? (
          <Topics
            role={user.role}
            onSelect={(id, code) => {
              setSelectedTopicId(id);
              setSelectedTopicCode(code);
              setSelectedQuestionId(null);
            }}
          />
        ) : /* 2) QUESTIONS PAGE */ selectedQuestionId === null ? (
          <div>
            <button
              className="btn"
              onClick={() => {
                setSelectedTopicId(null);
                setSelectedTopicCode(null);
                setSelectedQuestionId(null);
              }}
            >
              ← Back to courses
            </button>

            <div style={{ marginTop: 12 }}>
              <Questions
                topicId={selectedTopicId}
                topicCode={selectedTopicCode!}
                username={user.username}
                role={user.role}
                onSelectQuestion={setSelectedQuestionId}
              />
            </div>
          </div>
        ) : (
          /* 3) COMMENTS PAGE */
          <div>
            <button className="btn" onClick={() => setSelectedQuestionId(null)}>
              ← Back to questions
            </button>

            <div style={{ marginTop: 12 }}>
             <Comments
  questionId={selectedQuestionId}
  course={selectedTopicCode!}
  username={user.username}
  role={user.role}
/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
