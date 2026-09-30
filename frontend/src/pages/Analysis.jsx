import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const Analysis = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [logs, setLogs] = useState([]);
  const [completed, setCompleted] = useState(false);
  const terminalEndRef = useRef(null);

  const steps = [
    {
      label: "Repository Scanner",
      desc: "Listing files and detecting technology stacks.",
    },
    {
      label: "Rule Engine Loader",
      desc: "Loading predefined rules from analysisRules.js.",
    },
    {
      label: "Technical Debt Checker",
      desc: "Applying debt rules: large files, TODOs, nesting.",
    },
    {
      label: "Security Rule Scanner",
      desc: "Checking hardcoded secrets and insecure patterns.",
    },
    {
      label: "Dependency Extractor",
      desc: "Parsing package.json and requirements.txt.",
    },
    {
      label: "Architecture Mapper",
      desc: "Mapping folder structure and component relationships.",
    },
  ];

  const simulatedLogs = [
    [
      { text: "[SYSTEM] Initializing rule-based scanning pipeline...", type: "info" },
      { text: `[SYSTEM] Target Project Identifier: ${id}`, type: "info" },
      { text: "[SCANNER] Traversing codebase files recursively...", type: "info" },
      { text: "[SCANNER] Skipping node_modules, dist, build, venv directories.", type: "info" },
      { text: "[SCANNER] Technology indicators detected: package.json, requirements.txt", type: "success" },
      { text: "[SCANNER] File and directory traversal complete.", type: "success" },
    ],
    [
      { text: "[RULES] Loading analysisRules.js — single source of truth.", type: "info" },
      { text: "[RULES] Technical Debt rules loaded: TD001 through TD006.", type: "info" },
      { text: "[RULES] Security rules loaded: SEC001 through SEC006.", type: "info" },
      { text: "[RULES] Rule definitions verified. Thresholds and patterns ready.", type: "success" },
    ],
    [
      { text: "[DEBT] Applying TD001 — Large File rule (threshold: 300 lines).", type: "info" },
      { text: "[DEBT] Applying TD002 — TODO comment pattern detection.", type: "info" },
      { text: "[DEBT] Applying TD003 — FIXME comment pattern detection.", type: "info" },
      { text: "[DEBT] Applying TD004 — Deep nesting indentation analysis.", type: "info" },
      { text: "[DEBT] Applying TD006 — console.log left in source files.", type: "info" },
      { text: "[DEBT] Technical debt rule scan complete.", type: "success" },
    ],
    [
      { text: "[SECURITY] Applying SEC001 — Hardcoded API key pattern.", type: "info" },
      { text: "[SECURITY] Applying SEC002 — Hardcoded password pattern.", type: "info" },
      { text: "[SECURITY] Applying SEC003 — Hardcoded secret or token pattern.", type: "info" },
      { text: "[SECURITY] Applying SEC004 — eval() usage detection.", type: "info" },
      { text: "[SECURITY] Applying SEC005 — Insecure HTTP URL detection.", type: "info" },
      { text: "[SECURITY] Applying SEC006 — Private key header detection.", type: "info" },
      { text: "[SECURITY] All matched values masked before storage.", type: "success" },
    ],
    [
      { text: "[DEPS] Locating package.json files in archive...", type: "info" },
      { text: "[DEPS] Extracting production and devDependencies.", type: "info" },
      { text: "[DEPS] Locating requirements.txt for Python dependencies.", type: "info" },
      { text: "[DEPS] Dependency extraction complete. Results stored in MongoDB.", type: "success" },
    ],
    [
      { text: "[ARCH] Analysing top-level and second-level directory names.", type: "info" },
      { text: "[ARCH] Categorizing: routes, controllers, models, services, middleware.", type: "info" },
      { text: "[ARCH] Building component connection graph.", type: "info" },
      { text: "[SYSTEM] All analysis modules completed. Results saved to database.", type: "success" },
      { text: "[SYSTEM] Rule-based analysis pipeline finished successfully.", type: "success" },
    ],
  ];

  useEffect(() => {
    let stepIdx = 0;
    let logIdx = 0;
    let interval;

    const printNextLog = () => {
      if (stepIdx >= steps.length) {
        setCompleted(true);
        clearInterval(interval);
        return;
      }

      const stepLogs = simulatedLogs[stepIdx];
      if (logIdx < stepLogs.length) {
        setLogs((prev) => [...prev, stepLogs[logIdx]]);
        logIdx++;
      } else {
        stepIdx++;
        if (stepIdx < steps.length) {
          setCurrentStep(stepIdx);
          logIdx = 0;
        }
      }
    };

    interval = setInterval(printNextLog, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="p-8 max-w-5xl mx-auto w-full space-y-8 flex-1 flex flex-col justify-center">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-primary-600/10 border border-primary-500/20 text-primary-400 flex items-center justify-center mx-auto shadow-md font-bold text-xs">
          ✓
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Rule-Based Analysis Pipeline
        </h1>
        <p className="text-sm text-gray-400 max-w-md mx-auto font-medium">
          Running predefined static code rules, security pattern matching, and
          dependency extraction.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        <div className="glass-panel border border-gray-900 rounded-3xl p-6 flex flex-col justify-between shadow-2xl">
          <div className="space-y-6">
            <h3 className="font-bold text-base px-2 border-b border-gray-900 pb-3">
              Analysis Stages
            </h3>
            <div className="space-y-4">
              {steps.map((step, idx) => {
                const isActive = currentStep === idx;
                const isCompleted = currentStep > idx || completed;
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-4 p-2 rounded-2xl transition-colors ${isActive ? "bg-primary-950/20" : ""}`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border flex-shrink-0 mt-0.5 ${
                        isCompleted
                          ? "bg-emerald-950/40 border-emerald-500 text-emerald-400"
                          : isActive
                          ? "bg-primary-600 border-primary-500 text-white"
                          : "bg-gray-950 border-gray-900 text-gray-500"
                      }`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold transition-colors ${
                          isActive || isCompleted ? "text-gray-100" : "text-gray-500"
                        }`}
                      >
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {completed && (
            <button
              onClick={() => navigate(`/dashboard/security/${id}`)}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-3.5 text-xs font-bold shadow-xl shadow-primary-500/25 hover:shadow-primary-500/35 transition-all flex items-center justify-center gap-2 mt-6"
            >
              View Analysis Results
            </button>
          )}
        </div>

        <div className="glass-panel border border-gray-900 rounded-3xl p-6 bg-gray-950/50 flex flex-col h-[480px] shadow-2xl relative">
          <div className="flex items-center justify-between border-b border-gray-900 pb-3 mb-4 flex-shrink-0">
            <span className="text-xs text-gray-400 font-bold flex items-center gap-1.5">
              engine_output.log
            </span>
            <span className={`w-2 h-2 rounded-full ${completed ? "bg-emerald-500" : "bg-primary-500"}`}></span>
          </div>

          <div className="flex-1 overflow-y-auto font-mono text-[10px] space-y-2.5 pr-2 select-text">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={`leading-relaxed ${
                  log.type === "success"
                    ? "text-emerald-400"
                    : log.type === "warn"
                    ? "text-amber-400"
                    : "text-gray-300"
                }`}
              >
                {log.text}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
