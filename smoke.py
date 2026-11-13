#!/usr/bin/env python3
# Kept so old instructions still work: the real smoke test is tools/smoke.py (all pages, phone + desktop, stale-data checks).
import os, sys
os.execv(sys.executable, [sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tools', 'smoke.py')] + sys.argv[1:])
