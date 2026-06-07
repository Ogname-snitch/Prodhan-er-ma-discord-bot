const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 20000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bake")
    .setDescription("🎂 Bake a cake"),

  async execute(interaction) {

    const user = await User.getUser(interaction.user.id);
    const now = Date.now();

    // ================= COOLDOWN =================
    if (now - user.lastBake < cooldown) {
      const left = Math.ceil((cooldown - (now - user.lastBake)) / 1000);

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xffcc70)
            .setTitle("⏳ Baking Cooldown")
            .setDescription(`You are still baking ideas...\n\n**Wait:** \`${left}s\``)
            .setFooter({ text: "Keep your oven warm!" })
        ],
        ephemeral: true,
      });
    }

    // ================= REQUIREMENT =================
    const equipment = user.inventory.find(
      i => i.item === "baking equipment" && i.amount > 0
    );

    if (!equipment) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xff5c5c)
            .setTitle("❌ Missing Equipment")
            .setDescription(
              "You need **baking equipment** to bake cakes.\n\nGo buy or find it before baking!"
            )
            .setFooter({ text: "Kitchen locked 🔒" })
        ],
        ephemeral: true,
      });
    }

    // ================= ADD ITEM =================
    const existing = user.inventory.find(i => i.item === "cake");

    if (existing) {
      existing.amount += 1;
    } else {
      user.inventory.push({ item: "cake", amount: 1 });
    }

    user.lastBake = now;
    user.markModified("inventory");

    await user.save();

    // ================= SUCCESS EMBED =================
    const embed = new EmbedBuilder()
      .setColor(0xffb347)
      .setTitle("🎂 Baking Successful!")
      .setDescription(
        [
          "You carefully mix ingredients, preheat the oven, and bake a perfect cake.",
          "",
          "🍰 **Result:** You successfully baked **1 cake**!",
          "",
          "📦 The cake has been added to your inventory."
        ].join("\n")
      )
      .addFields(
        {
          name: "🧾 Requirement Used",
          value: "Baking Equipment ✔",
          inline: true,
        },
        {
          name: "⏱ Cooldown",
          value: "20 seconds",
          inline: true,
        }
      )
      .setFooter({
        text: "Cooking System • Bake Command",
      });

    return interaction.reply({ embeds: [embed] });
  },
};