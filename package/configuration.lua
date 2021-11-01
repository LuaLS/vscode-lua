local const = require 'proto.define'
local json  = require 'json'

local config = {
    ["Lua.runtime.version"] = {
        scope = 'window',
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
        scope = 'window',
        type = "array",
        items = {
            type = 'string',
        },
        markdownDescription = "%config.runtime.path%",
        default = {
            "?.lua",
            "?/init.lua",
        }
    },
    ["Lua.runtime.special"] = {
        scope = 'window',
        type  = 'object',
        markdownDescription = '%config.runtime.special%',
        additionalProperties = false,
        patternProperties= {
            ['.*'] = {
                type = "string",
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
        scope = 'window',
        type = 'boolean',
        default = false,
        markdownDescription = "%config.runtime.unicodeName%"
    },
    ["Lua.runtime.nonstandardSymbol"] = {
        scope = 'window',
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
        scope = 'window',
        type = "string",
        default = "",
        markdownDescription = "%config.runtime.plugin%"
    },
    ["Lua.runtime.fileEncoding"] = {
        scope = 'window',
        type  = 'string',
        default = 'utf8',
        enum = {
            "utf8",
            "ansi",
        },
        markdownDescription = '%config.runtime.fileEncoding%',
    },
    ['Lua.runtime.builtin'] = {
        scope = 'window',
        type  = 'object',
        additionalProperties = false,
        properties = {},
        markdownDescription = '%config.runtime.builtin%',
    },
    ["Lua.diagnostics.enable"] = {
        scope = 'window',
        type = 'boolean',
        default = true,
        markdownDescription = "%config.diagnostics.enable%"
    },
    ["Lua.diagnostics.disable"] = {
        scope = 'window',
        type = "array",
        items = {
            type = 'string',
        },
        markdownDescription = "%config.diagnostics.disable%"
    },
    ["Lua.diagnostics.globals"] = {
        scope = 'window',
        type = "array",
        items = {
            type = 'string',
        },
        markdownDescription = "%config.diagnostics.globals%"
    },
    ["Lua.diagnostics.severity"] = {
        scope = 'window',
        type = 'object',
        additionalProperties = false,
        markdownDescription = "%config.diagnostics.severity%",
        title = "severity",
        properties = {}
    },
    ["Lua.diagnostics.neededFileStatus"] = {
        scope = 'window',
        type = 'object',
        additionalProperties = false,
        markdownDescription = "%config.diagnostics.neededFileStatus%",
        title = "neededFileStatus",
        properties = {}
    },
    ["Lua.diagnostics.workspaceDelay"] = {
        scope = 'window',
        type = "integer",
        default = 0,
        markdownDescription = "%config.diagnostics.workspaceDelay%",
    },
    ["Lua.diagnostics.workspaceRate"] = {
        scope = 'window',
        type = "integer",
        default = 100,
        markdownDescription = "%config.diagnostics.workspaceRate%",
    },
    ["Lua.diagnostics.libraryFiles"] = {
        scope = 'window',
        type = "string",
        default = "Opened",
        enum = {
            "Enable",
            "Opened",
            "Disable",
        },
        markdownEnumDescriptions = {
            "%config.diagnostics.files.Enable%",
            "%config.diagnostics.files.Opened%",
            "%config.diagnostics.files.Disable%",
        },
        markdownDescription = "%config.diagnostics.libraryFiles%",
    },
    ["Lua.diagnostics.ignoredFiles"] = {
        scope = 'window',
        type = "string",
        default = "Opened",
        enum = {
            "Enable",
            "Opened",
            "Disable",
        },
        markdownEnumDescriptions = {
            "%config.diagnostics.files.Enable%",
            "%config.diagnostics.files.Opened%",
            "%config.diagnostics.files.Disable%",
        },
        markdownDescription = "%config.diagnostics.ignoredFiles%",
    },
    ["Lua.workspace.ignoreDir"] = {
        scope = 'window',
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
        scope = 'window',
        type = "boolean",
        default = true,
        markdownDescription = "%config.workspace.ignoreSubmodules%"
    },
    ["Lua.workspace.useGitIgnore"] = {
        scope = 'window',
        type = "boolean",
        default = true,
        markdownDescription = "%config.workspace.useGitIgnore%"
    },
    ["Lua.workspace.maxPreload"] = {
        scope = 'window',
        type = "integer",
        default = 1000,
        markdownDescription = "%config.workspace.maxPreload%"
    },
    ["Lua.workspace.preloadFileSize"] = {
        scope = 'window',
        type = "integer",
        default = 100,
        markdownDescription = "%config.workspace.preloadFileSize%"
    },
    ["Lua.workspace.library"] = {
        scope = 'window',
        type = "array",
        items = {
            type = "string"
        },
        markdownDescription = "%config.workspace.library%"
    },
    ['Lua.workspace.checkThirdParty'] = {
        scope = 'window',
        type  = 'boolean',
        default = true,
        markdownDescription = "%config.workspace.checkThirdParty%"
    },
    ["Lua.workspace.userThirdParty"] = {
        scope = 'window',
        type = "array",
        items = {
            type = "string"
        },
        markdownDescription = "%config.workspace.userThirdParty%"
    },
    ["Lua.completion.enable"] = {
        scope = 'window',
        type = "boolean",
        default = true,
        markdownDescription = "%config.completion.enable%"
    },
    ["Lua.completion.callSnippet"] = {
        scope = 'window',
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
        scope = 'window',
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
        scope = 'window',
        type  = "integer",
        default = 0,
        markdownDescription = "%config.completion.displayContext%",
    },
    ['Lua.completion.workspaceWord'] = {
        scope = 'window',
        type = "boolean",
        default = true,
        markdownDescription = "%config.completion.workspaceWord%"
    },
    ['Lua.completion.showWord'] = {
        scope = 'window',
        type = "string",
        default = 'Fallback',
        enum = {
            "Enable",
            "Fallback",
            "Disable",
        },
        markdownEnumDescriptions = {
            "%config.completion.showWord.Enable%",
            "%config.completion.showWord.Fallback%",
            "%config.completion.showWord.Disable%",
        },
        markdownDescription = "%config.completion.showWord%"
    },
    ['Lua.completion.autoRequire'] = {
        scope = 'window',
        type = "boolean",
        default = true,
        markdownDescription = "%config.completion.autoRequire%"
    },
    ['Lua.completion.showParams'] = {
        scope = 'window',
        type = "boolean",
        default = true,
        markdownDescription = "%config.completion.showParams%"
    },
    ['Lua.completion.requireSeparator'] = {
        scope = 'window',
        type = "string",
        default = '.',
        markdownDescription = "%config.completion.requireSeparator%"
    },
    ["Lua.color.mode"] = {
        scope = 'window',
        type = "string",
        default = "Semantic",
        enum = {
            "Grammar",
            "Semantic",
            "SemanticEnhanced",
        },
        markdownEnumDescriptions = {
            "%config.color.mode.Grammar%",
            "%config.color.mode.Semantic%",
            "%config.color.mode.SemanticEnhanced%",
        },
        markdownDescription = "%config.color.mode%"
    },
    ["Lua.signatureHelp.enable"] = {
        scope = 'window',
        type = "boolean",
        default = true,
        markdownDescription = "%config.signatureHelp.enable%"
    },
    ['Lua.hover.enable'] = {
        scope = 'window',
        type = "boolean",
        default = true,
        markdownDescription = "%config.hover.enable%"
    },
    ['Lua.hover.viewString'] = {
        scope = 'window',
        type = "boolean",
        default = true,
        markdownDescription = "%config.hover.viewString%"
    },
    ['Lua.hover.viewStringMax'] = {
        scope = 'window',
        type = "integer",
        default = 1000,
        markdownDescription = "%config.hover.viewStringMax%"
    },
    ['Lua.hover.viewNumber'] = {
        scope = 'window',
        type = "boolean",
        default = true,
        markdownDescription = "%config.hover.viewNumber%"
    },
    ['Lua.hover.previewFields'] = {
        scope = 'window',
        type = "integer",
        default = 20,
        markdownDescription = "%config.hover.previewFields%"
    },
    ['Lua.hover.enumsLimit'] = {
        scope = 'window',
        type = "integer",
        default = 5,
        markdownDescription = "%config.hover.enumsLimit%"
    },
    --["Lua.plugin.enable"] = {
    --    scope = 'window',
    --    type = "boolean",
    --    default = false,
    --    markdownDescription = "%config.plugin.enable%"
    --},
    --["Lua.plugin.path"] = {
    --    scope = 'window',
    --    type = "string",
    --    default = ".vscode/lua-plugin/*.lua",
    --    markdownDescription = "%config.plugin.path%"
    --},
    --["Lua.develop.enable"] = {
    --    scope = 'window',
    --    type = "boolean",
    --    default = false,
    --    markdownDescription = "%config.develop.enable%"
    --},
    --["Lua.develop.debuggerPort"] = {
    --    scope = 'window',
    --    type = "integer",
    --    default = 11412,
    --    markdownDescription = "%config.develop.debuggerPort%"
    --},
    --["Lua.develop.debuggerWait"] = {
    --    scope = 'window',
    --    type = "boolean",
    --    default = false,
    --    markdownDescription = "%config.develop.debuggerWait%"
    --},
    --['Lua.intelliSense.searchDepth'] = {
    --    scope = 'window',
    --    type = "integer",
    --    default = 0,
    --    markdownDescription = "%config.intelliSense.searchDepth%"
    --},
    ['Lua.window.statusBar'] = {
        scope = 'window',
        type  = 'boolean',
        default = true,
        markdownDescription = '%config.window.statusBar%',
    },
    ['Lua.window.progressBar'] = {
        scope = 'window',
        type  = 'boolean',
        default = true,
        markdownDescription = '%config.window.progressBar%',
    },
    ['Lua.telemetry.enable'] = {
        scope = 'window',
        type = {"boolean", "null"},
        default = json.null,
        markdownDescription = "%config.telemetry.enable%"
    },
    ['Lua.hint.enable'] = {
        scope = 'window',
        type  = 'boolean',
        default = false,
        markdownDescription = '%config.hint.enable%',
    },
    ['Lua.hint.paramType'] = {
        scope = 'window',
        type  = 'boolean',
        default = true,
        markdownDescription = '%config.hint.paramType%',
    },
    ['Lua.hint.setType'] = {
        scope = 'window',
        type  = 'boolean',
        default = false,
        markdownDescription = '%config.hint.setType%',
    },
    ['Lua.hint.paramName'] = {
        scope = 'window',
        type  = 'string',
        default = 'All',
        enum = {
            "All",
            "Literal",
            "Disable",
        },
        markdownEnumDescriptions = {
            "%config.hint.paramName.All%",
            "%config.hint.paramName.Literal%",
            "%config.hint.paramName.Disable%",
        },
        markdownDescription = '%config.hint.paramName%',
    },
    ['Lua.misc.parameters'] = {
        scope = 'window',
        type = "array",
        items = {
            type = 'string',
        },
        markdownDescription = '%config.misc.parameters%',
    },
}

local DiagSeverity = config["Lua.diagnostics.severity"].properties
for name, level in pairs(const.DiagnosticDefaultSeverity) do
    DiagSeverity[name] = {
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

local builtin = config["Lua.runtime.builtin"].properties
for name, status in pairs(const.BuiltIn) do
    builtin[name] = {
        type = 'string',
        default = status,
        description = '%config.runtime.builtin.' .. name .. '%',
        enum = {
            'default',
            'enable',
            'disable',
        }
    }
end

return config
