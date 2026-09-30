import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../App";

const Reports = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchDetails = async () => {
    setLoading(true);
    const url = id ? `/api/reports/${id}` : "/api/reports/undefined";
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (e) {
      console.error("Failed to fetch report configuration", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id, token]);

  /**
   * Generates a report by calling the backend, then downloads the real content.
   */
  const handleDownload = async (format) => {
    if (!data) return;
    setDownloadingFormat(format);
    setMessage(null);

    try {
      const res = await fetch(`/api/reports/${id}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ format }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        setMessage(result.message || "Failed to generate report.");
        return;
      }

      const reportContent = result.data?.content;
      const projectName = reportContent?.project?.name || "CodeCatalyst_Project";

      let fileContent = "";
      let mimeType = "text/plain";
      let extension = format;

      if (format === "json") {
        fileContent = JSON.stringify(reportContent, null, 2);
        mimeType = "application/json";
      } else if (format === "csv") {
        fileContent = convertToCSV(reportContent);
        mimeType = "text/csv";
      } else {
        // PDF: generate a human-readable text file
        fileContent = buildTextReport(reportContent);
        mimeType = "text/plain";
        extension = "txt"; // plain text export labelled as report
      }

      const blob = new Blob([fileContent], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CodeCatalyst_${projectName.replace(/\s+/g, "_")}_Report.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setMessage(`${format.toUpperCase()} report downloaded successfully.`);
      fetchDetails(); // refresh report list
    } catch (e) {
      setMessage(e.message || `Failed to download ${format.toUpperCase()} report.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  /**
   * Converts report data to a simple CSV format.
   */
  const convertToCSV = (reportContent) => {
    if (!reportContent) return "No data available.";
    const rows = ["Section,Key,Value"];

    rows.push(`Project,Name,${reportContent.project?.name || ""}`);
    rows.push(`Project,Type,${reportContent.project?.uploadType || ""}`);
    rows.push(`Project,Files,${reportContent.project?.fileCount || 0}`);
    rows.push(`Project,Folders,${reportContent.project?.folderCount || 0}`);
    rows.push(`Project,Generated At,${reportContent.generatedAt || ""}`);

    if (reportContent.technicalDebt && !reportContent.technicalDebt.message) {
      rows.push(`Technical Debt,Health Score,${reportContent.technicalDebt.debtScore}`);
      rows.push(`Technical Debt,Total Issues,${reportContent.technicalDebt.totalIssues}`);
      rows.push(`Technical Debt,TODO Count,${reportContent.technicalDebt.todoCount}`);
      rows.push(`Technical Debt,FIXME Count,${reportContent.technicalDebt.fixmeCount}`);
      rows.push(`Technical Debt,Large Files,${reportContent.technicalDebt.largeFileCount}`);
    }

    if (reportContent.securityAudit && !reportContent.securityAudit.message) {
      rows.push(`Security,Score,${reportContent.securityAudit.securityScore}`);
      rows.push(`Security,Critical,${reportContent.securityAudit.criticalCount}`);
      rows.push(`Security,High,${reportContent.securityAudit.highCount}`);
      rows.push(`Security,Medium/Low,${reportContent.securityAudit.mediumCount}`);
    }

    rows.push(`Dependencies,Total Packages,${reportContent.dependencies?.total || 0}`);

    return rows.join("\n");
  };

  /**
   * Builds a human-readable plain-text report.
   */
  const buildTextReport = (reportContent) => {
    if (!reportContent) return "No data available.";
    const lines = [];
    lines.push("=".repeat(60));
    lines.push(reportContent.reportTitle || "CodeCatalyst Static Code Analysis Report");
    lines.push("=".repeat(60));
    lines.push(`Generated: ${reportContent.generatedAt || new Date().toISOString()}`);
    lines.push("");

    lines.push("── PROJECT INFORMATION ──");
    lines.push(`Name:       ${reportContent.project?.name || "N/A"}`);
    lines.push(`Type:       ${reportContent.project?.uploadType === "git" ? "GitHub URL" : "ZIP Upload"}`);
    if (reportContent.project?.gitUrl && reportContent.project?.gitUrl !== "N/A") {
      lines.push(`GitHub URL: ${reportContent.project.gitUrl}`);
    }
    lines.push(`Files:      ${reportContent.project?.fileCount || 0}`);
    lines.push(`Folders:    ${reportContent.project?.folderCount || 0}`);
    const langs = Object.entries(reportContent.project?.languages || {});
    if (langs.length > 0) {
      lines.push(`Languages:  ${langs.map(([l, c]) => `${l} (${c})`).join(", ")}`);
    }
    lines.push("");

    lines.push("── TECHNICAL DEBT ANALYSIS ──");
    const td = reportContent.technicalDebt;
    if (td && !td.message) {
      lines.push(`Health Score:   ${td.debtScore}/100`);
      lines.push(`Total Issues:   ${td.totalIssues}`);
      lines.push(`TODO Markers:   ${td.todoCount}`);
      lines.push(`FIXME Markers:  ${td.fixmeCount}`);
      lines.push(`Large Files:    ${td.largeFileCount}`);
      lines.push(`Deep Nesting:   ${td.deepNestingCount}`);
      if (td.issues && td.issues.length > 0) {
        lines.push("");
        lines.push("  Top Issues:");
        td.issues.slice(0, 10).forEach((issue, i) => {
          lines.push(`  ${i + 1}. [${issue.severity}] ${issue.issueType} — ${issue.filePath}${issue.lineNumber ? `:${issue.lineNumber}` : ""}`);
          lines.push(`     ${issue.description}`);
        });
      }
    } else {
      lines.push(td?.message || "No technical debt analysis available.");
    }
    lines.push("");

    lines.push("── SECURITY AUDIT ──");
    const sec = reportContent.securityAudit;
    if (sec && !sec.message) {
      lines.push(`Security Score: ${sec.securityScore}/100`);
      lines.push(`Critical:       ${sec.criticalCount}`);
      lines.push(`High:           ${sec.highCount}`);
      lines.push(`Medium/Low:     ${sec.mediumCount}`);
      if (sec.findings && sec.findings.length > 0) {
        lines.push("");
        lines.push("  Security Findings:");
        sec.findings.slice(0, 10).forEach((f, i) => {
          lines.push(`  ${i + 1}. [${f.severity}] ${f.title} — ${f.file}${f.lineNumber ? `:${f.lineNumber}` : ""}`);
          lines.push(`     ${f.description}`);
        });
      }
    } else {
      lines.push(sec?.message || "No security analysis available.");
    }
    lines.push("");

    lines.push("── DEPENDENCIES ──");
    lines.push(`Total Packages: ${reportContent.dependencies?.total || 0}`);
    if (reportContent.dependencies?.list?.length > 0) {
      reportContent.dependencies.list.slice(0, 20).forEach((dep) => {
        lines.push(`  - ${dep.name} @ ${dep.version} (${dep.type})`);
      });
    }
    lines.push("");

    lines.push("── ARCHITECTURE ──");
    const arch = reportContent.architecture;
    if (arch?.components?.length > 0) {
      lines.push(`Detected Components: ${arch.components.length}`);
      arch.components.forEach((c) => {
        lines.push(`  - ${c.name}/ [${c.category}]`);
      });
    } else {
      lines.push("No architecture components detected.");
    }

    lines.push("");
    lines.push("=".repeat(60));
    lines.push("End of Report — Generated by CodeCatalyst Rule-Based Analysis");
    lines.push("=".repeat(60));

    return lines.join("\n");
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-xs text-gray-400 font-medium">
        Retrieving report records...
      </div>
    );
  }

  const hasProject = data?.hasProject !== false && data?.data?.hasProject !== false;
  const reportPayload = data?.data || data || {};
  const project = reportPayload.project || {};
  const existingReports = reportPayload.reports || [];
  const emptyMessage = reportPayload.message;

  if (!hasProject || (!project.id && !project._id && !id)) {
    return (
      <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
        <div className="border-b border-gray-900 pb-6">
          <h1 className="text-3xl font-extrabold tracking-tight">Reports &amp; Export</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">
            Download static code analysis reports in JSON, CSV, or plain-text format.
          </p>
        </div>
        <div className="glass-panel border border-gray-900 rounded-3xl p-12 flex flex-col items-center justify-center text-center space-y-4">
          <svg className="w-16 h-16 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-xl font-bold text-gray-300">No Repository Uploaded</h2>
          <p className="text-sm text-gray-500 max-w-md">
            {emptyMessage || "Upload a repository ZIP file to generate and download reports."}
          </p>
        </div>
      </div>
    );
  }

  const reportSections = [
    "Project Information (name, type, file count, languages)",
    "Technical Debt Analysis (health score, issue list)",
    "Security Audit (score, critical/high/medium findings)",
    "Dependency List (production and development packages)",
    "Architecture Components (detected folders and modules)",
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
      <div className="border-b border-gray-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Reports &amp; Export
        </h1>
        <p className="text-sm text-gray-400 mt-1 font-medium">
          Download static code analysis reports in JSON, CSV, or plain-text
          format containing actual findings.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl border text-xs font-semibold ${
            message.includes("success")
              ? "bg-emerald-950/40 border-emerald-900/60 text-emerald-300"
              : "bg-red-950/40 border-red-900/60 text-red-300"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        {/* Report Info */}
        <div className="glass-panel border border-gray-900 rounded-3xl p-6 md:col-span-2 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-gray-900 pb-4">
            <div>
              <h3 className="font-bold text-base">
                {project.name
                  ? `${project.name} – Analysis Report`
                  : "Analysis Report Package"}
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                Complete static code analysis export with all findings.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            This report package contains all rule-based static analysis results
            for the selected project, generated from predefined rules in
            analysisRules.js.
          </p>

          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              Report Sections Included
            </h4>
            <div className="space-y-2">
              {reportSections.map((sec, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 text-xs text-gray-300 font-semibold"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0"></span>
                  <span>{sec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Reports */}
          {existingReports.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-gray-900">
              <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                Previously Generated Reports
              </h4>
              <div className="space-y-2">
                {existingReports.slice(0, 5).map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs text-gray-400"
                  >
                    <span className="font-semibold text-gray-300">{r.title}</span>
                    <span className="font-mono text-gray-500 uppercase text-[10px]">
                      {r.format} — {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Download Buttons */}
        <div className="glass-panel border border-gray-900 rounded-3xl p-6 md:col-span-1 space-y-6 shadow-xl text-center">
          <h3 className="font-bold text-sm text-gray-400 uppercase tracking-wider">
            Export Formats
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => handleDownload("pdf")}
              disabled={downloadingFormat !== null}
              className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white rounded-xl py-3.5 font-bold shadow-lg shadow-primary-500/10 hover:shadow-primary-500/35 transition-all flex items-center justify-center gap-2 text-xs"
            >
              {downloadingFormat === "pdf" ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Download Text Report</>
              )}
            </button>

            <button
              onClick={() => handleDownload("json")}
              disabled={downloadingFormat !== null}
              className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-200 rounded-xl py-3 font-bold transition-all flex items-center justify-center gap-2 text-xs"
            >
              {downloadingFormat === "json" ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Download JSON</>
              )}
            </button>

            <button
              onClick={() => handleDownload("csv")}
              disabled={downloadingFormat !== null}
              className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-200 rounded-xl py-3 font-bold transition-all flex items-center justify-center gap-2 text-xs"
            >
              {downloadingFormat === "csv" ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Download CSV</>
              )}
            </button>
          </div>

          <p className="text-[10px] text-gray-600 leading-relaxed">
            All reports are generated from actual static analysis findings stored
            in the database.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Reports;