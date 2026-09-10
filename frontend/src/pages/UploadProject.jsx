import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../App";

const UploadProject = ({ fetchProjects }) => {
  const [activeTab, setActiveTab] = useState("zip");
  const [projectName, setProjectName] = useState("");
  const [gitUrl, setGitUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { token } = useAuth();
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      if (!file.name.endsWith(".zip")) {
        setError("Only ZIP files are supported.");
        return;
      }

      setSelectedFile(file);

      if (!projectName) {
        setProjectName(file.name.replace(".zip", ""));
      }
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === "zip") {
        if (!selectedFile) {
          setError("Please select a ZIP file.");
          setLoading(false);
          return;
        }

        if (!projectName) {
          setError("Please specify a project name.");
          setLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("name", projectName);
        formData.append("file", selectedFile);

        const res = await fetch("/api/projects/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        let result;
        try {
          result = await res.json();
        } catch (jsonErr) {
          throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText})`);
        }

        if (res.ok && result.success) {
          if (fetchProjects) fetchProjects(true);
          navigate("/dashboard");
        } else {
          setError(result.message || "Failed to upload project ZIP archive.");
        }
      } else {
        if (!gitUrl) {
          setError("Please specify a GitHub Repository URL.");
          setLoading(false);
          return;
        }

        if (!projectName) {
          setError("Please specify a project name.");
          setLoading(false);
          return;
        }

        const res = await fetch("/api/projects/github", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: projectName, gitUrl }),
        });

        let result;
        try {
          result = await res.json();
        } catch (jsonErr) {
          throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText})`);
        }

        if (res.ok && result.success) {
          if (fetchProjects) fetchProjects(true);
          navigate("/dashboard");
        } else {
          setError(result.message || "Failed to submit GitHub repository URL.");
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        err.message && err.message.includes("Server returned")
          ? err.message
          : "Network error. Please make sure the backend Express server is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto w-full space-y-8">
      <div className="border-b border-gray-900 pb-6">
        <h1 className="text-3xl font-extrabold tracking-tight">
          Upload Codebase
        </h1>

        <p className="text-sm text-gray-400 mt-1 font-medium">
          Submit a local repository bundle or clone a public repository to
          launch product engines.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-900/60 flex items-start gap-2.5 text-xs text-red-300 font-semibold">
          <span>{error}</span>
        </div>
      )}

      <div className="flex bg-gray-950/40 p-1.5 rounded-2xl border border-gray-900 w-fit">
        <button
          onClick={() => {
            setActiveTab("zip");
            setError(null);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "zip"
              ? "bg-primary-600 text-white shadow-md shadow-primary-500/10"
              : "text-gray-400 hover:text-white"
          }`}
        >
          Local ZIP Upload
        </button>

        <button
          onClick={() => {
            setActiveTab("git");
            setError(null);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === "git"
              ? "bg-primary-600 text-white shadow-md shadow-primary-500/10"
              : "text-gray-400 hover:text-white"
          }`}
        >
          GitHub Repository
        </button>
      </div>

      <form onSubmit={handleScan} className="space-y-6">
        <div className="glass-panel border border-gray-900 rounded-3xl p-8 space-y-6 shadow-2xl">

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">
                Project Tag/Name
              </label>

              <span className="text-[10px] text-gray-500 font-medium">
                Identifies this scan report.
              </span>
            </div>

            <input
              type="text"
              required
              placeholder="e.g. Hospital Management System"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-gray-950/50 border border-gray-900 rounded-xl py-3.5 px-4 text-sm focus:border-primary-500 focus:outline-none transition-colors"
            />
          </div>

          {activeTab === "zip" ? (
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">
                Repository File Archive
              </label>

              <div
                className="border-2 border-dashed rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-4 cursor-pointer transition-all border-gray-900 hover:border-gray-800 bg-gray-950/20"
                onClick={() =>
                  document.getElementById("zipFileSelector")?.click()
                }
              >
                <input
                  type="file"
                  id="zipFileSelector"
                  accept=".zip"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  className={`p-4 rounded-full bg-gray-950/80 border border-gray-900 text-gray-400 ${
                    selectedFile
                      ? "text-primary-400 border-primary-500/20 bg-primary-950/30"
                      : ""
                  }`}
                ></div>

                {selectedFile ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-200">
                      {selectedFile.name}
                    </p>

                    <p className="text-[10px] text-gray-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      &bull; Ready to scan
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-300">
                      Click to select your project ZIP
                    </p>

                    <p className="text-[10px] text-gray-500">
                      Only ZIP files are supported
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide">
                Public GitHub Repository URL
              </label>

              <div className="relative">
                <input
                  type="url"
                  required
                  placeholder="https://github.com/username/repository"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  className="w-full bg-gray-950/50 border border-gray-900 rounded-xl py-3.5 pl-11 pr-4 text-sm focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>

              <p className="text-[10px] text-gray-500 font-medium flex items-center gap-1 mt-1">
                Supports cloning public repositories.
              </p>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-800 text-white rounded-xl py-4 font-bold shadow-xl shadow-primary-500/10 hover:shadow-primary-500/30 transition-all flex items-center justify-center gap-2 group"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
          ) : (
            <>Upload Project</>
          )}
        </button>
      </form>
    </div>
  );
};

export default UploadProject;