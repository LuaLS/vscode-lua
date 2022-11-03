return {
    -- 局部函数 | Local function
    ['function'] = {'support.function.any-method.lua'},
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
    -- table的field访问 | Table field access
    ['property'] = {'entity.other.attribute.lua'},
    -- table的field声明 | Table field statement
    ['property.declaration'] = {'entity.other.property.lua'},
    -- Regular variable (modlue-local or otherwise not scoped)
    ['variable'] = {'variable.other.lua'},
    -- close 变量 | Close variable
    ['variable.abstract'] = {'variable.other.constant.lua'},
    -- self
    ['variable.definition'] = {'variable.language.self.lua'},
    -- 局部变量 | Local variable
    ['variable.declaration'] = {'variable.other.lua'},
    -- Lua库常量，如 _G | Lua library constants, such as _G
    ['variable.defaultLibrary'] = {'support.constant.lua'},
    -- const 变量 | Const variable
    ['variable.readonly'] = {'variable.other.constant.lua'},
    -- 全局变量 | Global variable
    ['variable.global'] = {'variable.global.lua'},
    ['keyword'] = {'keyword.control.lua'},
    ['keyword.declaration'] = {'keyword.local.lua'},
    ['keyword.readonly'] = {'constant.language.lua'},
    ['keyword.async'] = {'entity.name.tag.lua'},
    ['keyword.documentation'] = {'storage.type.annotation.lua'},
    ['operator'] = {'keyword.operator.lua'},
    ['number'] = {'constant.numeric.float.lua'},
    ['number.static'] = {'constant.numeric.integer.lua'},
    ['string'] = {'string.lua'},
    ['string.modification'] = {'constant.character.escape.lua'},
    ['string.deprecated'] = {'invalid.illegal.character.escape.lua'},

    ["struct"] = {"string.tag.lua"},
    ["struct.declaration"] = {"string.tag.lua"},
    ["typeParameter"] = {"string.tag.lua"},
    ["comment.documentation"] = {"storage.type.annotation.lua"},
    ["class"] = {"support.class.lua"},
    ["class.declaration"] = {"support.class.lua"},
    ["type"] = {"support.type.lua"},
    ["type.modification"] = {"storage.type.generic.lua"},
    ["type.readonly"] = {"storage.type.self.lua"},
    ["macro"] = {"variable.lua"},
    ["event.static"] = {"support.class.lua"},
}
