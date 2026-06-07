const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");
const User = require("../../utils/database");

const cooldown = 20000;

// ================= FISH TABLE =================
const fishTable = [
  { name: "Old Boot", emoji: "🥾", rarity: "Trash", value: 200 },
  { name: "Seaweed", emoji: "🌿", rarity: "Trash", value: 200 },
  { name: "Plastic Bottle", emoji: "🍾", rarity: "Trash", value: 200 },
  { name: "Soggy Cardboard", emoji: "📦", rarity: "Trash", value: 200 },
  { name: "Rusty Tin Can", emoji: "🥫", rarity: "Trash", value: 300 },
  { name: "Tangled Fishing Line", emoji: "🧵", rarity: "Trash", value: 400 },

  { name: "Goldfish", emoji: "🐠", rarity: "Common", value: 1000 },
  { name: "Shrimp", emoji: "🦐", rarity: "Common", value: 1500 },
  { name: "Bass", emoji: "🐟", rarity: "Common", value: 1500 },
  { name: "Salmon", emoji: "🍣", rarity: "Common", value: 2000 },
  { name: "Sardine", emoji: "🐟", rarity: "Common", value: 2500 },
  { name: "Trout", emoji: "🐟", rarity: "Common", value: 2500 },

  { name: "Pufferfish", emoji: "🐡", rarity: "Uncommon", value: 2500 },
  { name: "Electric Eel", emoji: "🐍", rarity: "Uncommon", value: 3000 },
  { name: "Hammerhead Shark", emoji: "🦈", rarity: "Uncommon", value: 4000 },
  { name: "Octopus", emoji: "🐙", rarity: "Uncommon", value: 5000 },
  { name: "Clownfish", emoji: "🤡", rarity: "Uncommon", value: 5000 },
  { name: "Stingray", emoji: "🥞", rarity: "Uncommon", value: 5500 },

  { name: "Swordfish", emoji: "🗡️", rarity: "Rare", value: 7000 },
  { name: "Giant Squid", emoji: "🦑", rarity: "Rare", value: 8000 },
  { name: "Blobfish", emoji: "🫠", rarity: "Rare", value: 8000 },
  { name: "Golden Carp", emoji: "🪙", rarity: "Rare", value: 9000 },
  { name: "Rainbow Trout", emoji: "🌈", rarity: "Rare", value: 10000 },

  { name: "Lionfish", emoji: "🦁", rarity: "Epic", value: 10000 },
  { name: "Anglerfish", emoji: "💡", rarity: "Epic", value: 10000 },
  { name: "Tiger Shark", emoji: "🐯", rarity: "Epic", value: 11000 },
  { name: "Manta Ray", emoji: "🦇", rarity: "Epic", value: 11000 },
  { name: "Narwhal", emoji: "🦄", rarity: "Epic", value: 12000 },

  { name: "Great White Shark", emoji: "🦈", rarity: "Legendary", value: 30000 },
  { name: "The Loch Ness Monster", emoji: "🦕", rarity: "Legendary", value: 50000 },
  { name: "Megaladon Shark", emoji: "🦈", rarity: "Legendary", value: 70000 },
  { name: "Ancient Coelacanth", emoji: "🐟", rarity: "Legendary", value: 80000 },

  { name: "Kraken Core", emoji: "👑", rarity: "Mythic", value: 100000 },
  { name: "Leviathan Scales", emoji: "🐉", rarity: "Mythic", value: 110000 },
  { name: "Cthulhu's Left Tentacle", emoji: "🦑", rarity: "Mythic", value: 120000 },
  { name: "Poseidon's Trident Fragment", emoji: "🔱", rarity: "Mythic", value: 150000 },

  // Vent (UNCHANGED)
  { name: "Prodhan's Cuck Chair", emoji: "🪑", rarity: "Vent", value: 800000 },
  { name: "Zarif's Left Testicle", emoji: "🪀", rarity: "Vent", value: 850000 },
  { name: "Omar's Skateboard", emoji: "🛹", rarity: "Vent", value: 900000 },
  { name: "Mashrib's Crush List", emoji: "📋", rarity: "Vent", value: 950000 },
  { name: "Shayan's Broken Hand", emoji: "🦾", rarity: "Vent", value: 975000 },
  { name: "Suhaib's ISP", emoji: "📡", rarity: "Vent", value: 1000000 },
  { name: "Johan's Soulmate", emoji: "👭", rarity: "Vent", value: 1500000 },
  { name: "Yean's Guitar", emoji: "🎸", rarity: "Vent", value: 1750000 },
  { name: "Tuhid's Screenshots", emoji: "📂", rarity: "Vent", value: 2000000 },
];

// ================= RARITY SYSTEM (BASE) =================
function getRandomFish() {
  const roll = Math.random() * 100;

  let rarity;

  if (roll < 20) rarity = "Trash";
  else if (roll < 50) rarity = "Common";
  else if (roll < 65) rarity = "Uncommon";
  else if (roll < 77) rarity = "Rare";
  else if (roll < 86) rarity = "Epic";
  else if (roll < 93) rarity = "Legendary";
  else if (roll < 97) rarity = "Mythic";
  else rarity = "Vent";

  const pool = fishTable.filter(f => f.rarity === rarity);
  return pool[Math.floor(Math.random() * pool.length)];
}

// ================= FISHER PERK BOOST =================
function applyFisherBoost(rarity, level) {
  const lvl = Math.min(level || 1, 4);

  if (rarity === "Vent") return 0;

  // only affects higher tiers
  if (!["Rare", "Epic", "Legendary", "Mythic"].includes(rarity)) {
    return 0;
  }

  if (lvl === 1) return 10;
  if (lvl >= 2) return 10 + ((lvl - 1) * 5); // +5% per level
  return 0;
}

// ================= COMMAND =================
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

    let fish = getRandomFish();

    // ================= PERK EFFECT (reroll boost chance) =================
    if (user.perk === "Fisher") {
      const boost = applyFisherBoost(fish.rarity, user.perkLevel);

      // chance to upgrade fish tier
      if (Math.random() < boost / 100) {
        const upgradePool = fishTable.filter(f =>
          ["Rare", "Epic", "Legendary", "Mythic"].includes(f.rarity)
        );

        fish = upgradePool[Math.floor(Math.random() * upgradePool.length)];
      }
    }

    const existing = user.inventory.find(i => i.item === fish.name);

    if (existing) {
      existing.amount += 1;
    } else {
      user.inventory.push({
        item: fish.name,
        amount: 1,
        value: fish.value,
      });
    }

    user.lastFish = now;
    user.markModified("inventory");

    await user.save();

    const embed = new EmbedBuilder()
      .setColor(0x2b2d31)
      .setTitle(`${fish.emoji} ${fish.name}`)
      .addFields(
        { name: "Rarity", value: fish.rarity, inline: true },
        { name: "Value", value: `${fish.value.toLocaleString()} coins`, inline: true }
      )
      .setFooter({ text: "🎣 Fishing System" });

    return interaction.reply({ embeds: [embed] });
  },
};