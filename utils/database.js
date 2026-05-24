const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

const userSchema = new mongoose.Schema({
  userId: String,
  wallet: { type: Number, default: 0 },
  lastDaily: { type: Number, default: 0 },
  lastWork: { type: Number, default: 0 },
  lastBeg: { type: Number, default: 0 },
  lastSteal: { type: Number, default: 0 },
});

const User = mongoose.model("User", userSchema);

module.exports = User;