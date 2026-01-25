import { useEffect, useState } from "react";

type Role = "student" | "tutor" | "professor";

type Comment = {
  id: number;
  questionId: number;
  text: string;
  author: string;
  role: Role;
};

type Props = {
  questionId: number;
  course: string; // ✅ ADD THIS
  username: string;
  role: Role;
};

export default function Comments({ questionId, course, username, role }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
const [editText, setEditText] = useState("");

async function updateComment(id: number) {
  const text = editText.trim();
  if (!text) return;

  const res = await fetch(
    `http://localhost:8080/comments?id=${id}&author=${encodeURIComponent(username)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    }
  );

  if (!res.ok) {
    if (res.status === 403) alert("You can only edit your own answer.");
    else alert("Failed to edit answer.");
    return;
  }

  setEditingId(null);
  setEditText("");
  await refresh();
}

  async function refresh() {
    const res = await fetch(`http://localhost:8080/comments?questionId=${questionId}`);
    if (!res.ok) throw new Error("Failed to load answers");
    const raw = await res.json();
    setComments(Array.isArray(raw) ? raw : []);
  }

  useEffect(() => {
    (async () => {
      try {
        setError("");
        await refresh();
      } catch (e) {
        console.error(e);
        setError("Failed to load answers.");
        setComments([]);
      }
    })();
  }, [questionId]);

  async function addComment() {
    const text = newComment.trim();
    if (!text) return;

    try {
      setError("");
      const res = await fetch("http://localhost:8080/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, text, author: username, role }),
      });

      if (!res.ok) throw new Error("Failed to post answer");
      setNewComment("");
      await refresh();
    } catch (e) {
      console.error(e);
      setError("Failed to post answer.");
    }
  }

  async function deleteComment(id: number) {
    const res = await fetch(
      `http://localhost:8080/comments?id=${id}&author=${encodeURIComponent(username)}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      if (res.status === 403) alert("You can only delete your own answer.");
      else alert("Failed to delete answer.");
      return;
    }

    await refresh();
  }

  return (
    <div className="card wide">
      <h2 className="pageTitle">Answers</h2>

      {error && <div className="errorBox">{error}</div>}

      {comments.length === 0 ? (
        <div className="emptyState">
          <div className="emptyTitle">No answers yet</div>
          <div className="meta">Be the first to reply 👇</div>
        </div>
      ) : (
        <div className="answersList">
          {comments.map((c) => {
            const canDelete = c.author === username; // 🔒 only own answers
const canEdit = c.author === username;

{editingId === c.id ? (
  <>
    <textarea
      className="textInput"
      rows={4}
      value={editText}
      onChange={(e) => setEditText(e.target.value)}
    />
    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
      <button
        className="primaryBtn"
        type="button"
        onClick={() => updateComment(c.id)}
        disabled={!editText.trim()}
      >
        Save
      </button>
      <button
        className="btn"
        type="button"
        onClick={() => { setEditingId(null); setEditText(""); }}
      >
        Cancel
      </button>
    </div>
  </>
) : (
  <div className="answerBody">{c.text}</div>
)}

<div style={{ display: "flex", gap: 8, marginTop: 10 }}>
  {canEdit && editingId !== c.id && (
    <button
      className="btn"
      type="button"
      onClick={() => {
        setEditingId(c.id);
        setEditText(c.text);
      }}
    >
      Edit
    </button>
  )}

  {canDelete && (
    <button className="deleteBtn" onClick={() => { if (confirm("Delete this answer?")) deleteComment(c.id); }}>
      Delete
    </button>
  )}
</div>

            return (
              <div key={c.id} className="answerCard">
                <div className="answerHeader">
                  <div className="answerAuthor">
                    <span className="authorName">{c.author}</span>
                    <span className={`roleBadge ${c.role}`}>{c.role}</span>
                  </div>

                  {canDelete && (
                    <button
                      className="deleteBtn"
                      onClick={() => {
                        if (confirm("Delete this answer?")) deleteComment(c.id);
                      }}
                      type="button"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div className="answerBody">{c.text}</div>
              </div>
            );
          })}
        </div>
      )}

      <hr className="divider" />

      <h3 className="sectionTitle">Add an answer</h3>

      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Write your answer…"
        rows={4}
        className="textInput"
      />

      <button onClick={addComment} disabled={!newComment.trim()} className="primaryBtn" style={{ marginTop: 10 }}>
        Post
      </button>
    </div>
  );
}
