import { createBot, Intents, startBot } from "@root/deps.ts";
import { Secret } from "@root/secret.ts";
import { helpCommand } from "@/commands/help.ts";
import { textCommand } from "@/commands/text.ts";
import { imageCommand } from "@/commands/image.ts";
import { loadHistory, saveHistory } from "@/history.ts";

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

const processingUsers = new Set();
bot.events.messageCreate = async (bot, message) => {
  if (message.isFromBot) return;
  if (message.content.startsWith(`<@${bot.id}>`)) {
    const userId = message.authorId;

    if (processingUsers.has(userId)) {
      const reply = await bot.helpers.sendMessage(message.channelId, {
        content: "⏳ 前のリクエストを処理中です。",
      });
      setTimeout(() => {
        bot.helpers.deleteMessage(message.channelId, reply.id);
      }, 3000);
      return;
    }

    try {
      processingUsers.add(userId);
      
      await bot.helpers.startTyping(message.channelId);

      const history = await loadHistory(userId.toString());
      const userMessage = {
        author: "user" as const,
        content: message.content.replace(/<@!?\d+>/g, "").trim(),
      };
      history.push(userMessage);

      const url = new URL(`https://ai-x.ri0n.dev/api`);
      url.searchParams.set("text", userMessage.content);
      url.searchParams.set("type", "text");
      url.searchParams.set("history", JSON.stringify(history));

      const res = await fetch(url.toString());
      const result = await res.json();

      let botResponse = "";

      if (result.type === "image" && result.url) {
        const response = await fetch(result.url);
        const buffer = await response.arrayBuffer();

        await bot.helpers.sendMessage(message.channelId, {
          content: "",
          file: [
            {
              name: "image.png",
              blob: new Blob([buffer], { type: "image/png" }),
            },
          ],
          embeds: [{
            title: "Generated Image",
            description: `${result.prompt || "Image generated"}`,
            image: {
              url: `attachment://image.png`,
            },
            author: {
              name: "AI-x",
              iconUrl: "https://cdn.discordapp.com/avatars/1374103595015864331/5a627e23f79ba1694265aef9d59b4f69.webp?size=1024&format=webp",
            },
            footer: {
              text: "model: GPT-4o | tools: Image Generation"
            },
            color: 0xffb3b3,
          }],
        });
        botResponse = result.prompt || "Image generated";
      } else if (result.type === "search" && result.result) {
        await bot.helpers.sendMessage(message.channelId, {
          content: `${result.result || "No response"}\n-# model: Gemini 2.0 Flash\n-# tools: LangSearch`,
        });
        botResponse = result.result || "No response";
      } else if (result.type === "cmd" && result.result) {
        await bot.helpers.sendMessage(message.channelId, {
          content: `${result.result}\n-# model: GPT-4o\n-# tools: Command Execution`,
        });
        botResponse = result.result;
      } else if (result.type === "text" && result.content) {
        await bot.helpers.sendMessage(message.channelId, {
          content: `${result.content}\n-# model: GPT-4o`,
        });
        botResponse = result.content;
      } else {
        await bot.helpers.sendMessage(message.channelId, {
          content: `Sorry, an error occurred with the API. Please try again after a short while. If the problem persists, contact the developer.\n\n-# API Error`,
        });
        botResponse = "API Error";
      }

      history.push({ author: "bot", content: botResponse });
      await saveHistory(userId.toString(), history);

    } catch (error) {
      console.error("Error processing message:", error);
      await bot.helpers.sendMessage(message.channelId, {
        content: "An error occurred while processing your message.",
      });
    } finally {
      processingUsers.delete(userId);
    }
  }
};

await startBot(bot);

{ /* Deno Cron Settings */ }
Deno.cron("Continuous Request", "*/1 * * * *", () => {
  console.log("running...");
});
