return {
    name = "lua",
    displayName = "Lua",
    description = "Lua Language Server coded by Lua",
    author = "sumneko",
    icon = "images/logo.png",
    license = "MIT",
    repository = {
        type = "git",
        url = "https://github.com/sumneko/lua-language-server"
    },
    publisher = "sumneko",
    categories = {
        "Linters",
        "Programming Languages",
        "Snippets"
    },
    keywords = {
        "Lua",
        "IntelliSense",
        "EmmyLua",
    },
    engines = {
        vscode = "^1.61.0"
    },
    activationEvents = {
        "onLanguage:lua",
        "onWebviewPanel:lua-doc",
        "onCommand:extension.lua.doc",
    },
    main = "./client/out/extension",
    contributes = {
        configuration = {
            type = "object",
            title = "Lua",
            properties = require 'package.configuration',
        },
        semanticTokenScopes = {
            {
                language = "lua",
                scopes = require 'package.semanticTokenScope',
            }
        },
        jsonValidation = {
            {
                fileMatch = {
                    ".luarc.json",
                    ".luarc.jsonc",
                },
                url = "./setting/schema.json",
            },
        },
        languages = {
            {
                id = 'jsonc',
                filenames = {
                    '.luarc.json',
                },
            },
        },
    },
    capabilities = {
        untrustedWorkspaces = {
            supported = "limited",
            description = "",
            restrictedConfigurations = {
                "Lua.runtime.plugin",
                "Lua.misc.parameters",
            },
        },
    },
}
