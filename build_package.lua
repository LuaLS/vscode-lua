local json = require 'json'
local diagDefault = require 'constant.DiagnosticDefaultSeverity'

local VERSION = "0.16.4"

local package = {
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
        "LSP",
        "GoTo Definition",
        "IntelliSense"
    },
    engines = {
        vscode = "^1.23.0"
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
            properties = {
                ["Lua.runtime.version"] = {
                    scope = "resource",
                    type = "string",
                    default = "Lua 5.3",
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
                    default = 300,
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
                --["Lua.color.mode"] = {
                --    scope = "resource",
                --    type = "string",
                --    default = "Grammar",
                --    enum = {
                --        "Grammar",
                --        "Semantic",
                --    },
                --    markdownEnumDescriptions = {
                --        "%config.color.mode.Grammar%",
                --        "%config.color.mode.Semantic%",
                --    },
                --    markdownDescription = "%config.color.mode%"
                --},
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
                --["Lua.awakened.cat"] = {
                --    scope = "resource",
                --    type = "boolean",
                --    default = false,
                --    markdownDescription = "%config.awakened.cat%"
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
            }
        },
        grammars = {
            {
                language = "lua",
                scopeName = "source.lua",
                path = "./syntaxes/lua.tmLanguage.json"
            }
        }
    },
	__metadata = {
		id = "3a15b5a7-be12-47e3-8445-88ee3eabc8b2",
		publisherDisplayName = "sumneko",
		publisherId = "fb626675-24cf-4881-8c13-b465f29bec2f",
	},
}

local DiagSeverity = package.contributes.configuration.properties["Lua.diagnostics.severity"].properties
for name, level in pairs(diagDefault) do
    DiagSeverity[name] = {
        scope = 'resource',
        type = 'string',
        default = level,
        enum = {
            'Error',
            'Warning',
            'Information',
            'Hint',
        }
    }
end

package.version = VERSION

print('生成 package.json')
io.save(ROOT / 'package.json', json.encode(package) .. '\r\n')

local example = {
    library = [[
```json
"Lua.workspace.library": {
    "C:/lua": true,
    "../lib": [
        "temp/*"
    ]
}
```
]],
    disable = [[
```json
"Lua.diagnostics.disable" : [
    "unused-local",
    "lowercase-global"
]
```
]],
    globals = [[
```json
"Lua.diagnostics.globals" : [
    "GLOBAL1",
    "GLOBAL2"
]
```
]],
    severity = [[
```json
"Lua.diagnostics.severity" : {
    "redefined-local" : "Warning",
    "emmy-lua" : "Hint"
}
```
]],
    ignoreDir = [[
```json
"Lua.workspace.ignoreDir" : [
    "temp/*.*",
    "!temp/*.lua"
]
```
]]
}

print('生成 package.nls.json')
io.save(ROOT / 'package.nls.json', json.encode {
    ["config.runtime.version"]            = "Lua runtime version.",
    ["config.runtime.path"]               = "`package.path`",
    ["config.diagnostics.enable"]         = "Enable diagnostics.",
    ["config.diagnostics.disable"]        = "Disabled diagnostic (Use code in hover brackets).\n" .. example.disable,
    ["config.diagnostics.globals"]        = "Defined global variables.\n" .. example.globals,
    ["config.diagnostics.severity"]       = "Modified diagnostic severity.\n" .. example.severity,
    ["config.workspace.ignoreDir"]        = "Ignored directories (Use `.gitignore` grammar).\n" .. example.ignoreDir,
    ["config.workspace.ignoreSubmodules"] = "Ignore submodules.",
    ["config.workspace.useGitIgnore"]     = "Ignore files list in `.gitignore` .",
    ["config.workspace.maxPreload"]       = "Max preloaded files.",
    ["config.workspace.preloadFileSize"]  = "Skip files larger than this value (KB) when preloading.",
    ["config.workspace.library"]          = [[
Load external library.
This feature can load external Lua files, which can be used for definition, automatic completion and other functions. Note that the language server does not monitor changes in external files and needs to restart if the external files are modified.
The following example shows loaded files in `C:/lua` and `../lib` ,exclude `../lib/temp`.
]] .. example.library,
    ['config.completion.enable']                 = 'Enable completion.',
    ['config.completion.callSnippet']            = 'Shows function call snippets.',
    ['config.completion.callSnippet.Disable']    = "Only shows `function name`.",
    ['config.completion.callSnippet.Both']       = "Shows `function name` and `call snippet`.",
    ['config.completion.callSnippet.Replace']    = "Only shows `call snippet.`",
    ['config.completion.keywordSnippet']         = 'Shows keyword syntax snippets.',
    ['config.completion.keywordSnippet.Disable'] = "Only shows `keyword`.",
    ['config.completion.keywordSnippet.Both']    = "Shows `keyword` and `syntax snippet`.",
    ['config.completion.keywordSnippet.Replace'] = "Only shows `syntax snippet`.",
    ['config.color.mode']                        = "Color mode.",
    ['config.color.mode.Semantic']               = "Semantic color (test).",
    ['config.color.mode.Grammar']                = "Grammar color.",
    ['config.awakened.cat']                      = 'PLAY WITH ME >_<\n\n(This will enable the beta version which is still in development. Feedback is welcome! Reload the window after changing this option!)',
    ['config.develop.enable']                    = 'Developer mode. Do not enable, performance will be affected.',
    ['config.develop.debuggerPort']              = 'Listen port of debugger.',
    ['config.develop.debuggerWait']              = 'Suspend before debugger connects.',
})

