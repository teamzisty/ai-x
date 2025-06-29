import { Bot, Interaction } from "@root/deps.ts";

export const helpCommand = {
  name: "help",
  description: "Show help.",
  type: 1,
  execute: async (b: Bot, interaction: Interaction) => {
    try {
      await b.helpers.sendInteractionResponse(
        interaction.id,
        interaction.token,
        {
          type: 4,
          data: {
            embeds: [
              {
                title: "Hi, I'm AI-x",
                description:
                  "AI-x is a free application that allows you to generate images, perform searches, and have conversations. You can request it to carry out tasks such as image generation and searching.\n\n❓ Need support? If so, please visit [Zisty Hub](https://discord.gg/6BPfVm6cST)\n\nDeveloper: Zisty(Rion and rai)",
                author: {
                  name: "AI-x",
                  iconUrl:
                    "https://cdn.discordapp.com/avatars/1374103595015864331/5a627e23f79ba1694265aef9d59b4f69.webp?size=1024&format=webp",
                },
                thumbnail: {
                  url: "https://cdn.discordapp.com/avatars/1374103595015864331/5a627e23f79ba1694265aef9d59b4f69.webp?size=1024&format=webp",
                },
                color: 0xffb3b3,
              },
            ],
          },
        }
      );
    } catch (e) {
      console.error(e);
    }
  },
};
