# Per-Mod Install Timing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Print how long each mod took to install, plus a running cumulative total for the batch, right after each mod finishes installing.

**Architecture:** `ModService.install()` (src/mod.service.ts) already loops over `WeiduLineGroup`s and calls `execWeidu()` per mod, followed by `verifyInstall()`. Add a `batchStart` timestamp before the loop and a per-mod `start` timestamp before each `execWeidu()` call; after `execWeidu()` resolves, compute elapsed and cumulative seconds and print them.

**Tech Stack:** TypeScript, compiled via `tsc` (`npm run build`) to `lib/`. No test framework is configured in this project (see `package.json` — no `test` script, no `*.test.ts` files anywhere); verification for this plan is build-clean + manual run, matching how the existing `verifyInstall()` feature (src/mod.service.ts:488-510) was verified.

## Global Constraints

- Console output only — do not write to any file. (Spec: "Console output only — nothing persisted to a file.")
- Only `install()` is touched. `uninstall()`, `printInstallCommands()`, and other commands are out of scope. (Spec: "`uninstall()` and other commands are out of scope; only `install()` is touched.")
- Durations are whole seconds via `Math.round()`, not any other unit or precision. (Spec: "Both durations are whole seconds (`Math.round`)".)
- Skipped groups (already installed) and declined groups (user said no at the "Install X ?" prompt) must print nothing and must not advance either clock. (Spec: "don't reset either clock".)

---

### Task 1: Add per-mod and cumulative install timing to `install()`

**Files:**
- Modify: `src/mod.service.ts:286-329` (the `install()` method)

**Interfaces:**
- Consumes: existing `ModService.execWeidu(args: readonly string[], cwd: string): Promise<unknown>` (src/mod.service.ts:470-486) — unchanged signature, called exactly as it is today.
- Consumes: existing `ModService.verifyInstall(config: Config, group: WeiduLineGroup): void` (src/mod.service.ts:488-510) — unchanged, called exactly as it is today, immediately after the new timing capture.
- Consumes: existing `ModService.getModFolder(tp2File: string): string` (src/mod.service.ts:530-532) — used to format the mod name in the new console line, same as the existing "Install X ?" prompt at src/mod.service.ts:305 already does.
- Produces: no new public methods or types. This task only changes the body of `install()`.

This is a single, self-contained change with no unit test seams (the codebase has no test framework), so it is verified by a build check plus one manual run against a real game folder — there is no separate "write failing test" step for this task.

- [ ] **Step 1: Read the current `install()` method to confirm line numbers haven't drifted**

