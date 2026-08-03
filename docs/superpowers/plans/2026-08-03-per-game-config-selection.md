# Per-Game Config Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the single `assets/config.json` into per-game `assets/config_bg1.json` / `assets/config_bg2.json`, select the target game via a `-g, --game <bg1|bg2>` CLI flag, and require an explicit "press any key" confirmation (showing the selected game and config path) before any destructive action runs.

**Architecture:** `Constants.getConfigFile(game)` resolves the game to a config path. `ModService`'s constructor takes that path instead of reading a hardcoded constant. `index.ts` validates `--game`, prints a banner, pauses on destructive actions, then constructs `ModService` with the resolved path.

**Tech Stack:** TypeScript, Node.js, `commander` (CLI parsing), `chalk` (colored output), `ts-node` (manual run/verification — no test framework is present in this repo).

## Global Constraints

- No test framework exists in this repo (`package.json` has no jest/mocha/etc.) — verification for every task is a manual CLI run, not an automated test. Do not add a test framework as part of this work.
- Every action option (`--list`, `--copy`, `--work`, `--install`, `--uninstall`, `--print`, `--clear`) must keep working exactly as before except for the new `--game` requirement and the destructive-action pause.
- `generate` with no options at all must still print help (`program.outputHelp()`), with no `--game`-related error.
- Leave `Constants.modsFile` / `ModService.getMods()` untouched — unused dead code, out of scope.

---

### Task 1: Split config.json into per-game files

**Files:**
- Rename: `assets/config.json` → `assets/config_bg2.json` (via `git mv`, preserves current BG2EE settings)
- Create: `assets/config_bg1.json`

**Interfaces:**
- Produces: two JSON files matching the existing `Config` shape from [src/models/interface.ts](../../../src/models/interface.ts), consumed by later tasks via `Constants.getConfigFile()`.

- [ ] **Step 1: Rename the existing config to the BG2 file**

```bash
git mv assets/config.json assets/config_bg2.json
```

- [ ] **Step 2: Verify the rename kept content intact**

Run: `cat assets/config_bg2.json`
Expected: the same content that was previously in `assets/config.json` (gameFolder pointing at the BG2EE folder, existing `mods`/`externalMods` arrays intact).

- [ ] **Step 3: Create the BG1 config file**

Create `assets/config_bg1.json`:

```json
{
  "gameFolder": "<path to Baldur's Gate: Enhanced Edition folder>",
  "modsFolders": [
    "Z:/games/bg/mods/bg1",
    "Z:/games/bg/mods/both"
  ],
  "language": "English",
  "weiduLocation": "<path to weidu.exe for BG1EE>",
  "mods": [],
  "externalMods": []
}
```

- [ ] **Step 4: Verify both files are valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('assets/config_bg1.json','utf8')); JSON.parse(require('fs').readFileSync('assets/config_bg2.json','utf8')); console.log('both valid')"`
Expected: prints `both valid` with no error.

- [ ] **Step 5: Commit**

```bash
git add assets/config_bg1.json assets/config_bg2.json
git commit -m "feat: split config.json into per-game config_bg1/config_bg2 files"
```

---

### Task 2: Inject the config path into ModService

**Files:**
- Modify: [src/models/constants.ts](../../../src/models/constants.ts)
- Modify: [src/mod.service.ts](../../../src/mod.service.ts) (lines 12-23, 179-181)
- Modify: [src/index.ts](../../../src/index.ts) (line 2, 28)

**Interfaces:**
- Produces: `Constants.getConfigFile(game: Game): string`, `Game` type (`'bg1' | 'bg2'`), `new ModService(configFile: string)`.
- Consumes: nothing new from earlier tasks.

This task hardcodes `'bg2'` at the `index.ts` call site as an intermediate step — Task 3 replaces that hardcode with the real CLI flag. This keeps the build green and behavior unchanged (still targets the same config as before Task 1) while proving the constructor-injection wiring works end to end.

- [ ] **Step 1: Add `Game` type and `getConfigFile` to constants, remove the old `configFile` constant**

In [src/models/constants.ts](../../../src/models/constants.ts), replace the whole file with:

```ts
export type Game = 'bg1' | 'bg2';

export const Constants = {
    getConfigFile: (game: Game) => `assets/config_${game}.json`,
    modsFile: 'assets/mods.json',
    externalMods: 'assets/external-mods.json',
    defaultLanguage: 'English',
    gameFolderIgoreList: ['data', 'dlc', 'lang', 'Manuals', 'movies', 'music', 'override', 'scripts', 'BGEEClassicMovies', 'DlcMerger']
};

export const CR = '\r\n';
```

