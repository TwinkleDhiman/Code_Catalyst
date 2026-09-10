import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../App";

const Reports = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  const [responseMeta, setResponseMeta] = useState(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setResponseMeta(result);
        setData(result.data || result);
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

  const handleDownload = async (format) => {
    if (!data) return;
    setDownloadingFormat(format);

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

      const projectName = data.project?.name || "CodeCatalyst_Project";
      const dummyContent = `CodeCatalyst ${format.toUpperCase()} Export Report\nProject: ${projectName}\nDate: ${new Date().toLocaleDateString()}\nStatus: Active`;
      
      const blob = new Blob([dummyContent], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CodeCatalyst_${projectName.replace(/\s+/g, "_")}_Report.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message || `Failed to download ${format.toUpperCase()} report.`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-xs text-gray-400 font-medium">
        Retrieving report records...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-xs text-red-400 font-semibold">
        Error loading report configuration.
      </div>
    );
  }

  const sections = [
    "Get complete report of your project"
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto w-full space-y-8">
      <div className="border-b border-gray-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          CodeCatalyst Reports &amp; Export
        </h1>
        <p className="text-sm text-gray-400 mt-1 font-medium">
          Download offline PDF blueprints, raw JSON schemas, or CSV spreadsheets
          detailing static code analysis findings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="glass-panel border border-gray-900 rounded-3xl p-6 md:col-span-2 space-y-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-3 border-b border-gray-900 pb-4">
            <div>
              <h3 className="font-bold text-base">Executive Dossier Package</h3>
              <p className="text-[10px] text-gray-500">
                Multi-format analysis export.
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            This report package includes security audit results, technical debt
            hotspots and product architecture and dependencies.
          </p>

          <div className="space-y-3 pt-2">
            <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
              Report Chapters Included
            </h4>
            <div className="space-y-2">
              {sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 text-xs text-gray-300 font-semibold"
                >
                  <span>{sec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel border border-gray-900 rounded-3xl p-6 md:col-span-1 space-y-6 shadow-xl text-center relative overflow-hidden">
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
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>Download PDF Report</>
              )}
            </button>

            <button
              onClick={() => handleDownload("json")}
              disabled={downloadingFormat !== null}
              className="w-full bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-200 rounded-xl py-3 font-bold transition-all flex items-center justify-center gap-2 text-xs"
            >
              {downloadingFormat === "json" ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
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
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>Download CSV</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;