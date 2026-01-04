import { useState } from "react";
import { CompilationProcess } from "./components/CompilationProcess";
import "./index.css";

export function App() {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="w-screen h-screen overflow-hidden p-4 relative z-10 flex flex-col">
      <div className="flex items-center gap-4 mb-4">
        <h1
          className="text-2xl font-bold text-[#fbf0df] cursor-default transition-transform duration-300 hover:scale-110 hover:[transform:perspective(500px)_rotateY(-15deg)_rotateX(10deg)] origin-left"
          style={{ transformStyle: 'preserve-3d' }}
        >
          Code Craft
        </h1>
        <p className="text-[#fbf0df]/60 text-sm font-mono">
          Send <code className="bg-[#1a1a1a] px-2 py-0.5 rounded">.c</code> code to see compilation steps
        </p>
        <div className="ml-auto">
          <button
            onClick={() => setShowInfo(true)}
            className="w-8 h-8 bg-[#1a1a1a]/90 border-2 border-[#fbf0df]/50 rounded-full text-[#fbf0df] hover:bg-[#fbf0df]/20 flex items-center justify-center font-bold text-sm transition-colors backdrop-blur-sm"
            title="How it works"
          >
            i
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <CompilationProcess />
      </div>

      {/* Info Popup */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowInfo(false)}>
          <div
            className="bg-[#1a1a1a]/95 border-2 border-[#fbf0df]/50 rounded-2xl p-6 max-w-lg w-full mx-4 backdrop-blur-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#fbf0df]">How It Works</h2>
              <button
                onClick={() => setShowInfo(false)}
                className="w-8 h-8 text-[#fbf0df]/60 hover:text-[#fbf0df] text-xl"
              >
                ×
              </button>
            </div>

            <div className="text-[#fbf0df]/80 text-sm font-mono">
              {/* Flow diagram */}
              <div className="flex items-center justify-center gap-1 text-xs mb-4 flex-wrap">
                <span className="bg-[#f3d5a3]/20 px-2 py-1 rounded">High-Level Code</span>
                <span className="text-[#f3d5a3]">→</span>
                <span className="bg-[#f3d5a3]/20 px-2 py-1 rounded">Tokens</span>
                <span className="text-[#f3d5a3]">→</span>
                <span className="bg-[#f3d5a3]/20 px-2 py-1 rounded">AST</span>
                <span className="text-[#f3d5a3]">→</span>
                <span className="bg-[#f3d5a3]/20 px-2 py-1 rounded">IR</span>
                <span className="text-[#f3d5a3]">→</span>
                <span className="bg-[#f3d5a3]/20 px-2 py-1 rounded">Assembly</span>
                <span className="text-[#f3d5a3]">→</span>
                <span className="bg-[#4ade80]/20 px-2 py-1 rounded text-[#4ade80]">Machine Code</span>
              </div>

              <div className="space-y-2">
                <p>
                  <strong className="text-[#f3d5a3]">1. Lexical Analysis</strong> — Breaks source code into tokens.
                </p>
                <p>
                  <strong className="text-[#f3d5a3]">2. Syntax Analysis</strong> — Builds an Abstract Syntax Tree (AST).
                </p>
                <p>
                  <strong className="text-[#f3d5a3]">3. Semantic Analysis</strong> — Validates types and scopes.
                </p>
                <p>
                  <strong className="text-[#f3d5a3]">4. Intermediate Code</strong> — Platform-independent representation.
                </p>
                <p>
                  <strong className="text-[#f3d5a3]">5. Code Optimization</strong> — Improves performance.
                </p>
                <p>
                  <strong className="text-[#f3d5a3]">6. Assembly Generation</strong> — Target architecture assembly.
                </p>
                <p>
                  <strong className="text-[#4ade80]">7. Machine Code</strong> — Final binary executable.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#fbf0df]/20">
              <a
                href="https://github.com/anantacoder/code_craft"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#fbf0df] text-[#1a1a1a] px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#f3d5a3] transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                More on GitHub
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