- [ ] **Step 2: Make `ModService` take the config path via constructor**

In [src/mod.service.ts](../../../src/mod.service.ts), replace lines 12-23:

```ts
export class ModService {

    getConfig() {
        try {
            const file = fs.readFileSync(Constants.configFile, { encoding: "utf8", flag: "r" });
            const config: Config = JSON.parse(file);
            return config;
        } catch (error: unknown) {
            console.error(chalk.red(`${Constants.configFile} is not a valid json file!`));
            throw error;
        }
    }
```

with:

```ts
export class ModService {

    constructor(private readonly configFile: string) {}

    getConfig() {
        try {
            const file = fs.readFileSync(this.configFile, { encoding: "utf8", flag: "r" });
            const config: Config = JSON.parse(file);
            return config;
        } catch (error: unknown) {
            console.error(chalk.red(`${this.configFile} is not a valid json file!`));
            throw error;
        }
    }
```

Then replace line 180 (`fs.writeFileSync(Constants.configFile, JSON.stringify(config, null, 2));`) with:

```ts
        fs.writeFileSync(this.configFile, JSON.stringify(config, null, 2));
```

- [ ] **Step 3: Wire index.ts to construct ModService with the resolved path**

In [src/index.ts](../../../src/index.ts), change the import on line 2:

```ts
import { ModService } from "./mod.service";
```

to:

```ts
import { ModService } from "./mod.service";
import { Constants } from "./models/constants";
```

Then change line 28 (`const modService = new ModService();`) to:

```ts
  const modService = new ModService(Constants.getConfigFile('bg2'));
```

- [ ] **Step 4: Build and verify no leftover references to the removed constant**

Run: `npm run build`
Expected: compiles with no errors (confirms no remaining `Constants.configFile` references anywhere).

- [ ] **Step 5: Manually verify the wiring reads the renamed file**

Run: `npx ts-node src/index.ts --list`
Expected: runs the existing external-mods scan against `assets/config_bg2.json` exactly as it did against `assets/config.json` before Task 1 (no "not a valid json file" error, no path errors beyond any that already existed before this change).

- [ ] **Step 6: Commit**

```bash
git add src/models/constants.ts src/mod.service.ts src/index.ts
git commit -m "feat: inject config file path into ModService instead of a hardcoded constant"
```

---

### Task 3: Add the `--game` CLI flag with validation and banner

**Files:**
- Modify: [src/index.ts](../../../src/index.ts)

**Interfaces:**
- Consumes: `Constants.getConfigFile(game: Game): string`, `Game` type from Task 2.
- Produces: `main()` now requires `--game bg1|bg2` whenever an action option is set; prints `Selected game: <label>` / `Config file: <path>` banner before running any action.

- [ ] **Step 1: Add the option declaration**

In [src/index.ts](../../../src/index.ts), add to the `program` option chain (after `.description(...)`, before `-l, --list`):

```ts
  .option("-g, --game <bg1|bg2>", "Select which game to target (bg1 or bg2)")
```

- [ ] **Step 2: Add game labels, a type guard, and rewrite `main()`**

Change the import line to also bring in `Game`:

```ts
import { Constants, Game } from "./models/constants";
```

Add, right after `const options = program.opts();`:

```ts
const GAME_LABELS: Record<Game, string> = {
  bg1: "Baldur's Gate: Enhanced Edition (BG1)",
  bg2: "Baldur's Gate II: Enhanced Edition (BG2)"
};

function isGame(value: unknown): value is Game {
  return value === 'bg1' || value === 'bg2';
}
```

Replace the whole `main()` function with:

```ts
async function main() {
  console.log(options);
  const actionRequested = options.list || options.copy || options.work || options.install || options.uninstall || options.print || options.clear;
  if (!actionRequested) {
    program.outputHelp();
    return;
  }

  if (!isGame(options.game)) {
    console.error(chalk.red(`Please specify which game to target with -g, --game <bg1|bg2>`));
    process.exit(1);
  }

  const game = options.game as Game;
  const configFile = Constants.getConfigFile(game);
  console.log(chalk.bold.yellow(`Selected game: ${GAME_LABELS[game]}`));
  console.log(chalk.gray(`Config file: ${configFile}`));

  const modService = new ModService(configFile);
  if (options.list) modService.checkExternalMods();
  else if (options.copy) modService.copyMods();
  else if (options.work) modService.listNotInstalledMods();
  else if (options.install) modService.install(options.install);
  else if (options.print) modService.printInstallCommands(options.print);
  else if (options.uninstall) modService.uninstall();
  else if (options.clear) modService.deleteBackupFolders();
}
```

