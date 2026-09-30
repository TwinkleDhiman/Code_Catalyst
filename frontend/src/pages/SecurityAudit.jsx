import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../App";

const SecurityAudit = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAudit = async () => {
      setAuditData(null);
      setLoading(true);
      const url = id ? `/api/security/${id}` : "/api/security/undefined";
      try {
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted) setAuditData(json);
        }
      } catch (e) {
        console.error("Failed to fetch security audit", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAudit();
    return () => { isMounted = false; };
  }, [id, token]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const hasProject = auditData?.hasProject !== false;
  const auditInfo = auditData?.data?.securityAudit || auditData?.securityAudit || auditData || {};
  const score = auditInfo?.securityScore ?? 100;
  const findings = auditInfo?.findings || [];
  const message = auditData?.data?.message || auditData?.message;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-100">
              Security Rule Audit
            </h1>
            <p className="text-xs text-gray-400">
              Deterministic static code analysis for hardcoded secrets, weak
              credentials, and network risks.
            </p>
          </div>
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
            {message || "Upload a repository ZIP file to run security scanning."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card rounded-2xl p-6 border border-gray-800">
          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            Security Score
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
            Critical Vulnerabilities
          </span>
          <div className="mt-2 text-3xl font-extrabold text-red-400">
            {auditInfo.criticalCount ?? 0}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-gray-800">
          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            High Risk Triggers
          </span>
          <div className="mt-2 text-3xl font-extrabold text-orange-400">
            {auditInfo.highCount ?? 0}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-gray-800">
          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            Medium / Low Risks
          </span>
          <div className="mt-2 text-3xl font-extrabold text-yellow-400">
            {auditInfo.mediumCount ?? 0}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-gray-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          Discovered Security Findings ({findings.length})
        </h2>

        {findings.length === 0 ? (
          <div className="p-8 text-center bg-gray-950/40 rounded-xl border border-gray-900 space-y-2">
            <p className="text-sm font-semibold text-gray-300">
              Clean Security Audit
            </p>
            <p className="text-xs text-gray-500">
              No hardcoded secrets or insecure permission rules were detected in
              this codebase.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {findings.map((f, idx) => (
              <div
                key={idx}
                className="bg-gray-950/60 border border-gray-900 rounded-xl p-5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                        f.severity === "CRITICAL"
                          ? "bg-red-950 text-red-400 border border-red-900/60"
                          : f.severity === "HIGH"
                            ? "bg-orange-950 text-orange-400 border border-orange-900/60"
                            : "bg-yellow-950 text-yellow-400 border border-yellow-900/60"
                      }`}
                    >
                      {f.severity}
                    </span>
                    <span className="text-sm font-bold text-white">
                      {f.title}
                    </span>
                  </div>
                  {f.file && (
                    <span className="text-xs font-mono text-gray-400 flex items-center gap-1">
                      {f.file}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-400">{f.description}</p>
                <div className="pt-2 border-t border-gray-900/60 text-xs text-primary-300 flex items-start gap-1.5">
                  <span className="font-bold text-gray-500 uppercase text-[10px]">
                    Fix:
                  </span>
                  <span>{f.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default SecurityAudit;
