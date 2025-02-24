export interface Config {
    /**
     * Location of Baldur's Gate folder
     */
    gameFolder: string;
    /**
     * Location of mods root folder. Mods must be unzipped.
     * A root folder can contain any number of mods. It is possible to specify several root folders.
     */
    modsFolders: string[];
    weiduLocation: string;
    /**
     * Language in full text, for example: English
     */
    language: string;

    mods: Mod[];
    externalMods: ExternalMod[];
}

export interface Mods {

}

export interface Mod extends BaseMod {
    language: ValueName;
    components: ModComponent[];
}

export interface ExternalMod extends BaseMod {
    /**
     * Will be copied in game folder if true
     */
    copy: boolean;
}

export interface BaseMod {
    name: string;
    tp2File: string;
    version: string;
}

export interface ValueName {
    value: number;
    name: string;
}

export interface ModComponent {
    num: number;
    name: string;
    /**
     * Install this component
     */
    install: boolean;
}

export interface ModLocation {
    relativePathTp2File: string;
    fullPathTp2File: string;
    relativePathFolder: string;
    fullPathFolder: string;
}

export interface WeiduLineGroup {
    tp2File: string;
    language: string;
    components: string[];
}