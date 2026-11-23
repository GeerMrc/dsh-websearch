#!/bin/bash
# S41 stage-0 audit: serial baseline registration for dsh-websearch (read-only except allowed side effects).
# All output goes to /tmp/dshws-s41/audit/baseline/. Commands run strictly one after another.
set -u
REPO=/Volumes/IPFSJK/Zcode/dsh-websearch
OUT=/tmp/dshws-s41/audit/baseline
mkdir -p "$OUT"
export PATH=/Users/aibot/.nvm/versions/node/v22.23.2/bin:$PATH
cd "$REPO" || exit 99

now() { perl -MTime::HiRes=time -e 'printf "%.3f", time'; }
SUMMARY="$OUT/summary.tsv"
: > "$SUMMARY"

{
  echo "node=$(node --version)"
  echo "pnpm=$(pnpm --version)"
  echo "cwd=$(pwd)"
  echo "HEAD=$(git rev-parse HEAD)"
  echo "started_at=$(date '+%Y-%m-%d %H:%M:%S %z')"
  echo "status_before_begin"
  git status --short
  echo "status_before_end"
} > "$OUT/env.txt" 2>&1

run() {
  local name="$1"; shift
  local log="$OUT/$name.log"
  local t0 t1 rc
  t0=$(now)
  "$@" > "$log" 2>&1
  rc=$?
  t1=$(now)
  printf '%s\t%s\t%s\t%s\t%s\n' "$name" "$rc" "$(perl -e "printf '%.1f', $t1 - $t0")" "$(wc -l < "$log" | tr -d ' ')" "$(date '+%H:%M:%S')" >> "$SUMMARY"
  echo "exit_code=$rc duration_s=$(perl -e "printf '%.1f', $t1 - $t0")" >> "$log"
}

run 01-install pnpm install --frozen-lockfile
git status --short > "$OUT/status_after_install.txt" 2>&1
if grep -v '^??' "$OUT/status_after_install.txt" | grep -q .; then
  echo "STOP	tracked files changed after install" >> "$SUMMARY"
  exit 0
fi

run 02-typecheck pnpm run typecheck
run 03-typecheck-client pnpm run typecheck:client
run 04-lint pnpm run lint
run 05-test pnpm test
run 06-check-i18n pnpm run check:i18n
run 07-build pnpm run build

git status --short > "$OUT/status_final.txt" 2>&1
echo "finished_at=$(date '+%Y-%m-%d %H:%M:%S %z')" >> "$OUT/env.txt"
echo "DONE" >> "$SUMMARY"
