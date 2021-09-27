return {
    -- 局部函数 | Local function
    ['function'] = {'variable.function.lua'},
    -- 自定义函数声明 | Custom function declaration
    ['function.declaration'] = {'entity.name.function.lua'},
    -- Lua库函数，如 print | Lua library functions, such as print
    ['function.defaultLibrary'] = {'support.function.lua'},
    -- 全局函数 | Global function
    ['function.static'] = {'entity.name.function.lua'},
    -- Class method
    ['method'] = {'entity.name.function.lua'},
    -- Class method declaration
    ['method.declaration'] = {'entity.name.function.lua'},
    -- 参数声明 | Parameter declaration
    ['parameter.declaration'] = {'variable.parameter.lua'},
    -- table的field声明 | Table field access
    ['property'] = {'variable.other.property.lua'},
    -- table的field声明 | Table field statement
    ['property.declaration'] = {'entity.other.property.lua'},
    -- Regular variable (modlue-local or otherwise not scoped)
    ['variable'] = {'variable.other.lua'},
    -- close 变量 | Close variable
    ['variable.abstract'] = {'variable.other.constant.lua'},
    -- 局部变量 | Local variable
    ['variable.declaration'] = {'variable.other.lua'},
    -- Lua库常量，如 _G | Lua library constants, such as _G
    ['variable.defaultLibrary'] = {'support.constant.lua'},
    -- 局部变量 | Local variable
    ['variable.local'] = {'variable.other.lua'},
    -- const 变量 | Const variable
    ['variable.readonly'] = {'variable.other.constant.lua'},
    -- 全局变量 | Global variable
    ['variable.static'] = {'variable.other.lua'},
}
