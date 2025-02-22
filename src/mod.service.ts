import chalk from "chalk";
import { exec as execCallback } from 'child_process';
import * as fs from "fs";
import path from "path";
import util from 'util';
import { Constants } from "./models/constants";
import { Config, ExternalMod, Mod, ModComponent, ModLocation, Mods, ValueName } from "./models/interface";
import { glob } from "glob";
import { stdout } from "process";
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

    findAllMods() {
        const config = this.getConfig();
        Promise.all([this.getGameFolderMods(config), this.getExternalMods(config)]).then(([mods, externalMods]) => {
            this.updateExternalModsConfig(config, externalMods);
            // console.log(externalMods.map(m => m.name));
        });
    }

    checkExternalMods(): Promise<void> {
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
                tp2File: location.fullPathTp2File,
                version,
                copy: false
            };
        });
        return Promise.resolve(mods);
    }

    getGameFolderMods(config: Config): Promise<Mod[]> {
        const folders = fs.readdirSync(config.gameFolder, { withFileTypes: true }).filter(f => f.isDirectory() && !Constants.gameFolderIgoreList.includes(f.name)).map(f => f.name);
        const locations = folders.map(f => this.getModLocations(config.gameFolder, f)).filter(l => l !== undefined);
        return Promise.all(locations.map(l => this.parseMod(config, l))).then((mods) => this.updateModsConfig(config, mods));
    }

    getModLocations(root: string, folder: string): ModLocation | undefined {
        const fullPathFolder = path.join(root, folder);
        const files = fs.readdirSync(fullPathFolder, { withFileTypes: true });
        const tp2 = files.find(f => f.name.toLowerCase().endsWith('.tp2') && f.name.toLowerCase().includes(folder.toLowerCase()));
        if (tp2) {
            return {
                relativePathTp2File: path.join(folder, tp2.name),
                fullPathTp2File: path.join(fullPathFolder, tp2.name),
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

    parseMod(config: Config, location: ModLocation): Promise<Mod> {
        const version = this.getVersion(location);
        let language: ValueName;
        return this.getLanguage(config, location).then(r => {
            language = r;
            return this.getComponents(config, location, language.value);
        }).then((components) => {
            const mod: Mod = {
                name: location.relativePathFolder,
                tp2File: location.relativePathTp2File,
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

    getLanguage(config: Config, location: ModLocation): Promise<ValueName> {
        const cmd = `weidu.exe --list-languages "${location.relativePathTp2File}"`;
        return exec(cmd, { cwd: config.gameFolder }).then(value => {
            if (value.stdout.includes('FATAL ERROR')) {
                console.log(cmd);
                throw new Error(value.stdout);
            }
            const rx = /(\d+)\:(\w+)/g;
            const languages = value.stdout.matchAll(rx).map(m => ({ value: +m[1], name: m[2] })).toArray();
            if (!languages.length) return { value: 0, name: '<no language found>' };
            let lang = languages.find(l => l.name.toLowerCase() === config.language.toLowerCase());
            if (!lang) lang = languages.find(l => l.name === Constants.defaultLanguage.toLowerCase());
            if (!lang) {
                throw new Error(`Language ${config.language} not found for ${location.relativePathFolder}:\n${JSON.stringify(languages)}`);
            }
            return lang;
        });
    }

    getComponents(config: Config, location: ModLocation, language: number) {
        const cmd = `weidu.exe --list-components "${location.relativePathTp2File}" ${language}`;
        return exec(cmd, { cwd: config.gameFolder }).then(value => {
            if (value.stdout.includes('FATAL ERROR')) {
                console.log(cmd);
                throw new Error(value.stdout);
            }
            const rx = /~[^~]+~\s+#\d+\s+#(\d+)\s+\/\/\s+(.+)/g;
            const components: ModComponent[] = value.stdout.matchAll(rx).map(m => {
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

    copyMods(): Promise<void> {
        const config = this.getConfig();
        return this.getGameFolderMods(config).then(() => {
            for (const externalMod of config.externalMods) {
                const mod = config.mods.find(m => m.name === externalMod.name);
                if (mod && mod.version === externalMod.version)
                    console.log(chalk.grey(`Skipping ${mod.name}, aready present with the same version`));
                else if (externalMod.copy) this.copyMod(config, externalMod);
            }
        })
    }

    copyMod(config: Config, mod: ExternalMod): void {
        const sourceFolder = mod.tp2File.substring(0, mod.tp2File.lastIndexOf('\\'));
        const destFolder = path.join(config.gameFolder, mod.name);
        console.log(chalk.bold(`Copying ${mod.name}... (${sourceFolder} to ${destFolder})`));
        fs.rmSync(destFolder, { recursive: true, force: true });
        fs.cpSync(sourceFolder, destFolder, { recursive: true });
    }

}