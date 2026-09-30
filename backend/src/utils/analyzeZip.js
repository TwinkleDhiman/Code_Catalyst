/**
 * analyzeZip.js
 * Rule-based static repository analysis engine for CodeCatalyst.
 * Extracts ZIP archives and runs deterministic rule-based checks:
 * 1. Technical Debt Analyzer (file length, TODO/FIXME, deep nesting, console logs)
 * 2. Security Audit (hardcoded secrets, keys, passwords, eval, insecure URLs)
 * 3. Dependency Analyzer (Package Inventory vs Source-Code Import Graph)
 * 4. Architecture Component Mapper
 *
 * Strictly rule-based: No AI, ML, or external AI APIs.
 */

const AdmZip = require("adm-zip");
const path = require("path");
const analysisRules = require("../rules/analysisRules");

// Directories to strictly exclude from analysis and graph generation
const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".cache",
  ".vite",
  ".next",
  "out",
  "public/assets",
  "uploads",
  "temp",
  "tmp",
  "vendor",
  "generated",
  "screenshots",
  "images",
  "target",
  "venv",
  "__pycache__",
  ".idea",
  ".vscode",
]);

// File extensions and names to strictly exclude
const EXCLUDED_FILENAMES = new Set([
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  ".env",
  ".env.local",
  ".env.development",
  ".env.production",
  ".gitignore",
]);

const EXCLUDED_EXTENSIONS = new Set([
  ".min.js",
  ".min.css",
  ".map",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".pdf",
  ".zip",
  ".log",
  ".tar",
  ".gz",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
]);

// Relevant source file extensions to inspect
const SOURCE_CODE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".py",
  ".java",
  ".cpp",
  ".c",
  ".css",
  ".html",
]);

// JS/TS extensions for dependency import resolution
const JS_TS_EXTENSIONS = new Set([".js", ".jsx", ".ts", ".tsx"]);

/**
 * Normalizes a file path to forward slashes with no leading/trailing slashes.
 */
function normalizePath(p) {
  return p.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

/**
 * Checks if a zip entry path should be excluded based on directory or filename rules.
 */
function isExcludedPath(entryPath) {
  const normalized = normalizePath(entryPath);
  const parts = normalized.split("/");

  // Check if any folder matches excluded directories
  for (const part of parts) {
    if (EXCLUDED_DIRS.has(part.toLowerCase())) {
      return true;
    }
  }

  const baseName = path.posix.basename(normalized);
  const lowerBase = baseName.toLowerCase();

  // Check exact excluded filenames
  if (EXCLUDED_FILENAMES.has(lowerBase)) {
    return true;
  }

  // Check excluded extensions
  for (const ext of EXCLUDED_EXTENSIONS) {
    if (lowerBase.endsWith(ext)) {
      return true;
    }
  }

  return false;
}

/**
 * Checks if a file belongs to the analyzer's own rules or engine implementation,
 * so rule text itself is never flagged as code issues.
 */
function isAnalyzerSelfFile(filePath) {
  const normalized = normalizePath(filePath).toLowerCase();
  return (
    normalized.endsWith("analysisrules.js") ||
    normalized.endsWith("analyzeroo.js") ||
    normalized.endsWith("analyzezip.js") ||
    normalized.includes("/rules/analysisrules") ||
    normalized.includes("/utils/analyzezip")
  );
}

/**
 * Determines programming language from file extension.
 */
function detectLanguage(ext) {
  const langMap = {
    ".js": "JavaScript",
    ".jsx": "JavaScript",
    ".ts": "TypeScript",
    ".tsx": "TypeScript",
    ".py": "Python",
    ".java": "Java",
    ".c": "C",
    ".cpp": "C++",
    ".html": "HTML",
    ".css": "CSS",
  };
  return langMap[ext] || null;
}

/**
 * Counts meaningful lines of code (excludes blank lines and standalone comments).
 */
function countMeaningfulLines(lines, ext) {
  let count = 0;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Filter comment-only lines
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("#") ||
      trimmed.startsWith("<!--")
    ) {
      continue;
    }
    count++;
  }
  return count;
}

/**
 * Checks if a line contains real deep control-flow nesting.
 * Avoids reporting indentation inside multiline strings, template strings, comments, or harmless object literals.
 */
