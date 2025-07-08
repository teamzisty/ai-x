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
            url.searchParams.set('text', message.content);
            url.searchParams.set('type', 'text');

            const res = await fetch(url.toString());
            const result = await res.json();

            let botResponse = '';

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
                        footer: { text: 'model: GPT-4o | tools: Image Generation' },
                        color: 0xffb3b3
                    }]
                });

                botResponse = result.prompt || 'Image generated';
            } else if (result.type === 'search' && result.result) {
                await message.channel.send(`${result.result}\n-# model: Gemini 2.0 Flash\n-# tools: LangSearch`);
                botResponse = result.result;
            } else if (result.type === 'cmd' && result.result) {
                await message.channel.send(`${result.result}\n-# model: GPT-4o\n-# tools: Command Execution`);
                botResponse = result.result;
            } else if (result.type === 'text' && result.content) {
                await message.channel.send(`${result.content}\n-# model: GPT-4o`);
                botResponse = result.content;
            } else {
                await message.channel.send('API エラーが発生しました。しばらくしてから再試行してください。');
                botResponse = 'API Error';
            }
        } catch (error) {
            console.error('Error processing message:', error);
            await message.channel.send('メッセージの処理中にエラーが発生しました。');
        } finally {
            processingUsers.delete(userId);
        }
    }
});

client.login(process.env.TOKEN);