const { Kazagumo } = require("kazagumo");
const { Connectors } = require("shoukaku");

module.exports = (client) => {

  try {

    const kazagumo = new Kazagumo(
      {
        defaultSearchEngine: "youtube",
        send: (guildId, payload) => {
          const guild = client.guilds.cache.get(guildId);

          if (guild) {
            guild.shard.send(payload);
          }
        },
      },

      new Connectors.DiscordJS(client),

      [
        {
          name: "main",
          url: process.env.LAVALINK_HOST,
          auth: process.env.LAVALINK_PASSWORD,
          secure: true,
        },
      ]
    );

    // 🔥 READY
    kazagumo.shoukaku.on("ready", (name) => {
      console.log(`✅ Lavalink Ready: ${name}`);
    });

    // 🔥 ERROR
    kazagumo.shoukaku.on("error", (name, error) => {
      console.log(`❌ Lavalink Error (${name}):`, error);
    });

    // 🔥 CLOSE
    kazagumo.shoukaku.on("close", (name, code, reason) => {
      console.log(
        `⚠️ Lavalink Closed (${name}) Code:${code} Reason:${reason}`
      );
    });

    // 🔥 DISCONNECT
    kazagumo.shoukaku.on("disconnect", (name) => {
      console.log(`⚠️ Lavalink Disconnected: ${name}`);
    });

    // 🔥 RECONNECTING
    kazagumo.shoukaku.on("reconnecting", (name) => {
      console.log(`🔁 Lavalink Reconnecting: ${name}`);
    });

    return kazagumo;

  } catch (err) {

    console.log("❌ lavalink.js crash:", err);

    return null;
  }
};
