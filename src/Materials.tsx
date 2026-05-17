import { useEffect, useState } from "react";

type Role = "student" | "tutor" | "professor";

type Material = {
  id: number;
  course: string;
  title: string;
  file: string;   // saved filename on backend
  author: string;
};

type Props = {
  course: string;      // e.g. CS1101S
  username: string;
  role: Role;
};

export default function Materials({ course, username, role }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  async function refresh() {
    const res = await fetch(`https://cvwo-production.up.railway.app/materials?course=${encodeURIComponent(course)}`);
    if (!res.ok) throw new Error("Failed to load materials");
    const raw = await res.json();
    setMaterials(Array.isArray(raw) ? raw : []);
  }

  useEffect(() => {
    refresh().catch((e) => {
      console.error(e);
      setError("Failed to load materials.");
    });
  }, [course]);

  async function upload() {
    if (role !== "professor") return;
    const t = title.trim();
    if (!t || !file) {
      setError("Please provide a title and choose a PDF file.");
      return;
    }

    try {
      setError("");
      const form = new FormData();
      form.append("title", t);
      form.append("author", username);
      form.append("role", role);
      form.append("file", file);

      const res = await fetch(`https://cvwo-production.up.railway.app/materials?course=${encodeURIComponent(course)}`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        if (res.status === 403) throw new Error("Only professors can upload.");
        throw new Error("Upload failed.");
      }

      setTitle("");
      setFile(null);
      await refresh();
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to upload material.");
    }
  }

  return (
    <div style={{ marginTop: 12, marginBottom: 18 }}>
      <div className="sectionHeaderRow">
        <h3 className="sectionTitle" style={{ margin: 0 }}>
          Course materials
        </h3>
        <div className="meta">{course}</div>
      </div>

      {error && <div className="errorBox" style={{ marginTop: 10 }}>{error}</div>}

      {materials.length === 0 ? (
        <div className="emptyState" style={{ marginTop: 10 }}>
          <div className="meta">No PDFs uploaded yet.</div>
        </div>
      ) : (
        <div className="materialsList" style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {materials.map((m) => (
            <a
              key={m.id}
              className="materialItem"
              href={`https://cvwo-production.up.railway.app/files/${m.file}`}
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: "none",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                borderRadius: 14,
                padding: "12px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: "var(--text)" }}>{m.title}</div>
                <div className="meta" style={{ marginTop: 4 }}>
                  Uploaded by <b>{m.author}</b>
                </div>
              </div>

              <div
                style={{
                  padding: "6px 10px",
                  borderRadius: 999,
                  background: "var(--accent-soft)",
                  border: "1px solid #c7d2fe",
                  color: "#3730a3",
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                Open PDF
              </div>
            </a>
          ))}
        </div>
      )}

      {/* ✅ Upload UI (professor only) */}
      {role === "professor" && (
        <div style={{ marginTop: 12 }}>
          <div className="meta" style={{ marginBottom: 8 }}>
            Professor upload
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <input
              className="textInput"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="PDF title (e.g., Week 3: Recursion)"
            />

            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <button className="primaryBtn" onClick={upload} disabled={!title.trim() || !file}>
              Upload PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
