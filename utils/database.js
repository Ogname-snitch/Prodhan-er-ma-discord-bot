const mongoose = require("mongoose");

// PERKS LIST (reference only)
const perks = ["Workaholic", "Alcoholic", "Robber", "Beggar"];

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

  // ⭐ PERK SYSTEM
  perk: {
    type: String,
    default: "None",
  },

  // ⭐ JAIL SYSTEM
  jailUntil: {
    type: Number,
    default: 0,
  },

  // ⭐ FREE PERK TRACKER
  perkClaimed: {
    type: Boolean,
    default: false,
  },

  // ⭐ NEW: PERSISTENT INVENTORY SYSTEM
  inventory: {
    type: [
      {
        item: String,
        amount: {
          type: Number,
          default: 1,
        },
      },
    ],
    default: [],
  },
});

// GET OR CREATE USER
userSchema.statics.getUser = async function (userId) {
  let user = await this.findOne({ userId });

  if (!user) {
    user = await this.create({
      userId,
      wallet: 0,
      lastDaily: 0,
      lastWork: 0,
      lastBeg: 0,
      lastSteal: 0,
      perk: "None",
      jailUntil: 0,
      perkClaimed: false,
      inventory: [], // ⭐ IMPORTANT
    });
  }

  return user;
};

// MODEL
const User = mongoose.model("User", userSchema);

module.exports = User;