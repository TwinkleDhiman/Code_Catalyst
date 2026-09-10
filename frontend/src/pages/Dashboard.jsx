import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../App";

import Overview from "./Overview";
import UploadProject from "./UploadProject";
import Analysis from "./Analysis";
import DependencyGraph from "./DependencyGraph";
import Architecture from "./Architecture";
import SecurityAudit from "./SecurityAudit";
import TechnicalDebt from "./TechnicalDebt";
import Reports from "./Reports";

const Dashboard = () => {
  const { user, logout, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const fetchProjects = async (selectLatest = false) => {
    try {
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        if (data.length > 0 && (selectLatest || selectedProjectId === null)) {
          setSelectedProjectId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch projects", e);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    const parts = location.pathname.split("/");
    const lastPart = parts[parts.length - 1];
    if (lastPart && projects.some((p) => p.id === lastPart)) {
      setSelectedProjectId(lastPart);
    }
  }, [location.pathname, projects]);

  const handleProjectSelect = (id) => {
    setSelectedProjectId(id);
    setProjectDropdownOpen(false);
    const pathParts = location.pathname.split("/");
    if (pathParts.length > 3) {
      const pageType = pathParts[2];
      navigate(`/dashboard/${pageType}/${id}`);
    } else {
      navigate(`/dashboard/security/${id}`);
    }
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  const navLinks = [
    { label: "Overview", path: "/dashboard", category: "general" },
    {
      label: "Upload Repository",
      path: "/dashboard/upload",
      category: "general",
    },
    {
      label: "Security Audit",
      path: `/dashboard/security/${selectedProjectId}`,
      category: "project",
    },
    {
      label: "Technical Debt",
      path: `/dashboard/debt/${selectedProjectId}`,
      category: "project",
    },
    {
      label: "Dependency Graph",
      path: `/dashboard/dependencies/${selectedProjectId}`,
      category: "project",
    },
    {
      label: "Architecture Graph",
      path: `/dashboard/architecture/${selectedProjectId}`,
      category: "project",
    },
    {
      label: "Reports & Export",
      path: `/dashboard/reports/${selectedProjectId}`,
      category: "project",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-gray-100 flex flex-col">
      <header className="bg-gray-950/70 border-b border-gray-900 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4 border-b border-gray-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20 text-white font-bold text-xs">
              C
            </div>
            <div>
              <span className="font-bold text-sm tracking-wide text-white block">
                CodeCatalyst
              </span>
              <span className="text-[9px] text-gray-400 font-mono tracking-wider uppercase">
                Rule Engine v2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative min-w-[200px]">
              {projects.length === 0 ? (
                <Link
                  to="/dashboard/upload"
                  className="w-full text-left px-3 py-2 rounded-xl border border-dashed border-gray-800 hover:border-primary-500 text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1.5 transition-colors"
                >
                  Upload first project
                </Link>
              ) : (
                <>
                  <button
                    onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                    className="w-full bg-gray-900 hover:bg-gray-800/80 border border-gray-800 rounded-xl px-3 py-2 text-xs text-left font-semibold flex items-center justify-between gap-2 transition-colors"
                  >
                    <span className="truncate">
                      {activeProject ? activeProject.name : "Select Project"}
                    </span>
                    <span className="text-gray-500 flex-shrink-0 text-[10px]">v</span>
                  </button>

                  {projectDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-full bg-gray-900 border border-gray-800 rounded-xl shadow-2xl py-1.5 z-40 max-h-48 overflow-y-auto">
                      {projects.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleProjectSelect(p.id)}
                          className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-primary-950/40 hover:text-primary-400 ${selectedProjectId === p.id ? "text-primary-400 font-bold bg-primary-950/20" : "text-gray-300"}`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-gray-900">
              <div className="w-8 h-8 rounded-full bg-primary-900/40 flex items-center justify-center text-primary-300 font-bold text-xs flex-shrink-0">
                {user ? user.fullname.charAt(0).toUpperCase() : "C"}
              </div>
              <div className="hidden sm:block overflow-hidden max-w-[120px]">
                <p className="text-xs font-semibold truncate text-gray-200">
                  {user?.fullname}
                </p>
                <p className="text-[10px] text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 px-3 rounded-lg bg-gray-900 hover:bg-red-950/30 text-gray-500 hover:text-red-400 transition-colors text-xs font-bold"
                title="Sign Out"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <nav className="max-w-7xl mx-auto px-6 py-2.5 flex flex-wrap items-center justify-center gap-2">
          {navLinks.map((link) => {
            const isGeneral = link.category === "general";
            const isActive = isGeneral
              ? location.pathname === link.path
              : location.pathname.startsWith(
                  link.path.split("/").slice(0, 3).join("/"),
                );
            return (
              <Link
                key={link.label}
                to={link.path}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  isActive
                    ? "bg-primary-950/40 text-primary-400 border border-primary-900/50"
                    : "text-gray-400 hover:text-white hover:bg-gray-900/40"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="flex-1 relative overflow-y-auto">
        <Routes>
          <Route
            path="/"
            element={
              <Overview
                projects={projects}
                loading={loadingProjects}
                fetchProjects={fetchProjects}
              />
            }
          />
          <Route
            path="/upload"
            element={<UploadProject fetchProjects={fetchProjects} />}
          />
          <Route path="/security/:id" element={<SecurityAudit />} />
          <Route path="/debt/:id" element={<TechnicalDebt />} />
          <Route path="/analysis/:id" element={<Analysis />} />
          <Route path="/dependencies/:id" element={<DependencyGraph />} />
          <Route path="/architecture/:id" element={<Architecture />} />
          <Route path="/reports/:id" element={<Reports />} />
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
