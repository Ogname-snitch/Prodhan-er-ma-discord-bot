require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { REST, Routes } = require("discord.js");

const commands = [];

const commandsPath = path.join(__dirname, "commands");

if (!fs.existsSync(commandsPath)) {
  console.log("❌ Commands folder not found");
  process.exit(1);
}

// 🔥 LOAD ALL COMMAND FILES
const folders = fs.readdirSync(commandsPath);

for (const folder of folders) {
  const folderPath = path.join(commandsPath, folder);

  if (!fs.existsSync(folderPath)) continue;

  const files = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"));

  for (const file of files) {
    const filePath = path.join(folderPath, file);

    try {
      const command = require(filePath);

      // 🔥 EXTRA DEBUG (IMPORTANT FOR /play ISSUE)
      if (!command) {
        console.log(`❌ Empty export: ${file}`);
        continue;
      }

      if (!command.data) {
        console.log(`⚠️ Missing "data" in command: ${file}`);
        continue;
      }

      if (!command.data.name) {
        console.log(`⚠️ Missing name in command: ${file}`);
        continue;
      }

      commands.push(command.data.toJSON());
      console.log(`✅ Loaded: ${file}`);
    } catch (err) {
      console.log(`❌ Error loading ${file}:`, err.message);
    }
  }
}

// 🔥 DEBUG FINAL OUTPUT (THIS IS KEY)
console.log("=================================");
console.log("TOTAL COMMANDS LOADED:", commands.length);
console.log("COMMAND LIST:", commands.map(c => c.name));
console.log("=================================");

// 🔥 REGISTER COMMANDS TO DISCORD
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`🔁 Registering ${commands.length} slash commands...`);

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("✅ Slash commands successfully registered!");
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
})();