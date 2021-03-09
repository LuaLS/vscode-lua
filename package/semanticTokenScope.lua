return {
    -- Lua库函数，如 print
    ["namespace.static"] = {"support.function.lua"},
    -- Lua库常量，如 _G
    ["namespace.readonly"] = {"constant.language.lua"},
    -- 全局变量
    ["namespace.deprecated"] = {"entity.name.label"},
    -- 参数声明
    ['parameter.declaration'] = {"variable.parameter"},
    -- table的field声明
    ['property.declaration'] = {"entity.other.attribute"},
    -- 局部变量
    ['variable'] = {"variable.other.lua"},
    -- const 变量
    ['variable.static'] = {'variable.other.constant.lua'},
    -- close 变量
    ['variable.abstract'] = {'variable.other.constant.lua'},
    -- 自定义函数声明
    ['interface.declaration'] = {"entity.name.function.lua"},
}
