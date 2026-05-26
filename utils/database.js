const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.log("❌ MongoDB Error:", err));

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },

  wallet: { type: Number, default: 0 },

  lastDaily: { type: Number, default: 0 },
  lastWork: { type: Number, default: 0 },
  lastBeg: { type: Number, default: 0 },
  lastSteal: { type: Number, default: 0 },

  lastBake: { type: Number, default: 0 },
  lastHunt: { type: Number, default: 0 },
  lastFish: { type: Number, default: 0 },

  perk: { type: String, default: "None" },
  jailUntil: { type: Number, default: 0 },

  perkClaimed: { type: Boolean, default: false },

  inventory: {
    type: [
      {
        item: String,
        amount: Number,
      },
    ],
    default: [],
  },

  // ✅ GOODS NOW STORE VALUE + AMOUNT (FIXED SYSTEM)
  goods: {
    type: Object,
    default: {},
  },

  createdAt: {
    type: Number,
    default: Date.now,
  },
});

// FIX OLD USERS AUTOMATICALLY
userSchema.statics.getUser = async function (userId) {
  let user = await this.findOne({ userId });

  if (!user) {
    user = await this.create({
      userId,
      wallet: 0,
      inventory: [],
      goods: {},
    });
  }

  if (!user.inventory) user.inventory = [];
  if (!user.goods) user.goods = {};

  await user.save();
  return user;
};

module.exports = mongoose.model("User", userSchema);