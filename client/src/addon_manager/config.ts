import * as vscode from "vscode";

// Development
export const DEVELOPMENT_IFRAME_URL = "http://127.0.0.1:5173";

// GitHub Repository Info
export const REPOSITORY = {
    PATH: "https://github.com/LuaLS/LLS-Addons.git",
    DEFAULT_BRANCH: "main",
}

export const REPOSITORY_OWNER = "carsakiller";
export const REPOSITORY_NAME = "LLS-Addons";
export const REPOSITORY_ISSUES_URL =
    "https://github.com/LuaLS/vscode-lua/issues/new?template=bug_report.yml";
export const ADDONS_DIRECTORY = "addons";
export const GIT_DOWNLOAD_URL = "https://git-scm.com/downloads";

// settings.json file info
export const LIBRARY_SETTING = "Lua.workspace.library";

// Addon files
export const PLUGIN_FILENAME = "plugin.lua";
export const CONFIG_FILENAME = "config.json";
export const INFO_FILENAME = "info.json";

let useGlobal = true
export function getStorageUri(context: vscode.ExtensionContext) {
    return useGlobal ? context.globalStorageUri : (context.storageUri ?? context.globalStorageUri)
}

export function setGlobalStorageUri(use: boolean) {
    useGlobal = use
}