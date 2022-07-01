local currentPath = debug.getinfo(1, 'S').source:sub(2)
local rootPath = currentPath:gsub('[^/\\]-$', '')
local fs         = require 'bee.filesystem'
local subprocess = require 'bee.subprocess'
local platform   = require 'bee.platform'
local thread     = require 'bee.thread'
--dofile(rootPath .. 'server/test.lua')

package.path = package.path
    .. ';' .. rootPath .. '?.lua'
    .. ';' .. rootPath .. 'server/script/?.lua'

local fsu = require 'fs-utility'
ROOT = fs.path(rootPath)
fs.current_path(ROOT)
require 'package.build'
dofile(rootPath .. 'build-settings.lua')
local json = require 'json'

local function loadPackage()
    local buf = fsu.loadFile(ROOT / 'package.json')
    if not buf then
        error(ROOT:string())
    end
    local package = json.decode(buf)
    return package.version
end

local function createDirectory(version)
    local out = ROOT / 'publish' / version
    fs.create_directories(out)
    return out
end

local function copyFiles(root, out)
    return function (dirs)
        local count = 0
        local function copy(relative, mode)
            local source = root / relative
            local target = out / relative
            if not fs.exists(source) then
                return
            end
            if fs.is_directory(source) then
                fs.create_directory(target)
                if mode == true then
                    for path in fs.pairs(source) do
                        copy(relative / path:filename(), true)
                    end
                else
                    for name, v in pairs(mode) do
                        copy(relative / name, v)
                    end
                end
            else
                fs.copy_file(source, target)
                count = count + 1
            end
        end

        copy(fs.path '', dirs)
        return count
    end
end

local function runTest(root)
    local ext = platform.OS == 'Windows' and '.exe' or ''
    local exe = root / 'bin' / 'lua-language-server' .. ext
    local test = root / 'test.lua'
    local lua = subprocess.spawn {
        exe,
        test,
        '-E',
        cwd = root,
        stdout = true,
        stderr = true,
    }
    for line in lua.stdout:lines 'l' do
        print(line)
    end
    lua:wait()
    local err = lua.stderr:read 'a'
    if err ~= '' then
        error(err)
    end
end

local function removeFiles(out)
    return function (dirs)
        local function remove(relative, mode)
            local target = out / relative
            if not fs.exists(target) then
                return
            end
            if fs.is_directory(target) then
                if mode == true then
                    for path in fs.pairs(target) do
                        remove(relative / path:filename(), true)
                    end
                    fs.remove(target)
                else
                    for name, v in pairs(mode) do
                        remove(relative / name, v)
                    end
                end
            else
                fs.remove(target)
            end
        end

        remove(fs.path '', dirs)
    end
end

local version = loadPackage()
print('版本号为：' .. version)

print('复制 readme ...')
fs.copy_file(ROOT / 'server' / 'changelog.md', ROOT / 'changelog.md', fs.copy_options.overwrite_existing)
fsu.saveFile(ROOT / 'README.md', fsu.loadFile(ROOT / 'server' / 'README.md'):gsub('%!%[build%][^\r\n]*', ''))

local out = createDirectory('test')
print('输出目录为：', out)
print('清理目录...')
removeFiles(out)(true)

print('开始复制文件...')
local count = copyFiles(ROOT , out) {
    ['client'] = {
        ['node_modules']      = true,
        ['out']               = true,
        ['package.json']      = true,
        ['3rd']               = {
            ['vscode-lua-doc']  = {
                ['doc']             = true,
                ['extension.js']    = true,
            },
        },
    },
    ['server'] = {
        ['bin']               = true,
        ['doc']               = true,
        ['locale']            = true,
        ['script']            = true,
        ['main.lua']          = true,
        ['test']              = true,
        ['test.lua']          = true,
        ['debugger.lua']      = true,
        ['changelog.md']      = true,
        ['meta']              = {
            ['template']      = true,
            ['3rd']           = true,
            ['spell']         = true,
        },
    },
    ['images'] = {
        ['logo.png'] = true,
    },
    ['syntaxes']               = true,
    ['package.json']           = true,
    ['README.md']              = true,
    ['changelog.md']           = true,
    ['package.nls.json']       = true,
    ['package.nls.zh-cn.json'] = true,
}
print(('复制了[%d]个文件'):format(count))

print('开始测试...')
runTest(out / 'server')

print('删除多余文件...')
removeFiles(out) {
    ['server'] = {
        ['log']               = true,
        ['test']              = true,
        ['test.lua']          = true,
        ['meta']              = {
            ['Lua 5.4 zh-cn'] = true,
        }
    },
}

print('完成')

for i = 5, 0, -1 do
    print('将在' .. i .. '秒后发布版本：', version)
    thread.sleep(1)
end

local function shell(command)
    command.stdout = true
    command.stderr = true
    command.searchPath = true
    local show = {}
    for _, c in ipairs(command) do
        show[#show+1] = tostring(c)
    end
    table.insert(command, 1, 'cmd')
    table.insert(command, 2, '/c')
    print(table.concat(show, ' '))
    local p, err = subprocess.spawn(command)
    if not p then
        error(err)
    end
    p:wait()
    print(p.stdout:read 'a')
    print(p.stderr:read 'a')
end

--local vsix = ROOT / 'publish' / ('lua-' .. version .. '.vsix')

--shell {
--    'vsce', 'package',
--    '-o', vsix,
--    cwd = out,
--}

shell {
    'git', 'add', '*',
}

shell {
    'git', 'commit', '-m', tostring(version),
}

shell {
    'git', 'tag', 'v' .. tostring(version),
}

shell {
    'git', 'push',
}

shell {
    'git', 'push', '--tags',
}

--shell {
--    'vsce', 'publish',
--    cwd = out,
--}

--local ovsxToken = fsu.loadFile(ROOT / 'ovsx-token')
--if ovsxToken then
--    ovsxToken = ovsxToken:match '[%w%-]+'
--    shell {
--        'npx', 'ovsx', 'publish', vsix,
--        '-p', ovsxToken
--    }
--end

print('完成')
