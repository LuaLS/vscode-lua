return {
    name = "lua",
    displayName = "Lua",
    description = "Lua Language Server coded by Lua",
    author = "sumneko",
    icon = "images/logo.png",
    license = "MIT",
    repository = {
        type = "git",
        url = "https://github.com/LuaLS/lua-language-server"
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
    sponsor = {
        url = "https://github.com/LuaLS/lua-language-server/issues/484"
    },
    engines = {
        vscode = "^1.67.0"
    },
    activationEvents = {
        "onLanguage:lua",
        "onWebviewPanel:lua-doc",
        "onCommand:extension.lua.doc",
    },
    main = "./client/out/extension",
    contributes = {
        commands = {
            {
                command = "lua.psi.view",
                title = "Lua Psi Viewer"
            },
            {
                command = "lua.addon_manager.open",
                title = "%command.addon_manager.open%",
            },
            {
                command = "lua.exportDocument",
                title = "%command.exportDocument%",
            },
			{
				command = "lua.reloadFFIMeta",
				title = "%command.reloadFFIMeta%",
			},
        },
        menus = {
            ["editor/context"] = {
                {
                    when = "resourceLangId == lua",
                    command = "lua.exportDocument",
                    group = "z_commands"
                },
                {
                    when = "resourceLangId == lua",
                    command = "lua.addon_manager.open",
                    group = "z_commands",
                },
                {
                    when = "resourceLangId == lua",
                    command = "lua.reloadFFIMeta",
                    group = "z_commands"
                },
            }
        },
        configuration = {
            type = "object",
            title = "Lua",
            properties = require 'server.tools.configuration',
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
                    'config.json',
                },
            },
        },
        configurationDefaults = {
            ["[lua]"] = {
                ["editor.quickSuggestions"] = {
                    comments = "inline",
                    other = "on",
                    strings = "on",
                },
                ["editor.semanticHighlighting.enabled"] = true,
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
