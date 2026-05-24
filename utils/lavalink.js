const { Kazagumo, Connectors } = require("kazagumo");

module.exports = (client) => {
  const nodes = [
    {
      name: "main",
      url: process.env.LAVALINK_HOST,
      auth: process.env.LAVALINK_PASSWORD,
      secure: false,
    },
  ];

  const kazagumo = new Kazagumo(
    {
      defaultSearchEngine: "youtube",
      send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
      },
    },
    new Connectors.DiscordJS(client),
    nodes
  );

  // 🔥 THIS tells you if Lavalink actually connects
  kazagumo.shoukaku.on("ready", (name) => {
    console.log("✅ Lavalink connected:", name);
  });

  kazagumo.shoukaku.on("error", (name, err) => {
    console.log("❌ Lavalink error:", err.message);
  });

  return kazagumo;
};