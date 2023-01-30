local fs = require 'bee.filesystem'

local currentPath = debug.getinfo(1, 'S').source:sub(2)
local rootPath = currentPath:gsub('[^/\\]-$', '')
package.path = package.path
    .. ';' .. rootPath .. '?.lua'
    .. ';' .. rootPath .. 'server/script/?.lua'

local json          = require 'json-beautify'
local configuration = require 'server.tools.configuration'
local fsu           = require 'fs-utility'
local lloader       = require 'locale-loader'
local diagd         = require 'proto.diagnostic'
local util          = require 'utility'

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
    local mt = getmetatable(t)
    if mt then
        setmetatable(nt, mt)
    end
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
local function mergeDiagnosticGroupLocale(locale)
    for groupName, names in pairs(diagd.diagnosticGroups) do
        local key = ('config.diagnostics.%s'):format(groupName)
        local list = {}
        for name in util.sortPairs(names) do
            list[#list+1] = ('* %s'):format(name)
        end
        local desc = table.concat(list, '\n')
        locale[key] = desc
    end
end

for dirPath in fs.pairs(fs.path 'server/locale') do
    local lang    = dirPath:filename():string()
    local nlsPath = dirPath / 'setting.lua'
    local text    = fsu.loadFile(nlsPath)
    if not text then
        goto CONTINUE
    end
    local nls = lloader(text, nlsPath:string())
    -- add `config.diagnostics.XXX`
    mergeDiagnosticGroupLocale(nls)

    local setting = {
        title       = 'setting',
        description = 'Setting of sumneko.lua',
        type        = 'object',
        properties  = copyWithNLS(configuration, function (str)
            return str:gsub('^%%(.+)%%$', function (key)
                if nls[key] then
                    return nls[key]
                else
                    nls[key] = ''
                    return ''
                end
            end)
        end),
    }

    local schemaName, nlsName
    if lang == 'en-us' then
        schemaName = 'setting/schema.json'
        nlsName    = 'package.nls.json'
    else
        schemaName = 'setting/schema-' .. lang .. '.json'
        nlsName    = 'package.nls.' .. lang .. '.json'
    end

    fsu.saveFile(fs.path(schemaName), json.beautify(setting, encodeOption))
    fsu.saveFile(fs.path(nlsName),    json.beautify(nls, encodeOption))
    ::CONTINUE::
end
