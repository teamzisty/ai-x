import { createBot, Intents, startBot, OpenAI } from "@root/deps.ts";
import { Secret } from "@root/secret.ts";
import { helpCommand } from "@/commands/help.ts";
import { textCommand } from "@/commands/text.ts";
import { imageCommand } from "@/commands/image.ts";

const commands = [helpCommand, textCommand, imageCommand];

const bot = createBot({
  token: Secret.TOKEN,
  intents:
    Intents.Guilds |
    Intents.GuildMessages |
    Intents.MessageContent |
    Intents.GuildIntegrations,
  events: {
    ready: async (bot, payload) => {
      console.log(`${payload.user.username} is ready!`);

      try {
        console.log("Registering global commands...");
        await bot.helpers.upsertGlobalApplicationCommands(commands);
        console.log("Global commands registered successfully!");
      } catch (error) {
        console.error("Failed to register commands:", error);
      }
    },
  },
});

bot.events.interactionCreate = async (b, interaction) => {
  if (interaction.type === 2 && interaction.data?.name) {
    try {
      const command = commands.find((c) => c.name === interaction.data!.name);
      if (command) {
        console.log(`Executing command: ${interaction.data.name}`);
        await command.execute(b, interaction);
      } else {
        console.log(`Command not found: ${interaction.data.name}`);
      }
    } catch (error) {
      console.error(`Error executing command ${interaction.data.name}:`, error);
      try {
        await b.helpers.sendInteractionResponse(
          interaction.id,
          interaction.token,
          {
            type: 4,
            data: {
              content: "An error occurred while executing the command.",
            },
          }
        );
      } catch (e) {
        console.error("Failed to send error response:", e);
      }
    }
  }
};

bot.events.messageCreate = async (bot, message) => {
  if (message.isFromBot) return; // Ignore bot messages
  // @ Mention the bot to trigger ai
  if (message.content.startsWith(`<@${bot.id}>`)) {
    try {
      await bot.helpers.startTyping(message.channelId);

      const openai = new OpenAI({
        baseURL: "https://capi.voids.top/v1",
        apiKey: "no_api_key_needed",
      });

      const textResponse = await openai.chat.completions.create({
        model: "gpt-4.1-2025-04-14",
        messages: [
          {
            role: "user",
            content: message.content.replace(`<@${bot.id}>`, ""),
          },
        ],
      });

      const text = textResponse.choices[0].message.content;
      if (!text) {
        throw new Error("API returned empty text data");
      }

      await bot.helpers.sendMessage(message.channelId, {
        content: text,
        messageReference: {
          channelId: message.channelId,
          guildId: message.guildId,
          messageId: message.id,
          failIfNotExists: true,
        },
      });
    } catch (error) {
      console.error("Error processing message:", error);
      await bot.helpers.sendMessage(message.channelId, {
        content: "An error occurred while processing your message.",
      });
    }
  }
};

await startBot(bot);

{
  /* Deno Cron Settings */
}
Deno.cron("Continuous Request", "*/2 * * * *", () => {
  console.log("running...");
});
