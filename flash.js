/* eslint-disable no-sync */
/* eslint-disable import/no-commonjs */
const fs = require("fs");
const parse = require("xml-parser");
const { fastbootExec, isUserspace } = require("./fastboot");
const { adbExec } = require("./adb");
const { extractSuper, flashSuperBPartitions } = require("./super");
const { extractBpartitions, flashBpartitions } = require("./ab");
const path = require("path");
const inquirer = require("inquirer");
const { extractFirmware } = require("./extract");
const util = require("util");
const readFile = util.promisify(fs.readFile);
const { starExec, copyStarBinary, moveStarFiles } = require("./star");
const { show_menu } = require("./prompt");

async function flash_firmware(file, extractOnly) {
  const firmwarePath = path.resolve("firmware");
  const folder = file.replace(".zip", "");

  const firmwareFolder = path.resolve(firmwarePath, folder).trim();
  const filePath = path.resolve(firmwarePath, file).trim();

  console.log("\nChecking device state");

  // Reboot to bootloader if device has OS booted
  const devices = await adbExec({ cmd: "devices" });
  const isOSMode = devices.split("\n").length === 4;
  if (isOSMode) {
    console.log("\nRebooting device to bootloader mode");
    await adbExec({ cmd: "reboot bootloader" });
    while (true) {
      const fbDevice = await fastbootExec({ cmd: "devices" });
      if (!fbDevice) continue;
      break;
    }
  }

  console.log("\nStarting flash process for " + file);

  // Extract firmaware to it's own directory
  await extractFirmware(firmwareFolder, filePath);

  // Load servicefile content
  const serviceFileContent = await readFile(
    firmwareFolder + "/servicefile.xml"
  );

  // Parse servicefile content
  const obj = parse(serviceFileContent.toString());
  const steps = obj.root.children[1].children;

  // Check if servicefile has super entries
  // to determine if it's a device with
  //dynamic partitions
  const isSuperDevice =
    steps.filter(
      (step) =>
        step.attributes.filename && step.attributes.filename.includes("super")
    ).length > 0;

  const isABDevice =
    steps.filter(
      (step) =>
        step.attributes.filename &&
        step.attributes.filename.includes("system_a")
    ).length > 0;

  // Unsparse and extract super images for
  // devices with dynamic partitions
  if (isSuperDevice) {
    console.log("\nDevice is using dynamic partition");
    console.log("\nExtracting super image");
    await extractSuper(firmwareFolder);
    console.log("\nDone");
  }

  // Unsparse and extract system and vendor images for
  // A/B devices without dynamic partitions
  if (isABDevice) {
    console.log("\nDevice is using A/B partitions");
    console.log("\nUnsparse system and vendor image");
    await extractBpartitions(firmwareFolder);
    console.log("\nDone");
  }

  try {
    // Switch slot for A/B devices
    if (isSuperDevice || isABDevice) {
      console.log("\nSwitch active slot to a");
      await fastbootExec({ cmd: "--set-active=a" });
    }
  } catch (e) {
    //non A/B device
  }

  // Copy star binary to firmware folder
  await copyStarBinary(firmwareFolder);

  // Cleanup previous xmls to avoid wrong picking
  const rootfiles = fs.readdirSync(path.resolve());
  const xmlFiles = rootfiles.filter((file) => file.endsWith(".xml"));
  if (xmlFiles && xmlFiles.length > 0) {
    xmlFiles.forEach((xml) => {
      fs.unlinkSync(path.resolve(xml));
    });
  }

  // If firmware includes bootloader.img
  // extract it using star tool and flash
  // partitions to both slot
  if (fs.existsSync(firmwareFolder + "/bootloader.img")) {
    await starExec("bootloader.img", firmwareFolder);
    let bootloaderFiles;
    try {
      bootloaderFiles = await readFile(path.resolve("bootloader.default.xml"));
    } catch (e) {
      // Fall back to default.xml
      bootloaderFiles = await readFile(path.resolve("default.xml"));
    }

    const mbns = parse(bootloaderFiles.toString());
    for (let m = 0; m < mbns.root.children.length; m++) {
      const mbn = mbns.root.children[m];
      if (!mbn.attributes.filename) continue;
      await moveStarFiles(
        path.resolve(mbn.attributes.filename),
        path.resolve(firmwareFolder, mbn.attributes.filename)
      );

      if (!extractOnly) {
        console.log(
          "\nFlashing " +
            mbn.attributes.filename +
            " to " +
            mbn.attributes.partition
        );

        const result = await fastbootExec({
          cmd:
            "flash --slot=all " +
            mbn.attributes.partition +
            " " +
            path.resolve(firmwareFolder, mbn.attributes.filename),
        });
        console.log(result);
      }
    }
  }

  // If firmware includes radio.img
  // extract it using star tool and flash
  // partitions to both slot
  if (fs.existsSync(firmwareFolder + "/radio.img")) {
    await starExec("radio.img", firmwareFolder);
    let radioFiles;
    try {
      radioFiles = await readFile(path.resolve("radio.default.xml"));
    } catch (e) {
      // Fall back to default.xml
      radioFiles = await readFile(path.resolve("default.xml"));
    }

    const radios = parse(radioFiles.toString());
    for (let m = 0; m < radios.root.children.length; m++) {
      const radio = radios.root.children[m];
      if (!radio.attributes.filename) continue;
      await moveStarFiles(
        path.resolve(radio.attributes.filename),
        path.resolve(firmwareFolder, radio.attributes.filename)
      );

      if (!extractOnly) {
        console.log(
          "\nFlashing " +
            radio.attributes.filename +
            " to " +
            radio.attributes.partition
        );

        const result = await fastbootExec({
          cmd:
            "flash --slot=all " +
            radio.attributes.partition +
            " " +
            path.resolve(firmwareFolder, radio.attributes.filename),
        });
        console.log(result);
      }
    }
  }

  if (extractOnly) {
    console.log("Firmware extracted".green);
    require("./prompt").show_menu();
    return;
  }

  // Loop on each partition found in servicefile
  for (let i = 0; i < steps.length; i++) {
    if (steps[i].attributes.filename) {
      // Don't flash bootloader or radio again
      if (
        steps[i].attributes.filename.includes("bootloader") ||
        steps[i].attributes.filename.includes("radio")
      )
        continue;

      //flash super.img later if fastbootd mode
      if (
        steps[i].attributes.filename.includes("super") &&
        (await isUserspace())
      )
        continue;

      if (steps[i].attributes.filename.includes("gpt") && (await isUserspace()))
        continue;

      console.log(
        "\nFlashing " +
          steps[i].attributes.filename +
          " to " +
          steps[i].attributes.partition
      );
      const result = await fastbootExec({
        cmd:
          "flash --slot=all " +
          steps[i].attributes.partition +
          " " +
          firmwareFolder +
          "/" +
          steps[i].attributes.filename,
      });
      console.log(result);
    }
  }

  // For devices with dynamic partitions
  // Flash duper partitions to slot B
  if (isSuperDevice) {
    // Flash super.img if fastbootd mode
    if (await isUserspace()) {
      const result = await fastbootExec({
        cmd: "flash super " + firmwareFolder + "/super.img",
      });

      console.log(result);
    }

    await flashSuperBPartitions(firmwareFolder);
  }

  // For A/B devices
  // Flash system and vendor to slot B
  if (isABDevice) {
    await flashBpartitions(firmwareFolder);
  }

  console.log("\nFlash process done.");

  inquirer
    .prompt([
      {
        type: "list",
        message: "Do you want to format /data ?",
        name: "format",
        choices: [
          {
            name: "Yes",
            value: "yes",
          },
          {
            name: "No",
            value: "no",
          },
        ],
      },
    ])
    .then(async (answers) => {
      switch (answers.format) {
        case "yes":
          try {
            await fastbootExec({
              cmd: "-w",
            });
          } catch (e) {
            // ignore
          }
          console.log(
            "\nDone. You can now reboot your device or flash a custom ROM"
          );
          break;
        case "no":
          console.log(
            "\nDone. You can now reboot your device or flash a custom ROM"
          );
      }
      require("./prompt").show_menu();
    });
}

module.exports = flash_firmware;
