# WeiDU Debug Log Install Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After each mod is installed via `ModService.install()`, verify against WeiDU's own `SETUP-<TP2>.DEBUG` file that every requested component was actually installed, and halt the entire install run immediately if any component is missing.

**Architecture:** Two new methods on `ModService` (`getDebugLogPath`, `verifyDebugLog`) are wired into the existing `install()` loop around the existing `execWeidu()` call. `getDebugLogPath` derives the debug file's path from the group's tp2 file. Before `execWeidu` runs, the debug file's current byte size is recorded; after it completes, `verifyDebugLog` reads only the bytes appended since then and confirms every requested component number appears as an `Installed` line for that tp2/language. A missing component throws an `Error`, which propagates out of `install()`'s loop (stopping the batch) to the existing top-level `main().catch()` handler in `src/index.ts`, which prints it in red and exits with code 1.

**Tech Stack:** TypeScript, Node.js `fs`/`path`, `chalk` — all already used in `mod.service.ts`. No new dependencies.

## Global Constraints

- No new npm dependencies.
- No new test framework — this repo has none configured (verified: no test runner in `package.json`, no `*.test.ts` files). Verification for this change is manual, per the design spec.
- Debug file naming/format is exactly as verified against real files: `SETUP-<TP2BASENAME_UPPERCASE_NO_EXT>.DEBUG` in `config.gameFolder`, with lines `^<TP2FILE>\s+<LANG>\s+<COMPONENT>\s+Installed\b` (column-padded, so match with `\s+` not fixed-width spacing).
- Only `install()` is in scope. `uninstall()` is explicitly out of scope.
- Already-installed groups (skipped via the existing `installedGroup` check) are not checked — they never call `execWeidu` in a given run.

Full background and format evidence: `docs/superpowers/specs/2026-08-04-weidu-debug-verification-design.md`.

---

## File Structure

- Modify: `src/mod.service.ts` — add `getDebugLogPath()` and `verifyDebugLog()` methods; wire them into the existing `install()` loop.

No new files. This is a single, cohesive, small change to one existing class.

---

### Task 1: Add debug-log verification and wire it into `install()`

**Files:**
- Modify: `src/mod.service.ts:286-328` (the `install()` method)
- Modify: `src/mod.service.ts` (add two new methods; place them directly after `execWeidu`, i.e. after line 485 and before the `run()` method at line 487)

**Interfaces:**
- Consumes: existing `WeiduLineGroup` type (`{ tp2File: string; language: string; components: string[] }`) from `src/models/interface.ts`; existing `Config` type; existing `fs`, `path`, `chalk` imports already present in `mod.service.ts`.
- Produces:
  - `getDebugLogPath(config: Config, group: WeiduLineGroup): string`
  - `verifyDebugLog(debugLogFile: string, startSize: number, group: WeiduLineGroup): void` (throws `Error` on missing component, otherwise logs success and returns)

- [ ] **Step 1: Add `getDebugLogPath` and `verifyDebugLog` methods**

  In `src/mod.service.ts`, insert the following two methods immediately after the closing brace of `execWeidu` (after line 485, before `async run(command: string, cwd: string) {` on line 487):

  ```typescript
  getDebugLogPath(config: Config, group: WeiduLineGroup): string {
    const tp2Base = group.tp2File.split("/").pop()!.replace(/\.TP2$/i, "");
    return path.join(config.gameFolder, `SETUP-${tp2Base}.DEBUG`);
  }

  verifyDebugLog(
    debugLogFile: string,
    startSize: number,
    group: WeiduLineGroup,
  ): void {
    if (!fs.existsSync(debugLogFile)) {
      throw new Error(
        `Debug log ${debugLogFile} not found after installing ${group.tp2File}`,
      );
    }
    const buffer = fs.readFileSync(debugLogFile);
    const newContent = buffer.subarray(startSize).toString("utf8");
    const escapedTp2 = group.tp2File.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const missing = group.components.filter((c) => {
      const rx = new RegExp(
        `^${escapedTp2}\\s+${group.language}\\s+${c}\\s+Installed\\b`,
        "m",
      );
      return !rx.test(newContent);
    });
    if (missing.length) {
      throw new Error(
        `Installation of ${group.tp2File} did not complete: component(s) ${missing.join(", ")} not confirmed as Installed in ${debugLogFile}. Halting.`,
      );
    }
    console.log(
      chalk.green(
        `${group.tp2File}: all ${group.components.length} component(s) confirmed installed`,
      ),
    );
  }
  ```

