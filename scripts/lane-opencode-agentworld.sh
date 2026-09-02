#!/usr/bin/env bash
# OpenCode + Unsloth AgentWorld lane for this repo.
# Loads .env (gitignored). Does not print the API key.
#
# Usage:
#   ./scripts/lane-opencode-agentworld.sh
#   ./scripts/lane-opencode-agentworld.sh --worktree fix-icon
#   ./scripts/lane-opencode-agentworld.sh --worktree fix-icon --print-env
#   ./scripts/lane-opencode-agentworld.sh --dry-run
#
# Parent agent still owns acceptance: npm test && npm run smoke after the lane.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

WORKTREE_ID=""
DRY_RUN=0
PRINT_ENV=0
EXTRA=()

usage() {
  sed -n '2,14p' "$0" | tr -d '#'
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help) usage 0 ;;
    --worktree)
      WORKTREE_ID="${2:-}"
      [[ -n "$WORKTREE_ID" ]] || { echo "error: --worktree needs an id" >&2; exit 2; }
      shift 2
      ;;
    --dry-run) DRY_RUN=1; shift ;;
    --print-env) PRINT_ENV=1; shift ;;
    --) shift; EXTRA+=("$@"); break ;;
    *) EXTRA+=("$1"); shift ;;
  esac
done

if [[ -f "$ROOT/.env" ]]; then
  # shellcheck disable=SC1091
  set -a
  # shellcheck disable=SC1090
  source "$ROOT/.env"
  set +a
fi

UNSLOTH_STUDIO_URL="${UNSLOTH_STUDIO_URL:-http://192.168.5.157:8888}"
AGENTWORLD_MODEL="${AGENTWORLD_MODEL:-unsloth/Qwen-AgentWorld-35B-A3B-GGUF:UD-IQ4_NL}"
API_KEY="${UNSLOTH_API_KEY:-${UNSLOTH_KEY:-}}"

if [[ -z "$API_KEY" ]]; then
  echo "error: set UNSLOTH_API_KEY in .env (see .env.example)" >&2
  exit 1
fi

if ! command -v unsloth >/dev/null 2>&1; then
  echo "error: unsloth not on PATH (expected ~/.unsloth/studio/bin/unsloth)" >&2
  exit 1
fi

WORKDIR="$ROOT"
BRANCH=""
if [[ -n "$WORKTREE_ID" ]]; then
  # sanitize id for path/branch
  SAFE="$(echo "$WORKTREE_ID" | tr -c 'A-Za-z0-9._-' '-' | sed 's/^-*//;s/-*$//')"
  [[ -n "$SAFE" ]] || { echo "error: invalid worktree id" >&2; exit 2; }
  WT="$ROOT/.worktrees/$SAFE"
  BRANCH="agent/$SAFE"
  if [[ ! -d "$WT" ]]; then
    mkdir -p "$ROOT/.worktrees"
    if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
      if git -C "$ROOT" show-ref --verify --quiet "refs/heads/$BRANCH"; then
        git -C "$ROOT" worktree add "$WT" "$BRANCH"
      else
        git -C "$ROOT" worktree add -b "$BRANCH" "$WT"
      fi
    else
      echo "error: not a git repo; cannot create worktree" >&2
      exit 1
    fi
  fi
  WORKDIR="$WT"
fi

export UNSLOTH_STUDIO_URL
export UNSLOTH_API_KEY="$API_KEY"
export AGENT_ID="${AGENT_ID:-opencode-lane}"

if [[ "$PRINT_ENV" -eq 1 ]]; then
  echo "UNSLOTH_STUDIO_URL=$UNSLOTH_STUDIO_URL"
  echo "AGENTWORLD_MODEL=$AGENTWORLD_MODEL"
  echo "AGENT_ID=$AGENT_ID"
  echo "WORKDIR=$WORKDIR"
  echo "BRANCH=${BRANCH:-"(main worktree)"}"
  echo "UNSLOTH_API_KEY=(set, ${#API_KEY} chars)"
  exit 0
fi

echo "lane: OpenCode AgentWorld"
echo "  studio: $UNSLOTH_STUDIO_URL"
echo "  model:  $AGENTWORLD_MODEL"
echo "  workdir:$WORKDIR"
echo "  agent:  $AGENT_ID"
echo "  verify after: cd \"$ROOT\" && npm test && npm run smoke"
echo

CMD=(unsloth start opencode --model "$AGENTWORLD_MODEL" --api-key "$API_KEY")
# Prefer cwd = worktree so OpenCode edits the right tree
cd "$WORKDIR"

if [[ "$DRY_RUN" -eq 1 ]]; then
  # do not print api key value
  echo "dry-run: UNSLOTH_STUDIO_URL=$UNSLOTH_STUDIO_URL \\"
  echo "  unsloth start opencode --model $AGENTWORLD_MODEL --api-key \"\$UNSLOTH_API_KEY\""
  [[ ${#EXTRA[@]} -gt 0 ]] && echo "  extra: ${EXTRA[*]}"
  exit 0
fi

# Pass through any extra args to unsloth if supported later
exec "${CMD[@]}" "${EXTRA[@]}"