print('生成 package.nls.zh-cn.json')
io.save(ROOT / 'package.nls.zh-cn.json', json.encode {
    ["config.runtime.version"]            = "Lua运行版本。",
    ["config.runtime.path"]               = "`package.path`",
    ["config.diagnostics.enable"]         = "启用诊断。",
    ["config.diagnostics.disable"]        = "禁用的诊断（使用浮框括号内的代码）。\n" .. example.disable,
    ["config.diagnostics.globals"]        = "已定义的全局变量。\n" .. example.globals,
    ["config.diagnostics.severity"]       = "修改诊断等级。\n" .. example.severity,
    ["config.workspace.ignoreDir"]        = "忽略的目录（使用 `.gitignore` 语法）。\n" .. example.ignoreDir,
    ["config.workspace.ignoreSubmodules"] = "忽略子模块。",
    ["config.workspace.useGitIgnore"]     = "忽略 `.gitignore` 中列举的文件。",
    ["config.workspace.maxPreload"]       = "最大预加载文件数。",
    ["config.workspace.preloadFileSize"]  = "预加载时跳过大小大于该值（KB）的文件。",
    ["config.workspace.library"]          = [[
加载外部函数库。
该功能可以加载外部的Lua文件，用于函数定义、自动完成等功能。注意，语言服务不会监视外部文件的变化，如果修改了外部文件需要重启。
下面这个例子表示加载`C:/lua`与`../lib`中的所有文件，但不加载`../lib/temp`中的文件。
]] .. example.library,
    ['config.completion.enable']                 = '启用自动完成。',
    ['config.completion.callSnippet']            = '显示函数调用片段。',
    ['config.completion.callSnippet.Disable']    = "只显示 `函数名`。",
    ['config.completion.callSnippet.Both']       = "显示 `函数名` 与 `调用片段`。",
    ['config.completion.callSnippet.Replace']    = "只显示 `调用片段`。",
    ['config.completion.keywordSnippet']         = '显示关键字语法片段',
    ['config.completion.keywordSnippet.Disable'] = "只显示 `关键字`。",
    ['config.completion.keywordSnippet.Both']    = "显示 `关键字` 与 `语法片段`。",
    ['config.completion.keywordSnippet.Replace'] = "只显示 `语法片段`。",
    ['config.color.mode']                        = "着色模式。",
    ['config.color.mode.Semantic']               = "语义着色（测试）。",
    ['config.color.mode.Grammar']                = "语法着色。",
    ['config.awakened.cat']                      = 'PLAY WITH ME >_<\n\n（这会启用还处于开发中的beta版，欢迎测试反馈！改变此选项需要重载窗口！）',
    ['config.develop.enable']                    = '开发者模式。请勿开启，会影响性能。',
    ['config.develop.debuggerPort']              = '调试器监听端口。',
    ['config.develop.debuggerWait']              = '调试器连接之前挂起。',
})
