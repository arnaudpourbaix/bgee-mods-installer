import { program } from "commander";
import chalk from "chalk";
import { ModService } from "./mod.service";
import { Constants, Game } from "./models/constants";
import { confirm } from "@inquirer/prompts";

const clear = require("clear");
const figlet = require("figlet");

clear();
console.log(
  figlet.textSync("BGEE Mods Installer", { horizontalLayout: "full" }),
);

program
  .version("0.0.1")
  .description("Automated mods installation")
  .option("-g, --game <bg1|bg2>", "Select which game to target (bg1 or bg2)")
  .option("-l, --list", "List external mods and put them in config")
  .option("-c, --copy", "Copy external mods to game folder")
  .option("-n, --clear", "Delete backup folders")
  .option("-w, --work", "List mods that are not installed yet")
  .option("-i, --install <file>", "Install mod list from an external WeiDU.log")
  .option("-u, --uninstall", "Uninstall every installed mods")
  .option("-p, --print <file>", "Print install commands")
  .parse(process.argv);

const options = program.opts();

const GAME_LABELS: Record<Game, string> = {
  bg1: "Baldur's Gate: Enhanced Edition (BG1)",
  bg2: "Baldur's Gate II: Enhanced Edition (BG2)",
};

function isGame(value: unknown): value is Game {
  return value === "bg1" || value === "bg2";
}

async function pauseForConfirmation(): Promise<void> {
  const confirmation = await confirm({
    message: "Press y to continue",
    default: true,
  });
  if (!confirmation) process.exit(1);
}

async function main() {
  const actionRequested =
    options.list ||
    options.copy ||
    options.work ||
    options.install ||
    options.uninstall ||
    options.print ||
    options.clear;
  if (!actionRequested) {
    program.outputHelp();
    return;
  }

  if (!isGame(options.game)) {
    if (options.game === undefined) {
      console.error(
        chalk.red(
          `Please specify which game to target with -g, --game <bg1|bg2>`,
        ),
      );
    } else {
      console.error(
        chalk.red(`Unknown game "${options.game}" — expected bg1 or bg2`),
      );
    }
    process.exit(1);
  }

  const game = options.game as Game;
  const configFile = Constants.getConfigFile(game);
  const destructive =
    options.copy || options.install || options.uninstall || options.clear;

  const modService = new ModService(configFile);
  const config = modService.getConfig();

  if (config.gameFolder.startsWith("<")) {
    console.error(
      chalk.red(
        `Please edit ${configFile} — gameFolder is still a placeholder value.`,
      ),
    );
    process.exit(1);
  }

  console.log(chalk.bold.yellow(`Selected game: ${GAME_LABELS[game]}`));
  console.log(chalk.gray(`Config file: ${configFile}`));
  console.log(chalk.gray(`Game folder: ${config.gameFolder}`));

  if (destructive) await pauseForConfirmation();

  if (options.list) modService.checkExternalMods();
  else if (options.copy) modService.copyMods();
  else if (options.work) modService.listNotInstalledMods();
  else if (options.install) modService.install(options.install);
  else if (options.print) modService.printInstallCommands(options.print);
  else if (options.uninstall) modService.uninstall();
  else if (options.clear) modService.deleteBackupFolders();
}

main().catch((error) => {
  console.error(
    chalk.red(error instanceof Error ? error.message : String(error)),
  );
  process.exit(1);
});
