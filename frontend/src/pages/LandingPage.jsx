import React from "react";
import { Link } from "react-router-dom";
import codeCatalystLogo from "../assets/codecatalyst-logo.png";

const LandingPage = () => {
  return (
    <div className="relative min-h-screen bg-background text-gray-100 overflow-hidden flex flex-col justify-between">
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              CodeCatalyst
            </span>
            <span className="block text-[10px] text-gray-400 font-mono tracking-wider uppercase">
              Rule-Based Intelligence
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            to="/auth?mode=login"
            className="text-sm font-semibold text-gray-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/auth?mode=signup"
            className="px-4 py-2 text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/10 hover:shadow-primary-500/25 transition-all flex items-center gap-1"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto w-full px-6 py-12 flex-1 flex flex-col lg:flex-row items-center justify-center gap-16">
        <div className="flex-1 text-center lg:text-left space-y-8 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
            Developer Intelligence & <br />
            <span className="gradient-text">Repository Analysis</span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 font-medium leading-relaxed">
            Upload any project ZIP or point to a public GitHub repository.
            CodeCatalyst performs security rule audits, technical
            debt detection and architecture decomposition.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link
              to="/auth?mode=signup"
              className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-xl shadow-primary-500/20 hover:shadow-primary-500/35 transition-all flex items-center justify-center gap-2 group"
            >
              Analyze Codebase
            </Link>
            <Link
              to="/auth?mode=login"
              className="w-full sm:w-auto px-8 py-4 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Open Dashboard
            </Link>
          </div>
        </div>

        <div className="flex-1 relative w-full max-w-md lg:max-w-none flex items-center justify-center">
          <div className="w-full aspect-[4/3] rounded-2xl glass-panel p-6 border border-gray-800/80 shadow-2xl flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-800/60 pb-4">
              <span className="text-xs text-gray-400 font-mono tracking-wider">
                CODECATALYST_RULE_ENGINE
              </span>
            </div>

            <div className="flex-1 flex items-center justify-center relative">
              <img
                src={codeCatalystLogo}
                alt="CodeCatalyst Logo"
                className="h-16 w-auto object-contain"
              />
            </div>

            <div className="bg-gray-950/60 border border-gray-900 rounded-xl p-4 font-mono text-[11px] leading-relaxed space-y-1.5 text-gray-400">
              <p className="text-primary-400 font-semibold">
                Rule Engine...
              </p>
              <p>
                Security Scores
              </p>
              <p>
                Technical Debts
              </p>
              <p>
                Architecture Layers
              </p>
            </div>
          </div>
        </div>
      </main>

      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 py-20 border-t border-gray-900/60">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-lg">Security Rule Audit</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Scans for hardcoded secrets, API keys, private keys and permissive
              CORS flags.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-lg">Technical Debt Engine</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Detects large files, deep control flow nesting
              and missing docstrings.
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="font-bold text-lg">PDF / JSON / CSV Dossiers</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Exports structured audit reports in PDF, JSON and CSV formats.
            </p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 w-full px-6 py-8 border-t border-gray-950 text-center text-xs text-gray-500 font-medium">
        &copy; {new Date().getFullYear()} CodeCatalyst. Rule-Based Developer
        Intelligence &amp; Repository Analysis Platform.
      </footer>
    </div>
  );
};

export default LandingPage;
