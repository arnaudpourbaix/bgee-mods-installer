import { confirm } from '@inquirer/prompts';
import chalk from "chalk";
import { exec as execCallback, spawn } from 'child_process';
import * as fs from "fs";
import path from "path";
import * as readline from 'readline';
import util from 'util';
import { Constants, CR } from "./models/constants";
import { Config, ExternalMod, Mod, ModComponent, ModLocation, Mods, ValueName, WeiduLineGroup } from "./models/interface";
const exec = util.promisify(execCallback);

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

    getMods() {
        try {
            const file = fs.readFileSync(Constants.modsFile, { encoding: "utf8", flag: "r" });
            const mods: Mods = JSON.parse(file);
            return mods;
        } catch (error: unknown) {
            console.error(chalk.red(`${Constants.modsFile} is not a valid json file!`));
            throw error;
        }
    }

    async checkExternalMods(): Promise<void> {
        const config = this.getConfig();
        return this.getExternalMods(config).then((externalMods) => this.updateExternalModsConfig(config, externalMods));
    }

    getExternalMods(config: Config): Promise<ExternalMod[]> {
        const locations: ModLocation[] = [];
        for (const modsFolder of config.modsFolders) {
            if (!fs.existsSync(modsFolder)) throw new Error(`Path ${modsFolder} doesn't exist`);
            const folders = fs.readdirSync(modsFolder, { withFileTypes: true }).filter(f => f.isDirectory());
            for (const f of folders) {
                const location = this.getModLocations(modsFolder, f.name);
                if (location) locations.push(location);
            }
        }
        const mods: ExternalMod[] = locations.map(location => {
            const version = this.getVersion(location);
            return {
                name: location.relativePathFolder,
                tp2File: location.fullPathTp2File.replaceAll('\\', '/'),
                version,
                copy: false
            };
        });
        return Promise.resolve(mods);
    }

    async getGameFolderMods(config: Config): Promise<Mod[]> {
        const folders = fs.readdirSync(config.gameFolder, { withFileTypes: true }).filter(f => f.isDirectory() && !Constants.gameFolderIgoreList.includes(f.name)).map(f => f.name);
        const locations = folders.map(f => this.getModLocations(config.gameFolder, f)).filter(l => l !== undefined);
        return Promise.all(locations.map(l => this.parseMod(config, l))).then((mods) => this.updateModsConfig(config, mods));
    }

    getModLocations(root: string, folder: string): ModLocation | undefined {
        const fullPathFolder = path.join(root, folder).replaceAll('\\', '/');
        const files = fs.readdirSync(fullPathFolder, { withFileTypes: true });
        const tp2 = files.find(f => f.name.toLowerCase().endsWith('.tp2') && f.name.toLowerCase().includes(folder.toLowerCase()));
        if (tp2) {
            return {
                relativePathTp2File: path.join(folder, tp2.name).replaceAll('\\', '/'),
                fullPathTp2File: path.join(fullPathFolder, tp2.name).replaceAll('\\', '/'),
                fullPathFolder,
                relativePathFolder: folder
            };
        } else {
            const subFolders = files.filter(f => f.isDirectory()).map(f => f.name);
            let subFolder: string | undefined;
            let res;
            while (!res && (subFolder = subFolders.pop())) {
                res = this.getModLocations(fullPathFolder, subFolder);
            }
            return res;
        }
    }

    async parseMod(config: Config, location: ModLocation): Promise<Mod> {
        const version = this.getVersion(location);
        let language: ValueName;
        return this.getLanguage(config, location).then(r => {
            language = r;
            return this.getComponents(config, location, language.value);
        }).then((components) => {
            const mod: Mod = {
                name: location.relativePathFolder.replaceAll('\\', '/'),
                tp2File: location.relativePathTp2File.replaceAll('\\', '/'),
                version,
                language,
                components
            };
            return mod;
        })
    }

    getVersion(location: ModLocation): string {
        const content = fs.readFileSync(location.fullPathTp2File, { encoding: "utf8", flag: "r" });
        const matches = /VERSION\s+~([^~]+)~/.exec(content);
        const version = matches?.[1] ?? '<unknown>';
        return version;
    }

    async getLanguage(config: Config, location: ModLocation): Promise<ValueName> {
        const cmd = `weidu.exe --list-languages "${location.relativePathTp2File}"`;
        return this.run(cmd, config.gameFolder).then(value => {
            const rx = /(\d+)\:(\w+)/g;
            const languages = value.matchAll(rx).map(m => ({ value: +m[1], name: m[2] })).toArray();
            if (!languages.length) return { value: 0, name: '<no language found>' };
            let lang = languages.find(l => l.name.toLowerCase() === config.language.toLowerCase());
            if (!lang) lang = languages.find(l => l.name === Constants.defaultLanguage.toLowerCase());
            if (!lang) {
                throw new Error(`Language ${config.language} not found for ${location.relativePathFolder}:\n${JSON.stringify(languages)}`);
            }
            return lang;
        });
    }

    async getComponents(config: Config, location: ModLocation, language: number) {
        const cmd = `weidu.exe --list-components "${location.relativePathTp2File}" ${language}`;
        return this.run(cmd, config.gameFolder).then(value => {
            const rx = /~[^~]+~\s+#\d+\s+#(\d+)\s+\/\/\s+(.+)/g;
            const components: ModComponent[] = value.matchAll(rx).map(m => {
                const label = m[2].trim();
                const index = label.lastIndexOf(':');
                const name = index !== -1 ? label.substring(0, index) : label;
                return { num: +m[1], name, install: false };
            }).toArray();
            return components;
        });
    }

    updateExternalModsConfig(config: Config, mods: ExternalMod[]) {
        for (const mod of mods) {
            const m = config.externalMods.find(m => m.name === mod.name);
            if (!m) console.log(chalk.magentaBright(`${mod.name} added with version ${mod.version}`));
            else mod.copy = m.copy;
            if (!!m && m.version !== mod.version) console.log(chalk.blueBright(`${mod.name} upgraded from version ${m.version} to ${mod.version}`));
        }
        config.externalMods = mods.sort((a, b) => (b.copy as unknown as number) - (a.copy as unknown as number));
        this.updateConfig(config);
    }

    updateModsConfig(config: Config, mods: Mod[]) {
        for (const mod of config.mods) {
            const m = mods.find(m => m.name === mod.name);
            if (!m) console.log(chalk.redBright(`${mod.name} doesn't exist anymore!`));
            else if (m.version !== mod.version) {
                console.log(chalk.blueBright(`${mod.name} upgraded from version ${mod.version} to ${m.version}, please check all components`));
                mod.components = m.components;
                mod.version = m.version;
            }
        }
        const added: Mod[] = [];
        for (const mod of mods) {
            const m = config.mods.find(m => m.name === mod.name);
            if (!m) {
                console.log(chalk.magentaBright(`${mod.name} added with version ${mod.version}`));
                added.push(mod);
            };
        }
        config.mods.push(...added);
        this.updateConfig(config);
        return Promise.resolve(mods);
    }

    updateConfig(config: Config) {
        fs.writeFileSync(Constants.configFile, JSON.stringify(config, null, 2));
    }

    async copyMods(): Promise<any> {
        const config = this.getConfig();
        return this.getGameFolderMods(config).then(() => {
            for (const externalMod of config.externalMods) {
                const mod = config.mods.find(m => m.name === externalMod.name);
                if (mod && mod.version === externalMod.version)
                    console.log(chalk.grey(`Skipping ${mod.name}, aready present with the same version`));
                else if (externalMod.copy) this.copyMod(config, externalMod);
            }
            return this.getGameFolderMods(config);
        });
    }

    copyMod(config: Config, mod: ExternalMod): void {
        const sourceFolder = mod.tp2File.substring(0, mod.tp2File.lastIndexOf('/'));
        const destFolder = path.join(config.gameFolder, mod.name);
        console.log(chalk.bold(`Copying ${mod.name}... (${sourceFolder} to ${destFolder})`));
        fs.rmSync(destFolder, { recursive: true, force: true });
        fs.cpSync(sourceFolder, destFolder, { recursive: true });
    }

    async install(file: string) {
        const config = this.getConfig();
        const installedGroups = this.parseWeiduLog(path.join(config.gameFolder, 'weiDU.log'));
        const groups = this.parseWeiduLog(file);
        const alwaysAsk = await confirm({ message: 'Ask for each install ?' });
        for (const [index, group] of groups.entries()) {
            const installedGroup = installedGroups[index];
            if (!installedGroup) {
                let install = !alwaysAsk;
                if (alwaysAsk) install = await confirm({ message: `Install ${this.getModFolder(group.tp2File)} ?` });
                if (install) {
                    await this.execWeidu([
                        group.tp2File,
                        '--language', group.language,
                        '--no-exit-pause',
                        '--noautoupdate',
                        '--force-install-list', ...group.components
                    ], config.gameFolder);
                } else console.log(`Skipping ${group.tp2File}`);
            } else console.log(chalk.grey(`${group.tp2File} already installed`));
        }
    }

    async uninstall() {
        const config = this.getConfig();
        const groups = this.parseWeiduLog(path.join(config.gameFolder, 'weiDU.log'));
        for (const group of groups.reverse()) {
            const uninstall = await confirm({ message: `Uninstall ${this.getModFolder(group.tp2File)} (${group.components.join(',')}) ?` });
            if (uninstall) {
                await this.execWeidu([
                    group.tp2File,
                    '--language', group.language,
                    '--no-exit-pause',
                    '--noautoupdate',
                    '--force-uninstall-list', ...group.components
                ], config.gameFolder);
            }
        }
    }

    printInstallCommands(file: string) {
        const config = this.getConfig();
        const installedGroups = this.parseWeiduLog(path.join(config.gameFolder, 'weiDU.log'));
        const groups = this.parseWeiduLog(file);
        const results: string[] = [];
        for (const [index, group] of groups.entries()) {
            const installedGroup = installedGroups[index];
            // if (!installedGroup) {
            results.push(`weidu ${group.tp2File} --language ${group.language} --no-exit-pause --noautoupdate --force-install-list ${group.components.join(' ')}`);
            results.push('pause');
            // }
        }
        const outputFile = 'install.log';
        fs.writeFileSync(outputFile, results.join(CR));
        console.log(`${outputFile} generated`);
    }

    async listNotInstalledMods() {
        const config = this.getConfig();
        const file = path.join(config.gameFolder, 'weiDU.log')
        this.updateModsFromWeiduLog(file).then(() => {
            const config = this.getConfig();
            for (const mod of config.mods) {
                if (mod.components.every(c => !c.install)) {
                    console.log(`${mod.name}`);
                }
            }
        });
    }

    async updateModsFromWeiduLog(file: string): Promise<void> {
        const config = this.getConfig();
        return Promise.resolve().then(() => {
            const groups = this.parseWeiduLog(file);
            const newList: Mod[] = [];
            for (const group of groups) {
                const modIndex = config.mods.findIndex(m => m.tp2File.toUpperCase() === group.tp2File);
                if (modIndex === -1) throw new Error(`${group.tp2File} not found !`);
                const mod = config.mods[modIndex];
                // const component = mod.components.find(c => c.num === numComponent);
                // if (!component) throw new Error(`${numComponent} not found for mod ${mod.name} !`);
                // component.install = true;
                if (!newList.some(m => m.name)) newList.push(mod);
            }
            for (const mod of config.mods) {
                if (!newList.some(m => m.name === mod.name)) newList.push(mod);
            }
            config.mods = newList;
            this.updateConfig(config);
        });
    }

    parseWeiduLog(file: string): WeiduLineGroup[] {
        if (!fs.existsSync(file)) {
            console.log(chalk.yellow(`File ${file} doesn't exist`));
            return [];
        };
        const content = fs.readFileSync(file, { encoding: "utf8", flag: "r" });
        const rx = /^~([^~]+)~\s+#(\d+)\s+#(\d+)/gm;
        const matches = content.matchAll(rx);
        const components: WeiduLineGroup[] = [];
        for (const match of matches) {
            const tp2File = match[1].toUpperCase();
            const language = match[2];
            const numComponent = match[3];
            if (components.at(-1)?.tp2File === tp2File) {
                (components.at(-1) as WeiduLineGroup).components.push(numComponent);
            } else {
                components.push({ tp2File, language, components: [numComponent] });
            }
        }
        return components;
    }

    async deleteBackupFolders(): Promise<void> {
        const config = this.getConfig();
        const folders = fs.readdirSync(config.gameFolder, { withFileTypes: true }).filter(f => f.isDirectory() && !Constants.gameFolderIgoreList.includes(f.name)).map(f => f.name);
        const locations = folders.map(f => this.getModLocations(config.gameFolder, f)).filter(l => l !== undefined);
        return Promise.all(locations.map(l => this.parseMod(config, l))).then((mods) => {
            for (const mod of mods) {
                const folder = path.join(config.gameFolder, mod.name, 'backup');
                if (fs.existsSync(folder)) {
                    fs.rmSync(folder, { recursive: true, force: true });
                }
            }
        });
    }

    async execWeidu(args: readonly string[], cwd: string) {
        return new Promise((resolve, reject) => {
            const p = spawn('weidu', args, { cwd, stdio: ['ignore', 'pipe', 'inherit'] });
            p.stdout.on('data', function (data) {
                console.log(data.toString());
            });
            p.stdout.on('end', function () {
                resolve(void 0);
            });
            p.on('error', (err) => {
                reject(err);
            });
        });
    }

    async run(command: string, cwd: string) {
        console.log(command);
        return exec(command, { cwd }).then(result => {
            if (result.stderr) {
                console.error(command);
                throw new Error(result.stderr);
            }
            else if (result.stdout.includes('FATAL ERROR') || result.stdout.includes('Aborting installation of')) {
                console.error(result.stdout);
                throw new Error(result.stderr);
            }
            // console.log(result.stdout);
            return result.stdout;
        });
    }

    getModFolder(tp2File: string) {
        return tp2File.substring(0, tp2File.lastIndexOf('/'));
    }

}