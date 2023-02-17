#!/bin/bash

set -e

bold=$(tput bold)
normal=$(tput sgr0)

black='\e[0;30m'
red='\e[0;31m'
green='\e[0;32m'
cyan='\e[0;36m'

echo -e "${red}${bold}Building VS Code Extension Client..."

echo -e "${cyan}${bold}Compiling TypeScript...${black}${normal}"
cd client
npm i
npm run build

echo -e "${green}${bold}Building Addon Manager WebVue...${black}${normal}"
cd webvue
npm i
npm run build

echo -e "${green}${bold}Build complete!${black}${normal}"
