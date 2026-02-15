#!/usr/bin/env bash

set -euo pipefail

if ! REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    echo "Error: Run this command from inside a git repository." >&2
    exit 1
fi

cd "$REPO_ROOT"

resolve_abs_path() {
    local candidate="$1"
    local absolute_candidate=""

    if [[ "$candidate" == /* ]]; then
        absolute_candidate="$candidate"
    else
        absolute_candidate="$REPO_ROOT/$candidate"
    fi

    python3 -c 'import os,sys; print(os.path.abspath(sys.argv[1]))' "$absolute_candidate"
}

resolve_active_hooks_dir() {
    local active_hooks_path=""
    active_hooks_path="$(git config --get core.hooksPath || true)"

    if [[ -z "$active_hooks_path" ]]; then
        printf '%s\n' "$(resolve_abs_path "$(git rev-parse --git-common-dir)/hooks")"
        return
    fi

    resolve_abs_path "$active_hooks_path"
}

resolve_target_hooks_dir() {
    local active_hooks_dir="$1"

    if [[ -f "$active_hooks_dir/.cursor-original-hooks-path" ]]; then
        local original_hooks_path=""
        original_hooks_path="$(<"$active_hooks_dir/.cursor-original-hooks-path")"

        if [[ -n "$original_hooks_path" ]]; then
            printf '%s\n' "$(resolve_abs_path "$original_hooks_path")"
            return
        fi
    fi

    printf '%s\n' "$active_hooks_dir"
}

PRE_PUSH_SOURCE="$REPO_ROOT/.githooks/pre-push"

if [[ ! -f "$PRE_PUSH_SOURCE" ]]; then
    echo "Error: Missing tracked hook at $PRE_PUSH_SOURCE" >&2
    exit 1
fi

ACTIVE_HOOKS_DIR="$(resolve_active_hooks_dir)"
TARGET_HOOKS_DIR="$(resolve_target_hooks_dir "$ACTIVE_HOOKS_DIR")"
PRE_PUSH_TARGET="$TARGET_HOOKS_DIR/pre-push"

mkdir -p "$TARGET_HOOKS_DIR"
cp "$PRE_PUSH_SOURCE" "$PRE_PUSH_TARGET"
chmod +x "$PRE_PUSH_TARGET"

echo "Installed pre-push hook at $PRE_PUSH_TARGET"
