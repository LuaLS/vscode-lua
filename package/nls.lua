local example = require 'package.nls-example'

return {
    ['config.awakened.cat']               = 'PLAY WITH ME >_<\n\n(This will enable the beta version which is still in development. Feedback is welcome! Reload the window after changing this option!)',
    ["config.runtime.version"]            = "Lua runtime version.",
    ["config.runtime.path"]               = "`package.path`",
    ["config.runtime.special"]            = [[The custom global variables are regarded as some special built-in variables, and the language server will provide special support
The following example shows that 'include' is treated as' require '.
]] .. example.special,
    ["config.runtime.unicodeName"]        = "Allows Unicode characters in name.",
    ["config.diagnostics.enable"]         = "Enable diagnostics.",
    ["config.diagnostics.disable"]        = "Disabled diagnostic (Use code in hover brackets).\n",-- .. example.disable,
    ["config.diagnostics.globals"]        = "Defined global variables.\n",-- .. example.globals,
    ["config.diagnostics.severity"]       = "Modified diagnostic severity.\n",-- .. example.severity,
    ["config.diagnostics.neededFileStatus"]     = "If you want to check only opened files, choice Opened; else choice Any.\n",-- .. example.neededFileStatus,
    ["config.diagnostics.workspaceDelay"] = "Latency (milliseconds) for workspace diagnostics. When you start the workspace, or edit any file, the entire workspace will be re-diagnosed in the background. Set to negative to disable workspace diagnostics.",
    ["config.diagnostics.workspaceRate"]  = "Workspace diagnostics run rate (%). Decreasing this value reduces CPU usage, but also reduces the speed of workspace diagnostics. The diagnosis of the file you are currently editing is always done at full speed and is not affected by this setting.",
    ["config.workspace.ignoreDir"]        = "Ignored directories (Use `.gitignore` grammar).\n",-- .. example.ignoreDir,
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
    ['config.completion.displayContext']         = "Previewing the relevant code snippet of the suggestion may help you understand the usage of the suggestion. The number set indicates the number of intercepted lines in the code fragment. If it is set to `0`, this feature can be disabled.",
    ['config.color.mode']                        = "Color mode.",
    ['config.color.mode.Semantic']               = "Semantic color (Testing. Your color theme must support semantic coloring to be effective.).",
    ['config.color.mode.Grammar']                = "Grammar color.",
    ['config.signatureHelp.enable']              = "Enable signature help.",
    ['config.hover.enable']                      = "Enable hover.",
    ['config.hover.viewString']                  = "Hover to view the contents of a string (only if the literal contains an escape character).",
    ['config.hover.viewStringMax']               = "The maximum length of a hover to view the contents of a string.",
    ['config.hover.viewNumber']                  = "Hover to view numeric content (only if literal is not decimal).",
    ['config.hover.fieldInfer']                  = "When hovering to view a table, type infer will be performed for each field. When the accumulated time of type infer reaches the set value (MS), the type infer of subsequent fields will be skipped.",
    ['config.hover.previewFields']               = "When hovering to view a table, limits the maximum number of previews for fields.",
    ['config.zzzzzz.cat']                        = 'DONT TOUCH ME, LET ME SLEEP >_<',
    ['config.develop.enable']                    = 'Developer mode. Do not enable, performance will be affected.',
    ['config.develop.debuggerPort']              = 'Listen port of debugger.',
    ['config.develop.debuggerWait']              = 'Suspend before debugger connects.',
    ['config.intelliSense.searchDepth']          = 'Set the search depth for IntelliSense. Increasing this value increases accuracy, but decreases performance. Different workspace have different tolerance for this setting. Please adjust it to the appropriate value.',
    ['config.intelliSense.fastGlobal']          = 'In the global variable completion, and view `_G` suspension prompt. This will slightly reduce the accuracy of type speculation, but it will have a significant performance improvement for projects that use a lot of global variables.',
    ['config.telemetry.enable']                 = [[
Enable telemetry to send your editor information and error logs over the network
* [What data will be sent](https://github.com/sumneko/lua-language-server/blob/master/script/service/telemetry.lua)
* [How to use this data](https://github.com/sumneko/lua-telemetry-server/tree/master/method)
]],
}
