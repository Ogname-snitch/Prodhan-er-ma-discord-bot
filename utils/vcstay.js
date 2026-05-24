const {
  joinVoiceChannel,
  getVoiceConnection,
} = require("@discordjs/voice");

function stayInVC(client) {
  setInterval(() => {
    const guild = client.guilds.cache.get(process.env.GUILD_ID);
    if (!guild) return;

    const channel = guild.channels.cache.get(process.env.CHANNEL_ID);
    if (!channel) return;

    if (getVoiceConnection(guild.id)) return;

    joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
    });
  }, 15000);
}

module.exports = stayInVC;