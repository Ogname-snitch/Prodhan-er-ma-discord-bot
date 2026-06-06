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
  lastScam: { type: Number, default: 0 },
  lastBankRob: { type: Number, default: 0 },

  bankJailUntil: { type: Number, default: 0 },

  perk: { type: String, default: "None" },
  jailUntil: { type: Number, default: 0 },

  perkClaimed: { type: Boolean, default: false },

  inventory: {
    type: [{ item: String, amount: Number }],
    default: [],
  },

  goods: {
    type: Object,
    default: {},
  },

  bank: { type: Number, default: 0 },
  bankSpace: { type: Number, default: 1000 },

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
      perkClaimed: false,
      jailUntil: 0,
      bankJailUntil: 0,
    });
  }

  if (!user.inventory) user.inventory = [];
  if (!user.goods) user.goods = {};

  await user.save();
  return user;
};

module.exports = mongoose.model("User", userSchema);