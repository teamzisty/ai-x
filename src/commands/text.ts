import { OpenAI, Bot, Interaction } from "@root/deps.ts";

export const textCommand = {
  name: "text",
  description: "Generate text.",
  type: 1,
  options: [
    {
      name: "prompt",
      description: "The prompt to generate text from.",
      type: 3,
      required: true,
    },
    {
      name: "model",
      description: "The model to use for text generation.",
      type: 3,
      required: true,
      choices: [
        { name: "GPT-4o", value: "gpt-4o" },
        { name: "GPT-4.1", value: "gpt-4.1" },
        { name: "GPT-4.1-mini", value: "gpt-4.1-mini" },
        { name: "o4-mini", value: "o4-mini" },
        { name: "o3", value: "o3" },
        { name: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
        { name: "Gemini Flash", value: "gemini-flash" },
      ],
    }
  ],
  execute: async (b: Bot, interaction: Interaction) => {
    try {
      await b.helpers.sendInteractionResponse(
        interaction.id,
        interaction.token,
        {
          type: 5,
        }
      );

      const prompt = interaction.data?.options?.find(
        (opt) => opt.name === "prompt"
      )?.value as string;

      const model = interaction.data?.options?.find(
        (opt) => opt.name === "model"
      )?.value as string;

      const url = new URL("https://ai-x.ri0n.dev/api");
      url.searchParams.set("text", prompt);
      url.searchParams.set("type", "text");
      url.searchParams.set("model", model);

      const res = await fetch(url.toString());
      const result = await res.json();

      if (result.type === "image" && result.url) {
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
            description: `${result.prompt || "Image generated"}`,
            image: {
              url: `attachment://image.png`,
            },
            author: {
              name: "AI-x",
              iconUrl: "https://cdn.discordapp.com/avatars/1374103595015864331/5a627e23f79ba1694265aef9d59b4f69.webp?size=1024&format=webp",
            },
            footer: {
              text: `model: ${model} | tools: Image Generation`
            },
            color: 0xffb3b3,
          }],
        });
      } else if (result.type === "search" && result.result) {
        await b.helpers.editOriginalInteractionResponse(interaction.token, {
          content: `${result.result}\n-# model: Gemini 2.0 Flash\n-# tools: LangSearch`,
        });
      } else if (result.type === "cmd" && result.result) {
        await b.helpers.editOriginalInteractionResponse(interaction.token, {
          content: `${result.result}\n-# model: GPT-4o\n-# tools: Command Execution`,
        });
      } else if (result.type === "text" && result.content) {
        await b.helpers.editOriginalInteractionResponse(interaction.token, {
          content: `${result.content}\n-# model: ${model}`,
        });
      } else {
        await b.helpers.editOriginalInteractionResponse(interaction.token, {
          content: `Sorry, an error occurred with the API. Please try again after a short while. If the problem persists, contact the developer.\n\n-# API Error`,
        });
      }
    } catch (_e) {
      await b.helpers.editOriginalInteractionResponse(interaction.token, {
        content: "",
        embeds: [
          {
            title: "Sorry",
            description:
              "An error occurred and the text could not be generated. Please try again or wait a while before trying again. If the issue persists, consider contacting the developer or checking the system status.",
            color: 0xff0000,
            footer: {
              text: "Please try again or try another prompt",
            },
          },
        ],
      });
    }
  },
};
