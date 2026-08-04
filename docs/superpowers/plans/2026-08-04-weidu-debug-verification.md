# WeiDU Install Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After each mod is installed via `ModService.install()`, verify against WeiDU's own `weiDU.log` that every requested component was actually installed, and halt the entire install run immediately if any component is missing.

**Architecture:** One new method on `ModService` (`verifyInstall`) is wired into the existing `install()` loop immediately after the existing `execWeidu()` call. `verifyInstall` re-reads and re-parses `<config.gameFolder>/weiDU.log` using the class's existing `parseWeiduLog()` method, and confirms every component number requested for the current group now appears among the installed components for that tp2/language. A missing component throws an `Error`, which propagates out of `install()`'s loop (stopping the batch) to the existing top-level `main().catch()` handler in `src/index.ts`, which prints it in red and exits with code 1.

**Tech Stack:** TypeScript, Node.js `fs`/`path`, `chalk` — all already used in `mod.service.ts`. No new dependencies.

## Global Constraints

- No new npm dependencies.
- No new test framework — this repo has none configured (verified: no test runner in `package.json`, no `*.test.ts` files). Verification for this change is manual, per the design spec.
- Reuse the existing `parseWeiduLog()` method and `WeiduLineGroup` type as-is. Do not introduce a second, separate log-parsing format (e.g. a WeiDU debug file) — `weiDU.log` alone is the source of truth for this check.
- Only `install()` is in scope. `uninstall()` is explicitly out of scope.
- Already-installed groups (skipped via the existing `installedGroup` check) are not checked — they never call `execWeidu` in a given run.

Full background and format evidence: `docs/superpowers/specs/2026-08-04-weidu-debug-verification-design.md`.

---

## File Structure

- Modify: `src/mod.service.ts` — add `verifyInstall()` method; call it from the existing `install()` loop.

No new files. This is a single, small change to one existing class.

---

### Task 1: Add install verification and wire it into `install()`

**Files:**
- Modify: `src/mod.service.ts:286-328` (the `install()` method)
- Modify: `src/mod.service.ts` (add one new method; place it directly after `execWeidu`, i.e. after line 485 and before the `run()` method at line 487)

**Interfaces:**
- Consumes: existing `WeiduLineGroup` type (`{ tp2File: string; language: string; components: string[] }`) from `src/models/interface.ts`; existing `Config` type; the existing `parseWeiduLog(file: string): WeiduLineGroup[]` method already on this class (src/mod.service.ts:423-443); existing `fs`, `path`, `chalk` imports already present in `mod.service.ts`.
- Produces:
  - `verifyInstall(config: Config, group: WeiduLineGroup): void` (throws `Error` on missing component, otherwise logs success and returns)

- [ ] **Step 1: Add the `verifyInstall` method**

  In `src/mod.service.ts`, insert the following method immediately after the closing brace of `execWeidu` (after line 485, before `async run(command: string, cwd: string) {` on line 487):

  ```typescript
  verifyInstall(config: Config, group: WeiduLineGroup): void {
    const installedGroups = this.parseWeiduLog(
      path.join(config.gameFolder, "weiDU.log"),
    );
    const installedComponents = installedGroups
      .filter(
        (g) => g.tp2File === group.tp2File && g.language === group.language,
      )
      .flatMap((g) => g.components);
    const missing = group.components.filter(
      (c) => !installedComponents.includes(c),
    );
    if (missing.length) {
      throw new Error(
        `Installation of ${group.tp2File} did not complete: component(s) ${missing.join(", ")} not found in weiDU.log. Halting.`,
      );
    }
    console.log(
      chalk.green(
        `${group.tp2File}: all ${group.components.length} component(s) confirmed installed`,
      ),
    );
  }
  ```

- [ ] **Step 2: Call it after `execWeidu` in `install()`**

  In the `install()` loop (currently lines 315-326), immediately after the existing `execWeidu` call:

  ```typescript
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
  ```

  add a call to the new method right after it, so the block becomes:

  ```typescript
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
  ```

- [ ] **Step 3: Build to check types**

  Run: `npm run build`
  Expected: completes with no TypeScript errors.

