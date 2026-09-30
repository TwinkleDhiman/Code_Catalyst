import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../App";

const TechnicalDebt = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [debtData, setDebtData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSeverity, setActiveSeverity] = useState("ALL");

  useEffect(() => {
    let isMounted = true;

    const fetchDebt = async () => {
      setDebtData(null);
      setLoading(true);
      setError(null);

      const url = id ? `/api/debt/${id}` : "/api/debt/undefined";

      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          if (isMounted) setError("Failed to retrieve technical debt analysis from server.");
          return;
        }

        const json = await res.json();
        if (isMounted) {
          // Store the full response; extract payload for display fields
          const payload = json.data || json;
          // Carry hasProject to top level of stored data
          setDebtData({ ...payload, hasProject: json.hasProject });
        }
      } catch (err) {
        console.error("TechnicalDebt fetch error:", err);
        if (isMounted) setError("Network error. Could not load technical debt data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDebt();

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

  const summary = debtData?.summary || {};
  const score = summary.debtScore ?? debtData?.technicalDebt?.debtScore ?? 100;
  const rawFindings = debtData?.findings || debtData?.technicalDebt?.issues || [];

  // Filter findings based on selected severity tab
  const filteredFindings =
    activeSeverity === "ALL"
      ? rawFindings
      : rawFindings.filter(
          (f) => (f.severity || "").toUpperCase() === activeSeverity
        );

  const totalFindings = debtData?.totalFindings ?? rawFindings.length;
  const highCount = summary.high ?? rawFindings.filter((f) => f.severity === "HIGH").length;
  const mediumCount = summary.medium ?? rawFindings.filter((f) => f.severity === "MEDIUM").length;
  const lowCount = summary.low ?? rawFindings.filter((f) => f.severity === "LOW").length;

  const hasProject = debtData?.hasProject !== false;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">
          Technical Debt Analysis
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Deterministic code health metrics for file sizes, TODO markers,
          control-flow nesting, and debug statements.
        </p>
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
            {debtData?.message || "Upload a repository ZIP file to view technical debt analysis."}
          </p>
        </div>
      ) : (
        <>
          {/* Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-gray-800">
          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            Health Score
          </span>
          <div className="mt-2 text-3xl font-extrabold text-white flex items-baseline gap-1">
            <span
              className={
                score >= 80
                  ? "text-emerald-400"
                  : score >= 60
                    ? "text-yellow-400"
                    : "text-red-400"
              }
            >
              {score}
            </span>
            <span className="text-xs text-gray-500 font-normal">/ 100</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-gray-800">
          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            Total Findings
          </span>
          <div className="mt-2 text-3xl font-extrabold text-white">
            {totalFindings}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-gray-800">
          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            High Severity
          </span>
          <div className="mt-2 text-3xl font-extrabold text-red-400">
            {highCount}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-gray-800">
          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            Medium / Low
          </span>
          <div className="mt-2 text-3xl font-extrabold text-yellow-400 flex items-baseline gap-2">
            <span>{mediumCount}</span>
            <span className="text-xs text-gray-500 font-normal">
              med / {lowCount} low
            </span>
          </div>
        </div>
      </div>

      {/* Findings Section */}
      <div className="glass-card rounded-2xl p-6 border border-gray-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            Findings List ({filteredFindings.length} of {totalFindings})
          </h2>

          {/* Severity Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-950/60 p-1 rounded-xl border border-gray-900">
            {["ALL", "HIGH", "MEDIUM", "LOW"].map((sev) => {
              const count =
                sev === "ALL"
                  ? totalFindings
                  : sev === "HIGH"
                    ? highCount
                    : sev === "MEDIUM"
                      ? mediumCount
                      : lowCount;

              return (
                <button
                  key={sev}
                  onClick={() => setActiveSeverity(sev)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeSeverity === sev
                      ? "bg-primary-600 text-white shadow-sm"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {sev} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="p-8 text-center bg-gray-950/40 rounded-xl border border-gray-900 space-y-2">
            <p className="text-sm font-semibold text-gray-300">
              Clean Code Structure
            </p>
            <p className="text-xs text-gray-500">
              {activeSeverity === "ALL"
                ? "No technical debt hotspots, excessive nesting, or oversized files were identified."
                : `No findings matching severity "${activeSeverity}".`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFindings.map((item, idx) => {
              const ruleId = item.ruleId || "TD-000";
              const severity = (item.severity || "LOW").toUpperCase();
              const filePath = item.filePath || item.file || "Unknown File";
              const lineNumber = item.lineNumber;
              const description = item.description || "Issue identified by rule engine.";
              const fix =
                item.suggestion ||
                item.recommendation ||
                "Refactor the code according to architectural standards.";

              return (
                <div
                  key={`${ruleId}-${filePath}-${lineNumber}-${idx}`}
                  className="bg-gray-950/60 border border-gray-900 rounded-xl p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border ${
                          severity === "HIGH"
                            ? "bg-red-950/50 text-red-400 border-red-900/60"
                            : severity === "MEDIUM"
                              ? "bg-yellow-950/50 text-yellow-400 border-yellow-900/60"
                              : "bg-gray-900 text-gray-400 border-gray-800"
                        }`}
                      >
                        {severity}
                      </span>
                      <span className="text-xs font-mono font-bold text-primary-400 bg-primary-950/30 px-2 py-0.5 rounded border border-primary-900/40">
                        {ruleId}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {item.issueType || item.name || "Rule Finding"}
                      </span>
                    </div>

                    <div className="text-xs font-mono text-gray-400 flex items-center gap-1">
                      <span>{filePath}</span>
                      {lineNumber && (
                        <span className="text-primary-400 font-bold">
                          :Line {lineNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    {description}
                  </p>

                  <div className="pt-2.5 border-t border-gray-900/70 text-xs text-primary-300 flex items-start gap-2">
                    <span className="font-bold text-emerald-400 uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-900/50 flex-shrink-0">
                      Fix
                    </span>
                    <span className="text-gray-300">{fix}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default TechnicalDebt;
