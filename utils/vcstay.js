const {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
} = require("@discordjs/voice");

module.exports = (client) => {
  const guildId = process.env.GUILD_ID;
  const channelId = process.env.CHANNEL_ID;

  if (!guildId || !channelId) {
    console.log("❌ Missing GUILD_ID or CHANNEL_ID");
    return;
  }

  function connect() {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    const existing = getVoiceConnection(guildId);

    if (existing) {
      // already connected → just keep it
      return;
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });

    console.log("🔊 Joined VC");

    // 🔥 KEEP ALIVE HANDLER
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        console.log("⚠️ VC Disconnected, reconnecting...");

        setTimeout(() => {
          connect();
        }, 3000);
      } catch (err) {
        console.log("VC reconnect error:", err);
      }
    });

    connection.on(VoiceConnectionStatus.Destroyed, () => {
      console.log("❌ VC Destroyed, reconnecting...");
      setTimeout(connect, 3000);
    });
  }

  // initial connect
  client.once("ready", () => {
    setTimeout(connect, 5000);
  });

  // heartbeat check (VERY IMPORTANT)
  setInterval(() => {
    const connection = getVoiceConnection(guildId);

    if (!connection) {
      console.log("🔁 VC missing → reconnecting");
      connect();
    }
  }, 10000);
};