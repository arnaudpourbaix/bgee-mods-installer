import { program } from "commander";
import { ModService } from "./mod.service";

const clear = require("clear");
const figlet = require("figlet");

clear();
console.log(
  figlet.textSync("BGEE Mods Installer", { horizontalLayout: "full" })
);

program
  .version("0.0.1")
  .description("Automated mods installation")
  .option("-l, --list", "List external mods and put them in config",)
  .option("-c, --copy", "Copy external mods to game folder",)
  .parse(process.argv);

const options = program.opts();

async function main() {
  const modService = new ModService();
  if (options.list) modService.checkExternalMods();
  else if (options.copy) modService.copyMods();
  else program.outputHelp();
}

main();
