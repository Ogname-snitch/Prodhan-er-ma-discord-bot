const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const User = require("../../utils/database");

const cooldown = 20000;

// ================= FISH TABLE =================
const fishTable = [
  // Trash (20%)
  { name: "Old Boot", emoji: "🥾", rarity: "Trash", chance: 20, value: 200 },
  { name: "Seaweed", emoji: "🌿", rarity: "Trash", chance: 20, value: 200 },
  { name: "Plastic Bottle", emoji: "🍾", rarity: "Trash", chance: 20, value: 200 },
  { name: "Soggy Cardboard", emoji: "📦", rarity: "Trash", chance: 20, value: 200 },
  { name: "Rusty Tin Can", emoji: "🥫", rarity: "Trash", chance: 20, value: 300 },
  { name: "Tangled Fishing Line", emoji: "🧵", rarity: "Trash", chance: 20, value: 400 },

  // Common (30%)
  { name: "Goldfish", emoji: "🐠", rarity: "Common", chance: 30, value: 1000 },
  { name: "Shrimp", emoji: "🦐", rarity: "Common", chance: 30, value: 1500 },
  { name: "Bass", emoji: "🐟", rarity: "Common", chance: 30, value: 1500 },
  { name: "Salmon", emoji: "🍣", rarity: "Common", chance: 30, value: 2000 },
  { name: "Sardine", emoji: "🐟", rarity: "Common", chance: 30, value: 2500 },
  { name: "Trout", emoji: "🐟", rarity: "Common", chance: 30, value: 2500 },

  // Uncommon (20%)
  { name: "Pufferfish", emoji: "🐡", rarity: "Uncommon", chance: 20, value: 2500 },
  { name: "Electric Eel", emoji: "🐍", rarity: "Uncommon", chance: 20, value: 3000 },
  { name: "Hammerhead Shark", emoji: "🦈", rarity: "Uncommon", chance: 20, value: 4000 },
  { name: "Octopus", emoji: "🐙", rarity: "Uncommon", chance: 20, value: 5000 },
  { name: "Clownfish", emoji: "🤡", rarity: "Uncommon", chance: 20, value: 5000 },
  { name: "Stingray", emoji: "🥞", rarity: "Uncommon", chance: 20, value: 5500 },

  // Rare (15%)
  { name: "Swordfish", emoji: "🗡️", rarity: "Rare", chance: 15, value: 7000 },
  { name: "Giant Squid", emoji: "🦑", rarity: "Rare", chance: 15, value: 8000 },
  { name: "Blobfish", emoji: "🫠", rarity: "Rare", chance: 15, value: 8000 },
  { name: "Golden Carp", emoji: "🪙", rarity: "Rare", chance: 15, value: 9000 },
  { name: "Rainbow Trout", emoji: "🌈", rarity: "Rare", chance: 15, value: 10000 },

  // Epic (10%)
  { name: "Lionfish", emoji: "🦁", rarity: "Epic", chance: 10, value: 10000 },
  { name: "Anglerfish", emoji: "💡", rarity: "Epic", chance: 10, value: 10000 },
  { name: "Tiger Shark", emoji: "🐯", rarity: "Epic", chance: 10, value: 11000 },
  { name: "Manta Ray", emoji: "🦇", rarity: "Epic", chance: 10, value: 11000 },
  { name: "Narwhal", emoji: "🦄", rarity: "Epic", chance: 10, value: 12000 },

  // Legendary (3%)
  { name: "Great White Shark", emoji: "🦈", rarity: "Legendary", chance: 3, value: 30000 },
  { name: "The Loch Ness Monster", emoji: "🦕", rarity: "Legendary", chance: 3, value: 50000 },
  { name: "Megaladon Shark", emoji: "🦈", rarity: "Legendary", chance: 3, value: 70000 },
  { name: "Ancient Coelacanth", emoji: "🐟", rarity: "Legendary", chance: 3, value: 80000 },

  // Mythic (1.5%)
  { name: "Kraken Core", emoji: "👑", rarity: "Mythic", chance: 1.5, value: 100000 },
  { name: "Leviathan Scales", emoji: "🐉", rarity: "Mythic", chance: 1.5, value: 110000 },
  { name: "Cthulhu's Left Tentacle", emoji: "🦑", rarity: "Mythic", chance: 1.5, value: 120000 },
  { name: "Poseidon's Trident Fragment", emoji: "🔱", rarity: "Mythic", chance: 1.5, value: 150000 },

  // Vent (rare meme tier)
  { name: "Prodhan's Cuck Chair", emoji: "🪑", rarity: "Vent", chance: 0.5, value: 800000 },
  { name: "Zarif's Left Testicle", emoji: "🪀", rarity: "Vent", chance: 0.5, value: 850000 },
  { name: "Omar's Skateboard", emoji: "🛹", rarity: "Vent", chance: 0.5, value: 900000 },
  { name: "Mashrib's Crush List", emoji: "📋", rarity: "Vent", chance: 0.5, value: 950000 },
  { name: "Shayan's Broken Hand", emoji: "🦾", rarity: "Vent", chance: 0.5, value: 975000 },
  { name: "Suhaib's ISP", emoji: "📡", rarity: "Vent", chance: 0.5, value: 1000000 },
  { name: "Johan's Soulmate", emoji: "👭", rarity: "Vent", chance: 0.5, value: 1500000 },
  { name: "Yean's Guitar", emoji: "🎸", rarity: "Vent", chance: 0.5, value: 1750000 },
  { name: "Tuhid's Screenshots", emoji: "📂", rarity: "Vent", chance: 0.5, value: 2000000 },
];

