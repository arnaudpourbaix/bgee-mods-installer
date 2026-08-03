# Per-game config selection design

## Problem

The installer currently reads a single hardcoded config file (`assets/config.json`). The tool is used for two different games (BG1EE and BG2EE) that need different `gameFolder`, `modsFolders`, and mod lists. Today, switching games means manually editing `assets/config.json` in place, which risks accidentally running a destructive action (`--copy`, `--install`, `--uninstall`, `--clear`) against the wrong game's folder — there is no config to lose, but the wrong game's install (backups, mod state) is at risk.

## Goals

- Maintain one config file per game: `assets/config_bg1.json` and `assets/config_bg2.json`.
- Select the target game explicitly via a command-line flag.
- Before any destructive action runs, print the selected game and config file, and require a keypress to continue, so a wrong `--game` value is easy to catch before damage is done.

## Non-goals

- No changes to mod-parsing, WeiDU invocation, or the shape of the config JSON itself.
- No env var or config-based default game — the flag must be passed explicitly every time an action is requested.
- `getMods()` / `Constants.modsFile` (unused, references a file that doesn't exist) is left untouched — out of scope.

## CLI flag

Add to [src/index.ts](../../../src/index.ts):

```
-g, --game <bg1|bg2>   Select which game to target (bg1 or bg2)
```

This is **not** declared as a commander-mandatory option, because running `generate` with no flags at all must still fall through to `program.outputHelp()` (existing behavior, exercised when no action option is set).

Instead, validation happens in `main()`:
- If any action option is present (`list`, `copy`, `work`, `install`, `uninstall`, `print`, `clear`) and `--game` is missing or not one of `bg1`/`bg2`, print an error via `chalk.red` and `process.exit(1)`.
- If no action option is present, behave exactly as today (`program.outputHelp()`), regardless of `--game`.

## Config file resolution

`src/models/constants.ts` adds:

```ts
export type Game = 'bg1' | 'bg2';

export const Constants = {
    ...
    getConfigFile: (game: Game) => `assets/config_${game}.json`,
    ...
};
```

The existing `configFile: 'assets/config.json'` constant is removed — nothing outside `ModService` reads it after this change.

## ModService wiring

`ModService` currently reads `Constants.configFile` directly in three places (`getConfig`, the read-error message, `updateConfig`). It changes to take the resolved path once, at construction:

```ts
export class ModService {
    constructor(private readonly configFile: string) {}

    getConfig() {
        ... fs.readFileSync(this.configFile, ...) ...
    }

    updateConfig(config: Config) {
        fs.writeFileSync(this.configFile, ...);
    }
}
```

`index.ts` resolves the path once and passes it in:

```ts
const configFile = Constants.getConfigFile(game);
const modService = new ModService(configFile);
```

No other method signatures change; every existing call site already goes through `getConfig()`/`updateConfig()` on the instance.

## Banner and pause behavior

After the existing figlet banner and before dispatching to `ModService`, `main()` prints the selected game, unconditionally (for any recognized action):

```
Selected game: Baldur's Gate: Enhanced Edition (BG1)
Config file: assets/config_bg1.json
```

(`bg2` prints "Baldur's Gate II: Enhanced Edition (BG2)" / `assets/config_bg2.json`.)

For destructive actions only — `--copy`, `--install`, `--uninstall`, `--clear` — this is followed by:

```
Press any key to continue... (Ctrl+C to abort)
```

Execution blocks until a keypress, implemented with raw stdin mode (`process.stdin.setRawMode(true)`, resolve on the first `data` event, restore normal mode after). A `Ctrl+C` byte (`0x03`) received while paused calls `process.exit(130)` instead of resolving, so the user can still abort.

Read-only actions (`--list`, `--work`, `--print`) print the banner but skip the pause and run immediately — unchanged turnaround for safe, non-mutating commands.

## File migration

- `git mv assets/config.json assets/config_bg2.json` (current config already targets the BG2EE folder; renaming preserves that config as-is).
- Create `assets/config_bg1.json` as a copy of the schema shape, with `mods: []` and `externalMods: []` reset, and `gameFolder`/`modsFolders`/`weiduLocation` left as placeholder values for the user to fill in for BG1EE. `language` carries over unchanged.

## Testing

This is a CLI tool with no existing test suite. Verification is manual:
- `generate` (no args) → shows help, no game-selection error.
- `generate --list` (no `--game`) → error message, exit code 1.
- `generate --game bg3 --list` (invalid value) → same error.
- `generate --game bg1 --list` → banner shown, proceeds immediately (no pause), reads/writes `assets/config_bg1.json`.
- `generate --game bg2 --uninstall` → banner shown, pauses for keypress, then proceeds; Ctrl+C during the pause exits without running the uninstall.