`chalk` isn't imported yet in this file — add it near the top, with the other imports:

```ts
import chalk from "chalk";
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compiles with no errors.

- [ ] **Step 4: Manually verify help still works with no flags**

Run: `npx ts-node src/index.ts`
Expected: prints the figlet banner and command help (via `program.outputHelp()`), no `--game` error.

- [ ] **Step 5: Manually verify missing/invalid `--game` is rejected**

Run: `npx ts-node src/index.ts --list`
Expected: prints the red "Please specify which game to target..." message, process exits with code 1.

Run: `npx ts-node src/index.ts --game bg3 --list`
Expected: same error and exit code 1.

- [ ] **Step 6: Manually verify a valid `--game` proceeds**

Run: `npx ts-node src/index.ts --game bg1 --list`
Expected: prints `Selected game: Baldur's Gate: Enhanced Edition (BG1)` and `Config file: assets/config_bg1.json`, then runs the external-mods scan against that file.

Run: `npx ts-node src/index.ts --game bg2 --list`
Expected: same, but for BG2 label and `assets/config_bg2.json`.

- [ ] **Step 7: Commit**

```bash
git add src/index.ts
git commit -m "feat: require --game bg1|bg2 flag, show selected game before running any action"
```

---

### Task 4: Pause for confirmation before destructive actions

**Files:**
- Modify: [src/index.ts](../../../src/index.ts)

**Interfaces:**
- Consumes: the `destructive` condition (`--copy`, `--install`, `--uninstall`, `--clear`) and the banner from Task 3.
- Produces: `pauseForConfirmation(): Promise<void>` — blocks on a single keypress; `Ctrl+C` exits the process with code 130 instead of resolving.

- [ ] **Step 1: Add `pauseForConfirmation`**

In [src/index.ts](../../../src/index.ts), add this function right before `async function main() {`:

```ts
async function pauseForConfirmation(): Promise<void> {
  console.log(chalk.bold("Press any key to continue... (Ctrl+C to abort)"));
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.once('data', (data: Buffer) => {
      stdin.setRawMode(false);
      stdin.pause();
      if (data[0] === 0x03) process.exit(130);
      resolve();
    });
  });
}
```

- [ ] **Step 2: Call it before constructing `ModService`, only for destructive actions**

In `main()`, replace:

```ts
  const game = options.game as Game;
  const configFile = Constants.getConfigFile(game);
  console.log(chalk.bold.yellow(`Selected game: ${GAME_LABELS[game]}`));
  console.log(chalk.gray(`Config file: ${configFile}`));

  const modService = new ModService(configFile);
```

with:

```ts
  const game = options.game as Game;
  const configFile = Constants.getConfigFile(game);
  const destructive = options.copy || options.install || options.uninstall || options.clear;

  console.log(chalk.bold.yellow(`Selected game: ${GAME_LABELS[game]}`));
  console.log(chalk.gray(`Config file: ${configFile}`));

  if (destructive) await pauseForConfirmation();

  const modService = new ModService(configFile);
```

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: compiles with no errors.

- [ ] **Step 4: Manually verify read-only actions still skip the pause**

Run: `npx ts-node src/index.ts --game bg1 --list`
Expected: banner prints, external-mods scan runs immediately — no "Press any key" prompt, no wait.

- [ ] **Step 5: Manually verify a destructive action pauses and resumes on keypress**

Run: `npx ts-node src/index.ts --game bg1 --clear`
Expected: banner prints, then `Press any key to continue... (Ctrl+C to abort)` appears and the process waits. Press any key (e.g. Enter or Space) — `deleteBackupFolders()` then runs.

- [ ] **Step 6: Manually verify Ctrl+C aborts without running the action**

Run: `npx ts-node src/index.ts --game bg1 --clear` again, and press `Ctrl+C` at the prompt instead.
Expected: process exits immediately (exit code 130), no backup folders are touched.

- [ ] **Step 7: Commit**

```bash
git add src/index.ts
git commit -m "feat: pause for keypress confirmation before destructive actions"
```
