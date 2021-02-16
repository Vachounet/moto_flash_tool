const fs = require("fs");
const colors = require("colors");
const inquirer = require("inquirer");
const flash_firmware = require("./flash");

function flash() {
  fs.readdir("firmware", (err, files) => {
    if (!files || files.length === 0) {
      console.log("\nNo firmwares found in the firmware folder".brightRed);
      console.log(
        "Put one manually or use Check firmwares from main menu\n".brightRed
      );
      require("./prompt").show_menu();
      return;
    }

    const menu = {
      type: "list",
      message: "Select a file/folder",
      name: "firmware",
      pageSize: 500,
      choices: [],
    };

    files.forEach((file) => {
      menu.choices.push({
        name: file + '\n',
      });
    });

    menu.choices.push({
      name: "Back to main menu\n",
      value: "main_menu",
    });

    inquirer.prompt([menu]).then(async (answers) => {
      if (answers.firmware === "main_menu") {
        require("./prompt").show_menu();
      } else {
        flash_firmware(answers.firmware);
      }
    });
  });
}

async function check_firmware() {
  const { adbExec } = require("./adb");
  const fastboot = require("./fastboot");
  const { show_menu, show_firmwares } = require("./prompt");
  const firmware_request = require("./firmware_check");
  let sku, result;
  try {
    result = await adbExec({
      cmd: "shell getprop ro.boot.hardware.sku",
    });
  } catch (e) {
    result = await fastboot({ cmd: "getvar sku" });
    sku = result.split("sku: ")[1].split("\n")[0].trim();
    firmware_request("sku", sku, (firmwares) => {
      if (firmwares && firmwares.length > 0) {
        show_firmwares(firmwares);
      } else {
        console.log("No firmwares found.");
        show_menu();
      }
    });
    return;
  }
  sku = result.trim();
  firmware_request("sku", sku, (firmwares) => {
    if (firmwares && firmwares.length > 0) {
      show_firmwares(firmwares);
    } else {
      console.log("No firmwares found.");
      show_menu();
    }
  });
}

module.exports = { flash, check_firmware };
