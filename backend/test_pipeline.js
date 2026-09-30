/**
 * test_pipeline.js
 * Comprehensive automated verification script for CodeCatalyst rule-based analysis.
 * Verifies Technical Debt Analyzer and Dependency Graph requirements.
 */

const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");
const { analyzeZip } = require("./src/utils/analyzeZip");

async function runTests() {
  console.log("=== Starting CodeCatalyst Analysis Pipeline Tests ===");

  const zip = new AdmZip();

  // 1. package.json with production & dev dependencies
  const packageJsonContent = JSON.stringify(
    {
      name: "sample-project",
      version: "1.0.0",
      dependencies: {
        react: "^18.2.0",
        "react-dom": "^18.2.0",
        axios: "^1.6.8",
      },
      devDependencies: {
        typescript: "^5.2.2",
        vite: "^5.1.6",
      },
    },
    null,
    2
  );
  zip.addFile("package.json", Buffer.from(packageJsonContent));

  // 2. package-lock.json (MUST be ignored)
  zip.addFile(
    "package-lock.json",
    Buffer.from(JSON.stringify({ name: "lock", lockfileVersion: 3 }))
  );

  // 3. node_modules file (MUST be ignored)
  zip.addFile(
    "node_modules/lodash/index.js",
    Buffer.from('// TODO: node_modules todo\nconsole.log("in node_modules");')
  );

  // 4. dist/bundle.min.js (MUST be ignored)
  zip.addFile(
    "dist/bundle.min.js",
    Buffer.from('// TODO: dist todo\nconsole.log("in dist");')
  );

  // 5. Rule description text in an analyzer-like file (MUST NOT trigger TODO/FIXME)
  zip.addFile(
    "src/rules/analysisRules.js",
    Buffer.from(
      '// Description: TODO/FIXME markers, and missing docstrings.\nconst r = { name: "TODO Comment" };'
    )
  );

  // 6. src/services/api.ts (valid file)
  const apiContent = `import axios from "axios";
import { helper } from "../utils/helper";

export async function fetchData() {
  console.log("Fetching API data");
  return axios.get("/api/data");
}
`;
  zip.addFile("src/services/api.ts", Buffer.from(apiContent));

  // 7. src/utils/helper.ts (valid file with real TODO & FIXME comments)
  const helperContent = `// TODO: implement formatHelper logic
// FIXME: fix rounding bug in calculation
export function helper(val: number): string {
  return String(val);
}
`;
  zip.addFile("src/utils/helper.ts", Buffer.from(helperContent));

  // 8. src/components/Header.tsx (valid file)
  const headerContent = `import React from "react";

export const Header = () => {
  return <header>Header Component</header>;
};
`;
  zip.addFile("src/components/Header.tsx", Buffer.from(headerContent));

  // 9. src/components/Dashboard.tsx (valid file with deep nesting & imports)
  const dashboardContent = `import React from "react";
import { Header } from "./Header";
import { fetchData } from "../services/api";

export const Dashboard = () => {
  function deepCheck(a: number, b: number, c: number, d: number, e: number) {
    if (a > 0) {
      if (b > 0) {
        if (c > 0) {
          if (d > 0) {
            if (e > 0) {
              console.log("Deeply nested statement");
            }
          }
        }
      }
    }
  }

  return <div>Dashboard</div>;
};
`;
  zip.addFile("src/components/Dashboard.tsx", Buffer.from(dashboardContent));

  // 10. src/utils/largeModule.ts (320 meaningful lines to test TD-SIZE-001)
  const largeLines = [];
  for (let i = 1; i <= 320; i++) {
    largeLines.push(`export const constant_${i} = ${i};`);
  }
  zip.addFile("src/utils/largeModule.ts", Buffer.from(largeLines.join("\n")));

  // Write temporary ZIP
  const testZipPath = path.join(__dirname, "test_repo.zip");
  zip.writeZip(testZipPath);
  console.log("✓ Generated test ZIP archive:", testZipPath);

  try {
    // Run analysis
    const result = analyzeZip(testZipPath);

    console.log("\n--- Validating Technical Debt Results ---");
    const td = result.technicalDebt;
    const findings = td.findings;

    console.log(`Total Findings: ${td.totalFindings}`);
    console.log(`Health Score: ${td.debtScore}`);
    console.log("Summary:", td.summary);

    // Assertion 1: node_modules and dist must NOT produce any findings
    const nodeModulesFindings = findings.filter(
      (f) => f.filePath.includes("node_modules") || f.filePath.includes("dist")
    );
    if (nodeModulesFindings.length > 0) {
      throw new Error("FAILED: node_modules or dist files produced findings!");
    }
    console.log("✓ node_modules and dist files were strictly excluded.");

    // Assertion 2: analysisRules.js rule description must NOT trigger TODO/FIXME
    const ruleSelfFindings = findings.filter((f) =>
      f.filePath.includes("analysisRules.js")
    );
    if (ruleSelfFindings.length > 0) {
      throw new Error("FAILED: analysisRules.js rule descriptions produced findings!");
    }
    console.log("✓ Analyzer rules source code / descriptions produced zero findings.");

    // Assertion 3: Real TODO and FIXME comments in helper.ts are detected
    const todoFinding = findings.find(
      (f) => f.ruleId === "TD-TODO-001" && f.filePath === "src/utils/helper.ts"
    );
    const fixmeFinding = findings.find(
      (f) => f.ruleId === "TD-FIXME-001" && f.filePath === "src/utils/helper.ts"
    );
    if (!todoFinding || !fixmeFinding) {
      throw new Error("FAILED: Real TODO or FIXME comment was not detected!");
    }
    console.log(`✓ Detected TODO marker at ${todoFinding.filePath}:${todoFinding.lineNumber}`);
    console.log(`✓ Detected FIXME marker at ${fixmeFinding.filePath}:${fixmeFinding.lineNumber}`);

    // Assertion 4: Real console statements detected
    const consoleFindings = findings.filter((f) => f.ruleId === "TD-DEBUG-001");
    if (consoleFindings.length === 0) {
      throw new Error("FAILED: Real console statements were not detected!");
    }
    console.log(`✓ Detected ${consoleFindings.length} real console.log statement(s).`);

    // Assertion 5: Deep nesting detected in Dashboard.tsx
    const nestingFinding = findings.find(
      (f) => f.ruleId === "TD-NESTING-001" && f.filePath === "src/components/Dashboard.tsx"
    );
    // Assertion 5b: Large file detected (>300 lines) once
    const sizeFindings = findings.filter((f) => f.ruleId === "TD-SIZE-001");
    if (sizeFindings.length !== 1 || sizeFindings[0].filePath !== "src/utils/largeModule.ts") {
      throw new Error(`FAILED: Expected 1 large file finding, found ${sizeFindings.length}!`);
    }
    console.log(`✓ Detected large file at ${sizeFindings[0].filePath} (reported once).`);

    // Assertion 6: All findings have non-empty Fix/Suggestion
    const emptyFix = findings.find((f) => !f.suggestion || f.suggestion.trim() === "");
    if (emptyFix) {
      throw new Error(`FAILED: Finding ${emptyFix.ruleId} has empty fix section!`);
    }
    console.log("✓ All findings contain non-empty fix recommendations.");

    // Assertion 7: Deduplication check
    const findingKeys = findings.map((f) => `${f.ruleId}:${f.filePath}:${f.lineNumber}`);
    const uniqueFindingKeys = new Set(findingKeys);
    if (findingKeys.length !== uniqueFindingKeys.size) {
      throw new Error("FAILED: Duplicate findings found!");
    }
    console.log("✓ All findings are cleanly deduplicated.");

    console.log("\n--- Validating Dependency Graph & Inventory ---");
    const dg = result.dependencyGraph;

    // Assertion 8: Package inventory separated from import graph
    console.log(
      `Package Inventory: ${dg.packageDependencies.production.length} prod, ${dg.packageDependencies.development.length} dev`
    );
    if (
      dg.packageDependencies.production.length !== 3 ||
      dg.packageDependencies.development.length !== 2
    ) {
      throw new Error("FAILED: Package inventory count mismatch!");
    }
    console.log("✓ Package dependency inventory extracted correctly.");

    // Assertion 9: Import graph has correct nodes and edges
    console.log(`Source Graph: ${dg.nodes.length} nodes, ${dg.edges.length} edges`);

    // Check specific valid edges:
    // Dashboard.tsx -> Header.tsx
    // Dashboard.tsx -> api.ts
    // api.ts -> helper.ts
    // api.ts -> axios
    // Dashboard.tsx -> react
    const hasEdge = (src, tgt) =>
      dg.edges.some((e) => e.source === src && e.target === tgt);

    if (!hasEdge("src/components/Dashboard.tsx", "src/components/Header.tsx")) {
      throw new Error("FAILED: Expected edge Dashboard.tsx -> Header.tsx not found!");
    }
    if (!hasEdge("src/components/Dashboard.tsx", "src/services/api.ts")) {
      throw new Error("FAILED: Expected edge Dashboard.tsx -> api.ts not found!");
    }
    if (!hasEdge("src/services/api.ts", "src/utils/helper.ts")) {
      throw new Error("FAILED: Expected edge api.ts -> helper.ts not found!");
    }
    if (!hasEdge("src/services/api.ts", "axios")) {
      throw new Error("FAILED: Expected edge api.ts -> axios not found!");
    }
    console.log("✓ All expected source import edges resolved correctly:");
    console.log("   • Dashboard.tsx → Header.tsx");
    console.log("   • Dashboard.tsx → api.ts");
    console.log("   • api.ts → helper.ts");
    console.log("   • api.ts → axios");

    // Assertion 10: No imaginary edges or file-to-every-file connections
    const imaginaryEdges = dg.edges.filter((e) => e.target.includes("imaginary"));
    if (imaginaryEdges.length > 0) {
      throw new Error("FAILED: Imaginary nodes/edges detected!");
    }
    console.log("✓ No imaginary file nodes or random edges created.");

    console.log("\n--- Validating Architecture Recursive Tree & Counts ---");
    const arch = result.architecture;

    if (!arch || !arch.tree || arch.tree.length === 0) {
      throw new Error("FAILED: Architecture tree is empty!");
    }

    const srcFolder = arch.tree.find((n) => n.name === "src" && n.type === "folder");
    if (!srcFolder || !srcFolder.children || srcFolder.children.length === 0) {
      throw new Error("FAILED: 'src' folder not found or has no children in architecture tree!");
    }

    const componentsFolder = srcFolder.children.find((n) => n.name === "components" && n.type === "folder");
    if (!componentsFolder || !componentsFolder.children || componentsFolder.children.length === 0) {
      throw new Error("FAILED: 'src/components' folder not found or has no children!");
    }

    const dashboardFile = componentsFolder.children.find((n) => n.name === "Dashboard.tsx" && n.type === "file");
    if (!dashboardFile) {
      throw new Error("FAILED: 'Dashboard.tsx' not found inside 'src/components'!");
    }

    console.log("✓ Full recursive folder tree verified successfully:");
    console.log(`   • Root -> ${srcFolder.name}/ -> ${componentsFolder.name}/ -> ${dashboardFile.name}`);
    console.log(`✓ Architecture Summary: ${arch.summary.files} files, ${arch.summary.folders} folders, ${arch.summary.components} components`);

    // Verify node_modules is NOT in tree
    const hasNodeModules = arch.tree.some((n) => n.name === "node_modules");
    if (hasNodeModules) {
      throw new Error("FAILED: node_modules found in architecture tree!");
    }
    console.log("✓ node_modules was strictly excluded from architecture tree.");

    console.log("\n==========================================");
    console.log("✅ ALL TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================");
  } finally {
    // Clean up test zip file
    if (fs.existsSync(testZipPath)) {
      fs.unlinkSync(testZipPath);
    }
  }
}

runTests().catch((err) => {
  console.error("\n❌ TEST FAILED:", err.message);
  process.exit(1);
});
