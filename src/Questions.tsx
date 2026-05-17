import { useEffect, useState } from "react";
import Materials from "./Materials";

type Role = "student" | "tutor" | "professor";

type Question = {
  id: number;
  title: string;
  topicId: number;
  author: string;
};

type Props = {
  topicId: number | null;
  topicCode: string;
  username: string;
  role: Role;
  onSelectQuestion: (id: number) => void;
};

export default function Questions({
  topicId,
  topicCode,
  username,
  role,
  onSelectQuestion,
}: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  async function refreshQuestions() {
    if (topicId === null) return;

    const res = await fetch(`https://cvwo-production.up.railway.app/questions?topicId=${topicId}`);
    const data = await res.json();
    setQuestions(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    refreshQuestions().catch(console.error);
  }, [topicId]);

  async function addQuestion() {
    const text = newQuestion.trim();
    if (!text || topicId === null) return;

    try {
      setError("");
      const res = await fetch("https://cvwo-production.up.railway.app/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: text, topicId, author: username }),
      });

      if (!res.ok) throw new Error("Failed to post question");

      setNewQuestion("");
      await refreshQuestions();
    } catch (e) {
      console.error(e);
      setError("Failed to post question.");
    }
  }

  async function updateQuestion(id: number) {
    const text = editTitle.trim();
    if (!text) return;

    const res = await fetch(
      `https://cvwo-production.up.railway.app/questions?id=${id}&author=${encodeURIComponent(username)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: text }),
      }
    );

    if (!res.ok) {
      if (res.status === 403) alert("You can only edit your own question.");
      else alert("Failed to edit question.");
      return;
    }

    setEditingId(null);
    setEditTitle("");
    await refreshQuestions();
  }

  return (
    <div className="card wide">
      {/* ===== 1) MATERIALS SECTION ===== */}
      <div className="sectionBlock">
        <div className="sectionHeaderRow">
          <div>
            <h2 className="pageTitle">{topicCode} Materials</h2>
            <div className="meta">Lecture notes / PDFs uploaded by professors.</div>
          </div>
        </div>

        <Materials course={topicCode} username={username} role={role} />
      </div>

      <hr className="divider" />

      {/* ===== 2) QUESTIONS SECTION ===== */}
      <div className="sectionBlock">
        <div className="sectionHeaderRow">
          <div>
            <h2 className="pageTitle">{topicCode} Questions</h2>
            <div className="meta">Click a question to view answers.</div>
          </div>
        </div>

        {error && <div className="errorBox">{error}</div>}

        {questions.length === 0 ? (
          <div className="emptyState">
            <div className="emptyTitle">No questions yet</div>
            <div className="meta">Be the first to ask something 👇</div>
          </div>
        ) : (
          <div className="qGrid">
            {questions.map((q) => {
              const canEdit = q.author === username;

              return (
                <div key={q.id} className="qCard">
                  {editingId === q.id ? (
                    <div className="qCardMain" style={{ cursor: "default" }}>
                      <input
                        className="textInput"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Edit question title..."
                      />

                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <button
                          className="primaryBtn"
                          type="button"
                          onClick={() => updateQuestion(q.id)}
                          disabled={!editTitle.trim()}
                        >
                          Save
                        </button>

                        <button
                          className="btn"
                          type="button"
                          onClick={() => {
                            setEditingId(null);
                            setEditTitle("");
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="qCardMain"
                      type="button"
                      onClick={() => onSelectQuestion(q.id)}
                    >
                      <div className="qTitle">{q.title}</div>
                      <div className="qMeta">
                        <span className="qMetaLabel">Asked by</span>{" "}
                        <span className="qMetaName">{q.author}</span>
                      </div>
                    </button>
                  )}

                  {canEdit && editingId !== q.id && (
                    <button
                      className="btn"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(q.id);
                        setEditTitle(q.title);
                      }}
                      style={{ margin: 12 }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <hr className="divider" />

        <h3 className="sectionTitle">Ask a question</h3>
        <div className="inputRow">
          <input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Type your question…"
            className="textInput"
          />
          <button onClick={addQuestion} disabled={!newQuestion.trim()} className="primaryBtn">
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
