const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("📢 Make the bot say something")
    .addStringOption(option =>
      option
        .setName("message")
        .setDescription("What should I say?")
        .setRequired(true)
    ),

  async execute(interaction) {
    const text = interaction.options.getString("message");

    if (!text) {
      return interaction.reply({
        content: "❌ You need to type a message.",
        ephemeral: true,
      });
    }

    // Optional safety: prevent pings
    const safeText = text.replace(/@/g, "@\u200b");

    await interaction.reply({
      content: "✅ Sent!",
      ephemeral: true,
    });

    await interaction.channel.send(safeText);
  },
};