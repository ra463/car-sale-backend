// const Car = require("../models/Car");
// const User = require("../models/User");
class APIFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
  }

  auctionSearch() {
    if (this.queryStr.keyword) {
      this.query = this.query.aggregate([
        {
          $lookup: {
            from: "Car",
            localField: "car",
            foreignField: "_id",
            as: "newField",
          },
        },
        {
          $match: {
            "newField.model": this.queryStr.keyword,
          },
        },
      ]);
    }
    return this;
  }

  filter() {
    const queryCopy = { ...this.queryStr };

    // Removing field for category
    const removeFields = [
      "keyword",
      "currentPage",
      "resultPerPage",
      "manufacture_company",
      "color",
      "transmission_type",
      "drive_type",
    ];
    removeFields.forEach((key) => delete queryCopy[key]);

    // filter for price
    let querystr = JSON.stringify(queryCopy);
    querystr = querystr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

    this.query = this.query.find(JSON.parse(querystr));

    return this;
  }

  filterByMake() {
    if (this.queryStr.manufacture_company) {
      this.query = this.query.aggregate([
        {
          $lookup: {
            from: "Car",
            localField: "car",
            foreignField: "_id",
            as: "cars",
          },
        },
        {
          $match: {
            "cars.manufacture_company": this.queryStr.manufacture_company,
          },
        },
      ]);
    }
    return this;
  }

  filterByColor() {
    if (this.queryStr.color) {
      this.query = this.query.find({
        color: {
          $regex: this.queryStr.color,
          $options: "i",
        },
      });
    }
    return this;
  }

  filterByTransmissionType() {
    if (this.queryStr.transmission_type) {
      this.query = this.query.find({
        transmission_type: this.queryStr.transmission_type,
      });
    }
    return this;
  }

  filterByDriveType() {
    if (this.queryStr.drive_type) {
      this.query = this.query.find({ drive_type: this.queryStr.drive_type });
    }
    return this;
  }

  pagination() {
    const currentPage = Number(this.queryStr.currentPage);
    const resultPerPage = Number(this.queryStr.resultPerPage);

    const skip = resultPerPage * (currentPage - 1);

    this.query = this.query.limit(resultPerPage).skip(skip);
    return this;
  }
}

module.exports = APIFeatures;