function checkDeepNesting(lines, ext, threshold = 4) {
  const findings = [];
  let inBlockComment = false;
  let inTemplateString = false;

  // Track control flow statements to report meaningful nesting spots
  const controlFlowRegex = /^\s*(if|else if|for|while|switch|case|try|catch|do|def|elif)\b/;

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const trimmed = rawLine.trim();

    if (!trimmed) continue;

    // Track block comments
    if (trimmed.startsWith("/*")) inBlockComment = true;
    if (inBlockComment) {
      if (trimmed.endsWith("*/")) inBlockComment = false;
      continue;
    }
    if (trimmed.startsWith("//") || trimmed.startsWith("#") || trimmed.startsWith("<!--")) {
      continue;
    }

    // Track template strings / multiline strings
    const backtickCount = (rawLine.match(/`/g) || []).length;
    if (backtickCount % 2 !== 0) {
      inTemplateString = !inTemplateString;
    }
    if (inTemplateString) continue;

    // Measure indentation depth: 2 spaces = 1 level (standard for JS/TS/web), 1 tab = 1 level
    const leadingSpaces = rawLine.match(/^( +)/);
    const leadingTabs = rawLine.match(/^(\t+)/);
    let indentDepth = 0;

    if (leadingTabs) {
      indentDepth = leadingTabs[1].length;
    } else if (leadingSpaces) {
      indentDepth = Math.floor(leadingSpaces[1].length / 2);
    }

    // Only report when nesting depth exceeds threshold AND line is a meaningful control flow statement
    if (indentDepth > threshold && controlFlowRegex.test(rawLine)) {
      findings.push({
        lineNumber: idx + 1,
        depth: indentDepth,
        snippet: trimmed.substring(0, 80),
      });

      // Report at most 1 meaningful deep nesting occurrence per file to avoid flooding
      break;
    }
  }

  return findings;
}

/**
 * Runs centralized Technical Debt rules against a source file.
 */
function runTechnicalDebtRules(filePath, lines, ext) {
  // Never scan analyzer's internal rule definitions
  if (isAnalyzerSelfFile(filePath)) {
    return [];
  }

  const findings = [];
  const rules = analysisRules.technicalDebt;

  // 1. TD-SIZE-001: Large Source File
  const sizeRule = rules.find((r) => r.id === "TD-SIZE-001");
  if (sizeRule && sizeRule.applicableExtensions.includes(ext)) {
    const meaningfulLines = countMeaningfulLines(lines, ext);
    if (meaningfulLines > (sizeRule.threshold || 300)) {
      findings.push({
        ruleId: sizeRule.id,
        issueType: sizeRule.name,
        severity: sizeRule.severity.toUpperCase(),
        filePath,
        lineNumber: 1,
        description: `File contains ${meaningfulLines} meaningful lines, exceeding the ${sizeRule.threshold || 300}-line limit.`,
        suggestion: sizeRule.suggestion,
      });
    }
  }

  // 2. TD-TODO-001 & TD-FIXME-001: TODO and FIXME Markers in Comments Only
  const todoRule = rules.find((r) => r.id === "TD-TODO-001");
  const fixmeRule = rules.find((r) => r.id === "TD-FIXME-001");

  const todoCommentRegex = /(?:\/\/|\/\*|\*|#|<!--)\s*TODO\b/i;
  const fixmeCommentRegex = /(?:\/\/|\/\*|\*|#|<!--)\s*FIXME\b/i;

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Ignore lines that describe the rule itself (e.g. in test fixtures or rule lists)
    if (
      trimmed.includes("TODO/FIXME") ||
      trimmed.includes("TODO marker") ||
      trimmed.includes("FIXME marker") ||
      trimmed.includes("analysisRules")
    ) {
      return;
    }

    if (todoRule && todoRule.applicableExtensions.includes(ext)) {
      if (todoCommentRegex.test(trimmed)) {
        findings.push({
          ruleId: todoRule.id,
          issueType: todoRule.name,
          severity: todoRule.severity.toUpperCase(),
          filePath,
          lineNumber: idx + 1,
          description: `TODO marker found: "${trimmed.substring(0, 80)}"`,
          suggestion: todoRule.suggestion,
        });
      }
    }

    if (fixmeRule && fixmeRule.applicableExtensions.includes(ext)) {
      if (fixmeCommentRegex.test(trimmed)) {
        findings.push({
          ruleId: fixmeRule.id,
          issueType: fixmeRule.name,
          severity: fixmeRule.severity.toUpperCase(),
          filePath,
          lineNumber: idx + 1,
          description: `FIXME marker found: "${trimmed.substring(0, 80)}"`,
          suggestion: fixmeRule.suggestion,
        });
      }
    }
  });

  // 3. TD-NESTING-001: Deep Control-Flow Nesting
  const nestingRule = rules.find((r) => r.id === "TD-NESTING-001");
  if (nestingRule && nestingRule.applicableExtensions.includes(ext)) {
    const nestingIssues = checkDeepNesting(lines, ext, nestingRule.threshold || 4);
    nestingIssues.forEach((issue) => {
      findings.push({
        ruleId: nestingRule.id,
        issueType: nestingRule.name,
        severity: nestingRule.severity.toUpperCase(),
        filePath,
        lineNumber: issue.lineNumber,
        description: `Control-flow nesting exceeds ${nestingRule.threshold || 4} levels.`,
        suggestion: nestingRule.suggestion,
      });
    });
  }

  // 4. TD-DEBUG-001: Real Debug Console Statements
  const debugRule = rules.find((r) => r.id === "TD-DEBUG-001");
  if (debugRule && debugRule.applicableExtensions.includes(ext)) {
    const consoleRegex = /(?:^|[^\w$.])console\.(log|error|warn|debug)\s*\(/;
    let reportedDebugCount = 0;

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Ignore comments and strings describing console
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith("/*") ||
        trimmed.startsWith("*")
      ) {
        return;
      }

      if (consoleRegex.test(trimmed) && reportedDebugCount < 3) {
        findings.push({
          ruleId: debugRule.id,
          issueType: debugRule.name,
          severity: debugRule.severity.toUpperCase(),
          filePath,
          lineNumber: idx + 1,
          description: `Debug console statement found: "${trimmed.substring(0, 80)}"`,
          suggestion: debugRule.suggestion,
        });
        reportedDebugCount++;
      }
    });
  }

  return findings;
}

/**
 * Runs Security rules against a source file.
 */
function runSecurityRules(filePath, lines, ext) {
  if (isAnalyzerSelfFile(filePath)) {
    return [];
  }

  const findings = [];
  const rules = analysisRules.security;

  rules.forEach((rule) => {
    if (!rule.applicableExtensions.includes(ext)) return;

    const patterns = rule.patterns || (rule.pattern ? [rule.pattern] : []);

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*")) return;

      patterns.forEach((pattern) => {
        if (pattern.test(line)) {
          // Mask secrets to prevent leaking credentials
          const maskedLine = line.replace(pattern, (match) => {
            return match.replace(/(['"`])[^'"`]{4,}(['"`])/g, "$1[REDACTED]$2");
          });

          findings.push({
            ruleId: rule.id || rule.legacyId,
            title: rule.name,
            severity: rule.severity.toUpperCase(),
            file: filePath,
            filePath,
            lineNumber: idx + 1,
            description: `${rule.description} Detected at: "${maskedLine.trim().substring(0, 100)}"`,
            suggestion: rule.suggestion,
            recommendation: rule.suggestion,
          });
        }
      });
    });
  });

  return findings;
}

