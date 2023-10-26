const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    given_by: {
      name: {
        type: String,
        required: true,
      },
      title: {
        type: String,
      },
      picture: {
        type: String,
        default:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSh1MxDvWeEQ39D04ETGLuJ_pnSkd_gZf47R7qkQaxbHotxVs-aBvYjsHmbvxcKhTGn9gI&usqp=CAU",
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Testimonial", schema);
