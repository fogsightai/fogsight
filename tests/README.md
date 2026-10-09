# Generation regression tests

Run from the repository root (no credentials or live model calls required):

```sh
python -m venv .venv
.venv/bin/pip install -r requirements-test.txt
.venv/bin/python -m unittest discover -s tests -v
npm ci
npm test
```

Use Node 22.22.2+ or 24.15+. JavaScript tests cover SSE byte framing,
UTF-8, model token boundaries, raw/fenced HTML, completion markers,
invalid documents, and DOM integration with the actual page and script.
Python tests mock OpenAI/Gemini and exercise token metadata, creation and
iteration failures, invalid content, and the `/generate` SSE endpoint.

The client displays incoming output as text while streaming, then extracts
one complete HTML document at completion. Only validated HTML is added to
conversation history and the iframe. Plain text, fragments, empty bodies,
and truncated documents are rejected. This is document-format validation,
not a guarantee that generated JavaScript executes or teaches correctly.

The same UI regression suite can be run against the previous script:

```sh
git show master:static/script.js > /tmp/fogsight-legacy-script.js
FOGSIGHT_SCRIPT=/tmp/fogsight-legacy-script.js node --test tests/ui.test.cjs
```

At baseline `3a3d6eb`, 4 of 6 UI cases fail: raw HTML, split fences,
service-error classification, and premature EOF. All 6 pass after the fix.
These reproduce specific code defects, not the original reporter's unknown
provider configuration or a unique root cause for issue #21.
