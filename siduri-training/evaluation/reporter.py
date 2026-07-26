import csv
import hashlib
import json
import os
from datetime import datetime
from typing import Any, Dict, List

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

from outputs.llm.prompts import SYSTEM_PROMPT_TEMPLATE, TRANSLATION_PROMPT_TEMPLATE


def _file_hash(filepath: str) -> str:
    if not os.path.isfile(filepath):
        return "N/A"
    with open(filepath, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()[:16]


def generate_all_reports(
    run_dir: str,
    results: List[Dict[str, Any]],
    configs: List[Dict[str, Any]],
    total_api_calls: int = 0,
):
    """Generates all human-readable and machine-readable evaluation reports in run_dir."""
    os.makedirs(run_dir, exist_ok=True)

    # 1. results.json
    with open(os.path.join(run_dir, "results.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    # 2. results.csv
    csv_path = os.path.join(run_dir, "results.csv")
    with open(csv_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow([
            "case_id", "suite", "config_id", "generation_num", "status",
            "json_valid", "enum_valid", "proper_names_correct", "privacy_safe",
            "role_reversal_detected", "meta_language_detected", "lore_grounded",
            "intent", "target", "emotion", "text_ja", "text_en", "failures"
        ])
        for r in results:
            writer.writerow([
                r.get("case_id"), r.get("suite"), r.get("config_id"), r.get("generation_num"),
                r.get("status"), r.get("json_valid"), r.get("enum_valid"),
                r.get("proper_names_correct"), r.get("privacy_safe"),
                r.get("role_reversal_detected"), r.get("meta_language_detected"),
                r.get("lore_grounded"), r.get("intent"), r.get("target"),
                r.get("emotion"), r.get("text_ja"), r.get("text_en"),
                "; ".join(r.get("failures", []))
            ])

    # 3. configuration.json
    with open(os.path.join(run_dir, "configuration.json"), "w", encoding="utf-8") as f:
        json.dump(configs, f, ensure_ascii=False, indent=2)

    # 4. prompt-snapshot.md
    prompts_path = os.path.join(PROJECT_ROOT, "outputs", "llm", "prompts.py")
    lore_path = os.path.join(PROJECT_ROOT, "config", "canonical_lore.json")
    snapshot_content = f"""# Prompt & Configuration Snapshot

- **Run Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **`outputs/llm/prompts.py` SHA256 Hash**: `{_file_hash(prompts_path)}`
- **`config/canonical_lore.json` SHA256 Hash**: `{_file_hash(lore_path)}`

---

## System Prompt Template
```text
{SYSTEM_PROMPT_TEMPLATE}
```

---

## Translation Prompt Template
```text
{TRANSLATION_PROMPT_TEMPLATE}
```
"""
    with open(os.path.join(run_dir, "prompt-snapshot.md"), "w", encoding="utf-8") as f:
        f.write(snapshot_content)

    # Calculate aggregate statistics
    total = len(results)
    passed = sum(1 for r in results if r.get("status") == "PASS")
    warned = sum(1 for r in results if r.get("status") == "WARNING")
    failed = sum(1 for r in results if r.get("status") == "FAIL")

    pass_rate = (passed / total * 100.0) if total > 0 else 0.0

    # 5. summary.md
    summary_md = f"""# Siduri Evaluation Summary Report

- **Run Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
- **Total Test Generations**: {total}
- **Total API Calls**: {total_api_calls}
- **Overall Pass Rate**: {pass_rate:.1f}% ({passed} PASS / {warned} WARNING / {failed} FAIL)

---

## Scores by Test Suite

| Test Suite | Total Cases | PASS | WARNING | FAIL | Pass Rate |
| ---------- | ----------: | ---: | ------: | ---: | --------: |
"""
    suites = sorted(list(set(r.get("suite", "general") for r in results)))
    for s in suites:
        s_results = [r for r in results if r.get("suite") == s]
        s_total = len(s_results)
        s_pass = sum(1 for r in s_results if r.get("status") == "PASS")
        s_warn = sum(1 for r in s_results if r.get("status") == "WARNING")
        s_fail = sum(1 for r in s_results if r.get("status") == "FAIL")
        s_rate = (s_pass / s_total * 100.0) if s_total > 0 else 0.0
        summary_md += f"| `{s}` | {s_total} | {s_pass} | {s_warn} | {s_fail} | {s_rate:.1f}% |\n"

    summary_md += "\n---\n\n## Top Recurring Failure Categories\n\n"
    all_failures = []
    for r in results:
        all_failures.extend(r.get("failures", []))

    if all_failures:
        counts = {}
        for f_item in all_failures:
            counts[f_item] = counts.get(f_item, 0) + 1
        for f_item, cnt in sorted(counts.items(), key=lambda x: x[1], reverse=True)[:10]:
            summary_md += f"- **{f_item}**: {cnt} occurrences\n"
    else:
        summary_md += "No failures recorded! All test cases passed cleanly.\n"

    with open(os.path.join(run_dir, "summary.md"), "w", encoding="utf-8") as f:
        f.write(summary_md)

    # 6. full-transcript.md
    transcript_md = f"# Full Evaluation Transcripts\n\n- **Run Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
    for idx, r in enumerate(results, 1):
        transcript_md += f"### [{idx}] Case `{r.get('case_id')}` (Config: `{r.get('config_id')}`, Gen #{r.get('generation_num')})\n"
        transcript_md += f"- **Status**: `{r.get('status')}` | **Emotion**: `{r.get('emotion')}` | **Target**: `{r.get('target')}`\n"
        transcript_md += f"- **Japanese Spoken**: {r.get('text_ja')}\n"
        transcript_md += f"- **English Subtitle**: {r.get('text_en')}\n"
        if r.get("failures"):
            transcript_md += f"- **Failures**: {', '.join(r.get('failures'))}\n"
        transcript_md += "\n"

    with open(os.path.join(run_dir, "full-transcript.md"), "w", encoding="utf-8") as f:
        f.write(transcript_md)

    # 7. failures.md
    failures_md = f"# Evaluation Failures Report\n\n- **Total Failures**: {failed}\n\n"
    for r in results:
        if r.get("status") == "FAIL":
            failures_md += f"#### Case `{r.get('case_id')}` (Suite: `{r.get('suite')}`)\n"
            failures_md += f"- **Input Text**: {r.get('turns', [{}])[-1].get('message', '')}\n"
            failures_md += f"- **Output JP**: {r.get('text_ja')}\n"
            failures_md += f"- **Output EN**: {r.get('text_en')}\n"
            failures_md += f"- **Reasons**: {'; '.join(r.get('failures', []))}\n\n"

    with open(os.path.join(run_dir, "failures.md"), "w", encoding="utf-8") as f:
        f.write(failures_md)

    # 8. index.html (Primary Offline Browser Review File)
    html_content = _generate_html_report(run_dir, results, configs, pass_rate, passed, warned, failed, total_api_calls)
    with open(os.path.join(run_dir, "index.html"), "w", encoding="utf-8") as f:
        f.write(html_content)


def _generate_html_report(run_dir, results, configs, pass_rate, passed, warned, failed, total_api_calls) -> str:
    results_json_str = json.dumps(results, ensure_ascii=False)
    configs_json_str = json.dumps(configs, ensure_ascii=False)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Siduri GLM Evaluation Dashboard</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
    h1, h2, h3 {{ color: #38bdf8; margin-top: 0; }}
    .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 16px; margin-bottom: 24px; }}
    .cards {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }}
    .card {{ background: #1e293b; border-radius: 8px; padding: 16px; border: 1px solid #334155; text-align: center; }}
    .card .val {{ font-size: 28px; font-weight: bold; margin-top: 8px; color: #38bdf8; }}
    .card.pass .val {{ color: #4ade80; }}
    .card.warn .val {{ color: #fbbf24; }}
    .card.fail .val {{ color: #f87171; }}
    .controls {{ display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; background: #1e293b; padding: 16px; border-radius: 8px; border: 1px solid #334155; }}
    select, input {{ background: #0f172a; color: #f8fafc; border: 1px solid #475569; padding: 8px 12px; border-radius: 6px; font-size: 14px; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 16px; background: #1e293b; border-radius: 8px; overflow: hidden; }}
    th, td {{ padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; font-size: 14px; }}
    th {{ background: #0f172a; color: #94a3b8; font-weight: 600; }}
    tr:hover {{ background: #334155; }}
    .badge {{ display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }}
    .badge.PASS {{ background: #064e3b; color: #4ade80; }}
    .badge.WARNING {{ background: #78350f; color: #fbbf24; }}
    .badge.FAIL {{ background: #7f1d1d; color: #f87171; }}
    .transcript {{ background: #0f172a; padding: 8px 12px; border-radius: 6px; margin-top: 6px; font-family: monospace; font-size: 13px; color: #cbd5e1; }}
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Siduri GLM Evaluation Dashboard</h1>
      <div style="color: #94a3b8;">Run Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Directory: {os.path.basename(run_dir)}</div>
    </div>
  </div>

  <div class="cards">
    <div class="card pass">
      <div>Pass Rate</div>
      <div class="val">{pass_rate:.1f}%</div>
    </div>
    <div class="card pass">
      <div>Passed</div>
      <div class="val">{passed}</div>
    </div>
    <div class="card warn">
      <div>Warning</div>
      <div class="val">{warned}</div>
    </div>
    <div class="card fail">
      <div>Failed</div>
      <div class="val">{failed}</div>
    </div>
    <div class="card">
      <div>Total API Calls</div>
      <div class="val">{total_api_calls}</div>
    </div>
  </div>

  <div class="controls">
    <input type="text" id="searchInput" placeholder="Search test ID, text, failure..." onkeyup="filterResults()">
    <select id="suiteFilter" onchange="filterResults()">
      <option value="">All Suites</option>
    </select>
    <select id="statusFilter" onchange="filterResults()">
      <option value="">All Statuses</option>
      <option value="PASS">PASS</option>
      <option value="WARNING">WARNING</option>
      <option value="FAIL">FAIL</option>
    </select>
  </div>

  <table id="resultsTable">
    <thead>
      <tr>
        <th>Case ID</th>
        <th>Suite</th>
        <th>Config</th>
        <th>Status</th>
        <th>Emotion</th>
        <th>Target</th>
        <th>Japanese Spoken</th>
        <th>English Subtitle</th>
        <th>Failures / Notes</th>
      </tr>
    </thead>
    <tbody id="tableBody"></tbody>
  </table>

  <script>
    const results = {results_json_str};

    function populateTable(data) {{
      const tbody = document.getElementById("tableBody");
      tbody.innerHTML = "";
      
      const suites = new Set();
      data.forEach(r => {{
        if (r.suite) suites.add(r.suite);
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${{r.case_id || ""}}</strong></td>
          <td><code>${{r.suite || ""}}</code></td>
          <td>${{r.config_id || ""}}</td>
          <td><span class="badge ${{r.status}}">${{r.status}}</span></td>
          <td><code>${{r.emotion || ""}}</code></td>
          <td><code>${{r.target || ""}}</code></td>
          <td>${{r.text_ja || ""}}</td>
          <td>${{r.text_en || ""}}</td>
          <td><span style="color: #f87171;">${{(r.failures || []).join(", ")}}</span></td>
        `;
        tbody.appendChild(tr);
      }});

      const suiteSelect = document.getElementById("suiteFilter");
      if (suiteSelect.options.length <= 1) {{
        suites.forEach(s => {{
          const opt = document.createElement("option");
          opt.value = s;
          opt.textContent = s;
          suiteSelect.appendChild(opt);
        }});
      }}
    }}

    function filterResults() {{
      const search = document.getElementById("searchInput").value.toLowerCase();
      const suite = document.getElementById("suiteFilter").value;
      const status = document.getElementById("statusFilter").value;

      const filtered = results.filter(r => {{
        const matchesSearch = !search || 
          (r.case_id && r.case_id.toLowerCase().includes(search)) ||
          (r.text_ja && r.text_ja.toLowerCase().includes(search)) ||
          (r.text_en && r.text_en.toLowerCase().includes(search)) ||
          (r.failures && r.failures.join(" ").toLowerCase().includes(search));
        
        const matchesSuite = !suite || r.suite === suite;
        const matchesStatus = !status || r.status === status;

        return matchesSearch && matchesSuite && matchesStatus;
      }});

      populateTable(filtered);
    }}

    document.addEventListener("DOMContentLoaded", () => populateTable(results));
  </script>
</body>
</html>
"""
