local json = require 'json-beautify'

local VERSION = "3.15.0"

local fsu     = require 'fs-utility'
local package = json.decode(fsu.loadFile(ROOT / 'package.json'))

package.version = VERSION
-- package.__metadata = {
--     id = "3a15b5a7-be12-47e3-8445-88ee3eabc8b2",
--     publisherDisplayName = "sumneko",
--     publisherId = "fb626675-24cf-4881-8c13-b465f29bec2f",
--     targetPlatform = "win32-x64",
--     isApplicationScoped = false,
--     updated = true,
--     isPreReleaseVersion = false,
--     preRelease = false,
-- }
package.contributes.configuration = {
    title = 'Lua',
    type = 'object',
    properties = require 'server.tools.configuration',
}
package.contributes.semanticTokenScopes = {
    {
        language = 'lua',
        scopes = require 'package.semanticTokenScope',
    }
}

local encodeOption = {
    newline = '\r\n',
    indent  = '\t',
}
print('生成 package.json')
fsu.saveFile(ROOT / 'package.json', json.beautify(package, encodeOption) .. '\r\n')
