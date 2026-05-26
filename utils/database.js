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

  // ⭐ INVENTORY SYSTEM (FULLY STABLE FIX)
  inventory: {
    type: [
      {
        item: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          default: 1,
        },
      },
    ],
    default: [],
  },

   // ⭐ EXTRA SAFETY FIELD (prevents undefined crashes)
  createdAt: {
    type: Number,
    default: Date.now,
  },

  // ⭐ BANK SYSTEM
  bank: {
    type: Number,
    default: 0,
  },

  bankSpace: {
    type: Number,
    default: 1000,
  },
});

// GET OR CREATE USER (SAFE + FIXED)
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
      inventory: [], // IMPORTANT FIX
      createdAt: Date.now(),
      bank: 0,
      bankSpace: 1000,
    });
  }

  // ⭐ SAFETY PATCH (fix old users missing inventory)
  if (!user.inventory) {
    user.inventory = [];
    await user.save();
  }

  return user;
};

// MODEL
const User = mongoose.model("User", userSchema);

module.exports = User;