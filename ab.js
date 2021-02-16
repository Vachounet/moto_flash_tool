/* eslint-disable import/no-commonjs */
/* eslint-disable no-sync */
const fs = require("fs");
const simg2img = require("./simg2img");
const {fastbootExec} = require("./fastboot");

async function extractBpartitions(firmwareFolder) {
  if (!fs.existsSync(firmwareFolder + "/system.img")) {
    if (process.platform === "linux") {
      await simg2img({
        cmd:
          firmwareFolder +
          "/system.img_sparsechunk.* " +
          firmwareFolder +
          "/system.img",
      });
      if (!fs.existsSync(firmwareFolder + "/vendor.img")) {
        await simg2img({
          cmd:
            firmwareFolder +
            "/vendor.img_sparsechunk.* " +
            firmwareFolder +
            "/vendor.img",
        });
      }
    } else if (process.platform === "win32") {
      await simg2img({
        cmd:
          "/decompress " +
          firmwareFolder +
          "/system.img_sparsechunk.0 " +
          firmwareFolder +
          "/system.img",
      });
      if (!fs.existsSync(firmwareFolder + "/vendor.img")) {
        await simg2img({
          cmd:
            "/decompress " +
            firmwareFolder +
            "/vendor.img_sparsechunk.0 " +
            firmwareFolder +
            "/vendor.img",
        });
      }
    }

    console.log("Done");
  }
}

async function flashBpartitions(firmwareFolder) {
  console.log("\nDevice is using A/B partitions");
  console.log("\nFlashing system and vendor to slot b");

  await fastbootExec({
    cmd: "flash system_b " + firmwareFolder + "/system.img",
  });

  await fastbootExec({
    cmd: "flash vendor_b " + firmwareFolder + "/vendor.img",
  });
}

module.exports = { extractBpartitions, flashBpartitions };
