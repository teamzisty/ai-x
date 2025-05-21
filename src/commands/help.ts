import { Bot, Interaction } from "../../deps.ts"

export const helpCommand = {
    name: "help",
    description: "Show help.",
    type: 1,
    execute: async (b: Bot, interaction: Interaction) => {
        try {
            await b.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: 4,
                data: {
                    embeds: [{
                        title: "Hi, I'm AI-x",
                        description: "AI-x is a free application that lets you generate images and text. You can generate images using commands, and generate text either through commands or by mentioning the app.\n\n❓ Need support? If so, please visit [Zisty Hub](https://discord.gg/6BPfVm6cST)\n\nDeveloper: Zisty(Rion)",
                        author: {
                            name: "AI-x",
                            iconUrl: "https://cdn.discordapp.com/avatars/1374103595015864331/5a627e23f79ba1694265aef9d59b4f69.webp?size=1024&format=webp",
                        },
                        thumbnail: {
                            url: "https://cdn.discordapp.com/avatars/1374103595015864331/5a627e23f79ba1694265aef9d59b4f69.webp?size=1024&format=webp",
                        },
                        color: 0xffb3b3,
                    }],
                },
            });
        } catch (e) {
            console.error(e)
        }
    },
}
