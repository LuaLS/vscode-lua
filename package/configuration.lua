local const = require 'proto.define'
local json  = require 'json'

local config = {
    ["Lua.runtime.version"] = {
        scope = 'resource',
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
        scope = 'resource',
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
    ["Lua.runtime.pathStrict"] = {
        scope = 'resource',
        type = "boolean",
        markdownDescription = "%config.runtime.pathStrict%",
        default = false,
    },
    ["Lua.runtime.special"] = {
        scope = 'resource',
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
                    'assert',
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
        scope = 'resource',
        type = "string",
        default = "",
        markdownDescription = "%config.runtime.plugin%"
    },
    ["Lua.runtime.fileEncoding"] = {
        scope = 'resource',
        type  = 'string',
        default = 'utf8',
        enum = {
            "utf8",
            "ansi",
            "utf16le",
            "utf16be",
        },
        markdownDescription = '%config.runtime.fileEncoding%',
    },
    ['Lua.runtime.builtin'] = {
        scope = 'resource',
        type  = 'object',
        additionalProperties = false,
        properties = {},
        markdownDescription = '%config.runtime.builtin%',
    },
    ["Lua.diagnostics.enable"] = {
        scope = 'resource',
        type = 'boolean',
        default = true,
        markdownDescription = "%config.diagnostics.enable%"
    },
    ["Lua.diagnostics.disable"] = {
        scope = 'resource',
        type = "array",
        items = {
            type = 'string',
        },
        markdownDescription = "%config.diagnostics.disable%"
    },
    ["Lua.diagnostics.globals"] = {
        scope = 'resource',
        type = "array",
        items = {
            type = 'string',
        },
        markdownDescription = "%config.diagnostics.globals%"
    },
    ["Lua.diagnostics.severity"] = {
        scope = 'resource',
        type = 'object',
        additionalProperties = false,
        markdownDescription = "%config.diagnostics.severity%",
        title = "severity",
        properties = {}
    },
    ["Lua.diagnostics.neededFileStatus"] = {
        scope = 'resource',
        type = 'object',
        additionalProperties = false,
        markdownDescription = "%config.diagnostics.neededFileStatus%",
        title = "neededFileStatus",
        properties = {}
    },
    ["Lua.diagnostics.workspaceDelay"] = {
        scope = 'resource',
        type = "integer",
        default = 3000,
        markdownDescription = "%config.diagnostics.workspaceDelay%",
    },
    ["Lua.diagnostics.workspaceRate"] = {
        scope = 'resource',
        type = "integer",
        default = 100,
        markdownDescription = "%config.diagnostics.workspaceRate%",
    },
    ["Lua.diagnostics.libraryFiles"] = {
        scope = 'resource',
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
        scope = 'resource',
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
        scope = 'resource',
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
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.workspace.ignoreSubmodules%"
    },
    ["Lua.workspace.useGitIgnore"] = {
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.workspace.useGitIgnore%"
    },
    ["Lua.workspace.maxPreload"] = {
        scope = 'resource',
        type = "integer",
        default = 5000,
        markdownDescription = "%config.workspace.maxPreload%"
    },
    ["Lua.workspace.preloadFileSize"] = {
        scope = 'resource',
        type = "integer",
        default = 500,
        markdownDescription = "%config.workspace.preloadFileSize%"
    },
    ["Lua.workspace.library"] = {
        scope = 'resource',
        type = "array",
        items = {
            type = "string"
        },
        markdownDescription = "%config.workspace.library%"
    },
    ['Lua.workspace.checkThirdParty'] = {
        scope = 'resource',
        type  = 'boolean',
        default = true,
        markdownDescription = "%config.workspace.checkThirdParty%"
    },
    ["Lua.workspace.userThirdParty"] = {
        scope = 'resource',
        type = "array",
        items = {
            type = "string"
        },
        markdownDescription = "%config.workspace.userThirdParty%"
    },
    ["Lua.completion.enable"] = {
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.completion.enable%"
    },
    ["Lua.completion.callSnippet"] = {
        scope = 'resource',
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
        scope = 'resource',
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
        scope = 'resource',
        type  = "integer",
        default = 0,
        markdownDescription = "%config.completion.displayContext%",
    },
    ['Lua.completion.workspaceWord'] = {
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.completion.workspaceWord%"
    },
    ['Lua.completion.showWord'] = {
        scope = 'resource',
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
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.completion.autoRequire%"
    },
    ['Lua.completion.showParams'] = {
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.completion.showParams%"
    },
    ['Lua.completion.requireSeparator'] = {
        scope = 'resource',
        type = "string",
        default = '.',
        markdownDescription = "%config.completion.requireSeparator%"
    },
    ['Lua.completion.postfix'] = {
        scope = 'resource',
        type = "string",
        default = '@',
        markdownDescription = "%config.completion.postfix%"
    },
    ["Lua.semantic.enable"] = {
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.semantic.enable%"
    },
    ["Lua.semantic.variable"] = {
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.semantic.variable%"
    },
    ["Lua.semantic.annotation"] = {
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.semantic.annotation%"
    },
    ["Lua.semantic.keyword"] = {
        scope = 'resource',
        type = "boolean",
        default = false,
        markdownDescription = "%config.semantic.keyword%"
    },
    ["Lua.signatureHelp.enable"] = {
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.signatureHelp.enable%"
    },
    ['Lua.hover.enable'] = {
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.hover.enable%"
    },
    ['Lua.hover.viewString'] = {
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.hover.viewString%"
    },
    ['Lua.hover.viewStringMax'] = {
        scope = 'resource',
        type = "integer",
        default = 1000,
        markdownDescription = "%config.hover.viewStringMax%"
    },
    ['Lua.hover.viewNumber'] = {
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.hover.viewNumber%"
    },
    ['Lua.hover.previewFields'] = {
        scope = 'resource',
        type = "integer",
        default = 20,
        markdownDescription = "%config.hover.previewFields%"
    },
    ['Lua.hover.enumsLimit'] = {
        scope = 'resource',
        type = "integer",
        default = 5,
        markdownDescription = "%config.hover.enumsLimit%"
    },
    --["Lua.plugin.enable"] = {
    --    scope = 'resource',
    --    type = "boolean",
    --    default = false,
    --    markdownDescription = "%config.plugin.enable%"
    --},
    --["Lua.plugin.path"] = {
    --    scope = 'resource',
    --    type = "string",
    --    default = ".vscode/lua-plugin/*.lua",
    --    markdownDescription = "%config.plugin.path%"
    --},
    --["Lua.develop.enable"] = {
    --    scope = 'resource',
    --    type = "boolean",
    --    default = false,
    --    markdownDescription = "%config.develop.enable%"
    --},
    --["Lua.develop.debuggerPort"] = {
    --    scope = 'resource',
    --    type = "integer",
    --    default = 11412,
    --    markdownDescription = "%config.develop.debuggerPort%"
    --},
    --["Lua.develop.debuggerWait"] = {
    --    scope = 'resource',
    --    type = "boolean",
    --    default = false,
    --    markdownDescription = "%config.develop.debuggerWait%"
    --},
    --['Lua.intelliSense.searchDepth'] = {
    --    scope = 'resource',
    --    type = "integer",
    --    default = 0,
    --    markdownDescription = "%config.intelliSense.searchDepth%"
    --},
    ['Lua.window.statusBar'] = {
        scope = 'resource',
        type  = 'boolean',
        default = true,
        markdownDescription = '%config.window.statusBar%',
    },
    ['Lua.window.progressBar'] = {
        scope = 'resource',
        type  = 'boolean',
        default = true,
        markdownDescription = '%config.window.progressBar%',
    },
    ['Lua.telemetry.enable'] = {
        scope = 'resource',
        type = {"boolean", "null"},
        default = json.null,
        markdownDescription = "%config.telemetry.enable%",
        tags = {"telemetry"},
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
    ["Lua.hint.arrayIndex"] = {
        scope = 'resource',
        type = "string",
        default = "Auto",
        enum = {
            "Enable",
            "Auto",
            "Disable",
        },
        markdownEnumDescriptions = {
            "%config.hint.arrayIndex.Enable%",
            "%config.hint.arrayIndex.Auto%",
            "%config.hint.arrayIndex.Disable%",
        },
        markdownDescription = "%config.hint.arrayIndex%"
    },
    ["Lua.format.enable"] = {
        scope = 'resource',
        type = "boolean",
        default = true,
        markdownDescription = "%config.format.enable%"
    },
    ["Lua.format.defaultConfig"] = {
        scope = 'resource',
        type  = 'object',
        markdownDescription = "%config.format.defaultConfig%",
    },
    ['Lua.misc.parameters'] = {
        scope = 'resource',
        type = "array",
        items = {
            type = 'string',
        },
        markdownDescription = '%config.misc.parameters%',
    },
    ['Lua.IntelliSense.traceLocalSet'] = {
        scope = 'resource',
        type = "boolean",
        default = false,
        markdownDescription = '%config.IntelliSense.traceLocalSet%',
    },
    ['Lua.IntelliSense.traceReturn'] = {
        scope = 'resource',
        type = "boolean",
        default = false,
        markdownDescription = '%config.IntelliSense.traceReturn%',
    },
    ['Lua.IntelliSense.traceBeSetted'] = {
        scope = 'resource',
        type = "boolean",
        default = false,
        markdownDescription = '%config.IntelliSense.traceBeSetted%',
    },
    ['Lua.IntelliSense.traceFieldInject'] = {
        scope = 'resource',
        type = "boolean",
        default = false,
        markdownDescription = '%config.IntelliSense.traceFieldInject%',
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
