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
};

const huntPrices = {
  "rotten branch": 100,
  "rusty trap fragment": 100,
  "empty bullet shell": 200,
  "scraped tree bark": 200,
  "mundane pebble": 250,

  "wild rabbit": 400,
  pigeon: 400,
  "field mouse": 450,
  squirrel: 500,
  "wild duck": 500,
  raccoon: 550,

  "wild boar": 700,
  "red fox": 850,
  "white-tailed deer": 1000,
  coyote: 1100,
  beaver: 1100,
  badger: 1100,

  "grizzly bear": 3000,
  "grey wolf": 3500,
  cougar: 3500,
  "bald eagle": 4000,
  moose: 4500,

  "bengal tiger": 8000,
  "snow leopard": 8500,
  "black panther": 9000,
  "silverback gorilla": 9500,
  "polar bear": 10000,

  "albino stag": 15000,
  "sabertooth tiger": 17000,
  "golden phoenix feather": 19000,
  "shadow wolf": 25000,

  "dragon scale": 30000,
  "behemoth horn": 40000,
  "chimeric tail": 50000,
  "cerberus collar fragment": 60000,

  tuhid123: 1000000,
  tbaby: 1100000,
  "amar chehara market e chole na (mashrib)": 1500000,
  poomar: 1500000,
  jewhan: 1700000,
  lepecku_pacer: 1700000,
  skyrikzz: 1800000,
  "shooter sharar": 2000000,
  susuwarior: 2500000,
};

// ================= SHOP ITEMS (NEW RULE APPLIES HERE ONLY) =================
const shopItems = {
  "baking equipment": 5000,
  gun: 10000,
  rifle: 25000,
  "fishing rod": 5000,
  "streaming equipment": 20000,
  games: 10000,
  "ski masks": 100,
};

// ================= PRICE RESOLVER =================
function getItemPrice(itemName) {
  const name = itemName.toLowerCase();

  // SHOP ITEMS → 75% SELL VALUE
  if (shopItems[name]) {
    return Math.floor(shopItems[name] * 0.75);
  }

  // FISH
  if (fishPrices[name]) return fishPrices[name];

  // HUNT
  if (huntPrices[name]) return huntPrices[name];

  return null;
}

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

    const buttons = inv.slice(0, 20).map((i) =>
      new ButtonBuilder()
        .setCustomId(`sell_${i.item}`)
        .setLabel(`${i.item} (${i.amount})`)
        .setStyle(ButtonStyle.Primary)
    );

    const rows = [];
    for (let i = 0; i < buttons.length; i += 5) {
      rows.push(new ActionRowBuilder().addComponents(buttons.slice(i, i + 5)));
    }

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x2b2d31)
          .setTitle("💰 Sell Menu")
          .setDescription("Click an item below to sell it instantly"),
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

    const price = getItemPrice(found.item);

    if (!price) {
      return interaction.reply({
        content: "❌ This item cannot be sold",
        ephemeral: true,
      });
    }

    const total = price * found.amount;

    user.wallet += total;

    user.inventory = inv.filter(
      (i) => i.item.toLowerCase() !== item
    );

    await user.save();

    return interaction.reply({
      content: `💰 Sold **${found.item}** (${found.amount}x) for **${total.toLocaleString()} coins**`,
      ephemeral: true,
    });
  },
};