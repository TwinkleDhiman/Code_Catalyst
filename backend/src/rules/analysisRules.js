/**
 * analysisRules.js
 * Central predefined rules file for CodeCatalyst rule-based static code analysis.
 * Single source of truth for all Technical Debt and Security rule definitions.
 * Each rule defines its standard metadata, severity, thresholds, and remediation suggestions.
 */

const analysisRules = {
  /**
   * Technical Debt Rules
   * Strictly rule-based checks for code maintainability, cleanliness, and complexity.
   */
  technicalDebt: [
    {
      id: "TD-DEBUG-001",
      name: "Debug Console Statement",
      category: "Technical Debt",
      description: "Debug console statement found.",
      severity: "LOW",
      condition: "Presence of console.log, console.error, or console.warn statements in source files",
      threshold: null,
      suggestion: "Replace console.log with a controlled logger or remove it before production.",
      applicableExtensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    {
      id: "TD-TODO-001",
      name: "TODO Marker",
      category: "Technical Debt",
      description: "TODO marker found in source code comments.",
      severity: "LOW",
      condition: "Presence of TODO comments indicating unfinished tasks",
      threshold: null,
      suggestion: "Create a tracked issue for this task and remove the inline marker once resolved.",
      applicableExtensions: [
        ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c", ".css", ".html",
      ],
    },
    {
      id: "TD-FIXME-001",
      name: "FIXME Marker",
      category: "Technical Debt",
      description: "FIXME marker found in source code comments.",
      severity: "MEDIUM",
      condition: "Presence of FIXME comments indicating known defects or problems",
      threshold: null,
      suggestion: "Resolve the defect or problem and track it in a bug tracker instead of inline comments.",
      applicableExtensions: [
        ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c", ".css", ".html",
      ],
    },
    {
      id: "TD-NESTING-001",
      name: "Deep Control-Flow Nesting",
      category: "Technical Debt",
      description: "Control-flow nesting exceeds 4 levels.",
      severity: "MEDIUM",
      condition: "Blocks or control-flow indentation exceeding 4 levels deep",
      threshold: 4,
      suggestion: "Extract nested logic into smaller functions, use guard clauses, or simplify conditional branches.",
      applicableExtensions: [
        ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c",
      ],
    },
    {
      id: "TD-SIZE-001",
      name: "Large Source File",
      category: "Technical Debt",
      description: "File contains more than 300 meaningful lines.",
      severity: "MEDIUM",
      condition: "Meaningful source lines of code exceeding 300 lines",
      threshold: 300,
      suggestion: "Split the file into smaller components, utilities, or service modules.",
      applicableExtensions: [
        ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".cpp", ".c", ".css", ".html",
      ],
    },
    {
      id: "TD-DOC-001",
      name: "Missing Function Documentation",
      category: "Technical Debt",
      description: "Function or class definition lacks documentation comments.",
      severity: "LOW",
      condition: "Exported function or class without preceding docstring or JSDoc comment",
      threshold: null,
      suggestion: "Add JSDoc or descriptive comments for public functions and module exports.",
      applicableExtensions: [".js", ".jsx", ".ts", ".tsx"],
    },
  ],

  /**
   * Security Rules
   * Deterministic pattern matching for common security vulnerabilities and credential leaks.
   */
  security: [
    {
      id: "SEC-KEY-001",
      legacyId: "SEC001",
      name: "Hardcoded API Key",
      category: "Security",
      description: "Detects possible hardcoded API keys in source files using common naming patterns.",
      severity: "HIGH",
      condition: "Assignments to variable names matching API key patterns with high-entropy string values",
      patterns: [
        /api[_-]?key\s*[=:]\s*['"`][A-Za-z0-9\-_]{16,}['"`]/i,
        /apikey\s*[=:]\s*['"`][A-Za-z0-9\-_]{16,}['"`]/i,
      ],
      threshold: null,
      suggestion: "Move API keys to environment variables and access them via process.env. Never commit keys to source control.",
      applicableExtensions: [
        ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".php", ".env.example",
      ],
    },
    {
      id: "SEC-PWD-001",
      legacyId: "SEC002",
      name: "Hardcoded Password",
      category: "Security",
      description: "Detects possible hardcoded passwords assigned to variables with password-related names.",
      severity: "CRITICAL",
      condition: "Plaintext password string assignment in source code",
      patterns: [
        /password\s*[=:]\s*['"`][^'"`\s]{4,}['"`]/i,
        /passwd\s*[=:]\s*['"`][^'"`\s]{4,}['"`]/i,
        /pwd\s*[=:]\s*['"`][^'"`\s]{4,}['"`]/i,
      ],
      threshold: null,
      suggestion: "Never hardcode passwords. Use environment variables and a secrets manager for sensitive credentials.",
      applicableExtensions: [".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".php"],
    },
    {
      id: "SEC-TOK-001",
      legacyId: "SEC003",
      name: "Hardcoded Secret or Token",
      category: "Security",
      description: "Detects possible hardcoded secret keys or bearer tokens in source files.",
      severity: "HIGH",
      condition: "Hardcoded secrets or authorization tokens found in source code",
      patterns: [
        /secret\s*[=:]\s*['"`][A-Za-z0-9\-_]{8,}['"`]/i,
        /token\s*[=:]\s*['"`][A-Za-z0-9\-_]{16,}['"`]/i,
        /bearer\s+[A-Za-z0-9\-_.]{20,}/i,
      ],
      threshold: null,
      suggestion: "Store secrets and tokens in environment variables. Use a vault or secrets manager in production.",
      applicableExtensions: [".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".php"],
    },
    {
      id: "SEC-EVL-001",
      legacyId: "SEC004",
      name: "Use of eval()",
      category: "Security",
      description: "Detects use of eval() which executes arbitrary code and can lead to code injection vulnerabilities.",
      severity: "HIGH",
      condition: "Call expression invoking eval() function",
      patterns: [/\beval\s*\(/],
      threshold: null,
      suggestion: "Remove all uses of eval(). Refactor to use safer alternatives such as JSON.parse() or strict mapping.",
      applicableExtensions: [".js", ".jsx", ".ts", ".tsx"],
    },
    {
      id: "SEC-URL-001",
      legacyId: "SEC005",
      name: "Insecure HTTP URL",
      category: "Security",
      description: "Detects hardcoded HTTP (non-HTTPS) URLs in source code that may transmit data insecurely.",
      severity: "MEDIUM",
      condition: "Insecure HTTP protocol URL hardcoded in source files",
      patterns: [/http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)[a-zA-Z0-9]/],
      threshold: null,
      suggestion: "Replace HTTP URLs with HTTPS equivalents to ensure encrypted data transmission.",
      applicableExtensions: [".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".php"],
    },
    {
      id: "SEC-PRV-001",
      legacyId: "SEC006",
      name: "Possible Exposed Private Key",
      category: "Security",
      description: "Detects patterns resembling private key headers in source files.",
      severity: "CRITICAL",
      condition: "PEM or cryptographic private key header found in file content",
      patterns: [/-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/],
      threshold: null,
      suggestion: "Remove all private keys from source code immediately. Store keys in a secure vault and load via environment configuration.",
      applicableExtensions: [
        ".js", ".jsx", ".ts", ".tsx", ".py", ".java", ".pem", ".key", ".txt",
      ],
    },
  ],
};

module.exports = analysisRules;
