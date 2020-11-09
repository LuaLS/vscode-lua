local fs = require 'bee.filesystem'

local json = require 'json-beautify'
local configuration = require 'package.configuration'
local fsu  = require 'fs-utility'

local function copyWithNLS(t, callback)
    local nt = {}
    for k, v in pairs(t) do
        if type(v) == 'string' then
            nt[k] = callback(v) or v
        elseif type(v) == 'table' then
            nt[k] = copyWithNLS(v, callback)
        else
            nt[k] = v
        end
    end
    return nt
end

local encodeOption = {
    newline = '\r\n',
    indent  = '    ',
}
for _, lang in ipairs {'', '-zh-cn'} do
    local nls = require('package.nls' .. lang)

    local setting = {
        ['$schema'] = '',
        title       = 'setting',
        description = 'Setting of sumneko.lua',
        type        = 'object',
        properties  = copyWithNLS(configuration, function (str)
            return str:gsub('^%%(.+)%%$', nls)
        end),
    }

    fsu.saveFile(fs.path'setting/schema'..lang..'.json', json.beautify(setting, encodeOption))
end
