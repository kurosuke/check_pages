"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gauge, Settings, FolderPlus, ChevronDown, ChevronRight, Folder } from "lucide-react";
import { useState, useEffect } from "react";
import { CreateProjectModal } from "./create-project-modal";

interface Project {
  id: string;
  name: string;
  created_at: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  // Extract current project ID from pathname
  const currentProjectId = pathname.match(/\/projects\/([^/]+)/)?.[1];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      if (response.ok && data.data) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (project: { id: string; name: string }) => {
    setProjects([{ ...project, created_at: new Date().toISOString() }, ...projects]);
    // Navigate to the new project
    router.push(`/projects/${project.id}/urls`);
  };

  return (
    <>
      <aside className="sidebar">
        <h1>Check Pages</h1>
        <nav className="nav">
          <Link href="/" className={pathname === "/" ? "active" : ""}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Gauge size={16} />
              ダッシュボード
            </span>
          </Link>

          {/* Projects Section */}
          <div className="nav-section">
            <button
              className="nav-section-header"
              onClick={() => setProjectsExpanded(!projectsExpanded)}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {projectsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                プロジェクト
              </span>
              <span className="project-count">{projects.length}</span>
            </button>

            {projectsExpanded && (
              <div className="project-list">
                {loading ? (
                  <div className="loading-text">読み込み中...</div>
                ) : projects.length === 0 ? (
                  <div className="empty-text">プロジェクトがありません</div>
                ) : (
                  projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}/urls`}
                      className={`project-name ${currentProjectId === project.id ? "active" : ""}`}
                    >
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <Folder size={14} />
                        {project.name}
                      </span>
                    </Link>
                  ))
                )}

                <button className="create-project-btn" onClick={() => setShowCreateModal(true)}>
                  <FolderPlus size={14} />
                  新規プロジェクト
                </button>
              </div>
            )}
          </div>

          <Link href="/settings" className={pathname === "/settings" || pathname.startsWith("/settings/") ? "active" : ""}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Settings size={16} />
              全体設定
            </span>
          </Link>
        </nav>
      </aside>

      <CreateProjectModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleProjectCreated}
      />

      <style jsx>{`
        .nav-section {
          margin: 20px 0 24px 0;
        }
        .nav-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: none;
          border: none;
          color: var(--muted);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-section-header:hover {
          color: var(--text);
        }
        .project-count {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text);
          padding: 2px 7px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          border: 1px solid var(--border);
        }
        .project-list {
          padding-left: 0;
          margin-top: 8px;
        }
        .project-name {
          display: block;
          padding: 8px 12px;
          color: var(--muted);
          text-decoration: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 4px;
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.02);
        }
        .project-name:hover {
          color: var(--text);
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(255, 255, 255, 0.12);
        }
        .project-name.active {
          color: var(--text);
          background: radial-gradient(circle at 20% 20%, rgba(140, 240, 179, 0.22), transparent 55%),
            radial-gradient(circle at 80% 0%, rgba(86, 215, 255, 0.18), transparent 52%),
            rgba(255, 255, 255, 0.06);
          border-color: rgba(140, 240, 179, 0.35);
          box-shadow: 0 12px 32px rgba(140, 240, 179, 0.3);
          font-weight: 600;
        }
        .loading-text,
        .empty-text {
          padding: 8px 12px;
          color: var(--muted);
          font-size: 13px;
          font-style: italic;
        }
        .create-project-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: calc(100% - 24px);
          margin: 22px 12px 8px 12px;
          padding: 10px 12px;
          background: linear-gradient(135deg, rgba(140, 240, 179, 0.16), rgba(86, 215, 255, 0.16));
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }
        .create-project-btn:hover {
          transform: translateY(-1px);
          background: linear-gradient(135deg, rgba(140, 240, 179, 0.2), rgba(86, 215, 255, 0.22));
          box-shadow: 0 16px 34px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </>
  );
}
