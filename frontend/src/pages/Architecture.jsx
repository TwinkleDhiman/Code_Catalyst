import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../App";

// Category color mapping for architecture components
const categoryColors = {
  Frontend: { bg: "bg-blue-950/40", border: "border-blue-900/60", text: "text-blue-400" },
  Backend: { bg: "bg-violet-950/40", border: "border-violet-900/60", text: "text-violet-400" },
  Controller: { bg: "bg-primary-950/40", border: "border-primary-900/60", text: "text-primary-400" },
  Routes: { bg: "bg-emerald-950/40", border: "border-emerald-900/60", text: "text-emerald-400" },
  "Data Model": { bg: "bg-amber-950/40", border: "border-amber-900/60", text: "text-amber-400" },
  Middleware: { bg: "bg-orange-950/40", border: "border-orange-900/60", text: "text-orange-400" },
  Service: { bg: "bg-cyan-950/40", border: "border-cyan-900/60", text: "text-cyan-400" },
  Utility: { bg: "bg-indigo-950/40", border: "border-indigo-900/60", text: "text-indigo-400" },
  Configuration: { bg: "bg-gray-900", border: "border-gray-800", text: "text-gray-400" },
  Tests: { bg: "bg-pink-950/40", border: "border-pink-900/60", text: "text-pink-400" },
  "Static Assets": { bg: "bg-teal-950/40", border: "border-teal-900/60", text: "text-teal-400" },
  Module: { bg: "bg-gray-900", border: "border-gray-800", text: "text-gray-300" },
};

