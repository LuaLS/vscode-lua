local fs = require 'bee.filesystem'

require 'utility'
local json = require 'json'
local configuration = require 'package.configuration'

local setting = {
    ['$schema'] = '',
    title       = 'setting',
    description = 'Setting of sumneko.lua',
    type        = 'object',
    properties  = configuration,
}

io.save(fs.path'setting/schema.json', json.encode(setting))
