#!/usr/bin/env bash

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: scripts/worktree-add.sh [--source <path>] [--force-env] [--skip-install] <path> <branch> [start-point]

Creates a worktree and bootstraps it:
  1) git worktree add ...
  2) copy .env from primary worktree (or --source path)
  3) pnpm install (unless --skip-install)

Positional arguments:
  path         Path where the new worktree will be created
  branch       Branch name for the worktree
  start-point  Optional commit/branch to create new branch from (default: HEAD)

Options:
  --source <path>  Source worktree to copy .env from during bootstrap
  --force-env      Overwrite .env in target worktree if present
  --skip-install   Skip pnpm install during bootstrap
  -h, --help       Show this help
EOF
}

SOURCE_WORKTREE=""
FORCE_ENV=0
SKIP_INSTALL=0

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

if (($# < 2)); then
    usage
    exit 1
fi

TARGET_PATH="$1"
BRANCH_NAME="$2"
START_POINT="${3:-HEAD}"

if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "Error: Run this command from inside a git repository." >&2
    exit 1
fi

cd "$REPO_ROOT"

TARGET_ABS_PATH="$(realpath -m "$TARGET_PATH")"

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

(
    cd "$TARGET_ABS_PATH"
    bash "$REPO_ROOT/scripts/worktree-bootstrap.sh" "${BOOTSTRAP_ARGS[@]}"
)

echo "Worktree is ready at: $TARGET_ABS_PATH"
