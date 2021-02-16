const path = require("path");
const util = require("util");

module.exports = async function (options, next) {
	const exec = util.promisify(require("child_process").exec);

	var simg2imgBinary = "simg2img";

	if (process.platform === "linux") {
		simg2imgBinary = path.resolve("linux", "simg2img");
	} else if (process.platform === "win32") {
		simg2imgBinary = path.resolve("windows", "SparseConverter.exe");
	}

	const { stdout, stderr } = await exec(simg2imgBinary + " " + options.cmd);

	if (stderr) {
		console.error(`stderr: ${stderr}`);
		return;
	}

	return stdout;
};
