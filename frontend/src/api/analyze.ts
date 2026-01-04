import type { AnalyzeResponse } from "@/types/FullPipelineResponse";

const API_BASE =
  (import.meta as any).env?.BUN_PUBLIC_API_URL || "http://localhost:8000/api";

export default async function analyzeCode(
  code: string,
  opts?: { signal?: AbortSignal }
): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/analyze/full`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
    signal: opts?.signal,
  });

  let payload: any = null;

  try {
    payload = await response.json();
  } catch {
    /* backend returned non-JSON (crash, proxy, HTML error) */
  }

  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.detail ||
      `Analyze failed (${response.status})`;

    throw new Error(message);
  }

  return payload as AnalyzeResponse;
}
