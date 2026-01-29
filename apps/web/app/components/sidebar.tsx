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
          background: #e5e7eb;
          color: var(--text);
          padding: 2px 7px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .project-list {
          padding-left: 0;
          margin-top: 8px;
        }
        .project-item {
          margin-bottom: 12px;
        }
        .project-name {
          display: block;
          padding: 8px 12px;
          color: #6b7280;
          text-decoration: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 6px;
        }
        .project-name:hover {
          background: #f9fafb;
          color: var(--text);
        }
        .project-name.active {
          background: #f3f4f6;
          color: var(--text);
          font-weight: 500;
        }
        .project-subnav {
          padding-left: 20px;
          margin-left: 12px;
          margin-top: 6px;
          margin-bottom: 8px;
          padding-top: 4px;
          padding-bottom: 4px;
        }
        .project-subnav :global(a) {
          display: block;
          padding: 6px 12px;
          color: #9ca3af;
          text-decoration: none;
          font-size: 12px;
          font-weight: 400;
          transition: all 0.2s;
          border-radius: 6px;
          margin-bottom: 2px;
        }
        .project-subnav :global(a:hover) {
          color: var(--text);
          background: #f9fafb;
        }
        .project-subnav :global(a.active) {
          color: var(--primary);
          background: #f0f9ff;
          font-weight: 500;
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
          margin: 12px 12px 8px 12px;
          padding: 10px 12px;
          background: #f0f9ff;
          border: none;
          border-radius: 6px;
          color: var(--primary);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .create-project-btn:hover {
          background: #e0f2fe;
        }
      `}</style>
    </>
  );
}
