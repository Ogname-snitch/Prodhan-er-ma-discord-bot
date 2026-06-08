const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err));

const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true },

  wallet: { type: Number, default: 0 },

  lastDaily: { type: Number, default: 0 },
  lastWork: { type: Number, default: 0 },
  lastBeg: { type: Number, default: 0 },
  lastSteal: { type: Number, default: 0 },
  lastBake: { type: Number, default: 0 },
  lastHunt: { type: Number, default: 0 },
  lastFish: { type: Number, default: 0 },
  lastStream: { type: Number, default: 0 },

  bankJailUntil: { type: Number, default: 0 },
  jailUntil: { type: Number, default: 0 },

  perk: { type: String, default: "None" },

  // ✅ NEW: perk upgrade level (starts at 1)
  perkLevel: { type: Number, default: 1 },

  perkClaimed: { type: Boolean, default: false },

  inventory: {
    type: [{ item: String, amount: Number }],
    default: [],
  },

  goods: { type: Object, default: {} },

  bank: { type: Number, default: 0 },
  bankSpace: { type: Number, default: 1000 },

  // ⭐ LEVEL SYSTEM
  level: { type: Number, default: 0 },
  xp: { type: Number, default: 0 },
  points: { type: Number, default: 0 },

  // 🧪 NEW POTION SYSTEM (ADDED)
  activeBoosts: {
    type: Object,
    default: {
      moneyMultiplier: 1,
      winChanceBonus: 0,
      xpMultiplier: 1,
      expiresAt: 0,
      potionName: null,
    },
  },

  createdAt: { type: Number, default: Date.now },
});

userSchema.statics.getUser = async function (id) {
  let user = await this.findOne({ userId: id });

  if (!user) {
    user = await this.create({
      userId: id,
      wallet: 0,
      inventory: [],
      goods: {},
      bank: 0,
      bankSpace: 1000,
      perk: "None",

      // ✅ NEW DEFAULTS
      perkLevel: 1,
      perkClaimed: false,

      // 🧪 POTION DEFAULT
      activeBoosts: {
        moneyMultiplier: 1,
        winChanceBonus: 0,
        xpMultiplier: 1,
        expiresAt: 0,
        potionName: null,
      },

      jailUntil: 0,
      bankJailUntil: 0,
      level: 0,
      xp: 0,
      points: 0,
    });
  }

  if (!user.inventory) user.inventory = [];
  if (!user.goods) user.goods = {};

  // safety fallback for old users
  if (user.perkLevel == null) user.perkLevel = 1;

  // 🧪 safety fallback for potion system
  if (!user.activeBoosts) {
    user.activeBoosts = {
      moneyMultiplier: 1,
      winChanceBonus: 0,
      xpMultiplier: 1,
      expiresAt: 0,
      potionName: null,
    };
  }

  return user;
};

module.exports = mongoose.model("User", userSchema);