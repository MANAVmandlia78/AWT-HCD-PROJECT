/**
 * Clipboard.jsx
 * Props:
 *   socket — socket.io socket instance
 *   role   — "teacher" | "student"
 *   roomId — room id (passed from Room.jsx)
 */

import { useState, useEffect, useRef, useCallback } from "react";

const LANG_OPTIONS = [
  "plain", "js", "ts", "jsx", "tsx",
  "py", "html", "css", "sql", "json", "bash", "java", "cpp",
];

const ACCENT_COLORS = {
  text: { bg: "#ff6b9d", light: "#fff5f9" },
  file: { bg: "#6b8eff", light: "#f5f7ff" },
};

function fmtSize(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1048576).toFixed(2)} MB`;
}

function nowTime() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

export default function Clipboard({ socket, role, roomId }) {
  const isTeacher = role === "teacher";

  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState("text");
  const [selectedLang, setSelectedLang] = useState("plain");
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteContent, setPasteContent] = useState("");
  const [pendingFiles, setPendingFiles] = useState([]);
  const [toast, setToast] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [openIds, setOpenIds] = useState(new Set());
  const [dragOver, setDragOver] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  // Track in-flight emits so we can ignore the bounce-back echo to ourselves
  // (server broadcasts to ALL including sender, so without this we'd get a
  //  duplicate flash of the old state before the authoritative one arrives)
  const pendingEmit = useRef(false);

  const toastTimer = useRef(null);
  const fileInputRef = useRef(null);

  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2700);
  }, []);

  // ── Socket listeners ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleInit = ({ items: serverItems }) => {
      setItems(Array.isArray(serverItems) ? serverItems : []);
    };

    // Single source of truth — server pushes the full updated list
    const handleUpdate = ({ items: serverItems }) => {
      setItems(Array.isArray(serverItems) ? serverItems : []);
    };

    const handleError = ({ message }) => {
      showToast(`⚠ ${message}`, "error");
    };

    socket.on("clipboard-init", handleInit);
    socket.on("clipboard-update", handleUpdate);
    socket.on("clipboard-error", handleError);

    return () => {
      socket.off("clipboard-init", handleInit);
      socket.off("clipboard-update", handleUpdate);
      socket.off("clipboard-error", handleError);
    };
  }, [socket, showToast]);

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── Post text snippet ────────────────────────────────────────────────
  // No local mutation — emit only; server will broadcast clipboard-update
  const shareText = () => {
    const title = pasteTitle.trim();
    const content = pasteContent.trim();

    if (!title || !content) {
      showToast("⚠ Title and content are required", "error");
      return;
    }

    socket.emit("clipboard-add", {
      roomId,
      type: "text",
      title,
      content,
      lang: selectedLang,
      time: nowTime(),
    });

    setPasteTitle("");
    setPasteContent("");
    showToast("Snippet shared to session ✓");
  };

  // ── Post files ───────────────────────────────────────────────────────
  const shareFiles = () => {
    if (!pendingFiles.length) return;

    let done = 0;
    const total = pendingFiles.length;

    pendingFiles.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        socket.emit("clipboard-add", {
          roomId,
          type: "file",
          title: f.name,
          size: fmtSize(f.size),
          ext: (f.name.split(".").pop() || "FILE").toUpperCase().slice(0, 5),
          dataUrl: ev.target.result,
          time: nowTime(),
        });

        if (++done === total) {
          setPendingFiles([]);
          if (fileInputRef.current) fileInputRef.current.value = "";
          showToast(`${total} file${total > 1 ? "s" : ""} shared ✓`);
        }
      };
      reader.readAsDataURL(f);
    });
  };

  // ── Delete ───────────────────────────────────────────────────────────
  const deleteItem = (id) => {
    socket.emit("clipboard-delete", { roomId, id });

    // Optimistically collapse the accordion so the UI feels instant,
    // but the actual list update comes from the server broadcast
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (editingId === id) setEditingId(null);
    showToast("Item removed from session");
  };

  // ── Edit ─────────────────────────────────────────────────────────────
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
    setOpenIds((prev) => new Set([...prev, item.id]));
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (id) => {
    const t = editTitle.trim();
    const c = editContent.trim();

    if (!t || !c) {
      showToast("⚠ Both fields are required", "error");
      return;
    }

    // Emit — server will broadcast clipboard-update to everyone
    socket.emit("clipboard-edit", {
      roomId,
      id,
      title: t,
      content: c,
    });

    setEditingId(null);
    showToast("Changes saved ✓");
  };

  // ── Copy ─────────────────────────────────────────────────────────────
  const copyCode = (content, id) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      showToast("Copied to clipboard ✓");
    });
  };

  // ── File drag-and-drop ───────────────────────────────────────────────
  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    setPendingFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const addFiles = (e) => {
    setPendingFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <div style={S.root}>
      <div style={S.topbar}>
        <div style={S.topbarLeft}>
          <div style={S.brandBox}>📋</div>
          <span style={S.brandText}>SESSION CLIPBOARD</span>
        </div>
        <div style={S.topbarCenter}>
          <div style={S.rolePill(isTeacher)}>
            {isTeacher ? "👩‍🏫 TEACHER" : "👨‍🎓 STUDENT"}
          </div>
        </div>
        <div style={S.topbarRight}>
          <span style={S.liveDot} />
          <span style={S.liveText}>LIVE SESSION</span>
        </div>
      </div>

      <div style={S.blobPink} aria-hidden />
      <div style={S.blobBlue} aria-hidden />

      <div style={S.main}>
        {isTeacher && (
          <div style={S.card}>
            <div style={S.cardHeader}>
              <span style={S.cardHeaderLabel}>Post to Clipboard</span>
            </div>

            <div style={S.tabRow}>
              {[
                { key: "text", label: "✎  Text / Code" },
                { key: "file", label: "📁  File Upload" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  style={S.tabBtn(activeTab === key)}
                  onClick={() => setActiveTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {activeTab === "text" && (
              <div style={S.tabPanel}>
                <div style={S.field}>
                  <label style={S.label}>Title</label>
                  <input
                    style={S.input}
                    type="text"
                    placeholder="Give this snippet a name..."
                    maxLength={120}
                    value={pasteTitle}
                    onChange={(e) => setPasteTitle(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
                  />
                </div>

                <div style={S.field}>
                  <label style={S.label}>Language</label>
                  <div style={S.langRow}>
                    {LANG_OPTIONS.map((l) => (
                      <button
                        key={l}
                        style={S.langChip(selectedLang === l)}
                        onClick={() => setSelectedLang(l)}
                      >
                        {l === "plain" ? "Plain" : l}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={S.field}>
                  <label style={S.label}>
                    Content
                    <span style={{ marginLeft: 8, color: "#bbb", fontWeight: 500 }}>
                      {pasteContent.length} / 8000
                    </span>
                  </label>
                  <textarea
                    style={S.textarea}
                    placeholder="Paste your snippet, code, or notes here..."
                    maxLength={8000}
                    rows={7}
                    value={pasteContent}
                    onChange={(e) => setPasteContent(e.target.value)}
                  />
                </div>

                <button style={S.primaryBtn} onClick={shareText}>
                  Share Snippet →
                </button>
              </div>
            )}

            {activeTab === "file" && (
              <div style={S.tabPanel}>
                <div
                  style={S.dropzone(dragOver)}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={S.dropIcon}>📁</div>
                  <div style={S.dropTitle}>
                    {dragOver ? "Drop to add" : "Drop files here"}
                  </div>
                  <div style={S.dropSub}>or click to browse your device</div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={addFiles}
                  />
                </div>

                {pendingFiles.length > 0 && (
                  <div style={S.fileQueue}>
                    <div style={S.label}>
                      {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""} ready
                    </div>
                    {pendingFiles.map((f, i) => (
                      <div key={i} style={S.fileQueueItem}>
                        <span style={S.fileExtBadge}>
                          {(f.name.split(".").pop() || "FILE").toUpperCase().slice(0, 5)}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={S.fileName}>{f.name}</div>
                          <div style={S.fileSize}>{fmtSize(f.size)}</div>
                        </div>
                        <button
                          style={S.removeBtn}
                          onClick={() =>
                            setPendingFiles((prev) => prev.filter((_, j) => j !== i))
                          }
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button style={S.primaryBtn} onClick={shareFiles}>
                      Share {pendingFiles.length} File{pendingFiles.length > 1 ? "s" : ""} →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div style={S.sectionHeader}>
          <span style={S.sectionLabel}>
            {items.length > 0
              ? `${items.length} Item${items.length !== 1 ? "s" : ""} in Session`
              : "Clipboard Feed"}
          </span>
          <div style={S.sectionLine} />
        </div>

        {items.length === 0 ? (
          <div style={S.emptyState}>
            <div style={S.emptyIcon}>📋</div>
            <div style={S.emptyTitle}>Nothing here yet</div>
            <div style={S.emptySub}>
              {isTeacher
                ? "Post a snippet or file above to share with everyone."
                : "Waiting for your teacher to share something..."}
            </div>
          </div>
        ) : (
          <div style={S.feed}>
            {items.map((item) => {
              const isOpen = openIds.has(item.id);
              const isEditing = editingId === item.id;
              const accent = ACCENT_COLORS[item.type] || ACCENT_COLORS.text;

              return (
                <div key={item.id} style={S.feedItem(isOpen, accent)}>
                  <div style={S.itemStripe(accent.bg)} />

                  <div
                    style={S.itemHead}
                    onClick={() => !isEditing && toggleOpen(item.id)}
                  >
                    <span style={S.typeBadge(accent.bg)}>
                      {item.type === "file"
                        ? item.ext
                        : item.lang === "plain"
                        ? "TEXT"
                        : item.lang.toUpperCase()}
                    </span>

                    <span style={S.itemTitle}>{item.title}</span>
                    <span style={S.itemTime}>{item.time}</span>

                    {isTeacher && (
                      <div
                        style={S.itemActions}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.type === "text" && (
                          <button style={S.ghostBtn} onClick={() => startEdit(item)}>
                            Edit
                          </button>
                        )}
                        <button
                          style={S.dangerBtn}
                          onClick={() => deleteItem(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    <span
                      style={{
                        ...S.chevron,
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                      }}
                    >
                      ▾
                    </span>
                  </div>

                  {isOpen && !isEditing && (
                    <div style={S.itemBody}>
                      {item.type === "file" ? (
                        <div>
                          <div style={S.fileDlRow}>
                            <div style={S.fileDlIconWrap(accent.bg)}>📄</div>
                            <div style={{ flex: 1 }}>
                              <div style={S.fileDlName}>{item.title}</div>
                              <div style={S.fileDlMeta}>{item.size}</div>
                            </div>
                          </div>
                          <a
                            href={item.dataUrl}
                            download={item.title}
                            style={{ textDecoration: "none" }}
                          >
                            <button style={S.ghostBtn}>↓ &nbsp;Download</button>
                          </a>
                        </div>
                      ) : (
                        <div>
                          <div style={S.bodyLangTag}>
                            {item.lang === "plain" ? "Plain text" : item.lang}
                          </div>
                          <pre style={S.codeBlock}>{item.content}</pre>
                          <button
                            style={{
                              ...S.ghostBtn,
                              background: copiedId === item.id ? "#111" : "#fff",
                              color: copiedId === item.id ? "#fff" : "#000",
                            }}
                            onClick={() => copyCode(item.content, item.id)}
                          >
                            {copiedId === item.id ? "✓ Copied" : "Copy"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {isOpen && isEditing && (
                    <div style={S.editForm}>
                      <div style={S.editBanner}>✎ &nbsp;Editing this item</div>
                      <div style={S.field}>
                        <label style={S.label}>Title</label>
                        <input
                          style={S.input}
                          type="text"
                          maxLength={120}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </div>
                      <div style={S.field}>
                        <label style={S.label}>Content</label>
                        <textarea
                          style={S.textarea}
                          maxLength={8000}
                          rows={5}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                      </div>
                      <div style={S.editFooter}>
                        <button style={S.ghostBtn} onClick={cancelEdit}>
                          Cancel
                        </button>
                        <button style={S.primaryBtn} onClick={() => saveEdit(item.id)}>
                          Save Changes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast && <div style={S.toast(toast.type)}>{toast.msg}</div>}
    </div>
  );
}

// ── Styles (unchanged from original) ─────────────────────────────────────────
const NB = {
  border: "2px solid #000",
  shadow: "4px 4px 0 #000",
  shadowSm: "2px 2px 0 #000",
  radius: "10px",
  radiusSm: "6px",
  font: "'Sora', 'DM Sans', 'Inter', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
};

const S = {
  root: {
    minHeight: "100%",
    background: "#fafafa",
    fontFamily: NB.font,
    fontSize: 14,
    color: "#111",
    position: "relative",
  },
  blobPink: {
    position: "fixed", top: -120, right: -80, width: 480, height: 480,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,180,180,0.45) 0%, rgba(255,120,180,0.18) 50%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  blobBlue: {
    position: "fixed", bottom: -100, left: -60, width: 420, height: 420,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(130,180,255,0.4) 0%, rgba(160,130,255,0.15) 50%, transparent 70%)",
    pointerEvents: "none", zIndex: 0,
  },
  topbar: {
    background: "linear-gradient(135deg, #1a1a1a 0%, #2d1a3e 60%, #1a1a2e 100%)",
    borderBottom: NB.border,
    padding: "0 28px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 54,
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  topbarLeft: { display: "flex", alignItems: "center", gap: 10 },
  topbarCenter: { display: "flex", alignItems: "center" },
  topbarRight: { display: "flex", alignItems: "center", gap: 6 },
  brandBox: {
    width: 30, height: 30,
    background: "linear-gradient(135deg, #ff6b9d, #ff4d7e)",
    border: "2px solid rgba(255,255,255,0.5)",
    borderRadius: 7, display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 15,
    boxShadow: "2px 2px 0 rgba(0,0,0,0.4)",
  },
  brandText: {
    fontFamily: NB.mono, fontSize: 12, fontWeight: 700,
    letterSpacing: "0.1em", color: "#fff",
  },
  rolePill: (isTeacher) => ({
    fontSize: 10, fontWeight: 900, letterSpacing: "0.12em",
    background: isTeacher
      ? "linear-gradient(135deg, #ff6b9d, #ff4d7e)"
      : "linear-gradient(135deg, #6b8eff, #4d6eff)",
    color: "#fff",
    border: "2px solid rgba(255,255,255,0.4)",
    borderRadius: NB.radiusSm, padding: "5px 13px",
    boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
  }),
  liveDot: {
    display: "inline-block", width: 7, height: 7, borderRadius: "50%",
    background: "#22C55E", boxShadow: "0 0 6px #22C55E",
  },
  liveText: { fontFamily: NB.mono, fontSize: 10, letterSpacing: "0.1em", color: "#aaa" },
  main: {
    position: "relative", zIndex: 1,
    maxWidth: 760, margin: "32px auto", padding: "0 24px 80px",
  },
  card: {
    background: "#fff", border: NB.border, borderRadius: NB.radius,
    boxShadow: NB.shadow, marginBottom: 32, overflow: "hidden",
  },
  cardHeader: {
    background: "linear-gradient(135deg, #1a1a1a 0%, #2d1a3e 100%)",
    padding: "12px 22px", borderBottom: NB.border,
    display: "flex", alignItems: "center", gap: 10,
  },
  cardHeaderLabel: {
    fontSize: 10, fontWeight: 900, letterSpacing: "0.2em",
    textTransform: "uppercase", color: "#fff",
  },
  tabRow: { display: "flex", borderBottom: NB.border, background: "#f5f5f5" },
  tabBtn: (active) => ({
    fontFamily: NB.font, fontSize: 12,
    fontWeight: active ? 900 : 700,
    padding: "13px 24px",
    background: active ? "#fff" : "transparent",
    border: "none",
    borderBottom: active ? "2.5px solid #000" : "2.5px solid transparent",
    borderRight: "1px solid #e0e0e0",
    cursor: "pointer",
    color: active ? "#000" : "#999",
    letterSpacing: "0.02em", marginBottom: -2, transition: "all 0.12s",
  }),
  tabPanel: { padding: "22px 24px" },
  field: { marginBottom: 16 },
  label: {
    display: "block", fontSize: 9, fontWeight: 900,
    letterSpacing: "0.15em", textTransform: "uppercase",
    color: "#888", marginBottom: 7,
  },
  input: {
    width: "100%", padding: "10px 14px", border: NB.border,
    borderRadius: NB.radiusSm, fontFamily: NB.font, fontSize: 14,
    fontWeight: 600, background: "#fff", outline: "none",
    boxShadow: NB.shadowSm, boxSizing: "border-box",
  },
  textarea: {
    width: "100%", padding: "10px 14px", border: NB.border,
    borderRadius: NB.radiusSm, fontFamily: NB.mono, fontSize: 13,
    lineHeight: 1.7, resize: "vertical", background: "#fff",
    outline: "none", boxShadow: NB.shadowSm, boxSizing: "border-box",
  },
  langRow: { display: "flex", flexWrap: "wrap", gap: 7 },
  langChip: (active) => ({
    fontSize: 10, fontWeight: 900, letterSpacing: "0.06em",
    padding: "5px 13px",
    background: active ? "#000" : "#fff",
    color: active ? "#fff" : "#555",
    border: NB.border, borderRadius: NB.radiusSm, cursor: "pointer",
    transition: "all 0.12s", boxShadow: active ? NB.shadowSm : "none",
  }),
  primaryBtn: {
    padding: "11px 24px", background: "#000", color: "#fff",
    border: NB.border, borderRadius: NB.radiusSm, fontFamily: NB.font,
    fontSize: 13, fontWeight: 900, letterSpacing: "0.04em", cursor: "pointer",
    boxShadow: NB.shadow, display: "inline-flex", alignItems: "center",
    gap: 6, marginTop: 4,
  },
  ghostBtn: {
    padding: "8px 16px", background: "#fff", color: "#000",
    border: NB.border, borderRadius: NB.radiusSm, fontFamily: NB.font,
    fontSize: 11, fontWeight: 800, cursor: "pointer",
    boxShadow: NB.shadowSm, marginRight: 8,
  },
  dangerBtn: {
    padding: "6px 14px", background: "#fff0f0", color: "#c00",
    border: "2px solid #c00", borderRadius: NB.radiusSm, fontFamily: NB.font,
    fontSize: 11, fontWeight: 800, cursor: "pointer",
    boxShadow: "2px 2px 0 #c00",
  },
  dropzone: (over) => ({
    border: over ? "2px dashed #000" : "2px dashed #ccc",
    borderRadius: NB.radius, padding: "40px 20px", textAlign: "center",
    cursor: "pointer", background: over ? "#f0f4ff" : "#f8f8f8",
    marginBottom: 16, transition: "all 0.15s",
  }),
  dropIcon: { fontSize: 30, marginBottom: 10 },
  dropTitle: { fontWeight: 900, fontSize: 15, color: "#333", marginBottom: 4 },
  dropSub: { fontSize: 12, color: "#aaa" },
  fileQueue: { display: "flex", flexDirection: "column", gap: 8, marginBottom: 4 },
  fileQueueItem: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 14px", border: NB.border, borderRadius: 8,
    background: "#fff", boxShadow: NB.shadowSm,
  },
  fileExtBadge: {
    fontSize: 9, fontFamily: NB.mono, fontWeight: 900,
    letterSpacing: "0.05em", background: "#6b8eff", color: "#fff",
    border: NB.border, borderRadius: 4, padding: "3px 7px", flexShrink: 0,
  },
  fileName: { fontWeight: 800, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  fileSize: { fontSize: 10, color: "#aaa", fontFamily: NB.mono },
  removeBtn: {
    background: "none", border: "none", cursor: "pointer",
    fontSize: 15, color: "#c00", fontWeight: 900, padding: "2px 6px",
  },
  sectionHeader: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
  sectionLabel: {
    fontFamily: NB.mono, fontSize: 9, fontWeight: 900,
    letterSpacing: "0.18em", textTransform: "uppercase",
    color: "#999", flexShrink: 0,
  },
  sectionLine: { flex: 1, height: 2, background: "#000", borderRadius: 1 },
  emptyState: {
    textAlign: "center", padding: "64px 20px", border: NB.border,
    borderRadius: NB.radius, background: "#fff", boxShadow: NB.shadow,
  },
  emptyIcon: { fontSize: 40, marginBottom: 14, opacity: 0.3 },
  emptyTitle: { fontSize: 18, fontWeight: 900, color: "#333", marginBottom: 8 },
  emptySub: { fontSize: 13, color: "#aaa", lineHeight: 1.7 },
  feed: { display: "flex", flexDirection: "column", gap: 12 },
  feedItem: (isOpen, accent) => ({
    border: NB.border, borderRadius: NB.radius,
    background: isOpen ? accent.light : "#fff",
    boxShadow: isOpen ? NB.shadow : NB.shadowSm,
    overflow: "hidden", position: "relative",
  }),
  itemStripe: (color) => ({
    position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: color,
  }),
  itemHead: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "14px 18px 14px 22px", cursor: "pointer", userSelect: "none",
  },
  typeBadge: (color) => ({
    fontSize: 9, fontFamily: NB.mono, fontWeight: 900,
    letterSpacing: "0.07em", background: color, color: "#fff",
    border: NB.border, borderRadius: 4, padding: "3px 7px",
    flexShrink: 0, boxShadow: "1px 1px 0 #000",
  }),
  itemTitle: {
    flex: 1, fontWeight: 800, fontSize: 14, letterSpacing: "-0.01em",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  itemTime: { fontFamily: NB.mono, fontSize: 10, color: "#bbb", flexShrink: 0 },
  itemActions: { display: "flex", gap: 4, flexShrink: 0 },
  chevron: {
    fontSize: 16, color: "#888", flexShrink: 0,
    transition: "transform 0.18s", display: "inline-block",
  },
  itemBody: {
    padding: "16px 20px 18px", borderTop: NB.border,
    background: "rgba(255,255,255,0.6)", backdropFilter: "blur(4px)",
  },
  bodyLangTag: {
    fontFamily: NB.mono, fontSize: 9, fontWeight: 800,
    letterSpacing: "0.14em", textTransform: "uppercase",
    color: "#aaa", marginBottom: 8,
  },
  codeBlock: {
    fontFamily: NB.mono, fontSize: 13, lineHeight: 1.75,
    background: "#111", color: "#e8e8e8", border: NB.border,
    borderRadius: 8, padding: "14px 16px", overflowX: "auto",
    whiteSpace: "pre-wrap", wordBreak: "break-word",
    marginBottom: 12, boxShadow: NB.shadowSm,
  },
  fileDlRow: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "12px 16px", border: NB.border, borderRadius: 8,
    background: "#fff", boxShadow: NB.shadowSm, marginBottom: 12,
  },
  fileDlIconWrap: (color) => ({
    width: 38, height: 38, background: color, border: NB.border,
    borderRadius: 8, display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 18, flexShrink: 0, boxShadow: NB.shadowSm,
  }),
  fileDlName: { fontWeight: 800, fontSize: 14, letterSpacing: "-0.01em" },
  fileDlMeta: { fontFamily: NB.mono, fontSize: 10, color: "#aaa", marginTop: 2 },
  editForm: { padding: "18px 20px", borderTop: NB.border, background: "#fffbf0" },
  editBanner: {
    fontSize: 10, fontWeight: 900, letterSpacing: "0.14em",
    textTransform: "uppercase", color: "#e6a800",
    marginBottom: 16, display: "flex", alignItems: "center", gap: 6,
  },
  editFooter: { display: "flex", gap: 8, marginTop: 14 },
  toast: (type) => ({
    position: "fixed", bottom: 28, right: 28,
    background: type === "error" ? "#c00" : "#111",
    color: "#fff",
    border: `2px solid ${type === "error" ? "#900" : "#000"}`,
    borderRadius: 10, padding: "12px 22px", fontWeight: 800,
    fontSize: 13, letterSpacing: "0.02em",
    boxShadow: `4px 4px 0 ${type === "error" ? "#900" : "#555"}`,
    zIndex: 9999, maxWidth: 320, lineHeight: 1.4,
  }),
};