const rarityColors = {
  Trash: 0xe2e8f0,
  Common: 0xdcfce7,
  Uncommon: 0xdbeafe,
  Rare: 0xf3e8ff,
  Epic: 0xffedd5,
  Legendary: 0xfef3c7,
  Mythic: 0xfce7f3,
  Vent: 0xffc7ce,
};

const rarityIcons = {
  Trash: "⬜",
  Common: "🟩",
  Uncommon: "🟦",
  Rare: "🟪",
  Epic: "🟧",
  Legendary: "🟨",
  Mythic: "🩷",
  Vent: "🟥",
};

// ================= PICK FUNCTION =================
function getRandomFish() {
  const roll = Math.random() * 100;

  let rarity;

  if (roll < 30) {
    rarity = "Trash";
  }
  else if (roll < 70) {
    rarity = "Common";
  }
  else if (roll < 85) {
    rarity = "Uncommon";
  }
  else if (roll < 92.5) {
    rarity = "Rare";
  }
  else if (roll < 95.5) {
    rarity = "Epic";
  }
  else if (roll < 98) {
    rarity = "Legendary";
  }
  else if (roll < 99.5) {
    rarity = "Mythic";
  }
  else {
    rarity = "Vent";
  }

  const pool = fishTable.filter(
    fish => fish.rarity === rarity
  );

  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("fish")
    .setDescription("🐟 Go fishing"),

  async execute(interaction) {
    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    if (now - user.lastFish < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastFish)) / 1000);
      return interaction.reply(`⏳ Wait ${left}s`);
    }

    const rod = user.inventory.find(
      i => i.item === "fishing rod" && i.amount > 0
    );

    if (!rod) {
      return interaction.reply("❌ You need a fishing rod");
    }

    const fish = getRandomFish();

    const existing = user.inventory.find(
      i => i.item === fish.name
    );

    if (existing) {
      existing.amount += 1;
    } else {
      user.inventory.push({
        item: fish.name,
        amount: 1,
        value: fish.value, // IMPORTANT FIX
      });
    }

    user.lastFish = now;
    user.markModified("inventory");

    await user.save();

    const embed = new EmbedBuilder()
  .setColor(rarityColors[fish.rarity])
  .setTitle("🎣 Fishing Result")
  .setDescription(
    `You caught **${fish.emoji} ${fish.name}**\n\n` +
    `${rarityIcons[fish.rarity]} **[${fish.rarity}]**\n\n` +
    `💰 Worth **${fish.value.toLocaleString()}** coins`
  );

return interaction.reply({
  embeds: [embed],
});
  },
};