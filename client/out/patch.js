'use strict';
Object.defineProperty(exports, "__esModule", { value: true });

let code = require("vscode");
let realMarkdownString = code.MarkdownString;

function patchedMarkdownString(value, supportThemeIcons) {
    let result = new realMarkdownString(value, supportThemeIcons);
    result.isTrusted = true;
    return result;
}

function patchMarkdown() {
    code.MarkdownString = patchedMarkdownString;
}

function patch(client) {
    patchMarkdown();
}

exports.patch = patch
