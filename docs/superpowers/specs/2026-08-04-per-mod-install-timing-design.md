# Per-Mod Install Timing Design

## Problem

Mod installs can take a very long time (some mods, e.g. Stratagems, can run for hours), but `ModService.install()` (src/mod.service.ts) gives no indication of how long each mod actually took. There's no way to look back at a run and see which mods were the slow ones.

## Goal

Print how long each mod took to install, right after it finishes, so the console output from an install run doubles as a timeline (e.g. `STRATAGEMS installed in 8214s`).

## Design

In the `install()` loop (src/mod.service.ts, around the `execWeidu` call), record a start timestamp immediately before `execWeidu` and compute the elapsed time immediately after it returns:

```ts
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
this.verifyInstall(config, group);
console.log(
  chalk.cyan(`${this.getModFolder(group.tp2File)} installed in ${elapsedSeconds}s`),
);
```

- Timing wraps only the `execWeidu` call — the actual WeiDU process — not `verifyInstall()`, which just re-reads `weiDU.log` and is effectively instant.
- Printed as its own line immediately after the existing green "all N component(s) confirmed installed" line from `verifyInstall()`.
- Uses `getModFolder()` (already used for the "Install X ?" prompt) so the mod name printed here matches the name shown elsewhere in the same run.
- Elapsed time is whole seconds (`Math.round`), matching the "Stratagems took 8000s" phrasing that motivated this.

### Scope / non-goals

- Console output only — nothing persisted to a file.
- No running/batch total across the whole install — per-mod only.
- Groups that are skipped (already installed, per the existing `installedGroup` check) or declined at the "Install X ?" prompt print nothing, since no install actually happened — consistent with existing behavior for those cases.
- `uninstall()` and other commands are out of scope; only `install()` is touched.

## Testing

This project has no test framework configured (consistent with the existing WeiDU verification design). Verification will be manual: run an install for at least one mod and confirm the new `installed in Ns` line appears with a plausible value, in the correct color, immediately after the existing confirmation line.
