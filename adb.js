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

module.exports = { adbExec, hasAdbConnectedDevice };
