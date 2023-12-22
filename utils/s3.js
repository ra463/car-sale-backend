const S3 = require("aws-sdk/clients/s3");
const SDK = require("aws-sdk");
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const multer = require("multer");
const dotenv = require("dotenv");
const convert = require("heic-convert");

dotenv.config();

exports.s3Uploadv2 = async (file, id) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  // if (file.mimetype.split("/")[0] === "video") {
  //   const params = {
  //     Bucket: process.env.AWS_BUCKET_NAME,
  //     Key: `uploads/user-${id}/car/${Date.now().toString()}-${
  //       file.originalname
  //     }`,
  //     Body: file.buffer,
  //   };

  //   return await s3.upload(params).promise();
  // }

  if (file.mimetype.split("/")[0] === "image") {
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/user-${id}/car/${Date.now().toString()}-${
        file.originalname
      }`,
      Body: file.buffer,
    };

    return await s3.upload(params).promise();
  }
};

exports.s3Update = async (file, oldFile, id) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  const key1 = oldFile.split("/")[6];
  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `uploads/user-${id}/profile-pictures/${key1}`,
  };

  await s3.deleteObject(param).promise();

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `uploads/user-${id}/profile-pictures/${Date.now().toString()}-${
      file.originalname
    }`,
    Body: file.buffer,
  };

  return await s3.upload(params).promise();
};

exports.s3delete = async (file, id) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  const key1 = file.split("/")[6];
  const param = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `uploads/user-${id}/car/${key1}`,
  };

  return await s3.deleteObject(param).promise();
};

exports.s3UploadMulti = async (files, id) => {
  const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_BUCKET_REGION,
  });

  // check if the file type is heic then convert to jpg/png
  let newFiles = [];
  for (let i = 0; i < files.length; i++) {
    if (files[i].mimetype === "image/heic") {
      const buffer = await convert({
        buffer: files[i].buffer,
        format: "JPEG",
        quality: 1,
      });
      const newFile = {
        originalname: files[i].originalname.split(".")[0] + ".jpg",
        buffer: buffer,
      };
      newFiles.push(newFile);
    } else {
      newFiles.push(files[i]);
    }
  }

  const params = newFiles.map((file) => {
    return {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/user-${id}/car/${Date.now().toString()}-${
        file.originalname ? file.originalname : "not"
      }`,
      Body: file.buffer,
    };
  });

  return await Promise.all(params.map((param) => s3.upload(param).promise()));
};

const storage = multer.memoryStorage();

const fileFilter = async (req, file, cb) => {
  if (file.mimetype.split("/")[0] === "image") {
    req.video_file = false;
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
  }
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 11006600, files: 5 },
});

// for video
// const fileFilter2 = (req, file, cb) => {
//   if (file.mimetype.split("/")[0] === "video") {
//     req.video_file = true;
//     cb(null, true);
//   } else {
//     cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE"), false);
//   }
// };

// exports.upload2 = multer({
//   storage,
//   fileFilter: fileFilter2,
//   limits: {
//     fileSize: 51006600,
//     files: 5,
//   },
// });
