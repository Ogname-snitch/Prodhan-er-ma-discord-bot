const mongoose = require("mongoose");

// CONNECT TO MONGODB
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
})
.then(() => {
  console.log("✅ MongoDB Connected");
})
.catch((err) => {
  console.log("❌ MongoDB Error:", err);
});

// USER SCHEMA
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },

  wallet: {
    type: Number,
    default: 0,
  },

  lastDaily: {
    type: Number,
    default: 0,
  },

  lastWork: {
    type: Number,
    default: 0,
  },

  lastBeg: {
    type: Number,
    default: 0,
  },

  lastSteal: {
    type: Number,
    default: 0,
  },
});

// GET OR CREATE USER
userSchema.statics.getUser = async function(userId) {

  let user = await this.findOne({ userId });

  if (!user) {

    user = await this.create({
      userId,
      wallet: 0,
      lastDaily: 0,
      lastWork: 0,
      lastBeg: 0,
      lastSteal: 0,
    });

  }

  return user;
};

// MODEL
const User = mongoose.model(
  "User",
  userSchema
);

module.exports = User;