// File Explorer Component
const FileExplorer = ({ root }) => {
  const [currentPath, setCurrentPath] = useState([root]);
  const currentFolder = currentPath[currentPath.length - 1];

  const navigateTo = (node, pathArray) => {
    if (node.type === "folder") {
      setCurrentPath(pathArray);
    }
  };

  const navigateUp = (index) => {
    setCurrentPath(currentPath.slice(0, index + 1));
  };

  const SidebarTree = ({ node, pathArray, level = 0 }) => {
    const isCurrentPath = currentPath.some(n => n.path === node.path);
    const [isOpen, setIsOpen] = useState(isCurrentPath || level === 0);

    useEffect(() => {
      if (currentPath.some(n => n.path === node.path)) {
        setIsOpen(true);
      }
    }, [currentPath, node.path]);

    if (!node || node.type === "file") return null;

    const isActive = currentFolder?.path === node.path;

    return (
      <div>
        <div 
          className={`flex items-center gap-1 py-1.5 px-2 hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-primary-900/30' : ''}`}
          style={{ paddingLeft: `${level * 12 + 4}px` }}
          onClick={() => {
            setIsOpen(true);
            navigateTo(node, pathArray);
          }}
        >
          <div 
            className="p-1 cursor-pointer hover:bg-gray-700 rounded"
            onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          >
            <svg className={`w-3.5 h-3.5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </div>
          <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
          <span className={`text-sm truncate font-medium ${isActive ? 'text-primary-400' : 'text-gray-300'}`}>{node.name}</span>
        </div>
        {isOpen && node.children && (
          <div className="flex flex-col">
            {node.children.filter(c => c.type === "folder").map((child, idx) => (
              <SidebarTree key={idx} node={child} pathArray={[...pathArray, child]} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!root || !root.children) return null;

  return (
    <div className="glass-panel border border-gray-900 rounded-3xl overflow-hidden mt-8 flex flex-col md:flex-row min-h-[400px]">
      {/* Sidebar Tree */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-black/40 border-r border-gray-900 p-4 overflow-y-auto max-h-[600px]">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Explorer</h3>
        <SidebarTree node={root} pathArray={[root]} />
      </div>

      {/* Main Content */}
      <div className="w-full md:w-2/3 lg:w-3/4 p-6 bg-gray-900/10 flex flex-col">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-6 bg-gray-900/50 p-3 rounded-xl overflow-x-auto border border-gray-800">
          {currentPath.map((node, idx) => (
            <React.Fragment key={idx}>
              <button 
                onClick={() => navigateUp(idx)}
                className="text-sm font-semibold text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
              >
                {idx === 0 ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> : node.name}
              </button>
              {idx < currentPath.length - 1 && (
                <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Folder Contents */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2 max-h-[500px]">
          {currentFolder?.children && currentFolder.children.length > 0 ? (
            currentFolder.children.map((child, idx) => (
              <div 
                key={idx}
                onClick={() => {
                  if (child.type === 'folder') {
                    navigateTo(child, [...currentPath, child]);
                  }
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border ${child.type === 'folder' ? 'bg-gray-800/40 border-gray-700 hover:bg-gray-700/80 cursor-pointer shadow-sm' : 'bg-gray-900/40 border-gray-800/60 cursor-default'} transition-all`}
              >
                {child.type === 'folder' ? (
                  <svg className="w-6 h-6 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                ) : (
                  <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                )}
                <span className="text-sm font-medium text-gray-200 truncate" title={child.name}>{child.name}</span>
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 flex flex-col items-center justify-center text-center space-y-3">
              <svg className="w-12 h-12 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
              <p className="text-sm text-gray-500">This folder is empty.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Architecture = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchArchitecture = async () => {
      // Allow fetching without ID to trigger default userProjects logic or empty state
      try {
        const url = id ? `/api/architecture/${id}` : `/api/architecture`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          setData(result.data || result);
        } else {
          const errData = await res.json().catch(() => null);
          setError(errData?.message || "Failed to load architecture data.");
        }
      } catch (e) {
        console.error("Failed to fetch architecture data", e);
        setError("Network error. Could not load architecture data.");
      } finally {
        setLoading(false);
      }
    };
    fetchArchitecture();
  }, [id, token]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="p-6 rounded-2xl bg-red-950/40 border border-red-900/60 text-red-300 text-sm font-semibold">
          {error}
        </div>
      </div>
    );
  }

  const components = data?.components || [];
  const connections = data?.connections || [];
  const message = data?.message || null;
  const root = data?.root || null;
  const hasProject = data?.hasProject !== false;

  // Group components by category for display
  const grouped = {};
  components.forEach((c) => {
    if (!grouped[c.category]) grouped[c.category] = [];
    grouped[c.category].push(c);
  });

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="border-b border-gray-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Architecture Visualization
        </h1>
        <p className="text-sm text-gray-400 mt-1 font-medium">
          Folder structure and module relationships detected in the uploaded repository.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-gray-800">
          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            Detected Components
          </span>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {components.length}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6 border border-gray-800">
          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            Component Categories
          </span>
          <div className="mt-2 text-3xl font-extrabold text-primary-400">
            {Object.keys(grouped).length}
          </div>
        </div>
      </div>

      {/* Empty States */}
      {!hasProject ? (
        <div className="glass-panel border border-gray-900 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4">
          <svg className="w-16 h-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-300">
            No Repository Uploaded
          </h2>
          <p className="text-sm text-gray-500 max-w-md">
            {message || "Upload a repository ZIP file to generate architecture information."}
          </p>
        </div>
      ) : components.length === 0 && (!root || !root.children || root.children.length === 0) ? (
        <div className="glass-panel border border-gray-900 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4">
          <svg className="w-16 h-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-300">
            No Architecture Data
          </h2>
          <p className="text-sm text-gray-500 max-w-md">
            {message || "Upload a ZIP file or run analysis to generate architecture information from your repository structure."}
          </p>
        </div>
      ) : (
        <>
          {/* File Explorer (Folder Structure + Breadcrumbs) */}
          {root && <FileExplorer root={root} />}

          {/* Component Groups */}
          {components.length > 0 && (
            <div className="space-y-6 mt-12">
              <h2 className="text-lg font-bold text-white">
                Detected Modules by Category
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(grouped).map(([category, items]) => {
                  const colors = categoryColors[category] || categoryColors["Module"];
                  return (
                    <div
                      key={category}
                      className={`rounded-2xl p-5 border ${colors.bg} ${colors.border} space-y-3`}
                    >
                      <div className={`text-xs font-bold uppercase tracking-wider ${colors.text}`}>
                        {category}
                      </div>
                      <div className="space-y-1.5">
                        {items.map((c, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs text-gray-300 font-semibold"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors.text.replace("text-", "bg-")}`}></span>
                            <span className="font-mono">{c.name}/</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Connections */}
          {connections.length > 0 && (
            <div className="glass-panel border border-gray-900 rounded-3xl p-6 space-y-4 mt-8">
              <h2 className="text-base font-bold text-white">
                Component Relationships
              </h2>
              <p className="text-xs text-gray-500">
                Typical call flow detected from folder naming patterns.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {connections.map((conn, idx) => (
                  <React.Fragment key={idx}>
                    <span className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-xs font-semibold text-gray-300">
                      {conn.from}
                    </span>
                    <span className="text-gray-600 text-xs">→</span>
                    <span className="px-3 py-1.5 rounded-lg bg-primary-950/30 border border-primary-900/40 text-xs font-semibold text-primary-300">
                      {conn.to}
                    </span>
                    {idx < connections.length - 1 && (
                      <span className="text-gray-700 text-xs mx-1">|</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Architecture;