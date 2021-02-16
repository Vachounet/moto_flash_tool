/* eslint-disable import/no-commonjs */
/* eslint-disable no-sync */
const fs = require("fs");
const colors = require("colors");
const { adbExec, hasAdbConnectedDevice } = require("./adb");
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

  console.log("\nWelcome to Motorola Flash Tool\n".bold.underline);

  console.log(
    "Telegram support group: https://t.me/motoflashtool\n".bold.underline
  );

  if (adbConnected) {
    console.log("Connected device :".bgBrightWhite.black);
    console.log(
      "Device : " +
        (await adbExec({
          cmd: "shell getprop ro.boot.device",
          trim: true,
        }))
    );
    console.log(
      "SKU : " +
        (await adbExec({
          cmd: "shell getprop ro.boot.hardware.sku",
          trim: true,
        }))
    );
    console.log(
      "Carrier : " +
        (await adbExec({
          cmd: "shell getprop ro.boot.carrier",
          trim: true,
        }))
    );
    console.log(
      "Current slot : " +
        (await adbExec({
          cmd: "shell getprop ro.boot.slot_suffix",
          trim: true,
        }))
    );
    console.log(
      "Dynamic partitions : " +
        (await adbExec({
          cmd: "shell getprop ro.boot.dynamic_partitions",
          trim: true,
        })) +
        "\n"
    );
    console.log('\nCurrent mode: android')
  } else {
    const fbDevices = await fastbootExec({ cmd: "devices" });
    const fastbootConnected = fbDevices.split("\n").length >= 2;
    const userSpace = await isUserspace()
    if (fastbootConnected) {
      console.log("Connected device :".bgBrightWhite.black);
      console.log(await fastbootExec({ cmd: "getvar product", trim: true }));
      if (!userSpace) {
        console.log(await fastbootExec({ cmd: "getvar sku", trim: true }));
      }
      console.log(
        await fastbootExec({ cmd: "getvar current-slot", trim: true })
      );

      if (!userSpace) {
        console.log('\nCurrent mode: bootloader')
      } else {
        console.log('\nCurrent mode: fastbootd')
      }
    } else {
      console.log("Please connect a device before using the tool.".brightRed);
    }
  }

  show_menu();
}

start_app();
