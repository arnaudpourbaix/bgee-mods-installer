# WeiDU Install Verification Design

## Problem

`ModService.install()` (src/mod.service.ts) installs mods by spawning `weidu` per WeiDU-log group (a tp2 file + language + list of component numbers) via `execWeidu()`. The child process's stdout is streamed to the console, but nothing inspects the outcome afterward beyond the process exit. WeiDU can silently skip or fail a component (e.g. due to a conflict or missing dependency) without necessarily causing a non-zero exit code, so a failed component can go unnoticed and the loop continues installing subsequent mods on top of an incomplete state.

## Goal

After each mod install, verify — using WeiDU's own `weiDU.log` (the game folder's persistent, incrementally-updated record of installed components) — that every component requested for that mod was actually installed. If any requested component is missing, halt the entire install run immediately (no further mods are attempted).

## How `weiDU.log` works (verified against a real game folder)

- `weiDU.log` lives at `<config.gameFolder>/weiDU.log`. It is WeiDU's canonical, always-current record of installed components, written incrementally as each component completes — this is the same file `ModService` already reads at the top of `install()` to skip already-installed groups, and already has a parser for: `parseWeiduLog()` (src/mod.service.ts:423-443).
- Each line has the format `~TP2FILE~ #language #component // description`, e.g.:
  ```
  ~EEEX/EEEX.TP2~ #0 #6 // Enable time step module: Advance 1 game tick on keypress: v1.0.0
  ~INFINITY_UI/INFINITY_UI.TP2~ #0 #0 // Install Infinity UI++ Core Component: v1.15
  ```
  Confirmed against a live `weiDU.log`.
- `parseWeiduLog()` already turns this into `WeiduLineGroup[]` (`{ tp2File, language, components }`), uppercasing `tp2File`. Consecutive lines sharing the same `tp2File` are merged into one group's `components` array; non-consecutive lines for the same tp2 (e.g. if the same mod's components were installed across two separate, non-adjacent WeiDU runs) produce separate group entries in the array.
- No debug-file naming, appending, or byte-offset scoping is needed at all: re-reading and re-parsing `weiDU.log` after an install always reflects exactly what is currently installed, and reuses code that already exists in this class.

## Design

### Verification

New helper on `ModService`:

```ts
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

`group.tp2File` and `group.language` are already uppercase/string-formatted identically to what `parseWeiduLog()` produces (both come from the same regex-based parsing), so the equality comparison is exact-match, no normalization needed.

The `.filter().flatMap()` (rather than `.find()`) guards against the edge case where the same tp2/language's components were installed across two non-adjacent WeiDU runs, which `parseWeiduLog()` would represent as two separate group entries in the array.

### Wiring into `install()`

Immediately after the existing `execWeidu` call in the loop body:

```ts
await this.execWeidu(
  [...existing args...],
  config.gameFolder,
);
this.verifyInstall(config, group);
```

No `try/catch` is added — the thrown `Error` propagates out of `install()`'s `for` loop (stopping any remaining mods in the batch) and up to the existing top-level handler in `src/index.ts`:

```ts
main().catch((error) => {
  console.error(chalk.red(error instanceof Error ? error.message : String(error)));
  process.exit(1);
});
```

This matches the existing halting pattern already used in `ModService.run()` for `FATAL ERROR` / `Aborting installation of` detection in WeiDU's stdout.

### Scope

- Applies only to `install()`. `uninstall()` is out of scope (not requested).
- Already-installed groups (skipped via the existing `installedGroup` check) are not checked — they don't invoke `execWeidu` in this run.
- No new config options; behavior is unconditional once installed.
- No new file-naming/discovery logic and no new regex parsing — this design deliberately reuses `parseWeiduLog()` as-is rather than introducing a second, debug-file-specific format to maintain.

## Testing

This project has no test framework configured (no test runner in `package.json`, no existing `*.test.ts` files). Adding one is out of scope for this change. Verification will be manual:

- Build (`npm run build`) and confirm no TypeScript errors.
- Exercise the pass path against a real game folder: run an install for a mod, confirm the green confirmation line appears and the loop continues.
- Exercise the halt path by temporarily requesting a component number that WeiDU won't actually install (e.g. append a bogus component number to a group's `components` before running), confirming the process halts with the expected red error message and stops before installing any subsequent mod in the batch.
