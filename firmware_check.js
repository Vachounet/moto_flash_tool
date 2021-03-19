const mongojs = require("mongojs");
const db = mongojs();
const col = db.collection("motofirmwares");

module.exports = function (type, sku, carrier, next) {
  switch (type) {
    case "pn":
      col.find({ sn: sku }, (err, docs) => {
        if (docs && docs.length > 0) {
          return next(docs);
        }

        return next();
      });
      break;
    case "devicename":
    case "version":
    case "key":
      col.find({ name: { $regex: sku, $options: "i" } }, (err, docs) => {
        if (docs && docs.length > 0) {
          return next(docs);
        }

        return next();
      });
      break;
    case "sku":
      col.find(
        {
          $and: [
            { phones: { $regex: sku, $options: "i" } },
            { carrier: { $regex: carrier, $options: "i" } },
          ],
        },
        (err, docs) => {
          if (err) console.log(err);
          if (docs && docs.length > 0) {
            return next(docs);
          }
        }
      );
      break;
  }
};
