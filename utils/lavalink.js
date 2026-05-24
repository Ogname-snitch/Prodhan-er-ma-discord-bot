const { Kazagumo } = require("kazagumo");
const { Connectors } = require("shoukaku");

module.exports = (client) => {
  const nodes = [
    {
      name: "main",
      url: process.env.LAVALINK_HOST,
      auth: process.env.LAVALINK_PASSWORD,
      secure: process.env.LAVALINK_HOST.includes("443"),
    },
  ];

  const kazagumo = new Kazagumo(
    {
      defaultSearchEngine: "youtube",
      send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;
        guild.shard?.send(payload);
      },
    },
    new Connectors.DiscordJS(client),
    nodes
  );

  // IMPORTANT FIX: proper logging
  kazagumo.shoukaku.on("ready", (name) => {
    console.log(`✅ Lavalink ready: ${name}`);
  });

  kazagumo.shoukaku.on("error", (name, error) => {
    console.log(`❌ Lavalink error (${name}):`, error.message);
  });

  kazagumo.shoukaku.on("close", (name) => {
    console.log(`⚠️ Lavalink closed: ${name}`);
  });

  kazagumo.shoukaku.on("disconnect", () => {
    console.log(`⚠️ Lavalink disconnected`);
  });

  return kazagumo;
};