/**
 * Extracts package dependencies from a package.json file.
 */
function extractPackageJson(content, filePath) {
  try {
    const pkg = JSON.parse(content);
    const production = [];
    const development = [];

    if (pkg.dependencies && typeof pkg.dependencies === "object") {
      Object.entries(pkg.dependencies).forEach(([name, version]) => {
        production.push({
          name,
          version: String(version),
          type: "production",
          source: filePath,
        });
      });
    }

    if (pkg.devDependencies && typeof pkg.devDependencies === "object") {
      Object.entries(pkg.devDependencies).forEach(([name, version]) => {
        development.push({
          name,
          version: String(version),
          type: "development",
          source: filePath,
        });
      });
    }

    return { production, development };
  } catch {
    return { production: [], development: [] };
  }
}

/**
 * Extracts imports and requires from JS/TS source code and resolves them.
 *
 * @param {string} sourceFilePath - Normalized path to the importing file
 * @param {string} content - File source code
 * @param {Set<string>} allSourceFiles - Set of all actual source files in the project
 * @returns {Array<{ targetId: string, label: string, type: 'file' | 'package' }>}
 */
function extractImports(sourceFilePath, content, allSourceFiles) {
  const imports = [];
  const dir = path.posix.dirname(sourceFilePath);

  // Regex for ES import / export and CommonJS require
  const importPatterns = [
    // import ... from "..."
    /(?:import|export)\s+(?:[\w*\s{},$]+from\s+)?['"]([^'"]+)['"]/g,
    // require("...")
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // dynamic import("...")
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  const matchedSpecifiers = new Set();

  importPatterns.forEach((regex) => {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const specifier = match[1]?.trim();
      if (specifier && !matchedSpecifiers.has(specifier)) {
        matchedSpecifiers.add(specifier);
      }
    }
  });

  matchedSpecifiers.forEach((specifier) => {
    if (specifier.startsWith(".")) {
      // Relative import: resolve against actual project files
      const resolvedBase = path.posix.normalize(path.posix.join(dir, specifier));

      // Candidates to check
      const candidates = [
        resolvedBase,
        `${resolvedBase}.ts`,
        `${resolvedBase}.tsx`,
        `${resolvedBase}.js`,
        `${resolvedBase}.jsx`,
        `${resolvedBase}/index.ts`,
        `${resolvedBase}/index.tsx`,
        `${resolvedBase}/index.js`,
        `${resolvedBase}/index.jsx`,
      ];

      const foundTarget = candidates.find((c) => allSourceFiles.has(c));

      // ONLY create a node and edge if the file genuinely exists in the project
      if (foundTarget && foundTarget !== sourceFilePath) {
        imports.push({
          targetId: foundTarget,
          label: path.posix.basename(foundTarget),
          type: "file",
        });
      }
    } else {
      // External package import (e.g. "react", "express", "@vitejs/plugin-react")
      // Filter out internal protocol or pseudo-paths
      if (specifier.startsWith("http:") || specifier.startsWith("https:") || specifier.startsWith("/")) {
        return;
      }

      // Normalize scoped or subpath packages (e.g. "@scope/pkg/sub" -> "@scope/pkg", "pkg/sub" -> "pkg")
      let pkgName = specifier;
      if (specifier.startsWith("@")) {
        const parts = specifier.split("/");
        pkgName = parts.slice(0, 2).join("/");
      } else {
        pkgName = specifier.split("/")[0];
      }

      imports.push({
        targetId: pkgName,
        label: pkgName,
        type: "package",
      });
    }
  });

  return imports;
}

