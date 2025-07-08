const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('text')
    .setDescription('Generate text using AI models')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('The prompt to generate text from')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('model')
        .setDescription('The AI model to use for text generation')
        .setRequired(true)
        .addChoices(
          { name: 'GPT-4o', value: 'gpt-4o' },
          { name: 'GPT-4.1', value: 'gpt-4.1' },
          { name: 'GPT-4.1-mini', value: 'gpt-4.1-mini' },
          { name: 'o4-mini', value: 'o4-mini' },
          { name: 'o3', value: 'o3' },
          { name: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
          { name: 'Gemini Flash', value: 'gemini-flash' }
        )
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const prompt = interaction.options.getString('prompt');
      const model = interaction.options.getString('model');

      const url = new URL("https://ai-x.ri0n.dev/api");
      url.searchParams.set("text", prompt);
      url.searchParams.set("type", "text");
      url.searchParams.set("model", model);

      const res = await fetch(url.toString());
      const result = await res.json();

      if (result.type === "image" && result.url) {
        const response = await fetch(result.url);
        const buffer = await response.arrayBuffer();

        await interaction.editReply({
          content: "",
          files: [{
            attachment: Buffer.from(buffer),
            name: 'image.png',
          }],
          embeds: [{
            title: "Generated Image",
            description: result.prompt || "Image generated",
            image: { url: "attachment://image.png" },
            author: {
              name: "AI-x",
              iconURL: "https://cdn.discordapp.com/avatars/1374103595015864331/5a627e23f79ba1694265aef9d59b4f69.webp?size=1024&format=webp",
            },
            footer: {
              text: `model: ${model} | tools: Image Generation`
            },
            color: 0xffb3b3,
          }],
        });
      } else if (result.type === "search" && result.result) {
        await interaction.editReply({
          content: `${result.result}\n-# model: Gemini 2.0 Flash\n-# tools: LangSearch`,
        });
      } else if (result.type === "cmd" && result.result) {
        await interaction.editReply({
          content: `${result.result}\n-# model: GPT-4o\n-# tools: Command Execution`,
        });
      } else if (result.type === "text" && result.content) {
        await interaction.editReply({
          content: `${result.content}\n-# model: ${model}`,
        });
      } else {
        await interaction.editReply({
          content: `Sorry, an error occurred with the API. Please try again after a short while. If the problem persists, contact the developer.\n\n-# API Error`,
        });
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: "An error occurred while processing your request. Please try again later.",
      });
    }
  },
};
