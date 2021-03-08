local const = require 'proto.define'

local config = {
    ["Lua.runtime.version"] = {
        scope = "resource",
        type = "string",
        default = "Lua 5.4",
        enum = {
            "Lua 5.1",
            "Lua 5.2",
            "Lua 5.3",
            "Lua 5.4",
            "LuaJIT"
        },
        markdownDescription = "%config.runtime.version%"
    },
    ["Lua.runtime.path"] = {
        scope = "resource",
        type = "array",
        items = {
            type = 'string',
        },
        markdownDescription = "%config.runtime.path%",
        default = {
            "?.lua",
            "?/init.lua",
            "?/?.lua"
        }
    },
    ["Lua.runtime.special"] = {
        scope = 'resource',
        type  = 'object',
        markdownDescription = '%config.runtime.special%',
        patternProperties= {
            ['.*'] = {
                type = "string",
                scope = "resource",
                default = "require",
                enum = {
                    '_G',
                    'rawset',
                    'rawget',
                    'setmetatable',
                    'require',
                    'dofile',
                    'loadfile',
                    'pcall',
                    'xpcall',
                }
            }
        }
    },
    ["Lua.runtime.unicodeName"] = {
        scope = 'resource',
        type = 'boolean',
        default = false,
        markdownDescription = "%config.runtime.unicodeName%"
    },
    ["Lua.runtime.nonstandardSymbol"] = {
        scope = 'resource',
        type = 'array',
        items = {
            type = 'string',
            enum = {
                '//', '/**/',
                '`',
                '+=', '-=', '*=', '/=',
                '||', '&&', '!', '!=',
                'continue',
            }
        },
        markdownDescription = "%config.runtime.nonstandardSymbol%"
    },
    ["Lua.runtime.plugin"] = {
        scope = "resource",
        type = "string",
        default = ".vscode/lua/plugin.lua",
        markdownDescription = "%config.runtime.plugin%"
    },
    ["Lua.runtime.fileEncoding"] = {
        scope = 'resource',
        type  = 'string',
        default = 'utf8',
        enum = {
            "utf8",
            "ansi",
        },
        markdownDescription = '%config.runtime.fileEncoding%',
    },
    ["Lua.diagnostics.enable"] = {
        scope = 'resource',
        type = 'boolean',
        default = true,
        markdownDescription = "%config.diagnostics.enable%"
    },
    ["Lua.diagnostics.disable"] = {
        scope = "resource",
        type = "array",
        items = {
            type = 'string',
        },
        markdownDescription = "%config.diagnostics.disable%"
    },
    ["Lua.diagnostics.globals"] = {
        scope = "resource",
        type = "array",
        items = {
            type = 'string',
        },
        markdownDescription = "%config.diagnostics.globals%"
    },
    ["Lua.diagnostics.severity"] = {
        scope = "resource",
        type = 'object',
        markdownDescription = "%config.diagnostics.severity%",
        title = "severity",
        properties = {}
    },
    ["Lua.diagnostics.neededFileStatus"] = {
        scope = "resource",
        type = 'object',
        markdownDescription = "%config.diagnostics.neededFileStatus%",
        title = "neededFileStatus",
        properties = {}
    },
    ["Lua.diagnostics.workspaceDelay"] = {
        scope = "resource",
        type = "integer",
        default = 0,
        markdownDescription = "%config.diagnostics.workspaceDelay%",
    },
    ["Lua.diagnostics.workspaceRate"] = {
        scope = "resource",
        type = "integer",
        default = 100,
        markdownDescription = "%config.diagnostics.workspaceRate%",
    },
    ["Lua.workspace.ignoreDir"] = {
        scope = "resource",
        type = "array",
        items = {
            type = 'string',
        },
        markdownDescription = "%config.workspace.ignoreDir%",
        default = {
            ".vscode",
        },
    },
    ["Lua.workspace.ignoreSubmodules"] = {
        scope = "resource",
        type = "boolean",
        default = true,
        markdownDescription = "%config.workspace.ignoreSubmodules%"
    },
    ["Lua.workspace.useGitIgnore"] = {
        scope = "resource",
        type = "boolean",
        default = true,
        markdownDescription = "%config.workspace.useGitIgnore%"
    },
    ["Lua.workspace.maxPreload"] = {
        scope = "resource",
        type = "integer",
        default = 1000,
        markdownDescription = "%config.workspace.maxPreload%"
    },
    ["Lua.workspace.preloadFileSize"] = {
        scope = "resource",
        type = "integer",
        default = 100,
        markdownDescription = "%config.workspace.preloadFileSize%"
    },
    ["Lua.workspace.library"] = {
        scope = 'resource',
        type = 'object',
        markdownDescription = "%config.workspace.library%"
    },
    ["Lua.completion.enable"] = {
        scope = "resource",
        type = "boolean",
        default = true,
        markdownDescription = "%config.completion.enable%"
    },
    ["Lua.completion.callSnippet"] = {
        scope = "resource",
        type = "string",
        default = "Disable",
        enum = {
            "Disable",
            "Both",
            "Replace",
        },
        markdownEnumDescriptions = {
            "%config.completion.callSnippet.Disable%",
            "%config.completion.callSnippet.Both%",
            "%config.completion.callSnippet.Replace%",
        },
        markdownDescription = "%config.completion.callSnippet%"
    },
    ["Lua.completion.keywordSnippet"] = {
        scope = "resource",
        type = "string",
        default = "Replace",
        enum = {
            "Disable",
            "Both",
            "Replace",
        },
        markdownEnumDescriptions = {
            "%config.completion.keywordSnippet.Disable%",
            "%config.completion.keywordSnippet.Both%",
            "%config.completion.keywordSnippet.Replace%",
        },
        markdownDescription = "%config.completion.keywordSnippet%"
    },
    ['Lua.completion.displayContext'] = {
        scope = "resource",
        type  = "integer",
        default = 6,
        markdownDescription = "%config.completion.displayContext%",
    },
    ['Lua.completion.workspaceWord'] = {
        scope = "resource",
        type = "boolean",
        default = true,
        markdownDescription = "%config.completion.workspaceWord%"
    },
    ["Lua.color.mode"] = {
        scope = "resource",
        type = "string",
        default = "Semantic",
        enum = {
            "Grammar",
            "Semantic",
        },
        markdownEnumDescriptions = {
            "%config.color.mode.Grammar%",
            "%config.color.mode.Semantic%",
        },
        markdownDescription = "%config.color.mode%"
    },
    ["Lua.signatureHelp.enable"] = {
        scope = "resource",
        type = "boolean",
        default = true,
        markdownDescription = "%config.signatureHelp.enable%"
    },
    ['Lua.hover.enable'] = {
        scope = "resource",
        type = "boolean",
        default = true,
        markdownDescription = "%config.hover.enable%"
    },
    ['Lua.hover.viewString'] = {
        scope = "resource",
        type = "boolean",
        default = true,
        markdownDescription = "%config.hover.viewString%"
    },
    ['Lua.hover.viewStringMax'] = {
        scope = "resource",
        type = "integer",
        default = 1000,
        markdownDescription = "%config.hover.viewStringMax%"
    },
    ['Lua.hover.viewNumber'] = {
        scope = "resource",
        type = "boolean",
        default = true,
        markdownDescription = "%config.hover.viewNumber%"
    },
    ['Lua.hover.fieldInfer'] = {
        scope = "resource",
        type = "integer",
        default = 3000,
        markdownDescription = "%config.hover.fieldInfer%"
    },
    ['Lua.hover.previewFields'] = {
        scope = "resource",
        type = "integer",
        default = 100,
        markdownDescription = "%config.hover.previewFields%"
    },
    --["Lua.plugin.enable"] = {
    --    scope = "resource",
    --    type = "boolean",
    --    default = false,
    --    markdownDescription = "%config.plugin.enable%"
    --},
    --["Lua.plugin.path"] = {
    --    scope = "resource",
    --    type = "string",
    --    default = ".vscode/lua-plugin/*.lua",
    --    markdownDescription = "%config.plugin.path%"
    --},
    ["Lua.develop.enable"] = {
        scope = "resource",
        type = "boolean",
        default = false,
        markdownDescription = "%config.develop.enable%"
    },
    ["Lua.develop.debuggerPort"] = {
        scope = "resource",
        type = "integer",
        default = 11412,
        markdownDescription = "%config.develop.debuggerPort%"
    },
    ["Lua.develop.debuggerWait"] = {
        scope = "resource",
        type = "boolean",
        default = false,
        markdownDescription = "%config.develop.debuggerWait%"
    },
    ['Lua.intelliSense.searchDepth'] = {
        scope = "resource",
        type = "integer",
        default = 0,
        markdownDescription = "%config.intelliSense.searchDepth%"
    },
    ['Lua.window.statusBar'] = {
        scope = "resource",
        type  = 'boolean',
        default = true,
        markdownDescription = '%config.window.statusBar%',
    },
    ['Lua.window.progressBar'] = {
        scope = "resource",
        type  = 'boolean',
        default = true,
        markdownDescription = '%config.window.progressBar%',
    },
    ['Lua.telemetry.enable'] = {
        scope = "resource",
        type = "boolean",
        default = true,
        markdownDescription = "%config.telemetry.enable%"
    },
    ['Lua.hint.enable'] = {
        scope = 'resource',
        type  = 'boolean',
        default = false,
        markdownDescription = '%config.hint.enable%',
    },
    ['Lua.hint.paramType'] = {
        scope = 'resource',
        type  = 'boolean',
        default = true,
        markdownDescription = '%config.hint.paramType%',
    },
    ['Lua.hint.setType'] = {
        scope = 'resource',
        type  = 'boolean',
        default = false,
        markdownDescription = '%config.hint.setType%',
    },
    ['Lua.hint.paramName'] = {
        scope = 'resource',
        type  = 'boolean',
        default = true,
        markdownDescription = '%config.hint.paramName%',
    },
}

local DiagSeverity = config["Lua.diagnostics.severity"].properties
for name, level in pairs(const.DiagnosticDefaultSeverity) do
    DiagSeverity[name] = {
        scope = 'resource',
        type = 'string',
        default = level,
        description = '%config.diagnostics.' .. name .. '%',
        enum = {
            'Error',
            'Warning',
            'Information',
            'Hint',
        }
    }
end

local DiagNeededFileStatus = config["Lua.diagnostics.neededFileStatus"].properties
for name, level in pairs(const.DiagnosticDefaultNeededFileStatus) do
    DiagNeededFileStatus[name] = {
        scope = 'resource',
        type = 'string',
        default = level,
        description = '%config.diagnostics.' .. name .. '%',
        enum = {
            'Any',
            'Opened',
            'None',
        }
    }
end

return config