- [ ] **Step 2: Wire the check into `install()`**

  Replace the `execWeidu` call inside the `install()` loop (currently lines 315-326):

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

  with:

  ```typescript
      const debugLogFile = this.getDebugLogPath(config, group);
      const startSize = fs.existsSync(debugLogFile)
        ? fs.statSync(debugLogFile).size
        : 0;
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
      this.verifyDebugLog(debugLogFile, startSize, group);
  ```

- [ ] **Step 3: Build to check types**

  Run: `npm run build`
  Expected: completes with no TypeScript errors.

- [ ] **Step 4: Write a throwaway verification script (not committed) to sanity-check the regex logic against real captured debug-file content**

  Create `C:\Users\pourb\AppData\Local\Temp\claude\c--Games-projects-bgee-mods-installer\7bd3a442-57d6-43c3-8015-48c7820ea71c\scratchpad\verify-debuglog.ts`:

  ```typescript
  import { ModService } from "c:/Games/projects/bgee-mods-installer/src/mod.service";

  const service = new ModService("unused-config-path.json") as any;

  // Real line format captured from an actual SETUP-BG1UB.DEBUG on 2026-08-04:
  const passContent = `
  Saving This Log:
  BG1UB/BG1UB.TP2  0  0 Installed ~Ice Island Level Two Restoration~
  BG1UB/BG1UB.TP2  0 11 Installed ~Scar and the Sashenstar's Daughter~
  BG1UB/BG1UB.TP2  0 12 Installed ~Quoningar, the Cleric~
  `;

  const group = {
    tp2File: "BG1UB/BG1UB.TP2",
    language: "0",
    components: ["0", "11", "12"],
  };

  // --- Pass case: all requested components present ---
  try {
    // Simulate verifyDebugLog's internal logic directly against passContent
    // by calling the real method with a fixture file.
    const fs = require("fs");
    const os = require("os");
    const path = require("path");
    const tmpFile = path.join(os.tmpdir(), "SETUP-BG1UB.DEBUG");
    fs.writeFileSync(tmpFile, passContent);
    service.verifyDebugLog(tmpFile, 0, group);
    console.log("PASS CASE OK: no throw, as expected");
  } catch (e) {
    console.error("PASS CASE FAILED (should not have thrown):", e);
    process.exitCode = 1;
  }

  // --- Halt case: component "12" missing ---
  try {
    const fs = require("fs");
    const os = require("os");
    const path = require("path");
    const tmpFile = path.join(os.tmpdir(), "SETUP-BG1UB-MISSING.DEBUG");
    const missingContent = passContent.replace(
      `BG1UB/BG1UB.TP2  0 12 Installed ~Quoningar, the Cleric~\n`,
      "",
    );
    fs.writeFileSync(tmpFile, missingContent);
    service.verifyDebugLog(tmpFile, 0, group);
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

  Run: `npx ts-node "C:\Users\pourb\AppData\Local\Temp\claude\c--Games-projects-bgee-mods-installer\7bd3a442-57d6-43c3-8015-48c7820ea71c\scratchpad\verify-debuglog.ts"`

  Expected output:
  ```
  PASS CASE OK: no throw, as expected
  HALT CASE OK: threw as expected: Installation of BG1UB/BG1UB.TP2 did not complete: component(s) 12 not confirmed as Installed in ...SETUP-BG1UB-MISSING.DEBUG. Halting.
  ```

  If either case fails, fix `verifyDebugLog` and re-run before proceeding.

- [ ] **Step 6: Delete the throwaway script**

  It lives in the scratchpad directory only and must not be committed:

  Run: `rm "C:\Users\pourb\AppData\Local\Temp\claude\c--Games-projects-bgee-mods-installer\7bd3a442-57d6-43c3-8015-48c7820ea71c\scratchpad\verify-debuglog.ts"`

- [ ] **Step 7: Commit**

  ```bash
  git add src/mod.service.ts
  git commit -m "$(cat <<'EOF'
  feat: halt install if WeiDU debug log doesn't confirm every component

  After each mod install, verify against SETUP-<TP2>.DEBUG that every
  requested component was actually installed; halt the batch immediately
  if any is missing rather than silently continuing past a failed install.
  EOF
  )"
  ```

---

## Manual End-to-End Verification (post-implementation)

Not a task step (requires a real game install), but should be done before considering this fully done:

1. Run a real install (`npm run start -- -g bg1 -i <weidu.log path>` or however this project is normally invoked) for at least one mod with multiple components, and confirm the green `... all N component(s) confirmed installed` line appears for it and the run proceeds to the next mod.
2. To exercise the halt path without corrupting a real install: temporarily add a component number to one group's `components` array that WeiDU won't have installed (or interrupt/deny one prompt via WeiDU itself if reproducible), confirm the process prints the red halt message and exits with a non-zero code, and confirm no subsequent mods in the batch were attempted.