Open `src/mod.service.ts` and locate the `install(file: string)` method. Confirm it still matches this shape (as of this plan's writing, src/mod.service.ts:286-329):

```ts
async install(file: string) {
  const config = this.getConfig();
  const installedGroups = this.parseWeiduLog(
    path.join(config.gameFolder, "weiDU.log"),
  );
  const groups = this.parseWeiduLog(file);
  const alwaysAsk = await confirm({
    message: "Ask for each install ?",
    default: true,
  });
  for (const [index, group] of groups.entries()) {
    const installedGroup = installedGroups[index];
    if (installedGroup) {
      console.log(chalk.grey(`${group.tp2File} already installed`));
      continue;
    }
    let install = !alwaysAsk;
    if (alwaysAsk)
      install = await confirm({
        message: `Install ${this.getModFolder(group.tp2File)} ?`,
        default: true,
      });
    if (!install) {
      console.log(`Skipping ${group.tp2File}`);
      continue;
    }
    console.log(
      `Installing ${group.tp2File} --language ${group.language} --no-exit-pause --noautoupdate --force-install-list ${group.components.join(" ")}`,
    );
    await this.execWeidu(
      [
        group.tp2File,
        "--language",
        group.language,
        "--no-exit-pause",
        "--noautoupdate",
        "--force-install-list",
        ...group.components,
      ],
      config.gameFolder,
    );
    this.verifyInstall(config, group);
  }
}
```

If the method body differs meaningfully from this (beyond whitespace), stop and re-read the surrounding file before proceeding — the edits in Step 2 assume this exact structure.

- [ ] **Step 2: Add `batchStart`, per-mod timing, and the console line**

Replace the method body with:

```ts
async install(file: string) {
  const config = this.getConfig();
  const installedGroups = this.parseWeiduLog(
    path.join(config.gameFolder, "weiDU.log"),
  );
  const groups = this.parseWeiduLog(file);
  const alwaysAsk = await confirm({
    message: "Ask for each install ?",
    default: true,
  });
  const batchStart = Date.now();
  for (const [index, group] of groups.entries()) {
    const installedGroup = installedGroups[index];
    if (installedGroup) {
      console.log(chalk.grey(`${group.tp2File} already installed`));
      continue;
    }
    let install = !alwaysAsk;
    if (alwaysAsk)
      install = await confirm({
        message: `Install ${this.getModFolder(group.tp2File)} ?`,
        default: true,
      });
    if (!install) {
      console.log(`Skipping ${group.tp2File}`);
      continue;
    }
    console.log(
      `Installing ${group.tp2File} --language ${group.language} --no-exit-pause --noautoupdate --force-install-list ${group.components.join(" ")}`,
    );
    const start = Date.now();
    await this.execWeidu(
      [
        group.tp2File,
        "--language",
        group.language,
        "--no-exit-pause",
        "--noautoupdate",
        "--force-install-list",
        ...group.components,
      ],
      config.gameFolder,
    );
    const elapsedSeconds = Math.round((Date.now() - start) / 1000);
    const cumulativeSeconds = Math.round((Date.now() - batchStart) / 1000);
    this.verifyInstall(config, group);
    console.log(
      chalk.cyan(
        `${this.getModFolder(group.tp2File)} installed in ${elapsedSeconds}s (cumulative: ${cumulativeSeconds}s)`,
      ),
    );
  }
}
```

Note `batchStart` is declared once, after the `alwaysAsk` prompt and before the `for` loop — so it isn't affected by however long the user takes to answer that initial prompt, and it isn't reset per-iteration.

- [ ] **Step 3: Build and confirm no TypeScript errors**

Run: `npm run build`
Expected: exits 0, no errors printed. This regenerates `lib/mod.service.js` from `src/mod.service.ts`.

- [ ] **Step 4: Manually verify against a real game folder**

This step requires a real WeiDU game folder and at least one mod available to install (or re-install after removing its `weiDU.log` entry) — use whatever the maintainer normally uses for testing this tool (e.g. one of the configs in `assets/config_bg1.json` / `assets/config_bg2.json`).

Run the CLI's install command for a batch containing at least two mods that will actually install (not already present in `weiDU.log`), e.g.:

```
node lib/index.js -g bg1 --install <path-to-a-weidu-log-with-2+-new-mods>
```

Expected, for each mod actually installed:
- The existing green `<TP2FILE>: all N component(s) confirmed installed` line still appears (unchanged).
- Immediately after it, a new cyan line appears: `<mod folder> installed in <N>s (cumulative: <M>s)`.
- The per-mod `<N>s` is roughly the wall-clock time that mod took.
- The cumulative `<M>s` strictly increases from one installed mod to the next, and is roughly the sum of all prior per-mod times in this run.
- For any mod that is skipped (already installed) or declined (answered "no" at the "Install X ?" prompt), no cyan timing line appears — output is unchanged from before this plan.

- [ ] **Step 5: Commit**

```bash
git add src/mod.service.ts lib/mod.service.js lib/mod.service.d.ts
git commit -m "$(cat <<'EOF'
feat: print per-mod and cumulative install timing

EOF
)"
```

(`lib/mod.service.js` and `lib/mod.service.d.ts` are the build output from Step 3 — check `git status` first to confirm which `lib/` files actually changed before staging; only add the ones `tsc` regenerated.)

## Self-Review

- **Spec coverage:** Per-mod elapsed time ✓ (Step 2), cumulative time since batch start ✓ (Step 2, `batchStart`), console-only output ✓ (no file writes anywhere in this plan), skip/decline groups print nothing and don't advance clocks ✓ (both `continue` branches are before `start`/`batchStart` usage — `batchStart` is set once outside the loop so it's never "reset", and per-mod `start` is only read for mods that reach the `execWeidu` call), only `install()` touched ✓ (no other method modified), whole-second rounding via `Math.round` ✓ (Step 2 code).
- **Placeholder scan:** No TBDs; every step has literal code or literal commands.
- **Type consistency:** No new types or method signatures introduced — `execWeidu`, `verifyInstall`, and `getModFolder` are called with their existing signatures, unchanged.
