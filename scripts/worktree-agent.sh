#!/usr/bin/env bash

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: scripts/worktree-agent.sh [--source <path>] [--force-env] [--skip-install] [--always-install] [--no-shell] <branch-or-agent>

Creates or reuses a repo-local worktree at <repo>/.worktrees/<branch>.
The input can be either:
  - a branch name (preferred), or
  - a Cursor agent/worktree directory name (fallback lookup).

Flow:
  1) Resolve input to branch (direct branch match first, agent lookup second)
  2) Ensure worktree exists at <repo>/.worktrees/<branch>
  3) Bootstrap via scripts/worktree-add.sh (when creating)
  4) Open an interactive shell in that worktree (unless --no-shell)

Arguments:
  branch-or-agent Branch name (for example: cursor/feature-123) or
                  agent/worktree directory name (for example: grl, lex)

Options:
  --source <path>  Passed through to worktree-add bootstrap
  --force-env      Passed through to worktree-add bootstrap
  --skip-install   Passed through to worktree-add bootstrap
  --always-install Passed through to worktree-add bootstrap
  --no-shell       Do not open a shell in the target worktree
  -h, --help       Show this help
EOF
}

SOURCE_WORKTREE=""
FORCE_ENV=0
SKIP_INSTALL=0
ALWAYS_INSTALL=0
NO_SHELL=0

resolve_path() {
    local candidate="$1"

    if command -v realpath >/dev/null 2>&1 && realpath -m / >/dev/null 2>&1; then
        realpath -m "$candidate"
        return
    fi

    if command -v python3 >/dev/null 2>&1; then
        python3 - "$candidate" <<'PY'
from pathlib import Path
import sys

print(str(Path(sys.argv[1]).expanduser().resolve(strict=False)))
PY
        return
    fi

    echo "Error: Could not resolve path. Install python3 or GNU coreutils realpath." >&2
    exit 1
}

POSITIONAL=()
while (($#)); do
    case "$1" in
        --source)
            if (($# < 2)); then
                echo "Error: --source requires a path argument." >&2
                exit 1
            fi
            SOURCE_WORKTREE="$2"
            shift 2
            ;;
        --force-env)
            FORCE_ENV=1
            shift
            ;;
        --skip-install)
            SKIP_INSTALL=1
            shift
            ;;
        --always-install)
            ALWAYS_INSTALL=1
            shift
            ;;
        --no-shell)
            NO_SHELL=1
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        -*)
            echo "Error: Unknown option '$1'." >&2
            usage
            exit 1
            ;;
        *)
            POSITIONAL+=("$1")
            shift
            ;;
    esac
done

set -- "${POSITIONAL[@]}"
if (($# != 1)); then
    usage
    exit 1
fi

AGENT_NAME="$1"

if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "Error: Run this command from inside a git repository." >&2
    exit 1
fi

cd "$REPO_ROOT"

resolve_branch_name() {
    local input="$1"

    if git show-ref --verify --quiet "refs/heads/$input"; then
        printf '%s\n' "$input"
        return 0
    fi

    if git show-ref --verify --quiet "refs/remotes/origin/$input"; then
        printf '%s\n' "$input"
        return 0
    fi

    return 1
}

find_agent_branch() {
    local wanted_agent="$1"
    local current_worktree=""

    while IFS= read -r line; do
        if [[ "$line" == worktree\ * ]]; then
            current_worktree="${line#worktree }"
            continue
        fi

        if [[ "$line" == branch\ refs/heads/* ]]; then
            local branch_name="${line#branch refs/heads/}"
            local base_name
            base_name="$(basename "$current_worktree")"

            if [[ "$base_name" == "$wanted_agent" ]]; then
                printf '%s\n' "$branch_name"
                return 0
            fi
        fi
    done < <(git worktree list --porcelain)

    return 1
}

if BRANCH_NAME="$(resolve_branch_name "$AGENT_NAME")"; then
    :
elif BRANCH_NAME="$(find_agent_branch "$AGENT_NAME")"; then
    :
else
    cat >&2 <<EOF
Error: '$AGENT_NAME' is neither:
  1) an existing local/remote branch, nor
  2) a known agent/worktree directory name.

Tip: pass the full branch name, e.g. cursor/classroom-last-chapter-verse-3321
EOF
    exit 1
fi

TARGET_PATH="$REPO_ROOT/.worktrees/$BRANCH_NAME"
TARGET_ABS_PATH="$(resolve_path "$TARGET_PATH")"
mkdir -p "$(dirname "$TARGET_ABS_PATH")"

is_registered_worktree_path() {
    local wanted_path
    wanted_path="$(resolve_path "$1")"

    while IFS= read -r line; do
        if [[ "$line" == worktree\ * ]]; then
            local candidate="${line#worktree }"
            if [[ "$(resolve_path "$candidate")" == "$wanted_path" ]]; then
                return 0
            fi
        fi
    done < <(git worktree list --porcelain)

    return 1
}

if [[ -d "$TARGET_ABS_PATH" ]]; then
    if ! is_registered_worktree_path "$TARGET_ABS_PATH"; then
        echo "Error: Target directory exists but is not a registered git worktree: $TARGET_ABS_PATH" >&2
        exit 1
    fi
    echo "Reusing existing worktree at: $TARGET_ABS_PATH"
else
    ADD_ARGS=()

    if [[ -n "$SOURCE_WORKTREE" ]]; then
        ADD_ARGS+=(--source "$SOURCE_WORKTREE")
    fi
    if [[ "$FORCE_ENV" -eq 1 ]]; then
        ADD_ARGS+=(--force-env)
    fi
    if [[ "$SKIP_INSTALL" -eq 1 ]]; then
        ADD_ARGS+=(--skip-install)
    fi
    if [[ "$ALWAYS_INSTALL" -eq 1 ]]; then
        ADD_ARGS+=(--always-install)
    fi

    bash "$REPO_ROOT/scripts/worktree-add.sh" "${ADD_ARGS[@]}" "$TARGET_ABS_PATH" "$BRANCH_NAME"
fi

echo "Ready: $TARGET_ABS_PATH (branch: $BRANCH_NAME)"

if [[ "$NO_SHELL" -eq 1 ]]; then
    exit 0
fi

cd "$TARGET_ABS_PATH"
echo "Opening shell in $TARGET_ABS_PATH"
exec "${SHELL:-/bin/zsh}"
