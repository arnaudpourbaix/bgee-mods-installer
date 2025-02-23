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
  .option("-r, --read", "Read WeiDU.log and update components to install",)
  .option("-w, --work", "List mods that are not installed yet",)
  .parse(process.argv);

const options = program.opts();

async function main() {
  const modService = new ModService();
  if (options.list) modService.checkExternalMods();
  else if (options.copy) modService.copyMods();
  else if (options.read) modService.readWeiduLog();
  else if (options.work) modService.listNotInstalledMods();
  else program.outputHelp();
}

main();