/**
 * Categorizes directory name into architecture components.
 */
function categorizeComponent(name) {
  const lower = name.toLowerCase();
  if (["components", "component", "ui", "views", "pages"].some((k) => lower.includes(k)))
    return "Frontend";
  if (["controllers", "controller", "handlers", "handler"].some((k) => lower.includes(k)))
    return "Controller";
  if (["routes", "route", "router"].some((k) => lower.includes(k)))
    return "Routes";
  if (["models", "model", "schema", "schemas", "entities"].some((k) => lower.includes(k)))
    return "Data Model";
  if (["middleware", "middlewares"].some((k) => lower.includes(k)))
    return "Middleware";
  if (["services", "service"].some((k) => lower.includes(k)))
    return "Service";
  if (["utils", "helpers", "lib", "libs"].some((k) => lower.includes(k)))
    return "Utility";
  if (["config", "configs", "settings"].some((k) => lower.includes(k)))
    return "Configuration";
  if (["tests", "test", "__tests__", "spec"].some((k) => lower.includes(k)))
    return "Tests";
  if (["public", "static", "assets"].some((k) => lower.includes(k)))
    return "Static Assets";
  if (lower === "backend" || lower === "server" || lower === "api")
    return "Backend";
  if (lower === "frontend" || lower === "client" || lower === "web")
    return "Frontend";
  return "Module";
}

/**
 * Deduplicates findings by ruleId + filePath + lineNumber + issueType.
 */
