const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: ['CHANNEL']
});

const processingUsers = new Set();

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('ready', async () => {
    const commands = [];
    const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(__dirname, 'commands', file));
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(token);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(
            Routes.applicationCommands(clientId),
            { body: commands },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Error reloading application (/) commands:', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const command = require(path.join(__dirname, 'commands', `${interaction.commandName}.js`));

    if (!command) {
        return interaction.reply({ content: 'Unknown command', ephemeral: true });
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error('Error executing command:', error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const userId = message.author.id;

    if (message.content.trim() === `<@${client.user.id}>`) {
        return;
    }

    if (message.content.startsWith(`<@${client.user.id}>`)) {
        if (processingUsers.has(userId)) {
            const reply = await message.reply('You are already being processed. Please wait.');
            setTimeout(() => { reply.delete(); }, 3000);
            return;
        }

        try {
            processingUsers.add(userId);

            await message.channel.sendTyping();

            const hashedUserId = crypto.createHash('sha256').update(userId).digest('hex');

            const url = new URL('https://ai-x.ri0n.dev/api');
            url.searchParams.set('userId', hashedUserId);
            url.searchParams.set('ask', message.content);

            const res = await fetch(url.toString());
            const result = await res.json();

            if (result.type === 'image' && result.url) {
                const response = await fetch(result.url);
                const arrayBuffer = await response.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);

                await message.channel.send({
                    content: '',
                    files: [{
                        attachment: buffer,
                        name: 'image.png'
                    }],
                    embeds: [{
                        title: 'Generated Image',
                        description: result.prompt || 'Image generated',
                        image: { url: 'attachment://image.png' },
                        footer: { text: 'Model: GPT-4o / Tools: Image Generation' },
                        color: 0xffb3b3
                    }]
                });

                botResponse = result.prompt || 'Image generated';
            } else if (result.type === 'gemini' && result.result) {
                await message.channel.send(`${result.result}\n-# Model: Gemini 2.5 Pro`);
                botResponse = result.result;
            } else if (result.type === 'claude' && result.result) {
                await message.channel.send(`${result.result}\n-# Model: Claude Sonnet 4`);
                botResponse = result.result;
            } else if (result.type === 'ask' && result.result) {
                await message.channel.send(`${result.result	}\n-# Model: GPT-4o`);
                botResponse = result.result;
            } else {
                await message.channel.send('Sorry, an error occurred with the API. Please try again after a short while. If the problem persists, contact the developer.');
                botResponse = 'API Error';
            }
        } catch (error) {
            console.error('Error processing message:', error);
            await message.channel.send('An error occurred while processing your request. Please try again later.');
        } finally {
            processingUsers.delete(userId);
        }
    }
});

client.login(process.env.TOKEN);