#!/usr/bin/env bash

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: scripts/worktree-add.sh [--source <path>] [--force-env] [--skip-install] [--always-install] <branch> [start-point]
       scripts/worktree-add.sh [--source <path>] [--force-env] [--skip-install] [--always-install] <path> <branch> [start-point]

Creates a worktree and bootstraps it:
  1) git worktree add ...
  2) copy .env from primary worktree (or --source path)
  3) install dependencies when needed (unless --skip-install)

Positional arguments:
  branch       Branch name for the worktree. When path is omitted, the target path
               defaults to <repo>/worktrees/<branch>.
  path         Optional path where the new worktree will be created
  start-point  Optional commit/branch to create new branch from (default: HEAD)

Options:
  --source <path>  Source worktree to copy .env from during bootstrap
  --force-env      Overwrite .env in target worktree if present
  --skip-install   Skip pnpm install during bootstrap
  --always-install Always run pnpm install during bootstrap
  -h, --help       Show this help
EOF
}

SOURCE_WORKTREE=""
FORCE_ENV=0
SKIP_INSTALL=0
ALWAYS_INSTALL=0

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
        --)
            shift
            continue
            ;;
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

if (($# < 1)); then
    usage
    exit 1
fi

TARGET_PATH=""
BRANCH_NAME=""
START_POINT="HEAD"

if (($# == 1)); then
    BRANCH_NAME="$1"
elif (($# == 2)); then
    if [[ "$1" == */* || "$1" == . || "$1" == .. || "$1" == ~* ]]; then
        TARGET_PATH="$1"
        BRANCH_NAME="$2"
    else
        BRANCH_NAME="$1"
        START_POINT="$2"
    fi
else
    TARGET_PATH="$1"
    BRANCH_NAME="$2"
    START_POINT="$3"
fi

if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "Error: Run this command from inside a git repository." >&2
    exit 1
fi

cd "$REPO_ROOT"

if [[ -z "$TARGET_PATH" ]]; then
    TARGET_PATH="$REPO_ROOT/worktrees/$BRANCH_NAME"
fi

TARGET_ABS_PATH="$(resolve_path "$TARGET_PATH")"

if [[ -e "$TARGET_ABS_PATH" ]]; then
    echo "Error: Target path already exists: $TARGET_ABS_PATH" >&2
    exit 1
fi

if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
    echo "Creating worktree at $TARGET_ABS_PATH from existing local branch $BRANCH_NAME"
    git worktree add "$TARGET_ABS_PATH" "$BRANCH_NAME"
elif git show-ref --verify --quiet "refs/remotes/origin/$BRANCH_NAME"; then
    echo "Creating worktree at $TARGET_ABS_PATH from remote branch origin/$BRANCH_NAME"
    git worktree add --track -b "$BRANCH_NAME" "$TARGET_ABS_PATH" "origin/$BRANCH_NAME"
else
    echo "Creating worktree at $TARGET_ABS_PATH with new branch $BRANCH_NAME from $START_POINT"
    git worktree add -b "$BRANCH_NAME" "$TARGET_ABS_PATH" "$START_POINT"
fi

BOOTSTRAP_ARGS=()

if [[ -n "$SOURCE_WORKTREE" ]]; then
    BOOTSTRAP_ARGS+=(--source "$SOURCE_WORKTREE")
fi

if [[ "$FORCE_ENV" -eq 1 ]]; then
    BOOTSTRAP_ARGS+=(--force-env)
fi

if [[ "$SKIP_INSTALL" -eq 1 ]]; then
    BOOTSTRAP_ARGS+=(--skip-install)
fi

if [[ "$ALWAYS_INSTALL" -eq 1 ]]; then
    BOOTSTRAP_ARGS+=(--always-install)
fi

(
    cd "$TARGET_ABS_PATH"
    bash "$REPO_ROOT/scripts/worktree-bootstrap.sh" "${BOOTSTRAP_ARGS[@]}"
)

echo "Worktree is ready at: $TARGET_ABS_PATH"
