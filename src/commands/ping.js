const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Pong! with latency'),
  async execute(interaction) {
    try {
      const sent = await interaction.reply({ 
        content: 'Pinging...', 
        fetchReply: true,
        flags: ['Ephemeral']
      });
      
      const latency = sent.createdTimestamp - interaction.createdTimestamp;
      const apiPing = interaction.client.ws.ping;

      const embed = new EmbedBuilder()
        .setColor(0xffb3b3)
        .setTitle('Pong! 🏓')
        .setDescription('Here are the ping details:')
        .addFields(
          { name: 'Latency', value: `${latency}ms`, inline: true },
          { name: 'API Ping', value: `${apiPing}ms`, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ 
        content: ' ', 
        embeds: [embed],
        flags: ['Ephemeral']
      });
    } catch (error) {
      console.error('Error in ping command:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: 'There was an error while executing this command!', 
          flags: ['Ephemeral']
        });
      } else {
        await interaction.followUp({ 
          content: 'There was an error while executing this command!', 
          flags: ['Ephemeral'] 
        });
      }
    }
  },
};
