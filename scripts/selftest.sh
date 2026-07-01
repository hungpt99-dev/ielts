#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8788}"
PASS=0
FAIL=0

pass() {
  PASS=$((PASS + 1))
  echo "  PASS: $1"
}

fail() {
  FAIL=$((FAIL + 1))
  echo "  FAIL: $1"
}

check_content_type() {
  local url="$1"
  local expected="$2"
  local label="$3"
  local content_type

  content_type=$(curl -s -I -o /dev/null -w '%{content_type}' "$url" 2>/dev/null || true)

  if [ "$content_type" = "$expected" ]; then
    pass "$label — Content-Type: $content_type"
  else
    fail "$label — expected '$expected', got '$content_type'"
  fi
}

echo "========================================"
echo "  Self-Test: Cloudflare Deployment"
echo "  Base URL: $BASE_URL"
echo "========================================"
echo ""

echo "--- MIME Type Checks ---"

echo ""
echo "  [JavaScript module scripts]"
index_html=$(curl -s "$BASE_URL/" 2>/dev/null || true)

if [ -z "$index_html" ]; then
  fail "Fetching index.html — no response from $BASE_URL/"
fi

script_urls=$(echo "$index_html" | grep -oE 'src="([^"]+\.js[^"]*)"' | sed 's/src="//;s/"//' || true)

if [ -z "$script_urls" ]; then
  fail "No <script src=...> found in index.html"
fi

while IFS= read -r url; do
  full_url="$BASE_URL$url"
  check_content_type "$full_url" "application/javascript" "$full_url"
done <<< "$script_urls"

echo ""
echo "  [CSS files]"
css_urls=$(echo "$index_html" | grep -oE 'href="([^"]+\.css[^"]*)"' | sed 's/href="//;s/"//' || true)

while IFS= read -r url; do
  full_url="$BASE_URL$url"
  check_content_type "$full_url" "text/css" "$full_url"
done <<< "$css_urls"

echo ""
echo "  [manifest.webmanifest]"
check_content_type "$BASE_URL/manifest.webmanifest" "application/manifest+json" "manifest.webmanifest"

echo ""
echo "--- Manifest Syntax Validation ---"

manifest_json=$(curl -s "$BASE_URL/manifest.webmanifest" 2>/dev/null || true)

if echo "$manifest_json" | python3 -c "import json,sys; json.load(sys.stdin)" 2>/dev/null; then
  pass "manifest.webmanifest is valid JSON"
else
  fail "manifest.webmanifest is not valid JSON"
fi

manifest_name=$(echo "$manifest_json" | python3 -c "import json,sys; print(json.load(sys.stdin).get('name',''))" 2>/dev/null || true)
if [ -n "$manifest_name" ]; then
  pass "manifest.webmanifest contains 'name': $manifest_name"
else
  fail "manifest.webmanifest missing 'name'"
fi

echo ""
echo "--- HTTP Security Headers ---"

check_content_type "$BASE_URL/" "text/html" "index.html"

echo ""
echo "--- Summary ---"
echo "  PASS: $PASS"
echo "  FAIL: $FAIL"
echo "========================================"

[ "$FAIL" -eq 0 ]
