const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help information about the bot'),
  
  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setTitle("Hi, I'm AI-x")
        .setDescription(
          "AI-x is a free application that allows you to generate images, perform searches, and have conversations. You can request it to carry out tasks such as image generation and searching.\n\nThe user's conversations are stored on the server and are used for the purpose of natural conversation. The user ID is hashed and sent, making it impossible to identify the user from the ID.\n\n❓ Need support? If so, please visit [Zisty Hub](https://discord.gg/6BPfVm6cST)\n\nDeveloper: Zisty(Rion and rai)"
        )
        .setAuthor({ 
          name: "AI-x", 
          iconURL: "https://cdn.discordapp.com/avatars/1374103595015864331/5a627e23f79ba1694265aef9d59b4f69.webp?size=1024&format=webp" 
        })
        .setThumbnail("https://cdn.discordapp.com/avatars/1374103595015864331/5a627e23f79ba1694265aef9d59b4f69.webp?size=1024&format=webp")
        .setColor(0xffb3b3);

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error in help command:', error);
      if (!interaction.replied) {
        await interaction.reply({ 
          content: 'There was an error while executing this command!', 
          flags: ['Ephemeral'] 
        });
      }
    }
  },
};
