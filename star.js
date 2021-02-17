/* eslint-disable import/no-commonjs */
const path = require("path");
const util = require("util");
const fs = require("fs");
const copyFile = util.promisify(require("fs").copyFile);
const moveFile = util.promisify(require("fs").rename);

async function starExec(filename, folder) {
  const exec = util.promisify(require("child_process").exec);

  let starBinary = "star";

  if (process.platform === "linux") {
    starBinary = path.join(folder, "star");
  } else if (process.platform === "win32") {
    starBinary = path.join(folder, "star.exe");
  }

  const { stdout, stderr } = await exec(starBinary + " -f "+folder+"/"+filename+" extract");

  if (stderr) {
    console.error(`stderr: ${stderr}`);
    return;
  }

  return stdout;
}

async function copyStarBinary(destination) {
  let starBinary = "star";

  if (process.platform === "linux") {
    starBinary = path.resolve("linux", "star");
    destination = destination + '/' + starBinary.split('/').pop()
  } else if (process.platform === "win32") {
    starBinary = path.resolve("windows", "star.exe");
    destination = destination + '\\' + starBinary.split('\\').pop();
  }

  

  await copyFile(starBinary, destination);
}

async function moveStarFiles(oldPath, newPath){
    await moveFile(oldPath, newPath);
}

module.exports = { starExec, copyStarBinary, moveStarFiles };
