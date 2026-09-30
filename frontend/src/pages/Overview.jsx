import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const Overview = ({ projects, loading, fetchProjects }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_projects: 0,
    language_counts: {},
    total_security_issues: 0,
    total_debt_issues: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error("Failed to fetch dashboard stats", e);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [projects]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this project and all its analysis data?"))
      return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchProjects();
        fetchStats();
      }
    } catch (e) {
      console.error("Failed to delete project", e);
    }
  };

  const kpis = [
    { label: "Total Projects", value: stats.total_projects ?? 0 },
    { label: "Security Findings", value: stats.total_security_issues ?? 0 },
    { label: "Debt Issues", value: stats.total_debt_issues ?? 0 },
    {
      label: "Languages Detected",
      value: Object.keys(stats.language_counts || {}).length,
    },
  ];

  const colors = ["#8b5cf6", "#a78bfa", "#6366f1", "#4f46e5", "#4338ca"];

  const chartData = Object.entries(stats.language_counts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([lang, count]) => ({ name: lang, count }));

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Console Overview
          </h1>
          <p className="text-sm text-gray-400 font-medium mt-1">
            Review aggregated project statistics, static analysis results, and
            code health metrics.
          </p>
        </div>
        <Link
          to="/dashboard/upload"
          className="px-5 py-2.5 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/10 hover:shadow-primary-500/25 transition-all flex items-center gap-1.5"
        >
          Analyze New Project
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div
            key={idx}
            className="glass-card rounded-2xl p-6 border border-gray-900 shadow-xl relative overflow-hidden"
          >
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
              {kpi.label}
            </p>
            <p className="text-3xl font-extrabold tracking-tight mt-2">
              {loadingStats ? "..." : kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts — only show when there are projects */}
      {projects.length > 0 && Object.keys(stats.language_counts || {}).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="glass-panel rounded-3xl p-6 border border-gray-900 lg:col-span-2 flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="font-bold text-base">Language Distribution</h3>
              <p className="text-xs text-gray-400">
                File counts by detected programming language across all projects.
              </p>
            </div>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "12px",
                    }}
                    labelStyle={{ color: "#fff", fontSize: "12px", fontWeight: "bold" }}
                    itemStyle={{ color: "#a78bfa", fontSize: "11px" }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6 border border-gray-900 flex flex-col justify-between">
            <div className="mb-6">
              <h3 className="font-bold text-base">Detected Languages</h3>
              <p className="text-xs text-gray-400">
                File proportions by language across scanned repositories.
              </p>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
              {Object.entries(stats.language_counts || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([lang, count], idx) => {
                  const total = Object.values(stats.language_counts).reduce(
                    (s, c) => s + c,
                    0
                  );
                  const percent = Math.round((count / total) * 100);
                  return (
                    <div key={lang} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-gray-300">{lang}</span>
                        <span className="text-gray-400">
                          {count} files ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-950/60 border border-gray-900/60 h-2 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: colors[idx % colors.length],
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="glass-panel rounded-3xl border border-gray-900 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-900 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">Analyzed Repositories</h3>
            <p className="text-xs text-gray-400">
              Click a project to view its security and technical debt findings.
            </p>
          </div>
          <button
            onClick={() => {
              fetchProjects();
              fetchStats();
            }}
            className="p-2 px-4 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary-500 text-gray-400 hover:text-white transition-colors text-xs font-semibold"
            title="Refresh"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400 font-medium">
            Fetching project registry...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <p className="text-xs text-gray-500 italic">
              No projects analyzed yet.
            </p>
            <Link
              to="/dashboard/upload"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600/20 hover:bg-primary-600/35 border border-primary-500/20 text-primary-400 font-bold rounded-xl text-xs transition-colors"
            >
              Analyze your first project
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-900 bg-gray-950/30 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Project Name</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6 text-center">Files</th>
                  <th className="py-4 px-6 text-center">Analysis Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => navigate(`/dashboard/security/${project.id}`)}
                    className="border-b border-gray-900 hover:bg-gray-900/10 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold">
                      <div className="space-y-0.5">
                        <div className="text-gray-100">{project.name}</div>
                        <div className="text-[10px] text-gray-500">
                          {project.file_count > 0
                            ? `${project.file_count} files in ${project.folder_count} folders`
                            : project.gitUrl
                            ? project.gitUrl.replace("https://github.com/", "")
                            : "Uploaded ZIP"}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-300 font-medium capitalize">
                      {project.uploadType === "git" ? "GitHub URL" : "ZIP Upload"}
                    </td>
                    <td className="py-4 px-6 text-center text-gray-400 font-mono">
                      {project.file_count || "—"}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center">
                        <span
                          className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                            project.analysisStatus === "completed"
                              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40"
                              : project.analysisStatus === "failed"
                              ? "bg-red-950/40 text-red-400 border border-red-900/40"
                              : "bg-gray-900 text-gray-400 border border-gray-800"
                          }`}
                        >
                          {project.analysisStatus === "completed"
                            ? "Analyzed"
                            : project.analysisStatus === "failed"
                            ? "Failed"
                            : "Pending ZIP"}
                        </span>
                      </div>
                    </td>
                    <td
                      className="py-4 px-6 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        className="p-2 px-3 rounded-lg bg-gray-900 hover:bg-red-950/30 text-gray-500 hover:text-red-400 border border-gray-800 hover:border-red-900/40 transition-colors text-xs font-bold"
                        title="Delete project"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Overview;
