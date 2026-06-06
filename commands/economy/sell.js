const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

const User = require("../../utils/database");

// ================= PRICE TABLES =================
const fishPrices = {
  "old boot": 200,
  seaweed: 200,
  "plastic bottle": 200,
  "soggy cardboard": 200,
  "rusty tin can": 300,
  "tangled fishing line": 400,

  goldfish: 1000,
  shrimp: 1500,
  bass: 1500,
  salmon: 2000,
  sardine: 2500,
  trout: 2500,

  pufferfish: 2500,
  "electric eel": 3000,
  "hammerhead shark": 4000,
  octopus: 5000,
  clownfish: 5000,
  stingray: 5500,

  swordfish: 7000,
  "giant squid": 8000,
  blobfish: 8000,
  "golden carp": 9000,
  "rainbow trout": 10000,

  lionfish: 10000,
  anglerfish: 10000,
  "tiger shark": 11000,
  "manta ray": 11000,
  narwhal: 12000,

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

const itemPrices = {
  "baking equipment": 2500,
  gun: 5000,
  rifle: 12500,
  "streaming equipment": 10000,
  games: 5000,
  "ski masks": 50,
};

// ================= COMMAND =================
module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("💰 Sell items from inventory"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);
    const inv = user.inventory || [];

    if (!inv.length) {
      return interaction.reply({
        content: "❌ Your inventory is empty",
        ephemeral: true,
      });
    }

    // ================= BUTTON CREATION =================
    const buttons = inv.slice(0, 20).map((i) =>
      new ButtonBuilder()
        .setCustomId(`sell_${i.item}`)
        .setLabel(`${i.item} (${i.amount})`)
        .setStyle(ButtonStyle.Primary)
    );

    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(
        new ActionRowBuilder().addComponents(buttons.slice(i, i + 5))
      );
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("💰 Sell Menu")
          .setDescription("Click a button to sell that item instantly"),
      ],
      components: rows,
    });
  },

  // ================= BUTTON HANDLER =================
  sellHandler: async (interaction, User) => {
    const item = interaction.customId.replace("sell_", "").toLowerCase();

    const user = await User.getUser(interaction.user.id);
    const inv = user.inventory || [];

    const found = inv.find(
      (i) => i.item.toLowerCase() === item
    );

    if (!found || found.amount <= 0) {
      return interaction.reply({
        content: "❌ You don't own this item",
        ephemeral: true,
      });
    }

    const amount = found.amount;

    const price =
      fishPrices[item] ||
      itemPrices[item];

    if (!price) {
      return interaction.reply({
        content: "❌ This item has no sell value",
        ephemeral: true,
      });
    }

    const total = amount * price;

    user.wallet += total;

    // remove item
    user.inventory = inv.filter(
      (i) => i.item.toLowerCase() !== item
    );

    await user.save();

    return interaction.reply({
      content: `💰 Sold **${found.item}** (${amount}x) for **${total} coins**`,
      ephemeral: true,
    });
  },
};