local fs = require 'bee.filesystem'

local currentPath = debug.getinfo(1, 'S').source:sub(2)
local rootPath = currentPath:gsub('[^/\\]-$', '')
package.path = package.path
    .. ';' .. rootPath .. '?.lua'
    .. ';' .. rootPath .. 'server/script/?.lua'

local json          = require 'json-beautify'
local configuration = require 'package.configuration'
local fsu           = require 'fs-utility'
local lloader       = require 'locale-loader'

local function addSplited(t, key, value)
    t[key] = value
    for pos in key:gmatch '()%.' do
        local left = key:sub(1, pos - 1)
        local right = key:sub(pos + 1)
        local nt = t[left] or {
            properties = {}
        }
        t[left] = nt
        addSplited(nt.properties, right, value)
    end
end

local function copyWithNLS(t, callback)
    local nt = {}
    for k, v in pairs(t) do
        if type(v) == 'string' then
            v = callback(v) or v
        elseif type(v) == 'table' then
            v = copyWithNLS(v, callback)
        end
        nt[k] = v
        if type(k) == 'string' and k:sub(1, #'Lua.') == 'Lua.' then
            local shortKey = k:sub(#'Lua.' + 1)
            local ref = {
                ['$ref'] = '#/properties/' .. shortKey
            }
            addSplited(nt, shortKey, ref)
            nt[k] = nil
            nt[shortKey] = v
        end
    end
    return nt
end

local encodeOption = {
    newline = '\r\n',
    indent  = '    ',
}

for dirPath in fs.pairs(fs.path 'server/locale') do
    local lang    = dirPath:filename():string()
    local nlsPath = dirPath / 'setting.lua'
    local text    = fsu.loadFile(nlsPath)
    if not text then
        goto CONTINUE
    end
    local nls = lloader(text, nlsPath:string())

    local setting = {
        title       = 'setting',
        description = 'Setting of sumneko.lua',
        type        = 'object',
        properties  = copyWithNLS(configuration, function (str)
            return str:gsub('^%%(.+)%%$', nls)
        end),
    }

    if lang == 'en-us' then
        lang = ''
    else
        lang = '-' .. lang
    end

    fsu.saveFile(fs.path'setting/schema'..lang..'.json', json.beautify(setting, encodeOption))
    ::CONTINUE::
end
