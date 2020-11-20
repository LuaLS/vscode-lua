local currentPath = debug.getinfo(1, 'S').source:sub(2)
local rootPath = currentPath:gsub('[^/\\]-$', '')
if rootPath == '' then
    rootPath = './'
end
loadfile(rootPath .. 'server/platform.lua')('script')
require 'bee'
local fs         = require 'bee.filesystem'
local subprocess = require 'bee.subprocess'
local platform   = require 'bee.platform'
local thread     = require 'bee.thread'
local fsu        = require 'fs-utility'
--dofile(rootPath .. 'server/test.lua')

package.path = package.path
    .. ';' .. rootPath .. '/?.lua'
ROOT = fs.path(rootPath)
require 'package.build'
dofile(rootPath .. 'setting/build.lua')
local json = require 'json'

local function loadPackage()
    local buf = fsu.loadFile(ROOT / 'package.json')
    if not buf then
        error(ROOT:string())
    end
    local package = json.decode(buf)
    return package.version
end

local function updateNodeModules(out, postinstall)
    local current = fs.current_path()
    fs.current_path(out)
    local cmd = io.popen(postinstall)
    for line in cmd:lines 'l' do
        print(line)
    end
    local suc = cmd:close()
    if not suc then
        error('更新NodeModules失败！')
    end
    fs.current_path(current)
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
                    for path in source:list_directory() do
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
    local exe = root / 'bin' / platform.OS / 'lua-language-server' .. ext
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
                    for path in target:list_directory() do
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

local out = createDirectory(version)
print('输出目录为：', out)
print('清理目录...')
removeFiles(out)(true)

print('开始复制文件...')
local count = copyFiles(ROOT , out) {
    ['client'] = {
        ['node_modules']      = true,
        ['out']               = true,
        ['package-lock.json'] = true,
        ['package.json']      = true,
        ['tsconfig.json']     = true,
        ['3rd']               = {
            ['vscode-lua-doc']  = {
                ['doc']             = true,
                ['extension.js']    = true,
            },
        },
    },
    ['server'] = {
        ['bin']               = true,
        ['libs']              = true,
        ['locale']            = true,
        ['script']            = true,
        ['main.lua']          = true,
        ['platform.lua']      = true,
        ['test']              = true,
        ['test.lua']          = true,
        ['debugger.lua']      = true,
        ['meta']              = {
            ['template']      = true
        },
    },
    ['images'] = {
        ['logo.png'] = true,
    },
    ['syntaxes']               = true,
    ['package-lock.json']      = true,
    ['package.json']           = true,
    ['README.md']              = true,
    ['tsconfig.json']          = true,
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
    },
}

print('完成')

for i = 5, 0, -1 do
    print('将在' .. i .. '秒后发布版本：', version)
    thread.sleep(1)
end

local vsix = ROOT / 'publish' / ('lua-' .. version .. '.vsix')
local p, err = subprocess.shell {
    'vsce', 'package',
    '-o', vsix,
    cwd = out,
    stderr = true,
}
if not p then
    error(err)
end
p:wait()
print(p.stderr:read 'a')

local p =subprocess.shell {
    'git', 'add', '*',
}
p:wait()

local p = subprocess.shell {
    'git', 'commit', '-m', tostring(version),
}
p:wait()

local p = subprocess.shell {
    'git', 'tag', 'v' .. tostring(version),
}
p:wait()

local p = subprocess.shell {
    'git', 'push',
}
p:wait()

local p = subprocess.shell {
    'git', 'push', '--tags',
}
p:wait()

local p, err = subprocess.shell {
    'vsce', 'publish',
    cwd = out,
    stderr = true,
    stdout = true,
}
if not p then
    error(err)
end
p:wait()

print('完成')
