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

  lastDaily: { type: Number, default: 0 },
  lastWork: { type: Number, default: 0 },
  lastBeg: { type: Number, default: 0 },
  lastSteal: { type: Number, default: 0 },

  lastBake: { type: Number, default: 0 },
  lastHunt: { type: Number, default: 0 },
  lastFish: { type: Number, default: 0 },
  lastStream: { type: Number, default: 0 },
  lastScam: { type: Number, default: 0 },
  lastBankRob: { type: Number, default: 0 },

  bankJailUntil: {
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

  perkClaimed: {
    type: Boolean,
    default: false,
  },

  // ⭐ INVENTORY (PRIMARY STORAGE)
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

  // ⭐ GOODS SYSTEM (FIX FOR /sell CAKE/FISH/ANIMAL/GIFTCARD)
  goods: {
    type: Object,
    default: {},
  },

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
      inventory: [],
      goods: {}, // ⭐ IMPORTANT FIX
      bank: 0,
      bankSpace: 1000,
      perk: "None",
      jailUntil: 0,
      bankJailUntil: 0,
      perkClaimed: false,
      createdAt: Date.now(),
    });
  }

  // 🔥 PATCH OLD USERS (VERY IMPORTANT FIX)
  if (!user.inventory) user.inventory = [];
  if (!user.goods) user.goods = {};
  if (!user.bank) user.bank = 0;
  if (!user.bankSpace) user.bankSpace = 1000;

  await user.save();

  return user;
};

const User = mongoose.model("User", userSchema);

module.exports = User;