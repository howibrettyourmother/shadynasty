# League Office (#office)
- Add a memo: drop `docs/<slug>.html` (+ `.png`, `.pdf`; `python3 tools/render_office_docs.py` renders both from HTML) and add an entry to `office.json` (newest first). Neutral slugs only: notice numbers, no names.
- Bylaws text lives in `bylaws.json` (built from the 2021 .docx by `tools/build_office.py`). Sleeper conflict checks are in `office.js` (`CHECKS`).
