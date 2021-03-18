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

  fastbootBinary = "\"" + fastbootBinary + "\"";

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

  return userpace.includes("yes");
}

async function loadVariables() {
  const variables = await fastbootExec({
    cmd: "getvar all"
  });

  const lines = variables.split("\n");

  const properties = [];

  lines.forEach((line) => {
    try {
      line = line.replace("(bootloader) ", "");
      const variable = line.split(":")[0].trim();
      const value = line.split(":")[1].trim();

      if (variable && value) {
        const propName = variable;
        properties[propName] = value;
      }
    } catch (e) {
      //term.bold.red("Unable to load property : " + line);
    }
  });
  return properties;
}

module.exports = { fastbootExec, isUserspace, loadVariables };
