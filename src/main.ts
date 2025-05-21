import { createBot, Intents, startBot } from "../deps.ts"
import { Secret } from "../secret.ts"
import { helpCommand } from "./commands/help.ts"
import { imageCommand } from "./commands/image.ts"

const commands = [helpCommand, imageCommand]

const bot = createBot({
    token: Secret.TOKEN,
    intents: Intents.Guilds | Intents.GuildMessages | Intents.MessageContent | Intents.GuildIntegrations,
    events: {
        ready: async (bot, payload) => {
            console.log(`${payload.user.username} is ready!`)

            try {
                console.log("Registering global commands...")
                await bot.helpers.upsertGlobalApplicationCommands(commands)
                console.log("Global commands registered successfully!")
            } catch (error) {
                console.error("Failed to register commands:", error)
            }
        },
    }
})

bot.events.interactionCreate = async (b, interaction) => {
    if (interaction.type === 2 && interaction.data?.name) {
        try {
            const command = commands.find(c => c.name === interaction.data!.name)
            if (command) {
                console.log(`Executing command: ${interaction.data.name}`)
                await command.execute(b, interaction)
            } else {
                console.log(`Command not found: ${interaction.data.name}`)
            }
        } catch (error) {
            console.error(`Error executing command ${interaction.data.name}:`, error)
            try {
                await b.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                    type: 4,
                    data: {
                        content: "An error occurred while executing the command."
                    }
                })
            } catch (e) {
                console.error("Failed to send error response:", e)
            }
        }
    }
}

await startBot(bot)

{/* Deno Cron Settings */}
Deno.cron("Continuous Request", "*/2 * * * *", () => {
    console.log("running...");
});
