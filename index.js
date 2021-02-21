/* eslint-disable import/no-commonjs */
/* eslint-disable no-sync */
const fs = require("fs");
const colors = require("colors");
const { adbExec, hasAdbConnectedDevice, loadProperties } = require("./adb");
const { fastbootExec, isUserspace } = require("./fastboot");

const { show_menu } = require("./prompt");

if (!fs.existsSync("super")) {
  fs.mkdirSync("super");
}

if (!fs.existsSync("firmware")) {
  fs.mkdirSync("firmware");
}

async function start_app() {
  await adbExec({ cmd: "start-server" });
  const adbConnected = await hasAdbConnectedDevice();
  const fbDevices = await fastbootExec({ cmd: "devices" });
  const fastbootConnected = fbDevices.split("\n").length >= 2;

  console.log("\nWelcome to Motorola Flash Tool\n".bold.underline);

  console.log(
    "Telegram support group: https://t.me/motoflashtool\n".bold.underline
  );

  if (adbConnected) {
    const properties = await loadProperties();
    console.log("Connected device :".bgBrightWhite.black);
    console.log("Device : " + properties["ro.boot.device"] + "\n");
    console.log("SKU : " + properties["ro.boot.hardware.sku"] + "\n");
    console.log("Carrier : " + properties["ro.boot.carrier"] + "\n");
    console.log("Current slot : " + properties["ro.boot.slot_suffix"] + "\n");
    console.log(
      "Dynamic partitions : " + properties["ro.boot.dynamic_partitions"] + "\n"
    );
    console.log("Current mode: Android\n");
  } else if (fastbootConnected) {
    const userSpace = await isUserspace();
    console.log("Connected device :".bgBrightWhite.black);
    console.log(await fastbootExec({ cmd: "getvar product", trim: true }));
    if (!userSpace) {
      console.log(await fastbootExec({ cmd: "getvar sku", trim: true }));
    }
    console.log(await fastbootExec({ cmd: "getvar current-slot", trim: true }));

    if (!userSpace) {
      console.log("\nCurrent mode: bootloader");
    } else {
      console.log("\nCurrent mode: fastbootd");
    }
  } else {
    console.log("Please connect a device before using the tool.".brightRed);
  }

  show_menu(fastbootConnected || adbConnected);
}

start_app();
