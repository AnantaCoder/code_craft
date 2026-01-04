import { useState } from "react";
import analyzeCode from "../api/analyze";
import MinimalJsonNode from "./MinimalJsonNode";

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
        <div className="mt-8 mx-auto w-full max-w-2xl text-left flex flex-col gap-4">
            <div className="flex flex-col gap-2 bg-[#1a1a1a] p-4 rounded-xl font-mono border-2 border-[#fbf0df] transition-colors duration-300 focus-within:border-[#f3d5a3] w-full">
                <textarea
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="// Enter C code here..."
                    className="w-full h-32 bg-transparent border-0 text-[#fbf0df] font-mono text-base p-2 outline-none focus:text-white placeholder-[#fbf0df]/40 resize-y"
                    spellCheck={false}
                />
                <div className="flex justify-end">
                    <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="bg-[#fbf0df] text-[#1a1a1a] border-0 px-5 py-1.5 rounded-lg font-bold transition-all duration-100 hover:bg-[#f3d5a3] hover:-translate-y-px cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Processing..." : "Send"}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-900/50 border border-red-500 rounded-xl text-red-200 text-left font-mono">
                    Error: {error}
                </div>
            )}

            {result && (
                <div className="bg-[#1a1a1a] border border-[#fbf0df]/20 rounded-xl p-6 overflow-auto max-h-[600px] text-left font-mono text-sm text-[#fbf0df]">
                    <MinimalJsonNode data={result} />
                </div>
            )}
        </div>
    );
}