- [ ] **Step 4: Write a throwaway verification script (not committed) to sanity-check the logic**

  Create a temporary `.ts` file anywhere outside the repo's tracked working tree (e.g. an OS temp directory) — it must never be `git add`ed or show up in `git status`. Use it to call `verifyInstall` against fixture `weiDU.log` content, covering two cases:

  ```typescript
  import { ModService } from "<absolute-path-to-your-worktree>/src/mod.service";
  import * as fs from "fs";
  import * as os from "os";
  import * as path from "path";

  const service = new ModService("unused-config-path.json") as any;

  // Real line format captured from an actual weiDU.log:
  const passContent = `~EEEX/EEEX.TP2~ #0 #6 // Enable time step module: v1.0.0
  ~BG1UB/BG1UB.TP2~ #0 #0 // Ice Island Level Two Restoration
  ~BG1UB/BG1UB.TP2~ #0 #11 // Scar and the Sashenstar's Daughter
  ~BG1UB/BG1UB.TP2~ #0 #12 // Quoningar, the Cleric
  `;

  const group = {
    tp2File: "BG1UB/BG1UB.TP2",
    language: "0",
    components: ["0", "11", "12"],
  };

  const gameFolder = fs.mkdtempSync(path.join(os.tmpdir(), "weidu-verify-"));
  const config = { gameFolder } as any;

  // --- Pass case: all requested components present ---
  fs.writeFileSync(path.join(gameFolder, "weiDU.log"), passContent);
  try {
    service.verifyInstall(config, group);
    console.log("PASS CASE OK: no throw, as expected");
  } catch (e) {
    console.error("PASS CASE FAILED (should not have thrown):", e);
    process.exitCode = 1;
  }

  // --- Halt case: component "12" missing ---
  const missingContent = passContent.replace(
    `~BG1UB/BG1UB.TP2~ #0 #12 // Quoningar, the Cleric\n`,
    "",
  );
  fs.writeFileSync(path.join(gameFolder, "weiDU.log"), missingContent);
  try {
    service.verifyInstall(config, group);
    console.error("HALT CASE FAILED: expected a throw but none occurred");
    process.exitCode = 1;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("component(s) 12") && msg.includes("Halting")) {
      console.log("HALT CASE OK: threw as expected:", msg);
    } else {
      console.error("HALT CASE FAILED: threw, but message was unexpected:", msg);
      process.exitCode = 1;
    }
  }
  ```

- [ ] **Step 5: Run the verification script**

  Run: `npx ts-node <path-to-your-throwaway-script>.ts`

  Expected output:
  ```
  PASS CASE OK: no throw, as expected
  HALT CASE OK: threw as expected: Installation of BG1UB/BG1UB.TP2 did not complete: component(s) 12 not found in weiDU.log. Halting.
  ```

  If either case fails, fix `verifyInstall` and re-run before proceeding.

- [ ] **Step 6: Delete the throwaway script**

  Confirm with `git status` that it was never tracked (it should not appear at all, since it was created outside the repo's working tree).

- [ ] **Step 7: Commit**

  ```bash
  git add src/mod.service.ts
  git commit -m "$(cat <<'EOF'
  feat: halt install if weiDU.log doesn't confirm every component

  After each mod install, re-read weiDU.log and verify every requested
  component was actually installed; halt the batch immediately if any is
  missing rather than silently continuing past a failed install.
  EOF
  )"
  ```

---

## Manual End-to-End Verification (post-implementation)

Not a task step (requires a real game install), but should be done before considering this fully done:

1. Run a real install (`npm run start -- -g bg1 -i <weidu.log path>` or however this project is normally invoked) for at least one mod with multiple components, and confirm the green `... all N component(s) confirmed installed` line appears for it and the run proceeds to the next mod.
2. To exercise the halt path without corrupting a real install: temporarily add a component number to one group's `components` array that WeiDU won't have installed (or interrupt/deny one prompt via WeiDU itself if reproducible), confirm the process prints the red halt message and exits with a non-zero code, and confirm no subsequent mods in the batch were attempted.
