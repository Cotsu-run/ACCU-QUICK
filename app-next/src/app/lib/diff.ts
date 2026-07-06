// Line + character diff — ported from the prototype's LCS implementation,
// but returning structured data (not HTML strings) for React rendering.

export type LineType = "added" | "removed" | "modified" | "unchanged";

export interface DiffLine {
  type: LineType;
  lineA?: string;
  lineB?: string;
  n: number;
}

export function computeLineDiff(a: string, b: string): DiffLine[] {
  const lA = a.split("\n");
  const lB = b.split("\n");
  const out: DiffLine[] = [];
  for (let i = 0; i < Math.max(lA.length, lB.length); i++) {
    const x = lA[i];
    const y = lB[i];
    if (x === undefined) out.push({ type: "added", lineB: y, n: i + 1 });
    else if (y === undefined) out.push({ type: "removed", lineA: x, n: i + 1 });
    else if (x === y) out.push({ type: "unchanged", lineA: x, lineB: y, n: i + 1 });
    else out.push({ type: "modified", lineA: x, lineB: y, n: i + 1 });
  }
  return out;
}

export type SegType = "eq" | "del" | "ins";
export interface Seg {
  t: SegType;
  s: string;
}

// Character-level LCS diff. Returns segments for each side:
// the A-side carries "eq" + "del", the B-side carries "eq" + "ins".
export function charDiff(a: string, b: string): { a: Seg[]; b: Seg[] } {
  const n = a.length;
  const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  let i = n;
  let j = m;
  const ops: { t: SegType; ch: string }[] = [];
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      ops.push({ t: "eq", ch: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ t: "ins", ch: b[j - 1] });
      j--;
    } else {
      ops.push({ t: "del", ch: a[i - 1] });
      i--;
    }
  }
  ops.reverse();

  // Coalesce consecutive ops of the same type into segments per side.
  const aSegs: Seg[] = [];
  const bSegs: Seg[] = [];
  const push = (arr: Seg[], t: SegType, ch: string) => {
    const last = arr[arr.length - 1];
    if (last && last.t === t) last.s += ch;
    else arr.push({ t, s: ch });
  };
  for (const o of ops) {
    if (o.t === "eq") {
      push(aSegs, "eq", o.ch);
      push(bSegs, "eq", o.ch);
    } else if (o.t === "del") {
      push(aSegs, "del", o.ch);
    } else {
      push(bSegs, "ins", o.ch);
    }
  }
  return { a: aSegs, b: bSegs };
}
