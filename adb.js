/* eslint-disable import/no-commonjs */
const path = require("path");
const util = require("util");

async function adbExec(options) {
  const exec = util.promisify(require("child_process").exec);

  let adbBinary = "adb";

  if (process.platform === "linux") {
    adbBinary = path.resolve("linux", "adb");
  } else if (process.platform === "win32") {
    adbBinary = path.resolve("windows", "adb.exe");
  }

  const { stdout, stderr } = await exec(adbBinary + " " + options.cmd);
  if (stderr) {
    return stderr;
  }

  if (options.trim) {
    return stdout.trim();
  }

  return stdout;
}

async function hasAdbConnectedDevice() {
  const deviceOutput = await adbExec({ cmd: "devices" });
  const outputLength = deviceOutput.split("\n").length;
  return outputLength === 4;
}

async function loadProperties() {
  const getprop = await adbExec({ cmd: "shell getprop" });

  const lines = getprop.split("\n");

  const properties = [];

  lines.forEach((line) => {
    try {
      const prop = line.split(":")[0].trim();
      const value = line.split(":")[1].trim();

      if (prop.match(/\[(.*?)\]/) && value.match(/\[(.*?)\]/)) {
        const propName = prop.match(/\[(.*?)\]/)[1]
        properties[propName] = value.match(/\[(.*?)\]/)[1]
      }
    } catch (e) {
      //term.bold.red("Unable to load property : " + line);
    }
  });

  return properties;
}

module.exports = { adbExec, hasAdbConnectedDevice, loadProperties };
