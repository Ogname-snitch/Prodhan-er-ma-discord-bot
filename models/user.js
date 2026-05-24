const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: String,
  wallet: { type: Number, default: 0 },
  lastDaily: { type: Number, default: 0 },
  lastWork: { type: Number, default: 0 },
  lastBeg: { type: Number, default: 0 },
});

module.exports = mongoose.model("User", userSchema);