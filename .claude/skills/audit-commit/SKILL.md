---
name: audit-commit
description: Stage and commit the current change set in granular, audit-ready commits matching BIGMAMA$'s 100-commit discipline. One logical unit per commit, conventional-commit prefix, co-author trailer.
---

# Audit Commit

BIGMAMA$ treats the commit log as a public audit trail. One commit = one reviewable decision.

## Rules

1. **Conventional prefixes**: `feat`, `fix`, `refactor`, `style`, `perf`, `security`, `test`, `chaos`, `ci`, `docs`, `chore`, `a11y`, `pwa`.
2. **Subject ≤ 72 chars**, imperative ("add", not "added").
3. **One concern per commit**. If a diff mixes a feature and a rename, split them.
4. **Body** (optional) explains WHY, not WHAT. Reference the invariant being preserved.
5. **Trailer** on every commit:
   ```
   Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
   ```
6. **Never `git add -A`**. Name files.
7. **Never `--amend`** a pushed commit.
8. **Never `--no-verify`** — fix the hook, don't bypass it.

## Procedure

1. `git status` and `git diff` to see what's staged.
2. Group hunks into logical units. If a file contains two concerns, `git add -p` to split.
3. For each unit: stage specific files → write subject + optional body → commit.
4. After all commits, `git log --oneline -n <count>` to verify cadence and style.

## When a hook fails

Fix the underlying issue, re-stage, create a NEW commit. Do not amend.
