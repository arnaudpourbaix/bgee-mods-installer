# Per-Mod Install Timing Design

## Problem

Mod installs can take a very long time (some mods, e.g. Stratagems, can run for hours), but `ModService.install()` (src/mod.service.ts) gives no indication of how long each mod actually took, or how far along a multi-mod batch is. There's no way to look back at a run and see which mods were the slow ones, or how long it took to get from one mod to another.

## Goal

Print how long each mod took to install, right after it finishes, plus the cumulative time since the batch started, so the console output from an install run doubles as a timeline (e.g. `STRATAGEMS installed in 8214s (cumulative: 15320s)`) — letting you answer "how long did it take to get from mod A to mod C" by reading the cumulative numbers.

## Design

Capture a `batchStart` timestamp once, immediately before the `install()` loop starts. In the loop (src/mod.service.ts, around the `execWeidu` call), record a per-mod start timestamp immediately before `execWeidu`, and compute both the per-mod elapsed time and the cumulative elapsed time since `batchStart` immediately after it returns:

```ts
const batchStart = Date.now(); // once, before the for loop

...

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
```

- Timing wraps only the `execWeidu` call — the actual WeiDU process — not `verifyInstall()`, which just re-reads `weiDU.log` and is effectively instant.
- `batchStart` is captured once, right before the loop starts — matching how `alwaysAsk` is already asked once before the loop — so cumulative time only counts mods actually attempted in this run, not any prior run.
- Printed as its own line immediately after the existing green "all N component(s) confirmed installed" line from `verifyInstall()`.
- Uses `getModFolder()` (already used for the "Install X ?" prompt) so the mod name printed here matches the name shown elsewhere in the same run.
- Both durations are whole seconds (`Math.round`), matching the "Stratagems took 8000s" phrasing that motivated this.

### Scope / non-goals

- Console output only — nothing persisted to a file.
- Groups that are skipped (already installed, per the existing `installedGroup` check) or declined at the "Install X ?" prompt print nothing and don't reset either clock — consistent with existing behavior for those cases.
- `uninstall()` and other commands are out of scope; only `install()` is touched.

## Testing

This project has no test framework configured (consistent with the existing WeiDU verification design). Verification will be manual: run an install for at least two mods and confirm the new `installed in Ns (cumulative: Ms)` line appears with plausible values (per-mod time roughly matching wall-clock, cumulative strictly increasing across mods), in the correct color, immediately after the existing confirmation line.
