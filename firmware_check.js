const mongojs = require("mongojs");
const db = mongojs();
const col = db.collection("motofirmwares");

module.exports = function (type, keyword, next) {
  switch (type) {
    case "pn":
      col.find({ sn: keyword }, (err, docs) => {
        if (docs && docs.length > 0) {
          return next(docs);
        }

        return next();
      });
      break;
    case "devicename":
    case "version":
    case "key":
      col.find({ name: { $regex: keyword, $options: "i" } }, (err, docs) => {
        if (docs && docs.length > 0) {
          return next(docs);
        }

        return next();
      });
      break;
    case "sku":
      col.find({ phones: { $regex: keyword, $options: "i" } }, (err, docs) => {
        if (err) console.log(err);
        if (docs && docs.length > 0) {
          return next(docs);
        }
      });
      break;
  }
};
