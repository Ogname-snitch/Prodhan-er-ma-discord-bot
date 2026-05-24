const { Kazagumo } = require("kazagumo");
const { Connectors } = require("shoukaku");

module.exports = (client) => {
  const kazagumo = new Kazagumo(
    {
      defaultSearchEngine: "youtube",
      send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);

        if (guild) guild.shard.send(payload);
      },
    },
    new Connectors.DiscordJS(client),
    [
      {
        name: "Lavalink",
        url: process.env.LAVALINK_HOST,
        auth: process.env.LAVALINK_PASSWORD,
        secure: false,
      },
    ]
  );

  kazagumo.shoukaku.on("ready", name => {
    console.log(`${name} ready`);
  });

  kazagumo.shoukaku.on("error", (name, err) => {
    console.log(`${name} error`, err);
  });

  return kazagumo;
};