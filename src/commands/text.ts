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
        { name: "GPT-4o", value: "gpt-4o-2024-11-20" },
        { name: "GPT-4.1", value: "gpt-4.1-2025-04-14" },
        { name: "o4-mini", value: "o4-mini-2025-04-16" },
        { name: "o3", value: "o3-2025-04-16" },
        { name: "o3-pro", value: "o3-pro-2025-06-10" },
        { name: "Gemini 2.5 Pro", value: "gemini-2.5-pro-preview-06-05" },
        { name: "Gemini 2.5 Flash", value: "gemini-2.5-flash-preview-04-17" },
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
      if (!prompt || !model) {
        throw new Error("No prompt or model provided");
      }

      const openai = new OpenAI({
        baseURL: "https://capi.voids.top/v1",
        apiKey: "no_api_key_needed",
      });

      const textResponse = await openai.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const text = textResponse.choices[0].message.content;
      if (!text) {
        throw new Error("API returned empty text data");
      }

      await b.helpers.editOriginalInteractionResponse(interaction.token, {
        content: text,
      });
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
