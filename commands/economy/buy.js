const {
  SlashCommandBuilder,
} = require("discord.js");

const User = require("../../utils/database");

// ================= SHOP ITEMS =================
const items = {
  "baking equipment": 5000,
  "gun": 10000,
  "rifle": 25000,
  "fishing rod": 5000,
  "streaming equipment": 20000,
  "games": 10000,
  "ski masks": 100,

  // ================= POTIONS (70k tier)
  "worker's coffee": 70000,
  "robber's kool-aid": 70000,
  "gambler's alcohol": 70000,
  "baker's sugey juice": 70000,
  "streamer's can o' monster": 70000,
  "small xp orb": 70000,
  "beggar's sewage water": 70000,
  "hunter's bag o' animal blood": 70000,

  // ================= POTIONS (150k tier)
  "worker's black coffee": 150000,
  "robber's watermelon kool-aid": 150000,
  "gambler's tequila": 150000,
  "baker's maple syrup": 150000,
  "streamers' can o' white monster": 150000,
  "big ol' xp orb": 150000,
  "beggar's stinky sewage water": 150000,
  "hunter's bag o' lumpy animal blood": 150000,
};

// ================= POTION EFFECTS =================
function applyPotion(user, itemName) {
  const now = Date.now();

  if (!user.activeBoosts) {
    user.activeBoosts = {
      moneyMultiplier: 1,
      winChanceBonus: 0,
      xpMultiplier: 1,
      expiresAt: 0,
    };
  }

  const isHighTier =
    itemName.includes("black") ||
    itemName.includes("white") ||
    itemName.includes("big") ||
    itemName.includes("150000");

  const duration = isHighTier
    ? 10 * 60 * 1000
    : 5 * 60 * 1000;

  user.activeBoosts.expiresAt = now + duration;

  // ================= EFFECTS =================
  if (itemName.includes("gambler")) {
    user.activeBoosts.winChanceBonus =
      itemName.includes("tequila") ? 0.15 : 0.10;
  }

  if (itemName.includes("xp") || itemName.includes("orb")) {
    user.activeBoosts.xpMultiplier =
      itemName.includes("big") ? 1.15 : 1.10;
  }

  // default money boost potions
  user.activeBoosts.moneyMultiplier =
    itemName.includes("15") ? 1.15 : 1.10;
}

// ================= COMMAND =================
module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("🛒 Buy an item")
    .addStringOption(option =>
      option
        .setName("item")
        .setDescription("Choose an item")
        .setRequired(true)
        .addChoices(
          { name: "Baking Equipment", value: "baking equipment" },
          { name: "Gun", value: "gun" },
          { name: "Rifle", value: "rifle" },
          { name: "Fishing Rod", value: "fishing rod" },
          { name: "Streaming Equipment", value: "streaming equipment" },
          { name: "Games", value: "games" },
          { name: "Ski Masks", value: "ski masks" },

          // potions
          { name: "Worker's Coffee", value: "worker's coffee" },
          { name: "Robber's Kool-Aid", value: "robber's kool-aid" },
          { name: "Gambler's Alcohol", value: "gambler's alcohol" },
          { name: "Baker's Sugey Juice", value: "baker's sugey juice" },
          { name: "Streamer's Can O' Monster", value: "streamer's can o' monster" },
          { name: "Small XP Orb", value: "small xp orb" },
          { name: "Beggar's Sewage Water", value: "beggar's sewage water" },
          { name: "Hunter's Bag O' Animal Blood", value: "hunter's bag o' animal blood" },

          { name: "Worker's Black Coffee", value: "worker's black coffee" },
          { name: "Robber's Watermelon Kool-Aid", value: "robber's watermelon kool-aid" },
          { name: "Gambler's Tequila", value: "gambler's tequila" },
          { name: "Baker's Maple Syrup", value: "baker's maple syrup" },
          { name: "Streamers' Can O' White Monster", value: "streamers' can o' white monster" },
          { name: "BIG Ol' XP Orb", value: "big ol' xp orb" },
          { name: "Beggar's Stinky Sewage Water", value: "beggar's stinky sewage water" },
          { name: "Hunter's Bag O' Lumpy Animal Blood", value: "hunter's bag o' lumpy animal blood" },
        )
    ),

  async execute(interaction) {

    const item = interaction.options.getString("item");
    const price = items[item];

    const user = await User.getUser(interaction.user.id);

    if (!price) {
      return interaction.reply("❌ Invalid item");
    }

    if (user.wallet < price) {
      return interaction.reply(`❌ You need ${price.toLocaleString()} coins`);
    }

    // 💸 deduct money
    user.wallet -= price;

    // 🎒 inventory update
    const inv = user.inventory || [];
    const existing = inv.find(i => i.item === item);

    if (existing) {
      existing.amount += 1;
    } else {
      inv.push({ item, amount: 1 });
    }

    user.inventory = inv;

    // 🧪 APPLY POTION EFFECT
    const isPotion =
      item.includes("coffee") ||
      item.includes("kool-aid") ||
      item.includes("alcohol") ||
      item.includes("juice") ||
      item.includes("monster") ||
      item.includes("orb") ||
      item.includes("syrup") ||
      item.includes("water");

    if (isPotion) {
      applyPotion(user, item);
    }

    await user.save();

    return interaction.reply(
      `🛒 You bought **${item}** for ${price.toLocaleString()} coins`
    );
  },
};