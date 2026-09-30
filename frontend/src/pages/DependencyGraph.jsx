import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../App";

const DependencyGraph = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Active view tab: "graph" (Source Import Graph) | "packages" (Package Inventory)
  const [activeTab, setActiveTab] = useState("graph");

  // Filters for Package Inventory
  const [packageSearch, setPackageSearch] = useState("");
  const [selectedPackageScope, setSelectedPackageScope] = useState("ALL");

  // Filters for Source Import Graph
  const [graphSearch, setGraphSearch] = useState("");
  const [nodeTypeFilter, setNodeTypeFilter] = useState("ALL"); // ALL | file | package
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchDependencies = async () => {
      // Cleanly reset state when project ID changes to prevent stale data
      setData(null);
      setLoading(true);
      setError(null);
      setSelectedNodeId(null);

      const url = id ? `/api/dependencies/${id}` : "/api/dependencies/undefined";

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (isMounted) setError("Failed to retrieve dependency data from server.");
          return;
        }

        const json = await res.json();
        if (isMounted) {
          const payload = json.data || json;
          setData({ ...payload, hasProject: json.hasProject });
        }
      } catch (err) {
        console.error("DependencyGraph fetch error:", err);
        if (isMounted) setError("Network error. Could not load dependency analysis.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDependencies();

    return () => {
      isMounted = false;
    };
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
        <div className="p-5 rounded-2xl bg-red-950/40 border border-red-900/60 text-red-300 text-sm font-semibold">
          {error}
        </div>
      </div>
    );
  }

  const packageDeps = data?.packageDependencies || { production: [], development: [] };
  const prodDeps = packageDeps.production || [];
  const devDeps = packageDeps.development || [];
  const allPackages = [...prodDeps, ...devDeps];

  const nodes = data?.nodes || [];
  const edges = data?.edges || [];
  const summary = data?.summary || {};

  // Extract distinct package source scopes (e.g. "frontend/package.json", "backend/package.json")
  const availableScopes = Array.from(
    new Set(allPackages.map((p) => p.source).filter(Boolean))
  );

  // Filter package inventory
  const filteredProdDeps = prodDeps.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(packageSearch.toLowerCase());
    const matchesScope =
      selectedPackageScope === "ALL" || p.source === selectedPackageScope;
    return matchesSearch && matchesScope;
  });

  const filteredDevDeps = devDeps.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(packageSearch.toLowerCase());
    const matchesScope =
      selectedPackageScope === "ALL" || p.source === selectedPackageScope;
    return matchesSearch && matchesScope;
  });

  // Filter graph nodes
  const filteredNodes = nodes.filter((n) => {
    const matchesType = nodeTypeFilter === "ALL" || n.type === nodeTypeFilter;
    const matchesSearch =
      !graphSearch ||
      n.id.toLowerCase().includes(graphSearch.toLowerCase()) ||
      n.label.toLowerCase().includes(graphSearch.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

  // Filter edges matching visible nodes
  const filteredEdges = edges.filter(
    (e) => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
  );

  // Detail for selected node
  const selectedNodeDetails = selectedNodeId
    ? {
        node: nodes.find((n) => n.id === selectedNodeId),
        importedBy: edges.filter((e) => e.target === selectedNodeId).map((e) => e.source),
        imports: edges.filter((e) => e.source === selectedNodeId).map((e) => e.target),
      }
    : null;

  const hasProject = data?.hasProject !== false;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Dependency &amp; Import Graph
          </h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">
            Strictly separated package inventory from manifest files and actual source-code import relationships.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 bg-gray-950/80 p-1.5 rounded-2xl border border-gray-900 shadow-lg">
          <button
            onClick={() => setActiveTab("graph")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "graph"
                ? "bg-primary-600 text-white shadow-md shadow-primary-600/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Source Import Graph ({edges.length})
          </button>
          <button
            onClick={() => setActiveTab("packages")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "packages"
                ? "bg-primary-600 text-white shadow-md shadow-primary-600/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Package Inventory ({allPackages.length})
          </button>
        </div>
      </div>

      {!hasProject ? (
        <div className="glass-panel border border-gray-900 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4">
          <svg className="w-16 h-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-300">
            No Repository Uploaded
          </h2>
          <p className="text-sm text-gray-500 max-w-md">
            {data?.message || "Upload a repository ZIP file to extract dependencies and view the graph."}
          </p>
        </div>
      ) : (
        <>
          {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-gray-800">
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
            Total Packages
          </span>
          <div className="mt-1 text-2xl font-extrabold text-white">
            {allPackages.length}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-gray-800">
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
            Production Deps
          </span>
          <div className="mt-1 text-2xl font-extrabold text-emerald-400">
            {prodDeps.length}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-gray-800">
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
            Dev Dependencies
          </span>
          <div className="mt-1 text-2xl font-extrabold text-indigo-400">
            {devDeps.length}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-gray-800">
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
            Source Files
          </span>
          <div className="mt-1 text-2xl font-extrabold text-sky-400">
            {summary.sourceFiles || nodes.filter((n) => n.type === "file").length}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-gray-800">
          <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
            Import Connections
          </span>
          <div className="mt-1 text-2xl font-extrabold text-purple-400">
            {edges.length}
          </div>
        </div>
      </div>

      {/* SECTION 1: SOURCE IMPORT GRAPH */}
      {activeTab === "graph" && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-gray-800 space-y-5">
            {/* Graph Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-bold text-white">
                  Source-Code Import Relationships
                </h2>
                <span className="text-xs text-gray-400 font-mono">
                  {filteredNodes.length} nodes, {filteredEdges.length} edges
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search Input */}
                <input
                  type="text"
                  placeholder="Filter files or packages..."
                  value={graphSearch}
                  onChange={(e) => setGraphSearch(e.target.value)}
                  className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500"
                />

                {/* Node Type Filter */}
                <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800">
                  <button
                    onClick={() => setNodeTypeFilter("ALL")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      nodeTypeFilter === "ALL"
                        ? "bg-primary-600 text-white"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setNodeTypeFilter("file")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      nodeTypeFilter === "file"
                        ? "bg-primary-600 text-white"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Files Only
                  </button>
                  <button
                    onClick={() => setNodeTypeFilter("package")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      nodeTypeFilter === "package"
                        ? "bg-primary-600 text-white"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    Packages
                  </button>
                </div>
              </div>
            </div>

            {/* Visual Node Explorer */}
            {filteredNodes.length === 0 ? (
              <div className="p-12 text-center bg-gray-950/40 rounded-xl border border-gray-900 space-y-2">
                <p className="text-sm font-semibold text-gray-300">
                  No Source Import Relationships Found
                </p>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  No JavaScript or TypeScript import statements were identified in the scanned source files.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Node Grid / Visual Canvas */}
                <div className="lg:col-span-2 bg-gray-950/70 border border-gray-900 rounded-2xl p-5 min-h-[420px] max-h-[520px] overflow-y-auto space-y-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 border-b border-gray-900 pb-2">
                    <span>Click a node to view its imports and dependents</span>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Source File
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> External Package
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-2">
                    {filteredNodes.map((node) => {
                      const isSelected = selectedNodeId === node.id;
                      const isFile = node.type === "file";

                      return (
                        <button
                          key={node.id}
                          onClick={() =>
                            setSelectedNodeId(isSelected ? null : node.id)
                          }
                          className={`px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-2 border text-left ${
                            isSelected
                              ? "bg-primary-600 text-white border-primary-400 shadow-lg shadow-primary-500/25 scale-105"
                              : isFile
                                ? "bg-sky-950/30 text-sky-300 border-sky-900/60 hover:border-sky-500/60 hover:bg-sky-950/50"
                                : "bg-purple-950/30 text-purple-300 border-purple-900/60 hover:border-purple-500/60 hover:bg-purple-950/50"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              isFile ? "bg-sky-400" : "bg-purple-400"
                            }`}
                          ></span>
                          <span className="font-semibold truncate max-w-[200px]">
                            {node.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Node Inspector Panel */}
                <div className="bg-gray-950/70 border border-gray-900 rounded-2xl p-5 flex flex-col justify-between">
                  {selectedNodeDetails?.node ? (
                    <div className="space-y-4 overflow-y-auto max-h-[460px] pr-1">
                      <div className="border-b border-gray-900 pb-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                          {selectedNodeDetails.node.type === "file"
                            ? "Source File"
                            : "External Package"}
                        </span>
                        <h3 className="text-sm font-bold text-white font-mono break-all mt-0.5">
                          {selectedNodeDetails.node.id}
                        </h3>
                      </div>

                      {/* Outgoing Imports */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5 mb-2">
                          <span>Imports ({selectedNodeDetails.imports.length})</span>
                        </h4>
                        {selectedNodeDetails.imports.length === 0 ? (
                          <p className="text-[11px] text-gray-500 italic">
                            No outgoing imports detected.
                          </p>
                        ) : (
                          <ul className="space-y-1.5">
                            {selectedNodeDetails.imports.map((tgt, i) => (
                              <li
                                key={i}
                                onClick={() => setSelectedNodeId(tgt)}
                                className="text-xs font-mono text-purple-300 bg-purple-950/20 px-2.5 py-1.5 rounded-lg border border-purple-900/40 hover:border-purple-500 cursor-pointer truncate transition-colors"
                              >
                                → {tgt}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Incoming Dependents */}
                      <div>
                        <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5 mb-2">
                          <span>Imported By ({selectedNodeDetails.importedBy.length})</span>
                        </h4>
                        {selectedNodeDetails.importedBy.length === 0 ? (
                          <p className="text-[11px] text-gray-500 italic">
                            Not imported by any scanned file.
                          </p>
                        ) : (
                          <ul className="space-y-1.5">
                            {selectedNodeDetails.importedBy.map((src, i) => (
                              <li
                                key={i}
                                onClick={() => setSelectedNodeId(src)}
                                className="text-xs font-mono text-sky-300 bg-sky-950/20 px-2.5 py-1.5 rounded-lg border border-sky-900/40 hover:border-sky-500 cursor-pointer truncate transition-colors"
                              >
                                ← {src}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-6 my-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-500 text-xs font-bold">
                        i
                      </div>
                      <p className="text-xs font-semibold text-gray-300">
                        Node Inspector
                      </p>
                      <p className="text-[11px] text-gray-500">
                        Select any file or package node in the canvas to view its incoming and outgoing relationships.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Edge Explorer Table */}
            {filteredEdges.length > 0 && (
              <div className="pt-4 border-t border-gray-900">
                <h3 className="text-sm font-bold text-white mb-3">
                  Import Connections Table ({filteredEdges.length})
                </h3>
                <div className="overflow-x-auto max-h-72 border border-gray-900 rounded-xl">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="sticky top-0 bg-gray-950 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">Source File</th>
                        <th className="py-2.5 px-4">Relationship</th>
                        <th className="py-2.5 px-4">Target (Imported)</th>
                        <th className="py-2.5 px-4">Target Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-900 font-mono">
                      {filteredEdges.map((edge) => (
                        <tr
                          key={edge.id}
                          className="hover:bg-gray-900/30 transition-colors"
                        >
                          <td className="py-2 px-4 text-sky-400 truncate max-w-xs">
                            {edge.source}
                          </td>
                          <td className="py-2 px-4 text-gray-500 text-[10px]">
                            imports →
                          </td>
                          <td className="py-2 px-4 text-purple-300 truncate max-w-xs">
                            {edge.target}
                          </td>
                          <td className="py-2 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase ${
                                edge.type === "import"
                                  ? "bg-sky-950 text-sky-400 border border-sky-900/60"
                                  : "bg-purple-950 text-purple-400 border border-purple-900/60"
                              }`}
                            >
                              {edge.type === "import" ? "Source File" : "Package"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: PACKAGE DEPENDENCY INVENTORY */}
      {activeTab === "packages" && (
        <div className="space-y-6">
          {/* Inventory Controls */}
          <div className="glass-card rounded-2xl p-5 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-400 mr-1">Scope:</span>
              <button
                onClick={() => setSelectedPackageScope("ALL")}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
                  selectedPackageScope === "ALL"
                    ? "bg-primary-600 text-white"
                    : "bg-gray-900 text-gray-400 hover:text-white"
                }`}
              >
                All Scopes ({allPackages.length})
              </button>
              {availableScopes.map((scope) => (
                <button
                  key={scope}
                  onClick={() => setSelectedPackageScope(scope)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono transition-colors ${
                    selectedPackageScope === scope
                      ? "bg-primary-600 text-white font-bold"
                      : "bg-gray-900 text-gray-400 hover:text-white"
                  }`}
                >
                  {scope}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search package name..."
              value={packageSearch}
              onChange={(e) => setPackageSearch(e.target.value)}
              className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 min-w-[200px]"
            />
          </div>

          {allPackages.length === 0 ? (
            <div className="glass-panel border border-gray-900 rounded-3xl p-12 text-center space-y-2">
              <h3 className="text-base font-bold text-gray-300">
                No Package Dependencies Detected
              </h3>
              <p className="text-xs text-gray-500">
                No package.json or requirements.txt files were found in the uploaded repository.
              </p>
            </div>
          ) : (
            <>
              {/* Production Dependencies Table */}
              <div className="glass-card rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    Production Dependencies ({filteredProdDeps.length})
                  </h2>
                </div>
                {filteredProdDeps.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    No production dependencies match your criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-950/50 text-gray-400 uppercase tracking-wider font-bold text-[10px]">
                          <th className="py-3 px-5">Package Name</th>
                          <th className="py-3 px-5">Version</th>
                          <th className="py-3 px-5">Type</th>
                          <th className="py-3 px-5">Source File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-900">
                        {filteredProdDeps.map((dep, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-900/20 transition-colors"
                          >
                            <td className="py-3 px-5 font-semibold text-gray-200">
                              {dep.name}
                            </td>
                            <td className="py-3 px-5 font-mono text-emerald-400 font-bold">
                              {dep.version}
                            </td>
                            <td className="py-3 px-5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-900/60">
                                Production
                              </span>
                            </td>
                            <td className="py-3 px-5 text-gray-400 font-mono text-[11px]">
                              {dep.source}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Development Dependencies Table */}
              <div className="glass-card rounded-2xl border border-gray-800 overflow-hidden">
                <div className="p-5 border-b border-gray-800 flex items-center justify-between">
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
                    Development Dependencies ({filteredDevDeps.length})
                  </h2>
                </div>
                {filteredDevDeps.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    No development dependencies match your criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-950/50 text-gray-400 uppercase tracking-wider font-bold text-[10px]">
                          <th className="py-3 px-5">Package Name</th>
                          <th className="py-3 px-5">Version</th>
                          <th className="py-3 px-5">Type</th>
                          <th className="py-3 px-5">Source File</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-900">
                        {filteredDevDeps.map((dep, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-900/20 transition-colors"
                          >
                            <td className="py-3 px-5 font-semibold text-gray-200">
                              {dep.name}
                            </td>
                            <td className="py-3 px-5 font-mono text-indigo-400 font-bold">
                              {dep.version}
                            </td>
                            <td className="py-3 px-5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-950/60 text-indigo-400 border border-indigo-900/60">
                                Development
                              </span>
                            </td>
                            <td className="py-3 px-5 text-gray-400 font-mono text-[11px]">
                              {dep.source}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default DependencyGraph;
