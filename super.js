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

  await fastbootExec({ cmd: "delete-logical-partition product_b" });
  await fastbootExec({ cmd: "delete-logical-partition vendor_b" });

  let partitionSize = await fastbootExec({
    cmd: "getvar partition-size:vendor_a",
  });
  partitionSize = partitionSize.split(":")[2].trim().split("\n")[0];
  await fastbootExec({
    cmd: "create-logical-partition vendor_b " + partitionSize,
  });

  partitionSize = await fastbootExec({
    cmd: "getvar partition-size:product_a",
  });
  partitionSize = partitionSize.split(":")[2].trim().split("\n")[0];
  await fastbootExec({
    cmd: "create-logical-partition product_b " + partitionSize,
  });

  console.log("\nFlashing system/product/vendor to slot b");

  let result = await fastbootExec({
    cmd: "flash product_b " + firmwareFolder + "/product_a.img",
  });
  console.log(result)

  result = await fastbootExec({
    cmd: "flash vendor_b " + firmwareFolder + "/vendor_a.img",
  });
  console.log(result)

  result = await fastbootExec({
    cmd: "flash system_b " + firmwareFolder + "/system_a.img",
  });
  console.log(result)

  console.log("Done");
}

module.exports = { extractSuper, flashSuperBPartitions };
