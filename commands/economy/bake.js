const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const User = require("../../utils/database");

const cooldown = 20000;

// ================= FUNNY BAKING LINES =================
const bakeLines = [
  "You tried baking… the smoke alarm is now your co-worker 🚨",
  "You forgot the sugar and invented emotional damage cake 💀",
  "The cake looks suspiciously like a rock 🪨",
  "You followed the recipe perfectly… still got chaos 🍰",
  "Your oven said 'nah bro' and exploded slightly 🔥",
  "You baked with love… and a little bit of regret ❤️",
  "The cake is undercooked but your confidence is high 📈",
  "You accidentally used salt instead of sugar 😭",
  "The cake is now a pancake hybrid 🥞",
  "Even Gordon Ramsay would quit Discord after seeing this 👨‍🍳",
  "You baked so hard the kitchen filed a complaint 🧑‍⚖️",
  "Prodhan's cake was stolen by Omar",
  "Tuhid liked the minecraft cake",
  "Johan bought it for his platonic soulmate",
  "Suhaib will gift his ISP a cake in hopes of getting better internet",
  "Yean bough cake for his concert",
  "Shayan bought cake for his basketball game",
  "Omar stole Prodhan's cake",
];

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

    // ================= RANDOM LINE =================
    const line = bakeLines[Math.floor(Math.random() * bakeLines.length)];

    // ================= SUCCESS EMBED =================
    const embed = new EmbedBuilder()
      .setColor(0xffb347)
      .setTitle("🎂 Baking Successful!")
      .setDescription(
        [
          `> *${line}*`,
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