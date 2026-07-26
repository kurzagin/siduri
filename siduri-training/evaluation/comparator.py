import json
import os
from datetime import datetime
from typing import Any, Dict, List


def compare_runs(old_run_dir: str, new_run_dir: str):
    """
    Compares two evaluation runs and generates comparison.html & comparison.md
    displaying score improvements, regressions, latency changes, fixed cases, and new failures.
    """
    old_json_path = os.path.join(old_run_dir, "results.json")
    new_json_path = os.path.join(new_run_dir, "results.json")

    if not os.path.isfile(old_json_path) or not os.path.isfile(new_json_path):
        raise FileNotFoundError(f"results.json missing in {old_run_dir} or {new_run_dir}")

    with open(old_json_path, "r", encoding="utf-8") as f:
        old_results = json.load(f)

    with open(new_json_path, "r", encoding="utf-8") as f:
        new_results = json.load(f)

    old_total = len(old_results)
    old_pass = sum(1 for r in old_results if r.get("status") == "PASS")
    old_rate = (old_pass / old_total * 100.0) if old_total > 0 else 0.0

    new_total = len(new_results)
    new_pass = sum(1 for r in new_results if r.get("status") == "PASS")
    new_rate = (new_pass / new_total * 100.0) if new_total > 0 else 0.0

    diff_rate = new_rate - old_rate

    # Map by case_id for detailed comparison
    old_map = {r.get("case_id"): r for r in old_results}
    new_map = {r.get("case_id"): r for r in new_results}

    fixed_cases = []
    regressed_cases = []

    for cid, new_r in new_map.items():
        if cid in old_map:
            old_r = old_map[cid]
            if old_r.get("status") != "PASS" and new_r.get("status") == "PASS":
                fixed_cases.append(cid)
            elif old_r.get("status") == "PASS" and new_r.get("status") != "PASS":
                regressed_cases.append(cid)

    # 1. Generate comparison.md
    comp_md = f"""# Siduri Evaluation Run Comparison

- **Comparison Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **Baseline Run**: `{os.path.basename(old_run_dir)}` ({old_rate:.1f}% Pass Rate)
- **New Run**: `{os.path.basename(new_run_dir)}` ({new_rate:.1f}% Pass Rate)
- **Overall Score Change**: `{diff_rate:+.1f}%`

---

## Fixed & Regressed Cases Summary

- **Newly Fixed Cases ({len(fixed_cases)})**: {', '.join(fixed_cases) if fixed_cases else 'None'}
- **Newly Failing Regressions ({len(regressed_cases)})**: {', '.join(regressed_cases) if regressed_cases else 'None'}

---

## Case-by-Case Status Comparison

| Case ID | Baseline Status | New Status | Delta |
| ------- | --------------- | ---------- | ----- |
"""
    for cid in sorted(list(set(old_map.keys()) | set(new_map.keys()))):
        o_st = old_map.get(cid, {}).get("status", "N/A")
        n_st = new_map.get(cid, {}).get("status", "N/A")
        delta = "SAME"
        if o_st != "PASS" and n_st == "PASS":
            delta = "FIXED ✅"
        elif o_st == "PASS" and n_st != "PASS":
            delta = "REGRESSED ❌"
        comp_md += f"| `{cid}` | `{o_st}` | `{n_st}` | {delta} |\n"

    comp_md_path = os.path.join(new_run_dir, "comparison.md")
    with open(comp_md_path, "w", encoding="utf-8") as f:
        f.write(comp_md)

    # 2. Generate comparison.html
    comp_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Siduri Evaluation Comparison Dashboard</title>
  <style>
    body {{ font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
    h1, h2 {{ color: #38bdf8; }}
    .cards {{ display: flex; gap: 16px; margin-bottom: 24px; }}
    .card {{ background: #1e293b; border-radius: 8px; padding: 16px; flex: 1; border: 1px solid #334155; text-align: center; }}
    .card .val {{ font-size: 32px; font-weight: bold; margin-top: 8px; }}
    .positive {{ color: #4ade80; }}
    .negative {{ color: #f87171; }}
    table {{ width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 8px; overflow: hidden; margin-top: 16px; }}
    th, td {{ padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; }}
    th {{ background: #0f172a; color: #94a3b8; }}
  </style>
</head>
<body>
  <h1>Siduri Run Comparison</h1>
  <div style="color: #94a3b8; margin-bottom: 24px;">Comparing `{os.path.basename(old_run_dir)}` vs `{os.path.basename(new_run_dir)}`</div>

  <div class="cards">
    <div class="card">
      <div>Baseline Pass Rate</div>
      <div class="val">{old_rate:.1f}%</div>
    </div>
    <div class="card">
      <div>New Pass Rate</div>
      <div class="val">{new_rate:.1f}%</div>
    </div>
    <div class="card">
      <div>Score Change</div>
      <div class="val {'positive' if diff_rate >= 0 else 'negative'}">{diff_rate:+.1f}%</div>
    </div>
  </div>

  <h2>Fixed & Regressed Cases</h2>
  <p><strong>Fixed ({len(fixed_cases)}):</strong> {', '.join(fixed_cases) if fixed_cases else 'None'}</p>
  <p><strong>Regressed ({len(regressed_cases)}):</strong> {', '.join(regressed_cases) if regressed_cases else 'None'}</p>

  <h2>Detailed Comparison Table</h2>
  <table>
    <thead>
      <tr>
        <th>Case ID</th>
        <th>Baseline Status</th>
        <th>New Status</th>
        <th>Change</th>
      </tr>
    </thead>
    <tbody>
"""
    for cid in sorted(list(set(old_map.keys()) | set(new_map.keys()))):
        o_st = old_map.get(cid, {}).get("status", "N/A")
        n_st = new_map.get(cid, {}).get("status", "N/A")
        delta_str = '<span class="positive">FIXED ✅</span>' if (o_st != "PASS" and n_st == "PASS") else ('<span class="negative">REGRESSED ❌</span>' if (o_st == "PASS" and n_st != "PASS") else "SAME")
        comp_html += f"<tr><td><code>{cid}</code></td><td><code>{o_st}</code></td><td><code>{n_st}</code></td><td>{delta_str}</td></tr>\n"

    comp_html += """
    </tbody>
  </table>
</body>
</html>
"""

    comp_html_path = os.path.join(new_run_dir, "comparison.html")
    with open(comp_html_path, "w", encoding="utf-8") as f:
        f.write(comp_html)

    print(f"[Comparison] Generated comparison.html and comparison.md in {new_run_dir}")
