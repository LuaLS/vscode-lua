local fs = require 'bee.filesystem'

require 'utility'
local json = require 'json'
local configuration = require 'package.configuration'

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

    io.save(fs.path'setting/schema'..lang..'.json', json.encode(setting))
end
