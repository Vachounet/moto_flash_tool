/* eslint-disable import/no-commonjs */
const colors = require("colors");
const inquirer = require("inquirer");
const flash_firmware = require("./flash");
const util = require("util");
const { Separator } = require("inquirer");
const readdir = util.promisify(require("fs").readdir);

async function flash() {
  const firmwareContent = await readdir("firmware", { withFileTypes: true });

  const dirs = firmwareContent.filter((dir) => dir.isDirectory());
  const files = firmwareContent.filter((file) => file.isFile());

  if (files.length === 0 && dirs.length === 0) {
    console.log("\nNo firmwares found in the firmware folder".brightRed);
    console.log(
      "Put one manually or use Check firmwares from main menu\n".brightRed
    );
    require("./prompt").show_menu(true);
    return;
  }

  const menu = {
    type: "list",
    message: "Select a file/folder",
    name: "firmware",
    pageSize: 500,
    choices: [],
  };

  if (dirs.length > 0) {
    menu.choices.push(new Separator("Folders"));

    dirs.forEach((dir) => {
      menu.choices.push({
        name: dir.name,
      });
    });
  }

  if (files.length > 0) {
    menu.choices.push(new Separator("Files"));

    files.forEach((file) => {
      menu.choices.push({
        name: file.name,
      });
    });
  }

  menu.choices.push(new Separator());

  menu.choices.push({
    name: "Back to main menu\n",
    value: "main_menu",
  });

  inquirer.prompt([menu]).then(async (answers) => {
    if (answers.firmware === "main_menu") {
      require("./prompt").show_menu(true);
    } else if (answers.firmware.includes(".zip")) {
      const extractMenu = {
        type: "confirm",
        message: "Extract only ?",
        name: "extract",
        pageSize: 500
      };
      inquirer.prompt([extractMenu]).then((extract) => {
        flash_firmware(answers.firmware, extract.extract);
      })
    } else {
      flash_firmware(answers.firmware, false);
    }
  });
}

async function check_firmware() {
  const { adbExec } = require("./adb");
  const { fastbootExec } = require("./fastboot");
  const { show_menu, show_firmwares } = require("./prompt");
  const firmware_request = require("./firmware_check");
  let sku, result;
  try {
    result = await adbExec({
      cmd: "shell getprop ro.boot.hardware.sku",
    });
    sku = result.trim();
  } catch (e) {
    result = await fastbootExec({ cmd: "getvar sku" });
    sku = result.split("sku: ")[1].split("\n")[0].trim();
  }
  
  firmware_request("sku", sku, (firmwares) => {
    if (firmwares && firmwares.length > 0) {
      show_firmwares(firmwares);
    } else {
      console.log("No firmwares found.");
      show_menu(true);
    }
  });
}

module.exports = { flash, check_firmware };
