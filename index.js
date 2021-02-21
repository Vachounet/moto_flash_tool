/* eslint-disable import/no-commonjs */
/* eslint-disable no-sync */
const fs = require("fs");
const colors = require("colors");
const { adbExec, hasAdbConnectedDevice, loadProperties } = require("./adb");
const { fastbootExec, isUserspace, loadVariables } = require("./fastboot");

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
    const variables = await loadVariables();
    console.log("Connected device :".bgBrightWhite.black);
    console.log("Device : " + variables.product);
    if (!userSpace) {
      console.log("SKU : " + variables.sku);
    }
    console.log("Current slot : " + variables["current-slot"]);

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
