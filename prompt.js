const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");
const { adbExec } = require("./adb");

const { flash, check_firmware } = require("./actions");

function show_menu() {
  inquirer
    .prompt([
      {
        type: "list",
        message: "Select an action",
        name: "action",
        choices: [
          {
            name: "Flash stock firmware",
            value: "flash",
          },
          {
            name: "Check firmwares for my device",
            value: "check_firmware",
          },
          {
            name: "Exit",
            value: "exit",
          },
        ],
      },
    ])
    .then((answers) => {
      switch (answers.action) {
        case "flash":
          flash();
          break;
        case "check_firmware":
          check_firmware();
          break;
        case "exit":
          adbExec({ cmd: "stop-server" });
          process.exit(0);
      }
    });
}

function show_firmwares(firmwares) {
  const menu = {
    type: "list",
    message: "Select a firmware to download",
    name: "firmware",
    pageSize: 500,
    choices: [],
  };

  firmwares.forEach((firmware) => {
    menu.choices.push({
      name:
        firmware.carrierName.join(" ") +
        " :\n " +
        firmware.name.split("_subsi")[0] +
        "\n",
      value: firmware.url,
    });
  });

  menu.choices.push({
    name: "Back to main menu\n",
    value: "main_menu",
  });

  inquirer.prompt(menu).then((answers) => {
    if (answers.firmware === "main_menu") {
      show_menu();
    } else {
      const download = require("./download");
      if (
        !fs.existsSync(
          path.resolve("firmware", answers.firmware.split("/").pop())
        )
      ) {
        download(
          answers.firmware,
          path.resolve("firmware", answers.firmware.split("/").pop()),
          () => {
            console.log("Firmwared downloaded");
            show_menu();
          }
        );
      } else {
        console.log("Firmware already downloaded");
        show_menu();
      }
    }
  });
}

module.exports = { show_menu, show_firmwares };
