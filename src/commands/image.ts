import { Bot, Interaction } from "@root/deps.ts";

export const imageCommand = {
    name: "image",
    description: "Generate an image.",
    type: 1,
    options: [
        {
            name: "prompt",
            description: "The prompt to generate an image from.",
            type: 3,
            required: true,
        },
    ],
    execute: async (b: Bot, interaction: Interaction) => {
        try {
            await b.helpers.sendInteractionResponse(interaction.id, interaction.token, {
                type: 5
            });

            const prompt = interaction.data?.options?.find(opt => opt.name === "prompt")?.value as string;
            if (!prompt) {
                throw new Error("No prompt provided");
            }

            const imageResponse = await fetch(`https://ai-x.ri0n.dev/api/?text=${encodeURIComponent(prompt)}&type=image`);
            if (!imageResponse.ok) {
                throw new Error(`API returned status ${imageResponse.status}: ${imageResponse.statusText}`);
            }

            const res = await fetch(imageResponse.url);
            const result = await res.json();

            const response = await fetch(result.url);
            const buffer = await response.arrayBuffer();

            await b.helpers.editOriginalInteractionResponse(interaction.token, {
                content: "",
                file: [
                    {
                        name: "image.png",
                        blob: new Blob([buffer], { type: "image/png" }),
                    },
                ],
                embeds: [{
                    title: "Generated Image",
                    description: `${prompt}\n`,
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
        } catch (_e) {
            await b.helpers.editOriginalInteractionResponse(interaction.token, {
                content: "",
                embeds: [{
                    title: "Sorry",
                    description: "An error occurred and the image could not be generated. Please try again or wait a while before trying again. If the issue persists, consider contacting the developer or checking the system status.",
                    color: 0xff0000,
                    footer: {
                        text: "Please try again or try another prompt"
                    }
                }]
            });
        }
    },
};