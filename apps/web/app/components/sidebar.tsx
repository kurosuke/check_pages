"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Gauge, Globe2, Bell, Users, Settings, FolderPlus, ChevronDown, ChevronRight } from "lucide-react";
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

  const getProjectLinks = (projectId: string) => [
    { href: `/projects/${projectId}/urls`, label: "URL一覧", icon: Globe2 },
    { href: `/projects/${projectId}/settings`, label: "通知設定", icon: Bell },
    { href: `/projects/${projectId}/members`, label: "メンバー", icon: Users },
  ];

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
                    <div key={project.id} className="project-item">
                      <Link
                        href={`/projects/${project.id}/urls`}
                        className={`project-name ${currentProjectId === project.id ? "active" : ""}`}
                      >
                        {project.name}
                      </Link>
                      {currentProjectId === project.id && (
                        <div className="project-subnav">
                          {getProjectLinks(project.id).map((item) => {
                            const Icon = item.icon;
                            const active = pathname === item.href;
                            return (
                              <Link key={item.href} href={item.href} className={active ? "active" : ""}>
                                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                                  <Icon size={14} />
                                  {item.label}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
                
                <button className="create-project-btn" onClick={() => setShowCreateModal(true)}>
                  <FolderPlus size={14} />
                  新規プロジェクト
                </button>
              </div>
            )}
          </div>

          <Link href="/settings" className={pathname === "/settings" ? "active" : ""}>
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
          margin: 8px 0;
        }
        .nav-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background: none;
          border: none;
          color: var(--muted);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 8px 12px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .nav-section-header:hover {
          color: var(--text);
        }
        .project-count {
          background: var(--border);
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 11px;
        }
        .project-list {
          padding-left: 0;
        }
        .project-item {
          margin-bottom: 2px;
        }
        .project-name {
          display: block;
          padding: 8px 12px 8px 24px;
          color: var(--text);
          text-decoration: none;
          border-radius: 6px;
          font-size: 14px;
          transition: background 0.2s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .project-name:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .project-name.active {
          background: rgba(255, 255, 255, 0.1);
          color: var(--info);
        }
        .project-subnav {
          padding-left: 24px;
          border-left: 1px solid var(--border);
          margin-left: 24px;
        }
        .project-subnav :global(a) {
          display: block;
          padding: 6px 12px;
          color: var(--muted);
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s;
        }
        .project-subnav :global(a:hover) {
          color: var(--text);
        }
        .project-subnav :global(a.active) {
          color: var(--info);
        }
        .loading-text,
        .empty-text {
          padding: 8px 12px 8px 24px;
          color: var(--muted);
          font-size: 13px;
        }
        .create-project-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          width: calc(100% - 24px);
          margin: 8px 12px;
          padding: 8px 12px;
          background: rgba(59, 130, 246, 0.1);
          border: 1px dashed var(--info);
          border-radius: 6px;
          color: var(--info);
          font-size: 13px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .create-project-btn:hover {
          background: rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </>
  );
}
