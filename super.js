/* eslint-disable no-sync */
/* eslint-disable import/no-commonjs */
const fs = require("fs");
const lpunpack = require("./lpunpack");
const simg2img = require("./simg2img");
const { fastbootExec, isUserspace } = require("./fastboot");

async function extractSuper(firmwareFolder) {
  if (!fs.existsSync(firmwareFolder + "/vendor_a.img")) {
    console.log("\nExtracting super image");
    if (!fs.existsSync(firmwareFolder + "/super.img")) {
      if (process.platform === "linux") {
        await simg2img({
          cmd:
            firmwareFolder +
            "/super.img_sparsechunk.* " +
            firmwareFolder +
            "/super.img",
        });
      } else if (process.platform === "win32") {
        await simg2img({
          cmd:
            "/decompress " +
            firmwareFolder +
            "/super.img_sparsechunk.0 " +
            firmwareFolder +
            "/super.img",
        });
      }
    }

    await lpunpack({
      cmd: firmwareFolder + "/super.img " + firmwareFolder + "/",
    });

    console.log("\nExtracted");
  }
}

async function flashSuperBPartitions(firmwareFolder) {
  if (!isUserspace()) {
    console.log("\nReboot to fastbootd");
    await fastbootExec({ cmd: "reboot fastboot" });
    while (true) {
      const fbDevice = await fastbootExec({ cmd: "devices" });
      if (!fbDevice) continue;
      break;
    }
  }

  try {
    await fastbootExec({ cmd: "delete-logical-partition product_b" });
  } catch (e) {
    // ignore, partition doesn't exists
  }

  try {
    await fastbootExec({ cmd: "delete-logical-partition vendor_b" });
  } catch (e) {
    // ignore, partition doesn't exists
  }

  let partitionSize = 0x0;
  try {
    let partitionSize = await fastbootExec({
      cmd: "getvar partition-size:vendor_a",
    });
    partitionSize = partitionSize.split(":")[2].trim().split("\n")[0];
    await fastbootExec({
      cmd: "create-logical-partition vendor_b " + partitionSize,
    });
  } catch (e) {
    console.log("\nUnable to create vendor_b");
  }

  try {
    partitionSize = await fastbootExec({
      cmd: "getvar partition-size:product_a",
    });
    partitionSize = partitionSize.split(":")[2].trim().split("\n")[0];
    await fastbootExec({
      cmd: "create-logical-partition product_b " + partitionSize,
    });
  } catch (e) {
    console.log("\nUnable to create product_b");
  }

  console.log("\nFlashing system/product/vendor to slot b");

  let result = "";
  try {
    result = await fastbootExec({
      cmd: "flash product_b " + firmwareFolder + "/product_a.img",
    });
    console.log(result);
  } catch (e) {
    console.log("\nUnable to flash product_b");
  }

  try {
    result = await fastbootExec({
      cmd: "flash vendor_b " + firmwareFolder + "/vendor_a.img",
    });
    console.log(result);
  } catch (e) {
    console.log("\nUnable to flash vendor_b");
  }

  try {
    result = await fastbootExec({
      cmd: "flash system_b " + firmwareFolder + "/system_a.img",
    });
    console.log(result);
  } catch (e) {
    console.log("\nUnable to flash system_b");
  }

  console.log("Done");
}

module.exports = { extractSuper, flashSuperBPartitions };
