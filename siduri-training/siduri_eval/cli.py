import argparse
import os
import shutil
import sys
import time
from datetime import datetime
from typing import Any, Dict, List

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from evaluation.comparator import compare_runs
from evaluation.evaluator import evaluate_simulation_result
from evaluation.reporter import generate_all_reports
from evaluation.runner import EvalRunner, load_all_cases, load_configs


def _resolve_run_dir(path_or_id: str) -> str:
    if os.path.isabs(path_or_id) and os.path.isdir(path_or_id):
        return path_or_id
    if os.path.isdir(path_or_id):
        return os.path.abspath(path_or_id)
    cand = os.path.join(PROJECT_ROOT, "test-results", "runs", path_or_id)
    if os.path.isdir(cand):
        return cand
    cand_latest = os.path.join(PROJECT_ROOT, "test-results", path_or_id)
    if os.path.isdir(cand_latest):
        return cand_latest
    return os.path.abspath(path_or_id)


def main():
    parser = argparse.ArgumentParser(description="Siduri GLM Conversation-Testing and Evaluation System")
    subparsers = parser.add_subparsers(dest="command")

    # Main evaluation command flags
    eval_parser = parser
    eval_parser.add_argument("--runs-per-case", type=int, default=5, help="Number of generations per test case (default: 5)")
    eval_parser.add_argument("--suite", type=str, default=None, help="Filter test suite by name (e.g. pragmatics, identity)")
    eval_parser.add_argument("--thinking", type=str, choices=["enabled", "disabled"], default=None, help="Override thinking parameter")
    eval_parser.add_argument("--model", type=str, default=None, help="Override model name (e.g. glm-4.7-flash)")
    eval_parser.add_argument("--temperature", type=float, default=None, help="Override temperature (e.g. 0.72)")
    eval_parser.add_argument("--max-cases", type=int, default=None, help="Limit total number of cases for quick testing")
    eval_parser.add_argument("--skip-translation", action="store_true", help="Skip English subtitle translation stage")
    eval_parser.add_argument("--skip-evaluator", action="store_true", help="Skip evaluation scoring layer")
    eval_parser.add_argument("--open-report", action="store_true", help="Automatically open generated HTML report in browser")
    eval_parser.add_argument("--dry-run", action="store_true", help="Print run plan without executing GLM calls")
    eval_parser.add_argument("--yes", action="store_true", help="Skip interactive confirmation prompts")
    eval_parser.add_argument("--resume", type=str, default=None, help="Resume an incomplete run ID")
    eval_parser.add_argument("--mock", action="store_true", help="Use mock GLM adapter for offline unit testing")

    # Subcommand for comparison
    comp_parser = subparsers.add_parser("compare", help="Compare two timestamped evaluation runs")
    comp_parser.add_argument("old_run", type=str, help="Path or run ID of baseline run")
    comp_parser.add_argument("new_run", type=str, help="Path or run ID of new run")

    args = parser.parse_args()

    if args.command == "compare":
        old_path = _resolve_run_dir(args.old_run)
        new_path = _resolve_run_dir(args.new_run)
        compare_runs(old_path, new_path)
        return

    # Check API key unless mock or dry-run
    if not args.mock and not args.dry_run:
        key = os.environ.get("ZHIPU_API_KEY") or os.environ.get("OPENAI_API_KEY") or os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            print("[ERROR] No LLM API key found in environment! Please set ZHIPU_API_KEY in your environment or .env file.")
            sys.exit(1)

    cases = load_all_cases(suite_filter=args.suite)
    configs = load_configs()

    if args.max_cases and args.max_cases > 0:
        cases = cases[:args.max_cases]

    # Override configs if flags provided
    if args.model or args.temperature is not None or args.thinking:
        for c in configs:
            if args.model:
                c["model"] = args.model
            if args.temperature is not None:
                c["temperature"] = args.temperature
            if args.thinking:
                c["thinking"] = args.thinking

    runs_per_case = args.runs_per_case
    total_reaction_calls = len(cases) * len(configs) * runs_per_case
    total_translation_calls = 0 if args.skip_translation else total_reaction_calls

    print("\n" + "=" * 60)
    print(" SIDURI GLM EVALUATION RUN PLAN")
    print("=" * 60)
    print(f" Test Cases Loaded       : {len(cases)}")
    print(f" Configurations Matrix   : {len(configs)}")
    print(f" Runs Per Case           : {runs_per_case}")
    print(f" Estimated Reaction Calls: {total_reaction_calls}")
    print(f" Estimated Subtitle Calls: {total_translation_calls}")
    print(f" Mock Mode               : {args.mock}")
    print("=" * 60 + "\n")

    if args.dry_run:
        print("[DRY-RUN] Execution stopped per --dry-run flag.")
        return

    if not args.yes and total_reaction_calls > 100:
        ans = input(f"Proceed with {total_reaction_calls} API calls? (y/N): ")
        if ans.lower() not in ("y", "yes"):
            print("Aborted by user.")
            sys.exit(0)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    runs_base_dir = os.path.join(PROJECT_ROOT, "test-results", "runs")
    run_dir = os.path.join(runs_base_dir, timestamp)
    latest_dir = os.path.join(PROJECT_ROOT, "test-results", "latest")

    os.makedirs(run_dir, exist_ok=True)

    runner = EvalRunner(run_dir, mock_mode=args.mock)
    eval_results = []
    api_calls_count = 0

    for config in configs:
        print(f"\n[Running Configuration: {config.get('name')}]")
        for c_idx, case in enumerate(cases, 1):
            print(f"  -> [{c_idx}/{len(cases)}] Case: {case.get('id')} ({runs_per_case} runs)...", end="", flush=True)
            for gen_num in range(1, runs_per_case + 1):
                sim_res = runner.run_multi_turn_simulation(case, config, gen_num)
                api_calls_count += len(case.get("turns", []))

                if args.skip_evaluator:
                    eval_res = {
                        "case_id": case.get("id"),
                        "suite": case.get("suite"),
                        "config_id": config.get("id"),
                        "generation_num": gen_num,
                        "status": "PASS",
                        "text_ja": sim_res.get("final_reaction", {}).get("text"),
                        "text_en": sim_res.get("final_reaction", {}).get("text_en"),
                        "failures": [],
                    }
                else:
                    eval_res = evaluate_simulation_result(sim_res)

                eval_results.append(eval_res)

            print(" Done.", flush=True)

    # Generate all report files in run_dir
    generate_all_reports(run_dir, eval_results, configs, total_api_calls=api_calls_count)

    # Update test-results/latest link/copy
    if os.path.exists(latest_dir):
        shutil.rmtree(latest_dir, ignore_errors=True)
    shutil.copytree(run_dir, latest_dir)

    print("\n" + "=" * 60)
    print(" EVALUATION COMPLETE")
    print("=" * 60)
    print(f" HTML Report     : {os.path.join(latest_dir, 'index.html')}")
    print(f" Markdown Summary: {os.path.join(latest_dir, 'summary.md')}")
    print(f" Total API Calls : {api_calls_count}")
    print("=" * 60 + "\n")

    if args.open_report:
        try:
            import webbrowser
            webbrowser.open(os.path.join(latest_dir, "index.html"))
        except Exception:
            pass


if __name__ == "__main__":
    main()
