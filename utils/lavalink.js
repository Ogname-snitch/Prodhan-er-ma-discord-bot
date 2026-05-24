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

  return new Kazagumo(
    {
      defaultSearchEngine: "youtube",
      send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;
        guild.shard.send(payload);
      },
    },
    new Connectors.DiscordJS(client),
    nodes
  );
};