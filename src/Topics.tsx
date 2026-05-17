import { useEffect, useState } from "react";

type Topic = { id: number; code: string; title: string };
type Role = "student" | "tutor" | "professor";

type Props = {
  onSelect: (id: number, code: string) => void;
  role: Role;
};

export default function Topics({ onSelect, role }: Props) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [error, setError] = useState("");

  // professor-only input fields
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");

  async function loadTopics() {
    try {
      setError("");
      const res = await fetch("https://cvwo-production.up.railway.app/topics");
      const data = await res.json();
      setTopics(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load topics.");
    }
  }

  useEffect(() => {
    loadTopics();
  }, []);

  async function addTopic() {
    if (!newCode.trim() || !newTitle.trim()) return;

    try {
      setError("");
      const res = await fetch("https://cvwo-production.up.railway.app/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.trim(),
          title: newTitle.trim(),
          role, // backend checks professor
        }),
      });

      if (!res.ok) {
        if (res.status === 403) setError("Only professors can add courses.");
        else setError("Failed to add course.");
        return;
      }

      setNewCode("");
      setNewTitle("");
      await loadTopics();
    } catch (e) {
      console.error(e);
      setError("Failed to add course.");
    }
  }

  return (
    <div className="card wide">
      <h2 className="pageTitle">Course Topics</h2>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {topics.length === 0 ? (
        <p className="meta">No topics yet.</p>
      ) : (
        <div className="grid-topics">
          {topics.map((t) => (
            <button
              key={t.id}
              className="topicBtn"
              onClick={() => onSelect(t.id, t.code)} // ✅ id + code
            >
              <div className="topicCode">{t.code}</div>
              <div className="topicTitle">{t.title}</div>
            </button>
          ))}
        </div>
      )}

      {role === "professor" && (
        <>
          <hr className="divider" />
          <h3 className="sectionTitle">Add a new course</h3>

          <div style={{ display: "grid", gap: 10, maxWidth: 420 }}>
            <input
              className="textInput"
              placeholder="Course code (e.g. CS2103T)"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
            />

            <input
              className="textInput"
              placeholder="Course title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />

            <button className="primaryBtn" onClick={addTopic}>
              Add course
            </button>
          </div>
        </>
      )}
    </div>
  );
}
