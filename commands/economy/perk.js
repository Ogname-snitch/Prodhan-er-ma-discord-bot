const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

// ================= PERKS =================
const perks = [
  "Workaholic",
  "Alcoholic",
  "Robber",
  "Beggar",
  "Fisher",
  "Streamer",
  "Baker", // ⭐ NEW PERK ADDED
  "Hunter", // ⭐ ADDED (ONLY ADDITION)
];

// ================= USER HELPER =================
async function getUser(id) {
  return await User.getUser(id);
}

// ================= GIVE MID GAMING EQUIPMENT =================
function giveMidGamingEquipment(user) {
  if (!user.inventory) user.inventory = [];

  const existing = user.inventory.find(
    (i) => i.item === "mid gaming equipment"
  );

  if (!existing) {
    user.inventory.push({
      item: "mid gaming equipment",
      amount: 1,
    });
  }
}

// ================= GIVE FISHING ROD =================
function giveFishingRod(user) {
  if (!user.inventory) user.inventory = [];

  const existing = user.inventory.find(
    (i) => i.item === "fishing rod"
  );

  if (!existing) {
    user.inventory.push({
      item: "fishing rod",
      amount: 1,
    });
  }
}

// ================= GIVE BAKING EQUIPMENT =================
function giveBakingEquipment(user) {
  if (!user.inventory) user.inventory = [];

  const existing = user.inventory.find(
    (i) => i.item === "baking equipment"
  );

  if (!existing) {
    user.inventory.push({
      item: "baking equipment",
      amount: 1,
    });
  }
}

// ================= GIVE NERF GUN (ADDED ONLY) =================
function giveNerfGun(user) {
  if (!user.inventory) user.inventory = [];

  const existing = user.inventory.find(
    (i) => i.item === "nerf gun"
  );

  if (!existing) {
    user.inventory.push({
      item: "nerf gun",
      amount: 1,
    });
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("perk")
    .setDescription("🎲 Get or reroll your perk (first time free, then 200k coins)"),

  async execute(interaction) {
    const user = await getUser(interaction.user.id);

    const COST = 200000;

    // 🎁 FIRST TIME FREE PERK
    if (!user.perkClaimed) {
      const random = perks[Math.floor(Math.random() * perks.length)];

      user.perk = random;
      user.perkClaimed = true;

      // ⭐ STREAMER BONUS
      if (random === "Streamer") {
        giveMidGamingEquipment(user);
      }

      // 🎣 FISHER BONUS
      if (random === "Fisher") {
        giveFishingRod(user);
      }

      // 🍰 BAKER BONUS
      if (random === "Baker") {
        giveBakingEquipment(user);
      }

      // 🔫 HUNTER BONUS (ADDED)
      if (random === "Hunter") {
        giveNerfGun(user);
      }

      await user.save();

      return interaction.reply(
        `🎉 You got your first perk for FREE!\n✨ **${random}**`
      );
    }

    // 💰 CHECK MONEY
    if (user.wallet < COST) {
      return interaction.reply(
        `❌ You need ${COST.toLocaleString()} coins to reroll your perk`
      );
    }

    user.wallet -= COST;

    const newPerk = perks[Math.floor(Math.random() * perks.length)];
    user.perk = newPerk;

    // ⭐ STREAMER BONUS
    if (newPerk === "Streamer") {
      giveMidGamingEquipment(user);
    }

    // 🎣 FISHER BONUS
    if (newPerk === "Fisher") {
      giveFishingRod(user);
    }

    // 🍰 BAKER BONUS
    if (newPerk === "Baker") {
      giveBakingEquipment(user);
    }

    // 🔫 HUNTER BONUS (ADDED)
    if (newPerk === "Hunter") {
      giveNerfGun(user);
    }

    await user.save();

    return interaction.reply(
      `🎲 You rerolled your perk for ${COST.toLocaleString()} coins!\n✨ New perk: **${newPerk}**`
    );
  },
};