const { SlashCommandBuilder } = require("discord.js");
const User = require("../../utils/database");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("💰 Sell items from your inventory")

    // ❗ We cannot use dynamic dropdowns in Discord
    .addStringOption(option =>
      option
        .setName("item")
        .setDescription("Type the item you want to sell")
        .setRequired(true)
    ),

  async execute(interaction) {
    const item = interaction.options.getString("item").toLowerCase();
    const user = await User.getUser(interaction.user.id);

    const inv = user.inventory || [];

    const found = inv.find(i => i.item.toLowerCase() === item);

    if (!found || found.amount <= 0) {
      return interaction.reply("❌ You don't own this item");
    }

    let total = 0;
    const amount = found.amount;

    // 🎣 FISH PRICES (your full system) sjks
    const fishPrices = {
      "goldfish": 1000,
      "shrimp": 1500,
      "bass": 1500,
      "salmon": 2000,
      "sardine": 2500,
      "trout": 2500,

      "pufferfish": 2500,
      "electric eel": 3000,
      "hammerhead shark": 4000,
      "octopus": 5000,
      "clownfish": 5000,
      "stingray": 5500,

      "swordfish": 7000,
      "giant squid": 8000,
      "blobfish": 8000,
      "golden carp": 9000,
      "rainbow trout": 10000,

      "lionfish": 10000,
      "anglerfish": 10000,
      "tiger shark": 11000,
      "manta ray": 11000,
      "narwhal": 12000,

      "great white shark": 30000,
      "the loch ness monster": 50000,
      "megaladon shark": 70000,
      "ancient coelacanth": 80000,

      "kraken core": 100000,
      "leviathan scales": 110000,
      "cthulhu's left tentacle": 120000,
      "poseidon's trident fragment": 150000,

      "prodhan's cuck chair": 800000,
      "zarif's left testicle": 850000,
      "omar's skateboard": 900000,
      "mashrib's crush list": 950000,
      "shayan's broken hand": 975000,
      "suhaib's isp": 1000000,
      "johan's soulmate": 1500000,
      "yean's broken guitar": 1750000,
      "tuhid's screenshots folder": 2000000,
    };

    // 🧰 NORMAL ITEMS
    const itemPrices = {
      "baking equipment": 2500,
      "gun": 5000,
      "rifle": 12500,
      "streaming equipment": 10000,
      "games": 5000,
      "ski masks": 50,
    };

    const key = item.toLowerCase();

    if (fishPrices[key]) {
      total = amount * fishPrices[key];
    } else if (itemPrices[key]) {
      total = amount * itemPrices[key];
    } else {
      return interaction.reply("❌ This item has no sell value");
    }

    // remove item
    user.inventory = inv.filter(i => i.item.toLowerCase() !== key);
    user.wallet += total;

    await user.save();

    return interaction.reply(
      `💰 Sold ALL ${item} (${amount}x) for ${total} coins`
    );
  },
};