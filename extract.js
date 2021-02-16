/* eslint-disable import/no-commonjs */
/* eslint-disable no-sync */
const fs = require("fs");
const extract = require("extract-zip");


async function extractFirmware(folder, file) {
  if (!fs.existsSync(folder)) {
    console.log("\nExtracting archive");
    await unzip(file, folder);
  }
}

async function unzip(file, firmwareFolder) {
    try {
      await extract(file, {
        dir: firmwareFolder,
      });
      console.log("\nExtraction complete");
    } catch (err) {
      console.log('Unable to extract archive, exiting');
      process.exit(0);
    }
  }

module.exports = { extractFirmware };
