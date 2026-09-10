import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../App";

const SecurityAudit = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [auditData, setAuditData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/security/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAuditData(data.data?.securityAudit || data.securityAudit || null);
        }
      } catch (e) {
        console.error("Failed to fetch security audit", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, [id, token]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const score = auditData?.securityScore ?? 100;
  const findings = auditData?.findings || [];

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
            {auditData ? auditData.criticalCount : 0}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-gray-800">
          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            High Risk Triggers
          </span>
          <div className="mt-2 text-3xl font-extrabold text-orange-400">
            {auditData ? auditData.highCount : 0}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 border border-gray-800">
          <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
            Medium / Low Risks
          </span>
          <div className="mt-2 text-3xl font-extrabold text-yellow-400">
            {auditData ? auditData.mediumCount : 0}
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
    </div>
  );
};

export default SecurityAudit;
