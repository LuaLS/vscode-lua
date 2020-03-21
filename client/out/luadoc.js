"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require('path');
const fs = require('fs');
var currentPanel;
function compileOther(srcPath, dstPath, name) {
    fs.copyFileSync(path.join(srcPath, name), path.join(dstPath, name));
}
function compileCss(srcPath, dstPath, name) {
    let css = fs.readFileSync(path.join(srcPath, name), 'utf8');
    css = css.split('\n').map(function (line) {
        if (line.match('color')) {
            return '';
        }
        return line;
    }).join('\n');
    fs.writeFileSync(path.join(dstPath, name), css);
}
function compileHtml(srcPath, dstPath, name) {
    let html = fs.readFileSync(path.join(srcPath, name), 'utf8');
    html = html.replace(/(<\/body>)/i, `
<SCRIPT>
    const vscode = acquireVsCodeApi();
    function gotoAnchor(anchor) {
        for (const e of document.getElementsByName(anchor)) {
            e.scrollIntoView();
            break;
        }
    }
    for (const link of document.querySelectorAll('a[href^="#"]')) {
        link.addEventListener('click', () => {
            const anchor = link.getAttribute('href').substr(1);
            gotoAnchor(anchor);
        });
    }
    for (const link of document.querySelectorAll('a[href*=".html"]')) {
        link.addEventListener('click', () => {
            const uri = link.getAttribute('href');
            vscode.postMessage({
                command: 'goto',
                uri: uri,
            });
        });
    }
    window.addEventListener('message', event => {
        const message = event.data;
        switch (message.command) {
            case 'goto':
                gotoAnchor(message.anchor);
                break;
        }
    });
</SCRIPT>
$1
    `);
    fs.readdirSync(srcPath).forEach(function (name) {
        const file = path.join(srcPath, name);
        const stat = fs.statSync(file);
        if (stat && stat.isFile()) {
            if (".html" != path.extname(file)) {
                const uri = currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(dstPath, name)));
                html = html.replace(name, uri);
            }
        }
    });
    fs.writeFileSync(path.join(dstPath, name), html);
}
function compile(srcPath, dstPath) {
    fs.mkdirSync(dstPath, { recursive: true });
    fs.readdirSync(srcPath).forEach(function (name) {
        const file = path.join(srcPath, name);
        const stat = fs.statSync(file);
        if (!stat || !stat.isFile()) {
            return;
        }
        const extname = path.extname(file);
        if (".html" == extname) {
            compileHtml(srcPath, dstPath, name);
        }
        else if (".css" == extname) {
            compileCss(srcPath, dstPath, name);
        }
        else {
            compileOther(srcPath, dstPath, name);
        }
    });
}
function needCompile(workPath, dstPath) {
    const cfg = path.join(dstPath, '.compiled');
    if (!fs.existsSync(cfg)) {
        return true;
    }
    return (workPath != fs.readFileSync(cfg, 'utf8'));
}
function checkAndCompile(workPath, language, version) {
    const srcPath = path.join(workPath, 'luadoc', 'src', language, version);
    const dstPath = path.join(workPath, 'luadoc', 'out', language, version);
    if (needCompile(workPath, dstPath)) {
        if (!fs.existsSync(srcPath)) {
            currentPanel.title = 'Error';
            currentPanel.webview.html = `
<!DOCTYPE html>
<html lang="en">
    <head></head>
    <body>
        <h1>Not Found doc/${language}/${version}/</h1>
    </body>
</html>`;
            return false;
        }
        compile(srcPath, dstPath);
        fs.writeFileSync(path.join(dstPath, '.compiled'), workPath);
    }
    currentPanel._language = language;
    currentPanel._version = version;
    return true;
}
function openHtml(workPath, file) {
    if (currentPanel._file == file) {
        return;
    }
    const htmlPath = path.join(workPath, 'luadoc', 'out', currentPanel._language, currentPanel._version, file);
    const html = fs.readFileSync(htmlPath, 'utf8');
    currentPanel._file = file;
    currentPanel.title = html.match(/<title>(.*?)<\/title>/i)[1];
    currentPanel.webview.html = html;
}
function gotoAnchor(anchor) {
    currentPanel.webview.postMessage({ command: 'goto', anchor: anchor });
}
function createPanel(workPath, disposables, viewType, args) {
    const column = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : vscode.ViewColumn.One;
    if (currentPanel) {
        currentPanel.reveal(column, true);
    }
    else {
        const options = {
            enableScripts: true,
            enableFindWidget: true,
            retainContextWhenHidden: true,
        };
        currentPanel = vscode.window.createWebviewPanel(viewType, '', { viewColumn: column, preserveFocus: true }, options);
        currentPanel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'goto':
                    const uri = message.uri.split("#");
                    openHtml(workPath, uri[0]);
                    if (uri[1]) {
                        gotoAnchor(uri[1]);
                    }
                    return;
            }
        }, null, disposables);
        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        }, null, disposables);
    }
    if (!checkAndCompile(workPath, args.language, args.version)) {
        return;
    }
    openHtml(workPath, args.file);
    if (args.anchor) {
        gotoAnchor(args.anchor);
    }
}
function activateLuaDoc(workPath, disposables, LuaDoc) {
    disposables.push(vscode.commands.registerCommand(LuaDoc.OpenCommand, (args) => {
        try {
            createPanel(workPath, disposables, LuaDoc.ViewType, args || {
                language: "en-us",
                version: "54",
                file: "readme.html",
            });
        }
        catch (error) {
            console.error(error);
        }
    }));
}
function activate(context) {
    activateLuaDoc(context.extensionPath, context.subscriptions, {
        ViewType: 'lua-doc',
        OpenCommand: 'lua-doc.open',
    });
}
exports.activate = activate;
//# sourceMappingURL=luadoc.js.map