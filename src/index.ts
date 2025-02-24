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
  .option("-n, --clear", "Delete backup folders",)
  .option("-w, --work", "List mods that are not installed yet",)
  .option("-i, --install <file>", "Install mod list from an external WeiDU.log",)
  .option("-u, --uninstall", "Uninstall every installed mods",)
  .option("-p, --print <file>", "Print install commands",)
  .parse(process.argv);

const options = program.opts();

async function main() {
  const modService = new ModService();
  if (options.list) modService.checkExternalMods();
  else if (options.copy) modService.copyMods();
  else if (options.work) modService.listNotInstalledMods();
  else if (options.install) modService.install(options.install);
  else if (options.print) modService.printInstallCommands(options.print);
  else if (options.uninstall) modService.uninstall();
  else if (options.clear) modService.deleteBackupFolders();
  else program.outputHelp();
}

main();
