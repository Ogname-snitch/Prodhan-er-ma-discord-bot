const {
  SlashCommandBuilder,
} = require("discord.js");

const fs = require("fs");
const path = require("path");

const imageFolder = path.join(__dirname, "../../images");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("prodhan")
    .setDescription("🎰 Random image"),

  async execute(interaction) {
    const images = fs.existsSync(imageFolder)
      ? fs.readdirSync(imageFolder).filter(f =>
          /\.(png|jpg|jpeg|webp)$/i.test(f)
        )
      : [];

    if (!images.length) {
      return interaction.reply("❌ No images found");
    }

    const file =
      images[Math.floor(Math.random() * images.length)];

    return interaction.reply({
      content: "🎰 Roulette",
      files: [path.join(imageFolder, file)],
    });
  },
};