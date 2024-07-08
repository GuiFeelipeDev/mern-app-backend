const { Schema, default: mongoose } = require("mongoose")
const mongooseUniqueValidator = require("mongoose-unique-validator")

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlenght: 6 },
  image: { type: String, required: true },
  places: [{ type: mongoose.Types.ObjectId, required: true, ref: "Place" }],
})

userSchema.plugin(mongooseUniqueValidator)

module.exports = mongoose.model("User", userSchema)
