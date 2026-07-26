# Siduri GLM Evaluation System (`siduri_eval`)

An automated multi-turn conversation-testing and evaluation system for Siduri VTuber reactions using real GLM API calls, layered evaluation rubrics, statistical metrics calculation across multiple runs, and static HTML/Markdown report generation.

## Features

- **Multi-Turn Conversation Simulation**: Preserves `assistant` API roles for Siduri's earlier responses and `user` API roles for Master/Viewer messages.
- **Layered Evaluator**: Layer 1 deterministic checks (JSON validity, proper-name preservation, secret redaction, role reversal, repetition) + Layer 2 semantic rubrics.
- **Offline HTML & Markdown Reports**: Primary review file `test-results/latest/index.html` opens directly in any browser without needing a web server.
- **Run Comparison**: Compare two timestamped evaluation runs (`python -m siduri_eval compare <old-run> <new-run>`).
- **Secret Redaction**: API keys and authorization tokens are strictly redacted from request/response logs.

---

## Usage Commands

### Basic Run (Defaults to 5 runs per case)
```bash
python scripts/evaluate_siduri.py --yes
```
or:
```bash
python -m siduri_eval --yes
```

### Run Specific Test Suite
```bash
python -m siduri_eval --suite pragmatics --runs-per-case 5 --yes
```

### Override Model, Temperature, or Thinking Mode
```bash
python -m siduri_eval --model glm-4.7-flash --temperature 0.72 --thinking enabled --yes
```

### Dry Run (View Execution Plan without Calling API)
```bash
python -m siduri_eval --dry-run
```

### Offline Unit Test Mode (Mocked Adapter)
```bash
python -m siduri_eval --mock --yes
```

### Compare Two Evaluation Runs
```bash
python -m siduri_eval compare 20260723_120000 20260723_130000
```

---

## Report Files Generated

After each run, the following files are produced in `test-results/latest/` and `test-results/runs/<timestamp>/`:
- `index.html`: Interactive browser dashboard with search box, filters, summary cards, and turn transcripts.
- `summary.md`: IDE-friendly markdown summary report.
- `full-transcript.md`: Readable multi-turn transcripts for all test cases.
- `failures.md`: Grouped failure category analysis.
- `results.json` & `results.csv`: Machine-readable results.
- `configuration.json`: Configuration matrix used.
- `prompt-snapshot.md`: Hash snapshot of prompt files, canonical lore, and parameters.
- `request-log.jsonl` & `response-log.jsonl`: Redacted API request/response logs.
