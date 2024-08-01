import * as vscode from 'vscode';

export const luaConfiguration: vscode.LanguageConfiguration = {
    autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "'", close: "'", notIn: [vscode.SyntaxTokenType.String] },
        { open: '"', close: '"', notIn: [vscode.SyntaxTokenType.String] },
        { open: "[=", close: "=]" },
        { open: "[==", close: "==]" },
        { open: "[===", close: "===]" },
        { open: "[====", close: "====]" },
        { open: "[=====", close: "=====]" },
    ],
    onEnterRules: [
        {
            beforeText: /\)\s*$/,
            afterText: /^\s*end\b/,
            action: {
                indentAction: vscode.IndentAction.IndentOutdent,
            }
        },
        {
            beforeText: /\b(\)|then|do|else)\b\s*$/,
            afterText: /^\s*end\b/,
            action: {
                indentAction: vscode.IndentAction.IndentOutdent,
            }
        },
        {
            beforeText: /\b(repeat)\b\s*$/,
            afterText: /^\s*until\b/,
            action: {
                indentAction: vscode.IndentAction.IndentOutdent,
            }
        },
        {
            beforeText: /^\s*---@/,
            action: {
                indentAction: vscode.IndentAction.None,
                appendText: "---@"
            }
        },
        {
            beforeText: /^\s*--- @/,
            action: {
                indentAction: vscode.IndentAction.None,
                appendText: "--- @"
            }
        },
        {
            beforeText: /^\s*--- /,
            action: {
                indentAction: vscode.IndentAction.None,
                appendText: "--- "
            }
        },
        {
            beforeText: /^\s*---/,
            action: {
                indentAction: vscode.IndentAction.None,
                appendText: "---"
            }
        },
    ],
};
