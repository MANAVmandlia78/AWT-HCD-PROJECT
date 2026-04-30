import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { storage } from "../firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "../Styles/materials.css";

// Helper — detect file type for badge
const getFileType = (fileName) => {
  if (!fileName) return "file";
  const ext = fileName.split(".").pop().toLowerCase();
  if (["ppt", "pptx"].includes(ext)) return "ppt";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "doc";
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return "img";
  return "file";
};

const getFileTypeLabel = (type) => {
  const labels = { ppt: "PPT", pdf: "PDF", doc: "DOC", img: "IMG", file: "FILE" };
  return labels[type] || "FILE";
};

const TeacherMaterials = () => {
  const { id } = useParams(); // courseId
  const [materials, setMaterials] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => { fetchMaterials(); }, [id]);

const fetchMaterials = async () => {
  try {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/materials/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setMaterials(res.data);
  } catch (err) { 
    console.log(err); 
  }
};

  const handleUpload = async () => {
    if (!title || !file) { alert("Title and file required"); return; }

    setUploading(true);
    setProgress(0);

    const storageRef = ref(storage, `materials/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setProgress(pct);
      },
      (error) => {
        console.log(error);
        alert("Upload failed ❌");
        setUploading(false);
      },
      async () => {
        const fileUrl = await getDownloadURL(uploadTask.snapshot.ref);

        try {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/materials`,
            {
              title,
              description,
              file_url: fileUrl,
              file_name: file.name,
              file_type: getFileType(file.name),
              course_id: id,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          alert("Material uploaded ✅");
          setTitle("");
          setDescription("");
          setFile(null);
          setProgress(0);
          fetchMaterials();
        } catch (err) {
          console.log(err);
          alert("Failed to save material ❌");
        } finally {
          setUploading(false);
        }
      }
    );
  };

  const handleDelete = async (materialId) => {
  if (!window.confirm("Delete this material?")) return;

  try {
    await axios.delete(
      `${import.meta.env.VITE_API_URL}/api/materials/${materialId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setMaterials((prev) => prev.filter((m) => m.id !== materialId));
  } catch (err) {
    console.log(err);
    alert("Failed to delete ❌");
  }
};

  return (
    <div className="materials-container">
      <div className="gradient-mid" />
      

      <span className="materials-page-title">Course Materials</span>
      <button
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        ⬅ Back
      </button>

      {/* ── Upload Card ── */}
      <div className="materials-upload-card">
        
        <div className="materials-card-topbar">
          <span className="materials-card-label">Upload Material</span>
        </div>

        <div className="materials-card-body">
          <div className="mat-field">
            <label>Title</label>
            <input
              type="text"
              placeholder="e.g. Week 3 - Lecture Slides"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mat-field">
            <label>Description (optional)</label>
            <textarea
              rows={2}
              placeholder="Brief description of the material..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* File picker */}
          <div className="mat-file-wrapper">
            <label className="mat-file-btn">
              📎 Choose File
              <input
                type="file"
                accept=".ppt,.pptx,.pdf,.doc,.docx,.png,.jpg,.jpeg"
                onChange={(e) => setFile(e.target.files[0] || null)}
              />
            </label>
            <span className={`mat-file-name ${file ? "selected" : ""}`}>
              {file ? `✓ ${file.name}` : "No file chosen — PPT, PDF, DOC, IMG supported"}
            </span>
          </div>

          {/* Progress bar — shown while uploading */}
          {uploading && (
            <div className="mat-progress-wrap">
              <div className="mat-progress-header">
                <span className="mat-progress-label">
                  <span className="mat-pulse-dot" />
                  Uploading {file?.name}
                </span>
                <span className="mat-progress-pct">{progress}%</span>
              </div>
              <div className="mat-progress-track">
                <div className="mat-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button
            className="mat-upload-btn"
            onClick={handleUpload}
            disabled={!title || !file || uploading}
          >
            {uploading ? `Uploading ${progress}%...` : "Upload Material"}
          </button>
        </div>
      </div>

      {/* ── Materials List ── */}
      <div className="materials-list-section">
        <p className="materials-list-heading">Uploaded Materials</p>

        <div className="materials-list">
          {materials.length === 0 ? (
            <div className="materials-empty">No materials uploaded yet</div>
          ) : (
            materials.map((m) => {
              const fileType = m.file_type || getFileType(m.file_name || "");
              return (
                <div key={m.id} className="material-item">
                  <div className="material-item-topbar">
                    <div className="material-item-topbar-left">
                      <div className="material-item-dot" />
                      <span className="material-item-title">{m.title}</span>
                    </div>
                    <span className={`material-type-badge ${fileType}`}>
                      {getFileTypeLabel(fileType)}
                    </span>
                  </div>

                  <div className="material-item-body">
                    <div className="material-item-info">
                      {m.description && (
                        <p className="material-item-desc">{m.description}</p>
                      )}
                      <span className="material-item-meta">
                        {m.file_name && `${m.file_name} · `}
                        {new Date(m.created_at).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </span>
                    </div>

                    <div className="material-item-actions">
                      <a
                        className="mat-open-btn"
                        href={m.file_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📂 Open
                      </a>
                      <button
                        className="mat-delete-btn"
                        onClick={() => handleDelete(m.id)}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherMaterials;