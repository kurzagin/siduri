#!/usr/bin/env python
"""
Standalone runner script for Siduri GLM Evaluation System.
Usage:
    python scripts/evaluate_siduri.py --runs-per-case 5 --yes
"""

import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from siduri_eval.cli import main

if __name__ == "__main__":
    main()
