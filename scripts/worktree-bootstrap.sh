#!/usr/bin/env bash

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: scripts/worktree-bootstrap.sh [--source <path>] [--force-env] [--skip-install]

Bootstraps a git worktree by:
  1) Copying .env from the primary worktree (or --source path)
  2) Running pnpm install

Options:
  --source <path>  Copy .env from this path instead of auto-detecting
  --force-env      Overwrite .env in the current worktree if it exists
  --skip-install   Skip pnpm install
  -h, --help       Show this help
EOF
}

SOURCE_WORKTREE=""
FORCE_ENV=0
SKIP_INSTALL=0

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
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Error: Unknown argument '$1'." >&2
            usage
            exit 1
            ;;
    esac
done

if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "Error: Run this command from inside a git repository." >&2
    exit 1
fi

cd "$REPO_ROOT"

primary_worktree_path() {
    while IFS= read -r line; do
        if [[ "$line" == worktree\ * ]]; then
            local candidate="${line#worktree }"
            if [[ -d "$candidate/.git" ]]; then
                printf '%s\n' "$candidate"
                return 0
            fi
        fi
    done < <(git worktree list --porcelain)

    printf '%s\n' "$REPO_ROOT"
}

if [[ -z "$SOURCE_WORKTREE" ]]; then
    SOURCE_WORKTREE="$(primary_worktree_path)"
else
    SOURCE_WORKTREE="$(realpath "$SOURCE_WORKTREE")"
fi

if [[ ! -d "$SOURCE_WORKTREE" ]]; then
    echo "Error: Source worktree path does not exist: $SOURCE_WORKTREE" >&2
    exit 1
fi

SOURCE_ENV_PATH="$SOURCE_WORKTREE/.env"
TARGET_ENV_PATH="$REPO_ROOT/.env"

if [[ "$SOURCE_ENV_PATH" == "$TARGET_ENV_PATH" ]]; then
    echo "Source and target .env are the same path. Skipping copy."
elif [[ -f "$SOURCE_ENV_PATH" ]]; then
    if [[ -f "$TARGET_ENV_PATH" && "$FORCE_ENV" -eq 0 ]]; then
        echo ".env already exists in target worktree. Keeping existing file."
    else
        cp "$SOURCE_ENV_PATH" "$TARGET_ENV_PATH"
        echo "Copied .env from $SOURCE_WORKTREE to $REPO_ROOT"
    fi
else
    echo "No .env found at $SOURCE_WORKTREE. Skipping .env copy."
fi

if [[ "$SKIP_INSTALL" -eq 1 ]]; then
    echo "Skipping pnpm install."
    exit 0
fi

if ! command -v pnpm >/dev/null 2>&1; then
    echo "Error: pnpm is not installed or not in PATH." >&2
    exit 1
fi

echo "Running pnpm install in $REPO_ROOT"
pnpm install
