import { useState } from "react";

type Role = "student" | "tutor" | "professor";
type User = { username: string; role: Role };

type Props = {
  onLogin: (u: User) => void;
};

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<Role | "">(""); // ✅ no default role
  const [error, setError] = useState("");

  function handleContinue() {
    const trimmed = username.trim();

    if (trimmed === "") {
      setError("Username cannot be empty.");
      return;
    }
    if (role === "") {
      setError("Please choose a role.");
      return;
    }

    setError("");
    onLogin({ username: trimmed, role });
  }

  const canContinue = username.trim() !== "" && role !== "";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(180deg, #eef2ff 0%, #ffffff 55%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        overflow: "auto",
      }}
    >
      <div style={{ width: 520, maxWidth: "100%" }}>
        {/* Top brand */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div
            style={{
              width: 54,
              height: 54,
              borderRadius: 18,
              background: "#111827",
              color: "white",
              display: "grid",
              placeItems: "center",
              fontWeight: 900,
              fontSize: 18,
              margin: "0 auto 10px",
            }}
          >
            NUS
          </div>

          <h1 style={{ margin: 0, color: "#111827", fontSize: 30 }}>
            Course Q&A
          </h1>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            Log in to ask questions and help your classmates.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 18,
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
          }}
        >
          <div style={{ display: "grid", gap: 12 }}>
            {/* Username */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: "#374151",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Username
              </label>

              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. fredleavey"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleContinue();
                }}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #d1d5db",
                  outline: "none",
                  fontSize: 14,
                  color: "#111827",
                  backgroundColor: "#ffffff",
                }}
              />

              <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
                Tip: use a simple nickname (no password needed for now).
              </div>
            </div>

            {/* Role */}
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: 6,
                  color: "#374151",
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Role
              </label>

              <div style={{ position: "relative" }}>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 12px",
                    borderRadius: 12,
                    border: "1px solid #d1d5db",
                    backgroundColor: "#ffffff",
                    color: role === "" ? "#9ca3af" : "#111827", // ✅ placeholder grey
                    fontSize: 14,
                    outline: "none",
                    appearance: "none",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                  }}
                >
                  {/* ✅ placeholder */}
                  <option value="" disabled hidden>
                    Select your role
                  </option>

                  <option value="student">Student</option>
                  <option value="tutor">Tutor</option>
                  <option value="professor">Professor</option>
                </select>

                {/* custom arrow */}
                <div
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: "#6b7280",
                    fontSize: 12,
                  }}
                >
                  ▼
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid #fecaca",
                  background: "#fef2f2",
                  color: "#991b1b",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}

            {/* Button */}
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              style={{
                padding: "11px 12px",
                borderRadius: 12,
                border: "1px solid #111827",
                background: canContinue ? "#111827" : "#9ca3af",
                color: "white",
                cursor: canContinue ? "pointer" : "not-allowed",
                fontWeight: 800,
                fontSize: 14,
              }}
            >
              Continue →
            </button>
          </div>

          <div
            style={{
              marginTop: 14,
              fontSize: 12,
              color: "#6b7280",
              lineHeight: 1.5,
            }}
          >
           
          </div>
        </div>
      </div>
    </div>
  );
}
