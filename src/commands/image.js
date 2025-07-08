const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('image')
    .setDescription('Generate an image.')
    .addStringOption(option =>
      option.setName('prompt')
        .setDescription('The prompt to generate an image from.')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const prompt = interaction.options.getString('prompt');
      if (!prompt) {
        throw new Error("No prompt provided");
      }

      const imageResponse = await fetch(`https://ai-x.ri0n.dev/api/?text=${encodeURIComponent(prompt)}&type=image`);
      if (!imageResponse.ok) {
        throw new Error(`API returned status ${imageResponse.status}: ${imageResponse.statusText}`);
      }

      const result = await imageResponse.json();
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
          description: `${prompt}\n`,
          image: { url: "attachment://image.png" },
          author: {
            name: "AI-x",
            iconURL: "https://cdn.discordapp.com/avatars/1374103595015864331/5a627e23f79ba1694265aef9d59b4f69.webp?size=1024&format=webp",
          },
          footer: {
            text: "model: GPT-4o | tools: Image Generation"
          },
          color: 0xffb3b3,
        }],
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
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
