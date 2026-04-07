const { Client, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection, VoiceConnectionStatus } = require('@discordjs/voice');
const path = require('path');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const ALLOWED_ROLE_ID = '1457302910672048244';
const VOICE_CHANNEL_ID = '1470746311979434082';

// Nama dan ID emoji sesuai yang ada di server Anda
const EMOJI_CONFIG = {
    petir: { id: '1485326834269688019', name: 'thunder', animated: true },
    qris:  { id: '1485329765559832596', name: 'qris', animated: false },
    dana:  { id: '1485329627986657472', name: 'dana', animated: false },
    centang: { id: '1485331070072389744', name: '10218verify', animated: false }
};

// Fungsi untuk mendapatkan string emoji custom atau fallback
function getEmojiString(guild, type, fallback) {
    const cfg = EMOJI_CONFIG[type];
    if (!cfg) return fallback;
    const emoji = guild?.emojis.cache.get(cfg.id);
    if (emoji) return emoji.toString();
    // Fallback ke Unicode jika emoji tidak ditemukan
    return fallback;
}

let currentConnection = null;

async function joinVoiceChannelAndReconnect() {
    const guild = client.guilds.cache.first();
    if (!guild) return;
    const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
    if (!channel || channel.type !== 2) {
        console.error(`Voice channel ${VOICE_CHANNEL_ID} tidak ditemukan`);
        return;
    }
    const existingConnection = getVoiceConnection(guild.id);
    if (existingConnection && existingConnection.state.status === VoiceConnectionStatus.Ready) return;

    const connection = joinVoiceChannel({
        channelId: VOICE_CHANNEL_ID,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
        console.log(`✅ Bot masuk voice: ${channel.name}`);
    });
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        console.log('⚠️ Terputus, reconnect dalam 5 detik...');
        setTimeout(() => joinVoiceChannelAndReconnect(), 5000);
    });
    currentConnection = connection;
}

client.once(Events.ClientReady, async (c) => {
    console.log(`✅ Bot ${c.user.tag} online!`);
    await joinVoiceChannelAndReconnect();
});

client.on(Events.GuildAvailable, async (guild) => {
    if (!getVoiceConnection(guild.id)) await joinVoiceChannelAndReconnect();
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    const content = message.content.toLowerCase();
    const member = message.member;
    if (!member || !member.roles.cache.has(ALLOWED_ROLE_ID)) return;

    const guild = message.guild;
    const getEmoji = (type, fallback) => getEmojiString(guild, type, fallback);

    // Command !qr
    if (content === '!qr') {
        try {
            const imagePath = path.join(__dirname, 'assets', 'qris.jpg');
            const petir = getEmoji('petir', '⚡');
            const qris = getEmoji('qris', '🟢');
            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle(`${qris} QRIS ALL PAYMENT MARVINX TEAM ${petir}`)
                .setImage('attachment://qris.jpg')
                .setFooter({ text: 'Scan QRIS di atas untuk pembayaran' });
            await message.channel.send({ embeds: [embed], files: [imagePath] });
        } catch (error) { console.error(error); }
    }
    // Command !pay (DANA saja)
    else if (content === '!pay') {
        try {
            const dana = getEmoji('dana', '💰');
            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle(`${dana} 085752852674 (DANA)`)
                .setFooter({ text: 'Pembayaran via DANA' });
            await message.channel.send({ embeds: [embed] });
        } catch (error) { console.error(error); }
    }
    // Command !allpay (QRIS Allpay + DANA + centang)
    else if (content === '!allpay') {
        try {
            const imagePath = path.join(__dirname, 'assets', 'qris.jpg');
            const qris = getEmoji('qris', '🟢');
            const dana = getEmoji('dana', '💰');
            const centang = getEmoji('centang', '✅');
            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle(`${qris} QRIS ALLPAY ${centang}\n${dana} DANA ${centang}`)
                .setImage('attachment://qris.jpg')
                .setFooter({ text: 'MarvinX Team System' });
            await message.channel.send({ embeds: [embed], files: [imagePath] });
        } catch (error) { console.error(error); }
    }
});

client.login(process.env.DISCORD_TOKEN);
