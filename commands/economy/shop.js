const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("🛒 View the economy shop"),

  async execute(interaction) {

    const embed = new EmbedBuilder()
      .setTitle("🛒 Economy Shop")
      .setColor("Blue")
      .setDescription(
`💻 **EQUIPMENT SHOP**
━━━━━━━━━━━━━━━━━━━━━━
🍰 Baking Equipment — 5,000 coins
🔫 Gun — 10,000 coins
🪖 Rifle — 25,000 coins
🎣 Fishing Rod — 5,000 coins
📹 Streaming Equipment — 20,000 coins
🎮 Games — 10,000 coins
🎭 Ski Masks — 100 coins

━━━━━━━━━━━━━━━━━━━━━━
🧪 **POTION SHOP (BUFFS)**
━━━━━━━━━━━━━━━━━━━━━━

☕ Worker's Coffee — 70,000
🍹 Robber's Kool-Aid — 70,000
🍺 Gambler's Alcohol — 70,000
🥤 Baker's Sugey Juice — 70,000
🥤 Streamer's Can O' Monster — 70,000
💀 Beggar's Sewage Water — 70,000
🩸 Hunter's Bag O' Animal Blood — 70,000
💠 Small XP Orb — 70,000

━━━━━━━━━━━━━━━━━━━━━━

☕ Worker's Black Coffee — 150,000
🍉 Robber's Watermelon Kool-Aid — 150,000
🍸 Gambler's Tequila — 150,000
🍁 Baker's Maple Syrup — 150,000
🥤 Streamer's Can O' White Monster — 150,000
💎 BIG Ol' XP Orb — 150,000
💀 Beggar's Stinky Sewage Water — 150,000
🩸 Hunter's Bag O' Lumpy Animal Blood — 150,000

━━━━━━━━━━━━━━━━━━━━━━`
      )
      .setFooter({
        text: "🛒 Use /buy to purchase items • Potions give temporary buffs"
      });

    return interaction.reply({ embeds: [embed] });
  },
};