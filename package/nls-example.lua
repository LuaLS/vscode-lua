return {
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
    neededFileStatus = [[
```json
"Lua.diagnostics.neededFileStatus" : {
    "undefined-global": "Any",
    "undefined-field" : "Opened"
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
]],
    special = [[
```json
"Lua.runtime.special" : {
    "include" : "require"
}
```
]]
}
