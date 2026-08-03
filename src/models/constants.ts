export type Game = 'bg1' | 'bg2';

export const Constants = {
    getConfigFile: (game: Game) => `assets/config_${game}.json`,
    modsFile: 'assets/mods.json',
    externalMods: 'assets/external-mods.json',
    defaultLanguage: 'English',
    gameFolderIgoreList: ['data', 'dlc', 'lang', 'Manuals', 'movies', 'music', 'override', 'scripts', 'BGEEClassicMovies', 'DlcMerger']
};

export const CR = '\r\n';
