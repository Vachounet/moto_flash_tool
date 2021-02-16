/* eslint-disable import/no-commonjs */
const path = require("path");
const util = require("util");

async function fastbootExec(options) {
  const exec = util.promisify(require("child_process").exec);

  let fastbootBinary = "fastboot";

  if (process.platform === "linux") {
    fastbootBinary = path.resolve("linux", "fastboot");
  } else if (process.platform === "win32") {
    fastbootBinary = path.resolve("windows", "fastboot.exe");
  }

  const { stdout, stderr } = await exec(fastbootBinary + " " + options.cmd);

  if (stderr) {
    if (options.trim) {
      return stderr.split("\n")[0].trim();
    }
    return stderr;
  }

  if (options.trim) {
    return stdout.split("\n")[0].trim();
  }
  return stdout;
}

async function isUserspace() {
  const userpace = await fastbootExec({
    cmd: "getvar is-userspace",
    trim: true,
  });

  return userpace.includes('yes')
}

module.exports = { fastbootExec, isUserspace };
