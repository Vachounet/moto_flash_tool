# moto-flash-tool

CLI tool to easilly download flash stock firmware on various Motorola devices.

## How it came to life

Mostly to make flash process easier for most users. Many of them can't find proper firmware for their devices, and not everyone has the knowledge to launch a bunch of commands or a script.

## Features

 - Check and lists firmwares for current connected device (Android or bootloader mode)
 - Download firmwares
 - Flash firmware, with full support for A/B devices, and A/B devices with dynamic partitions.
 - Fully populate both A and B slots for A/B devices by unpacking bootloader.img and radio.img and by flashing all partitions individually.
 

## Download

**Linux** and **Windows** available at AndroidFileHost : https://www.androidfilehost.com/?w=files&flid=323101

## Build

    git clone https://github.com/Vachounet/moto_flash_tool
    cd moto_flash_tool
    npm install

## Make packages

    npm i -g pkg
    pkg index.js --config package.json
