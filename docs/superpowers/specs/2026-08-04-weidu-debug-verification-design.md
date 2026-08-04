# WeiDU Debug Log Verification Design

## Problem

`ModService.install()` (src/mod.service.ts) installs mods by spawning `weidu` per WeiDU-log group (a tp2 file + language + list of component numbers) via `execWeidu()`. The child process's stdout is streamed to the console, but nothing inspects the outcome afterward beyond the process exit. WeiDU can silently skip or fail a component (e.g. due to a conflict or missing dependency) without necessarily causing a non-zero exit code, so a failed component can go unnoticed and the loop continues installing subsequent mods on top of an incomplete state.

## Goal

After each mod install, verify — using WeiDU's own debug log — that every component requested for that mod was actually installed. If any requested component is missing, halt the entire install run immediately (no further mods are attempted).

## How WeiDU's debug file works (verified against real files)

- WeiDU writes a per-mod debug file named `SETUP-<TP2BASENAME>.DEBUG` (uppercase, tp2 extension stripped) into the current working directory, which for this tool is always `config.gameFolder`. Example: tp2 `BG1UB/BG1UB.TP2` → `SETUP-BG1UB.DEBUG`. Confirmed against actual files: `SETUP-BG1UB.DEBUG`, `SETUP-BGEECLASSICMOVIES.DEBUG`, `SETUP-DLCMERGER.DEBUG`.
- The file is **appended to** across separate WeiDU invocations, not overwritten. A file from a prior session can already exist and contain unrelated history.
- Near the end of each invocation's output, WeiDU writes a block (following a `Saving This Log:` marker) listing every currently-installed component for the game in the same syntax as `weidu.log`, but without tildes/`#` and with the literal word `Installed`:
  ```
  BG1UB/BG1UB.TP2  0  0 Installed ~Ice Island Level Two Restoration~
  BG1UB/BG1UB.TP2  0 11 Installed ~Scar and the Sashenstar's Daughter~
  DLCMERGER/DLCMERGER.TP2  0  1 Installed
  ```
  (Component name in `~tildes~` is present for named components, absent otherwise. Whitespace between fields is column-padded, i.e. variable — must match with `\s+`, not fixed spacing.)
- This block includes *all* currently-installed components for the whole game (not just the mod being installed in this run), since WeiDU is dumping the equivalent of the full `weidu.log`. Confirming presence of the specific `tp2/language/component` lines requested in the current group is sufficient — extra unrelated lines in the block are irrelevant.
- No explicit "not installed" / "failed" line format was found in sampled files (no failure examples were available to inspect). The verification approach therefore does not depend on recognizing a failure marker: **absence of an `Installed` line for a requested component is treated as failure.** This also removes any need to scan for `ERROR`/`WARNING` text.

## Design

### 1. Debug file path resolution

New helper on `ModService`:

```ts
getDebugLogPath(config: Config, group: WeiduLineGroup): string {
  const tp2Base = group.tp2File.split("/").pop()!.replace(/\.TP2$/i, "");
  return path.join(config.gameFolder, `SETUP-${tp2Base}.DEBUG`);
}
```

`group.tp2File` is already uppercase (see `parseWeiduLog`), matching the debug file's naming convention.

### 2. Scoping the check to the current run

Because the debug file accumulates history, the check must only look at content written by *this* invocation:

- Before calling `execWeidu` for a group, record the debug file's current size in bytes (`0` if it doesn't exist yet).
- After `execWeidu` resolves, read the file and take only the bytes past that recorded offset.

### 3. Verification

New helper on `ModService`:

```ts
verifyDebugLog(debugLogFile: string, startSize: number, group: WeiduLineGroup): void {
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

### 4. Wiring into `install()`

In the loop body, immediately around the existing `execWeidu` call:

```ts
const debugLogFile = this.getDebugLogPath(config, group);
const startSize = fs.existsSync(debugLogFile) ? fs.statSync(debugLogFile).size : 0;
await this.execWeidu([...existing args...], config.gameFolder);
this.verifyDebugLog(debugLogFile, startSize, group);
```

No `try/catch` is added around this — the thrown `Error` propagates out of `install()`'s `for` loop (stopping any remaining mods in the batch) and up to the existing top-level handler in `src/index.ts`:

```ts
main().catch((error) => {
  console.error(chalk.red(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
```

This matches the existing halting pattern already used in `ModService.run()` for `FATAL ERROR` / `Aborting installation of` detection in WeiDU's stdout.

### Scope

- Applies only to `install()`. `uninstall()` is out of scope (not requested).
- Already-installed groups (skipped via the `installedGroup` check) are not checked — they don't invoke `execWeidu` in this run.
- No new config options; behavior is unconditional once installed.

## Testing

This project has no test framework configured (no test runner in `package.json`, no existing `*.test.ts` files). Adding one is out of scope for this change. Verification will be manual:

- Build (`npm run build`) and confirm no TypeScript errors.
- Exercise the pass path against a real game folder: run an install for a mod, confirm the green confirmation line appears and the loop continues.
- Exercise the halt path by hand-editing a copy of a real `SETUP-<MOD>.DEBUG` fixture (or temporarily requesting a component number that won't be present) to simulate a missing `Installed` line, confirming the process halts with the expected red error message and stops before installing any subsequent mod in the batch.
