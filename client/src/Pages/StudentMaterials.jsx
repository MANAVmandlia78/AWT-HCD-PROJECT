import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "../Styles/materials.css";

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

const getFileIcon = (type) => {
  const icons = { ppt: "📊", pdf: "📄", doc: "📝", img: "🖼", file: "📁" };
  return icons[type] || "📁";
};

const StudentMaterials = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

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
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="materials-container">
      <div className="gradient-mid" />

      {/* 🔙 Back Button */}
      <button
        className="back-btn"
        onClick={() => navigate(-1)}
      >
        ⬅ Back
      </button>

      <div className="materials-list-section">
        <p className="materials-list-heading">Materials from your teacher</p>

        <div className="materials-list">
          {loading ? (
            <div className="materials-empty">Loading materials...</div>
          ) : materials.length === 0 ? (
            <div className="materials-empty">No materials uploaded yet</div>
          ) : (
            materials.map((m) => {
              const fileType = m.file_type || getFileType(m.file_name || "");
              return (
                <div key={m.id} className="material-item">
                  <div className="material-item-topbar">
                    <div className="material-item-topbar-left">
                      <div className="material-item-dot" />
                      <span className="material-item-title">
                        {getFileIcon(fileType)} {m.title}
                      </span>
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
                        Uploaded by {m.teacher_name} ·{" "}
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

export default StudentMaterials;