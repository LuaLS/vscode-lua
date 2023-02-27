@echo off

echo Building VS Code Extension Client...

echo Compiling TypeScript...
cd client
call npm i
call npm run build

echo Building Addon Manager WebVue...
cd webvue
call npm i
call npm run build

echo Build complete!
