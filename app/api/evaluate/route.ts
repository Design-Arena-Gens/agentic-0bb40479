import { NextRequest, NextResponse } from "next/server";

function scoreFromPresence(text: string, terms: string[], weight = 1): number {
  const lc = text.toLowerCase();
  const hits = terms.reduce((acc, t) => acc + (lc.includes(t) ? 1 : 0), 0);
  const ratio = hits / Math.max(terms.length, 1);
  return Math.min(10, Math.max(0, 10 * ratio * weight));
}

function penaltyIf(text: string, predicates: ((t: string) => boolean)[], penalty = 3): number {
  const lc = text.toLowerCase();
  const p = predicates.some((fn) => fn(lc)) ? penalty : 0;
  return p;
}

function countNumbers(text: string): number {
  return (text.match(/\b(\$?\d+[\d,]*\.?\d*)\b/g) || []).length;
}

function wordCount(text: string): number {
  return (text.trim().match(/\S+/g) || []).length;
}

function clamp(x: number, lo = 0, hi = 10): number { return Math.min(hi, Math.max(lo, x)); }

function evaluateIdea(idea: string) {
  const w = wordCount(idea);

  const problemClarity = clamp(
    (w >= 30 ? 6 : w >= 15 ? 3 : 1) +
    scoreFromPresence(idea, ["problem", "pain", "today", "manual", "inefficient"]) +
    (/[.!?]/.test(idea) ? 1 : 0)
  );

  const targetCustomer = clamp(
    2 + scoreFromPresence(idea, ["for ", "mid-market", "enterprise", "consumer", "SMB", "developers", "ops", "finance"]) -
    penaltyIf(idea, [t => t.includes("everyone"), t => t.includes("anyone"), t => t.includes("all users")], 4)
  );

  const marketSize = clamp(
    (countNumbers(idea) >= 2 ? 5 : countNumbers(idea) >= 1 ? 3 : 0) +
    scoreFromPresence(idea, ["market", "TAM", "billion", "million", "growing", "category"]) -
    penaltyIf(idea, [t => t.includes("niche hobby"), t => t.includes("tiny market")], 3)
  );

  const differentiation = clamp(
    scoreFromPresence(idea, ["unlike", "differenti", "unique", "only", "moat", "proprietary"]) + 2 -
    penaltyIf(idea, [t => t.includes("just like"), t => t.includes("clone")], 5)
  );

  const distribution = clamp(
    scoreFromPresence(idea, ["SEO", "content", "paid", "ads", "sales", "BD", "marketplace", "virality", "referral", "integrations"]) + 2
  );

  const monetization = clamp(
    scoreFromPresence(idea, ["$", "pricing", "subscription", "SaaS", "ARPU", "unit economics", "take rate", "gross margin"]) + 2
  );

  const feasibility = clamp(
    5 + scoreFromPresence(idea, ["MVP", "prototype", "pilot", "timeline", "scope", "milestone"]) -
    penaltyIf(idea, [
      t => t.includes("solve AGI"),
      t => t.includes("cure cancer"),
      t => t.includes("fully autonomous level 5"),
      t => t.includes("impossible")
    ], 5)
  );

  const competition = clamp(
    1 + scoreFromPresence(idea, ["competitor", "incumbent", "alt", "switching costs", "status quo"]) +
    (/(unbundl|bundl|vs\.|versus)/i.test(idea) ? 2 : 0)
  );

  const moat = clamp(
    scoreFromPresence(idea, ["network effects", "data advantage", "switching costs", "scale", "embedded", "ecosystem"]) + 1
  );

  const speed = clamp(
    6 + scoreFromPresence(idea, ["weeks", "months", "sprint", "iterate", "ship"]) -
    penaltyIf(idea, [t => t.includes("FDA"), t => t.includes("HIPAA"), t => t.includes("hardware"), t => t.includes("regulator")], 4)
  );

  const evidence = clamp(
    scoreFromPresence(idea, ["users", "paying", "revenue", "MRR", "pilot", "waitlist", "conversion", "retention", "NPS"]) +
    (/(\d+%|\d+k|\d+ users|\d+ customers)/i.test(idea) ? 3 : 0)
  );

  const scores = {
    "Problem clarity": problemClarity,
    "Target customer": targetCustomer,
    "Market size": marketSize,
    "Differentiation": differentiation,
    "Distribution": distribution,
    "Monetization": monetization,
    "Feasibility": feasibility,
    "Competition grasp": competition,
    "Moat": moat,
    "Speed to market": speed,
    "Evidence/traction": evidence
  } as const;

  const avg = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;

  const issues: string[] = [];
  const recs: string[] = [];

  for (const [k, v] of Object.entries(scores)) {
    if (v < 5) issues.push(`${k} is weak (${v.toFixed(1)}/10)`);
    if (v < 7) recs.push(`Raise ${k.toLowerCase()} to ?7/10 with concrete proof and specifics.`);
  }

  // Tone: ruthless but constructive.
  const verdict: "BULLETPROOF" | "TRASH" | "WEAK" = avg >= 8 && issues.length === 0 ? "BULLETPROOF" : avg < 5 ? "TRASH" : "WEAK";

  const summary = (
    verdict === "BULLETPROOF" ?
      "Solid across the board with credible distribution, monetization, and traction." :
    verdict === "TRASH" ?
      "Vague, undersized, or fantasy-level execution. Fix fundamentals or kill it." :
      "Some promise, but missing specifics. Tighten the plan and validate fast."
  );

  const testPlan: string[] = [
    "Interview 5 target users in 48h; extract top 3 pains in their words.",
    "Ship a no-code or spreadsheet MVP to simulate core value within 72h.",
    "Run a single-channel acquisition test (e.g. LinkedIn DM or cold email) with 50 leads; measure reply and demo rates.",
    "Put a price on it now; aim for 3 paid pilots, not free trials.",
    "Define one metric that must move (e.g. time saved, conversion %, $ saved) and instrument it.",
    "List 3 real competitors and articulate a win reason that survives a founder-blind test."
  ];

  return { verdict, summary, scores, issues, recommendations: recs, testPlan };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const idea = String(body?.idea ?? "").trim();
    if (!idea || idea.length < 40) {
      return NextResponse.json({ error: "Write at least 40 characters." }, { status: 400 });
    }
    const out = evaluateIdea(idea);
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
