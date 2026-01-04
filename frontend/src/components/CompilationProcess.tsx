import { useState } from "react";
import analyzeCode from "../api/analyze";
import D3Tree from "./D3Tree";

export function CompilationProcess() {
    const [code, setCode] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!code.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await analyzeCode(code);
            setResult(data);
        } catch (err) {
            setError(String(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-4 w-full h-full">
            {/* Left panel - Input (20%) */}
            <div className="w-[20%] flex flex-col">
                <div className="flex flex-col gap-2 bg-[#1a1a1a]/90 p-4 rounded-2xl font-mono border-2 border-[#fbf0df]/50 transition-colors duration-300 focus-within:border-[#f3d5a3] h-full backdrop-blur-sm">
                    <textarea
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="// Enter C code here..."
                        className="w-full flex-1 bg-transparent border-0 text-[#fbf0df] font-mono text-base p-2 outline-none focus:text-white placeholder-[#fbf0df]/40 resize-none [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#fbf0df]/30 [&::-webkit-scrollbar-thumb]:rounded-full"
                        spellCheck={false}
                    />
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="w-full bg-[#fbf0df] text-[#1a1a1a] border-0 px-5 py-2 rounded-lg font-bold transition-all duration-100 hover:bg-[#f3d5a3] hover:-translate-y-px cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Processing..." : "Send"}
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-red-900/50 border border-red-500 rounded-xl text-red-200 text-left font-mono text-sm">
                        Error: {error}
                    </div>
                )}
            </div>

            {/* Right panel - Output (80%) */}
            <div className="w-[80%] bg-[#1a1a1a]/90 border-2 border-[#fbf0df]/50 rounded-2xl overflow-hidden relative backdrop-blur-sm">
                {result ? (
                    <D3Tree data={result} />
                ) : (
                    <div className="flex items-center justify-center h-full text-[#fbf0df]/40 font-mono">
                        Compilation output will appear here...
                    </div>
                )}
            </div>
        </div>
    );
}
