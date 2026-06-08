const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 20000;

// ================= HUNT TABLE =================
const huntTable = [
  { name: "Rotten Branch", emoji: "🌿", rarity: "Trash", value: 100 },
  { name: "Rusty Trap Fragment", emoji: "🪤", rarity: "Trash", value: 100 },
  { name: "Empty Bullet Shell", emoji: "🪙", rarity: "Trash", value: 200 },
  { name: "Scraped Tree Bark", emoji: "🪵", rarity: "Trash", value: 200 },
  { name: "Mundane Pebble", emoji: "🪨", rarity: "Trash", value: 250 },

  { name: "Wild Rabbit", emoji: "🐇", rarity: "Common", value: 400 },
  { name: "Pigeon", emoji: "🐦", rarity: "Common", value: 400 },
  { name: "Field Mouse", emoji: "🐁", rarity: "Common", value: 450 },
  { name: "Squirrel", emoji: "🐿️", rarity: "Common", value: 500 },
  { name: "Wild Duck", emoji: "🦆", rarity: "Common", value: 500 },
  { name: "Raccoon", emoji: "🦝", rarity: "Common", value: 550 },

  { name: "Wild Boar", emoji: "🐗", rarity: "Uncommon", value: 700 },
  { name: "Red Fox", emoji: "🦊", rarity: "Uncommon", value: 850 },
  { name: "White-Tailed Deer", emoji: "🦌", rarity: "Uncommon", value: 1000 },
  { name: "Coyote", emoji: "🐺", rarity: "Uncommon", value: 1100 },
  { name: "Beaver", emoji: "🦫", rarity: "Uncommon", value: 1100 },
  { name: "Badger", emoji: "🦡", rarity: "Uncommon", value: 1100 },

  { name: "Grizzly Bear", emoji: "🐻", rarity: "Rare", value: 3000 },
  { name: "Grey Wolf", emoji: "🐺", rarity: "Rare", value: 3500 },
  { name: "Cougar", emoji: "🐆", rarity: "Rare", value: 3500 },
  { name: "Bald Eagle", emoji: "🦅", rarity: "Rare", value: 4000 },
  { name: "Moose", emoji: "🫎", rarity: "Rare", value: 4500 },

  { name: "Bengal Tiger", emoji: "🐅", rarity: "Epic", value: 8000 },
  { name: "Snow Leopard", emoji: "🐆", rarity: "Epic", value: 8500 },
  { name: "Black Panther", emoji: "🐆", rarity: "Epic", value: 9000 },
  { name: "Silverback Gorilla", emoji: "🦍", rarity: "Epic", value: 9500 },
  { name: "Polar Bear", emoji: "🐻‍❄️", rarity: "Epic", value: 10000 },

  { name: "Albino Stag", emoji: "🦌", rarity: "Legendary", value: 15000 },
  { name: "Sabertooth Tiger", emoji: "🐅", rarity: "Legendary", value: 17000 },
  { name: "Golden Phoenix Feather", emoji: "🪶", rarity: "Legendary", value: 19000 },
  { name: "Shadow Wolf", emoji: "🐺", rarity: "Legendary", value: 25000 },

  { name: "Dragon Scale", emoji: "🐉", rarity: "Mythic", value: 30000 },
  { name: "Behemoth Horn", emoji: "🦏", rarity: "Mythic", value: 40000 },
  { name: "Chimeric Tail", emoji: "🐍", rarity: "Mythic", value: 50000 },
  { name: "Cerberus Collar Fragment", emoji: "🐕", rarity: "Mythic", value: 60000 },
];

// ================= HUNTER PERK BOOST =================
function applyHunterPerk(user, rarity) {
  if (user.perk !== "Hunter") return rarity;

  const level = Math.min(user.perkLevel || 1, 4);

  // Level 1: +10% chance above Uncommon
  if (level >= 1) {
    if (
      rarity === "Rare" ||
      rarity === "Epic" ||
      rarity === "Legendary" ||
      rarity === "Mythic"
    ) {
      if (Math.random() < 0.10) return rarity;
    }
  }

  // Level 2–4: +5% extra scaling
  if (level >= 2) {
    if (
      rarity === "Rare" ||
      rarity === "Epic" ||
      rarity === "Legendary" ||
      rarity === "Mythic"
    ) {
      const extra = (level - 1) * 0.05;
      if (Math.random() < extra) return rarity;
    }
  }

  return rarity;
}

// ================= RARITY SYSTEM =================
function getRandomAnimal(user) {
  const roll = Math.random() * 100;

  let rarity;

  if (roll < 35) rarity = "Trash";
  else if (roll < 55) rarity = "Common";
  else if (roll < 75) rarity = "Uncommon";
  else if (roll < 85) rarity = "Rare";
  else if (roll < 91) rarity = "Epic";
  else if (roll < 94) rarity = "Legendary";
  else if (roll < 95.5) rarity = "Mythic";
  else rarity = "Rare";

  // 🦌 APPLY HUNTER PERK HERE
  rarity = applyHunterPerk(user, rarity);

  const pool = huntTable.filter(h => h.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ================= COMMAND =================
module.exports = {
  data: new SlashCommandBuilder()
    .setName("hunt")
    .setDescription("🦌 Hunt animals"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    if (now - user.lastHunt < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastHunt)) / 1000);
      return interaction.reply(`⏳ Wait ${left}s`);
    }

    const weapon = user.inventory.find(
      i => (i.item === "gun" || i.item === "rifle") && i.amount > 0
    );

    if (!weapon) {
      return interaction.reply("❌ You need a gun or rifle");
    }

    const animal = getRandomAnimal(user);

    const existing = user.inventory.find(i => i.item === animal.name);

    if (existing) existing.amount += 1;
    else user.inventory.push({ item: animal.name, amount: 1, value: animal.value });

    user.lastHunt = now;
    user.markModified("inventory");

    await user.save();

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle(`${animal.emoji} ${animal.name}`)
      .addFields(
        { name: "Rarity", value: animal.rarity, inline: true },
        { name: "Value", value: `${animal.value.toLocaleString()} coins`, inline: true }
      )
      .setFooter({ text: "🦌 Hunting System" });

    return interaction.reply({ embeds: [embed] });
  },
};