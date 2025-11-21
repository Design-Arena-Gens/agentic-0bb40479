"use client";
import { useMemo, useState } from "react";

type Scores = Record<string, number>;

type EvaluateResponse = {
  verdict: "BULLETPROOF" | "TRASH" | "WEAK";
  summary: string;
  scores: Scores;
  issues: string[];
  recommendations: string[];
  testPlan: string[];
};

export default function Page() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvaluateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const charCount = idea.length;
  const canSubmit = useMemo(() => idea.trim().length >= 40, [idea]);

  async function onEvaluate() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as EvaluateResponse;
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function onUseTemplate() {
    setIdea(
      "A B2B SaaS for mid-market logistics companies that reduces failed deliveries by 40% using route-level risk scoring. Unlike incumbents, we integrate carrier telemetry + historical failure patterns to predict and preempt risky drops. Distribution via direct sales + integrations with existing TMS marketplaces. Priced per shipment with usage tiers. Early pilots with 3 carriers covering 250k shipments/month; 7% cost reduction observed."
    );
  }

  return (
    <div className="container">
      <div className="header">
        <div>
          <div className="title">Ruthless Mentor</div>
          <div className="subtitle">If your idea is weak, we will call it trash and tell you why.</div>
        </div>
        <button className="button secondary" onClick={onUseTemplate}>Try sample</button>
      </div>

      <div className="panel inputCard">
        <textarea
          className="textarea"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Pitch your idea. Who is it for, what problem, why now, how you'll reach users, how you make money, what proof you have."
        />
        <div className="actions">
          <button className="button" disabled={!canSubmit || loading} onClick={onEvaluate}>
            {loading ? "Evaluating?" : "Evaluate with no mercy"}
          </button>
          <div className="counter">{charCount} chars</div>
        </div>
      </div>

      {error && (
        <div className="panel card" style={{ borderColor: "#ff6b6b" }}>
          <div className="sectionTitle bad">Error</div>
          <div className="small">{error}</div>
        </div>
      )}

      {result && (
        <div className="grid">
          <div className="col-12">
            <div className="panel card">
              <div className="verdict">
                {result.verdict === "BULLETPROOF" && <span className="good">BULLETPROOF</span>}
                {result.verdict === "TRASH" && <span className="bad">TRASH</span>}
                {result.verdict === "WEAK" && <span className="neutral">WEAK</span>} ? {result.summary}
              </div>
            </div>
          </div>

          <div className="col-6">
            <div className="panel card">
              <div className="sectionTitle">Scores</div>
              <div className="kv">
                {Object.entries(result.scores).map(([k, v]) => (
                  <div key={k} style={{ display: "contents" }}>
                    <div className="tag">{k}</div>
                    <div className="score">{v.toFixed(1)}/10</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-6">
            <div className="panel card">
              <div className="sectionTitle">Issues</div>
              <ul className="list">
                {result.issues.length === 0 && <li>None found. Keep the bar high.</li>}
                {result.issues.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="col-12">
            <div className="panel card">
              <div className="sectionTitle">Do this next (test plan)</div>
              <ol className="list">
                {result.testPlan.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ol>
              <div className="small">Execute. No excuses. Results or it didn\'t happen.</div>
            </div>
          </div>

          <div className="col-12">
            <div className="panel card">
              <div className="sectionTitle">Recommendations</div>
              <ul className="list">
                {result.recommendations.map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