function deduplicateFindings(findings) {
  const seen = new Set();
  const deduped = [];

  findings.forEach((f) => {
    const key = `${f.ruleId}::${f.filePath}::${f.lineNumber}::${f.issueType || f.title || ""}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(f);
    }
  });

  return deduped;
}

/**
 * Computes health score (0-100) based on severity deductions.
 */
function computeDebtScore(findings) {
  let score = 100;
  findings.forEach((f) => {
    if (f.severity === "HIGH") score -= 5;
    else if (f.severity === "MEDIUM") score -= 3;
    else score -= 1;
  });
  return Math.max(0, Math.min(100, score));
}

function computeSecurityScore(findings) {
  let score = 100;
  findings.forEach((f) => {
    if (f.severity === "CRITICAL") score -= 15;
    else if (f.severity === "HIGH") score -= 10;
    else if (f.severity === "MEDIUM") score -= 5;
    else score -= 2;
  });
  return Math.max(0, Math.min(100, score));
}

/**
 * Main analysis function.
 * Extracts and analyzes a ZIP archive using strictly rule-based logic.
 *
 * @param {string} zipFilePath - Absolute path to the uploaded ZIP file.
 * @returns {object} Structured analysis results.
 */
function analyzeZip(zipFilePath) {
  const zip = new AdmZip(zipFilePath);
  const entries = zip.getEntries();

  // Sets and registries
  const allSourceFiles = new Set();
  const sourceContents = new Map();
  const rawDebtFindings = [];
  const rawSecurityFindings = [];
  const packageProdDeps = [];
  const packageDevDeps = [];
  const languageCounts = {};
  const folderSet = new Set();
  const archComponents = [];
  const archNames = new Set();

  // Sensible limits to prevent scanning massive or generated archives
  const MAX_SOURCE_FILES = 500;
  const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB limit per file

  // First pass: Index all relevant non-excluded source files
  entries.forEach((entry) => {
    const entryName = normalizePath(entry.entryName);

    if (!entryName || isExcludedPath(entryName)) {
      return;
    }

    if (entry.isDirectory) {
      const segments = entryName.split("/").filter(Boolean);
      segments.forEach((seg) => folderSet.add(seg));

      // Architecture folder mapping (top 2 levels)
      if (segments.length <= 2) {
        const name = segments[segments.length - 1];
        if (name && !archNames.has(name) && !EXCLUDED_DIRS.has(name.toLowerCase())) {
          archNames.add(name);
          archComponents.push({
            name,
            category: categorizeComponent(name),
            path: entryName,
          });
        }
      }
      return;
    }

    const baseName = path.posix.basename(entryName);
    const ext = path.posix.extname(baseName).toLowerCase();

    // Collect package.json files
    if (baseName === "package.json") {
      try {
        const content = entry.getData().toString("utf8");
        const { production, development } = extractPackageJson(content, entryName);
        packageProdDeps.push(...production);
        packageDevDeps.push(...development);
      } catch { /* skip unreadable JSON */ }
    }

    // Index valid source files
    if (SOURCE_CODE_EXTENSIONS.has(ext)) {
      if (allSourceFiles.size < MAX_SOURCE_FILES) {
        allSourceFiles.add(entryName);

        const lang = detectLanguage(ext);
        if (lang) {
          languageCounts[lang] = (languageCounts[lang] || 0) + 1;
        }

        try {
          const buffer = entry.getData();
          if (buffer.length <= MAX_FILE_SIZE) {
            sourceContents.set(entryName, {
              content: buffer.toString("utf8"),
              ext,
            });
          }
        } catch { /* skip unreadable files */ }
      }
    }
  });

  // Second pass: Run Technical Debt and Security rules on indexed source files
  sourceContents.forEach(({ content, ext }, filePath) => {
    const lines = content.split("\n");

    const debtIssues = runTechnicalDebtRules(filePath, lines, ext);
    rawDebtFindings.push(...debtIssues);

    const secIssues = runSecurityRules(filePath, lines, ext);
    rawSecurityFindings.push(...secIssues);
  });

  // Third pass: Build Source-Code Import Graph from JS/TS files
  const graphNodes = new Map();
  const graphEdges = new Map();

  const MAX_GRAPH_NODES = 150;
  const MAX_GRAPH_EDGES = 300;

  sourceContents.forEach(({ content, ext }, filePath) => {
    if (!JS_TS_EXTENSIONS.has(ext)) return;

    // Ensure source file node exists
    if (!graphNodes.has(filePath)) {
      graphNodes.set(filePath, {
        id: filePath,
        label: path.posix.basename(filePath),
        type: "file",
        path: filePath,
      });
    }

    const fileImports = extractImports(filePath, content, allSourceFiles);

    fileImports.forEach(({ targetId, label, type }) => {
      // Respect graph size limits
      if (graphNodes.size >= MAX_GRAPH_NODES && !graphNodes.has(targetId)) {
        return;
      }
      if (graphEdges.size >= MAX_GRAPH_EDGES) {
        return;
      }

      // Add target node
      if (!graphNodes.has(targetId)) {
        graphNodes.set(targetId, {
          id: targetId,
          label,
          type,
          path: type === "file" ? targetId : null,
        });
      }

      // Add unique directed edge
      const edgeId = `${filePath}->${targetId}`;
      if (!graphEdges.has(edgeId)) {
        graphEdges.set(edgeId, {
          id: edgeId,
          source: filePath,
          target: targetId,
          type: type === "file" ? "import" : "package",
        });
      }
    });
  });

  // Deduplicate and format Technical Debt findings
  const dedupedDebtFindings = deduplicateFindings(rawDebtFindings);
  const dedupedSecurityFindings = deduplicateFindings(rawSecurityFindings);

  const debtScore = computeDebtScore(dedupedDebtFindings);
  const securityScore = computeSecurityScore(dedupedSecurityFindings);

  const todoCount = dedupedDebtFindings.filter((f) => f.ruleId === "TD-TODO-001").length;
  const fixmeCount = dedupedDebtFindings.filter((f) => f.ruleId === "TD-FIXME-001").length;
  const largeFileCount = dedupedDebtFindings.filter((f) => f.ruleId === "TD-SIZE-001").length;
  const deepNestingCount = dedupedDebtFindings.filter((f) => f.ruleId === "TD-NESTING-001").length;

  const lowCount = dedupedDebtFindings.filter((f) => f.severity === "LOW").length;
  const mediumCount = dedupedDebtFindings.filter((f) => f.severity === "MEDIUM").length;
  const highCount = dedupedDebtFindings.filter((f) => f.severity === "HIGH").length;

  // Deduplicate package inventory by name + source path
  const dedupPackageList = (list) => {
    const map = new Map();
    list.forEach((item) => {
      const key = `${item.name}::${item.source}`;
      if (!map.has(key)) map.set(key, item);
    });
    return Array.from(map.values());
  };

  const finalProdDeps = dedupPackageList(packageProdDeps);
  const finalDevDeps = dedupPackageList(packageDevDeps);

  // Flat combined dependencies array for backwards compatibility
  const combinedFlatDeps = [...finalProdDeps, ...finalDevDeps];

  const nodesArray = Array.from(graphNodes.values());
  const edgesArray = Array.from(graphEdges.values());

  // Fourth pass: Build complete recursive repository folder and file tree
  const treeResult = buildRepositoryTree(entries, path.posix.basename(zipFilePath, ".zip"));

  return {
    technicalDebt: {
      debtScore,
      totalFindings: dedupedDebtFindings.length,
      todoCount,
      fixmeCount,
      largeFileCount,
      deepNestingCount,
      summary: {
        low: lowCount,
        medium: mediumCount,
        high: highCount,
        debtScore,
        todoCount,
        fixmeCount,
        largeFileCount,
        deepNestingCount,
      },
      findings: dedupedDebtFindings,
      issues: dedupedDebtFindings, // backwards compatibility
    },
    securityAudit: {
      securityScore,
      totalFindings: dedupedSecurityFindings.length,
      criticalCount: dedupedSecurityFindings.filter((f) => f.severity === "CRITICAL").length,
      highCount: dedupedSecurityFindings.filter((f) => f.severity === "HIGH").length,
      mediumCount: dedupedSecurityFindings.filter(
        (f) => f.severity === "MEDIUM" || f.severity === "LOW"
      ).length,
      findings: dedupedSecurityFindings,
    },
    dependencyGraph: {
      packageDependencies: {
        production: finalProdDeps,
        development: finalDevDeps,
      },
      nodes: nodesArray,
      edges: edgesArray,
      summary: {
        sourceFiles: allSourceFiles.size,
        sourceNodes: nodesArray.filter((n) => n.type === "file").length,
        packageNodes: nodesArray.filter((n) => n.type === "package").length,
        sourceEdges: edgesArray.length,
        productionDependencies: finalProdDeps.length,
        developmentDependencies: finalDevDeps.length,
      },
      dependencies: combinedFlatDeps, // backwards compatibility
    },
    dependencies: combinedFlatDeps,
    architecture: {
      root: treeResult.root,
      tree: treeResult.tree,
      summary: treeResult.summary,
      components: treeResult.components.length > 0 ? treeResult.components : archComponents,
      connections: buildSimpleConnections(treeResult.components.length > 0 ? treeResult.components : archComponents),
    },
    languageCounts,
    fileCount: allSourceFiles.size,
    folderCount: folderSet.size || 1,
  };
}

/**
 * Recursively builds the complete repository folder and file tree from ZIP entries.
 * Strictly excludes node_modules, .git, dist, build, lock files, and minified bundles.
 * Sorts folders first, alphabetically, and computes accurate summary statistics.
 */
function buildRepositoryTree(entries, projectName = "Repository") {
  const root = {
    name: projectName,
    type: "folder",
    path: "",
    children: [],
  };

  const folderMap = new Map();
  folderMap.set("", root);

  let totalFiles = 0;
  let totalFolders = 0;
  const categorizedModules = [];
  const categorySet = new Set();

  const MAX_TREE_NODES = 1000;
  let nodeCount = 0;
  let isLimited = false;

  // Filter entries to non-excluded files and folders
  const validEntries = entries.filter((entry) => {
    const entryName = normalizePath(entry.entryName);
    return entryName && !isExcludedPath(entryName);
  });

  // Sort entries so parent directories are registered before children
  validEntries.sort((a, b) => a.entryName.localeCompare(b.entryName));

  for (const entry of validEntries) {
    if (nodeCount >= MAX_TREE_NODES) {
      isLimited = true;
      break;
    }

    const entryName = normalizePath(entry.entryName);
    const parts = entryName.split("/").filter(Boolean);
    if (parts.length === 0) continue;

    let currentPath = "";
    let parentFolder = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!isLast || entry.isDirectory) {
        // Folder node
        if (!folderMap.has(currentPath)) {
          totalFolders++;
          nodeCount++;
          const folderNode = {
            name: part,
            type: "folder",
            path: currentPath,
            children: [],
          };
          parentFolder.children.push(folderNode);
          folderMap.set(currentPath, folderNode);

          // Architecture component categorization
          if (parts.length <= 3) {
            const cat = categorizeComponent(part);
            if (cat !== "Module" && !categorySet.has(currentPath)) {
              categorySet.add(currentPath);
              categorizedModules.push({
                name: part,
                path: currentPath,
                category: cat,
              });
            }
          }
        }
        parentFolder = folderMap.get(currentPath);
      } else {
        // File node
        totalFiles++;
        nodeCount++;
        const ext = path.posix.extname(part).toLowerCase();
        const fileNode = {
          name: part,
          type: "file",
          path: currentPath,
          extension: ext,
          category: categorizeComponent(part),
        };
        parentFolder.children.push(fileNode);
      }
    }
  }

  // Recursively sort all children: folders first (alphabetical), then files (alphabetical)
  function sortNode(node) {
    if (!node.children || node.children.length === 0) return;
    node.children.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });
    node.children.forEach(sortNode);
  }

  sortNode(root);

  return {
    root,
    tree: root.children,
    summary: {
      files: totalFiles,
      folders: totalFolders,
      components: categorizedModules.length,
      categories: new Set(categorizedModules.map((m) => m.category)).size,
      isLimited,
      warning: isLimited ? "Repository tree was limited to 1,000 nodes for performance." : null,
    },
    components: categorizedModules,
    connections: buildSimpleConnections(categorizedModules),
  };
}

/**
 * Builds connections between architecture categories.
 */
function buildSimpleConnections(components) {
  const connections = [];
  const categoryOrder = [
    "Routes", "Middleware", "Controller", "Service", "Data Model",
  ];
  const byCategory = {};
  components.forEach((c) => {
    if (!byCategory[c.category]) byCategory[c.category] = [];
    byCategory[c.category].push(c.name);
  });

  for (let i = 0; i < categoryOrder.length - 1; i++) {
    const from = byCategory[categoryOrder[i]];
    const to = byCategory[categoryOrder[i + 1]];
    if (from && to) {
      connections.push({
        from: categoryOrder[i],
        to: categoryOrder[i + 1],
        label: "calls",
      });
    }
  }
  return connections;
}

module.exports = {
  analyzeZip,
  buildRepositoryTree,
  isExcludedPath,
  extractImports,
  runTechnicalDebtRules,
  runSecurityRules,
};
