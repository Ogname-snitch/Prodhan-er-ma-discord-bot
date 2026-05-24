const {
  joinVoiceChannel,
  getVoiceConnection,
} = require("@discordjs/voice");

module.exports = (client) => {
  function stayInVC() {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);

    if (!guild) return;

    const channel = guild.channels.cache.get(
      process.env.CHANNEL_ID
    );

    if (!channel) return;

    if (getVoiceConnection(guild.id)) return;

    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
    });
  }

  setInterval(stayInVC, 15000);
};