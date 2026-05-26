const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

const User = require("../../utils/database");

const cooldown = 180000; // 3 mins
const jail = 60 * 60 * 1000; // 1 hour

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bankrob")
    .setDescription("🏦 Rob a bank")
    .addUserOption(option =>
      option
        .setName("partner")
        .setDescription("Partner")
        .setRequired(true)
    ),

  async execute(interaction) {

    const partnerUser =
      interaction.options.getUser("partner");

    if (partnerUser.id === interaction.user.id) {
      return interaction.reply(
        "❌ You can't rob with yourself"
      );
    }

    const user =
      await User.getUser(interaction.user.id);

    const partner =
      await User.getUser(partnerUser.id);

    const now = Date.now();

    // 🚔 JAIL CHECK
    if (user.bankJailUntil > now) {
      const left = Math.ceil(
        (user.bankJailUntil - now) / 1000
      );

      return interaction.reply(
        `🚔 You're jailed for ${left}s`
      );
    }

    // ⏳ COOLDOWN
    if (now - user.lastBankRob < cooldown) {
      const left = Math.ceil(
        (cooldown - (now - user.lastBankRob)) / 1000
      );

      return interaction.reply(
        `⏳ Wait ${left}s`
      );
    }

    // 🎭 SKI MASK CHECK
    const mask =
      user.inventory.find(
        i =>
          i.item === "ski masks" &&
          i.amount > 0
      );

    if (!mask) {
      return interaction.reply(
        "❌ You need ski masks"
      );
    }

    // 🎭 PARTNER NEEDS MASK TOO
    const partnerMask =
      partner.inventory.find(
        i =>
          i.item === "ski masks" &&
          i.amount > 0
      );

    if (!partnerMask) {
      return interaction.reply(
        "❌ Your partner needs ski masks"
      );
    }

    // ✅ ACCEPT BUTTONS
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("accept_bankrob")
          .setLabel("Accept")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("decline_bankrob")
          .setLabel("Decline")
          .setStyle(ButtonStyle.Danger)
      );

    const msg =
      await interaction.reply({
        content:
          `<@${partnerUser.id}>, do you accept the bank robbery?`,
        components: [row],
        fetchReply: true,
      });

    const collector =
      msg.createMessageComponentCollector({
        time: 60000,
      });

    collector.on("collect", async i => {

      if (i.user.id !== partnerUser.id) {
        return i.reply({
          content:
            "❌ This isn't for you",
          ephemeral: true,
        });
      }

      if (i.customId === "decline_bankrob") {

        collector.stop();

        return i.update({
          content:
            "❌ Bank robbery declined",
          components: [],
        });
      }

      if (i.customId === "accept_bankrob") {

        collector.stop();

        // 🎲 FAIL CHANCE
        let failChance = 0.75;

        const robberCount =
          (user.perk === "Robber" ? 1 : 0) +
          (partner.perk === "Robber" ? 1 : 0);

        if (robberCount === 1) {
          failChance = 0.50;
        }

        if (robberCount === 2) {
          failChance = 0.25;
        }

        const failed =
          Math.random() < failChance;

        if (failed) {

          user.bankJailUntil =
            now + jail;

          partner.bankJailUntil =
            now + jail;

          user.lastBankRob = now;
          partner.lastBankRob = now;

          await user.save();
          await partner.save();

          return i.update({
            content:
              "🚔 Bank robbery failed. Both robbers jailed for 1 hour.",
            components: [],
          });
        }

        const amount =
          Math.floor(
            Math.random() * 9001
          ) + 1000;

        const split =
          Math.floor(amount / 2);

        user.wallet += split;
        partner.wallet += split;

        user.lastBankRob = now;
        partner.lastBankRob = now;

        await user.save();
        await partner.save();

        return i.update({
          content:
            `🏦 Successful robbery!\n💰 Total: ${amount} coins\nEach robber got ${split} coins`,
          components: [],
        });
      }
    });

    collector.on("end", async (_, reason) => {

      if (reason === "time") {

        await msg.edit({
          content:
            "❌ Bank robbery request expired",
          components: [],
        }).catch(() => {});
      }
    });
  },
};