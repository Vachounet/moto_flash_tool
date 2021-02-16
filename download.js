const request = require("request"),
  fs = require("fs"),
  cliProgress = require("cli-progress");

module.exports = (url, filename, callback) => {
  const progressBar = new cliProgress.SingleBar(
    {
      format: "{bar} {percentage}% | ETA: {eta}s",
    },
    cliProgress.Presets.shades_classic
  );

  const file = fs.createWriteStream(filename);
  let receivedBytes = 0;

  request.post(
    {
      url: "",
      form: { file_name: url.split("/").pop() },
    },
    (err, httpResponse, body) => {
      const signedUrl = JSON.parse(body).url;

      request
        .get(signedUrl)
        .on("response", (response) => {
          if (response.statusCode !== 200) {
            return callback("Response status was " + response.statusCode);
          }

          const totalBytes = response.headers["content-length"];
          progressBar.start(totalBytes, 0);
        })
        .on("data", (chunk) => {
          receivedBytes += chunk.length;
          progressBar.update(receivedBytes);
        })
        .pipe(file)
        .on("error", (err) => {
          fs.unlink(filename);
          progressBar.stop();
          return callback(err.message);
        });

      file.on("finish", () => {
        progressBar.stop();
        file.close(callback);
      });

      file.on("error", (err) => {
        fs.unlink(filename);
        progressBar.stop();
        return callback(err.message);
      });
    }
  );
};
