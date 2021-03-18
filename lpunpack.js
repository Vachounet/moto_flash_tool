const path = require("path");
const util = require("util");

module.exports = async function (options) {
  const exec = util.promisify(require("child_process").exec);

  let lpunpackBinary = "lpunpack_static";

  if (process.platform === "linux") {
    lpunpackBinary = path.resolve("linux", "lpunpack_static");
  } else if (process.platform === "win32") {
    lpunpackBinary = path.resolve("windows", "superunpack.exe");
  }

  lpunpackBinary = "\"" + lpunpackBinary + "\"";

  const { stdout, stderr } = await exec(lpunpackBinary + " " + options.cmd);

  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }

  return stdout;
};
