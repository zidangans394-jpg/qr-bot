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

// Emoji custom
const EMOJI_PETIR = '<a:thunder:1485326834269688019>';
const EMOJI_QRIS = '<:qris:1485329765559832596>';
const EMOJI_DANA = '<:dana:1485329627986657472>';
const EMOJI_CENTANG = '<:10218verify:1485331070072389744>';

let currentConnection = null;

// Fungsi untuk join voice channel & auto-reconnect
async function joinVoiceChannelAndReconnect() {
    const guild = client.guilds.cache.first();
    if (!guild) return;
    const channel = guild.channels.cache.get(VOICE_CHANNEL_ID);
    if (!channel || channel.type !== 2) {
        console.error(`Voice channel ${VOICE_CHANNEL_ID} tidak ditemukan atau bukan voice channel`);
        return;
    }

    const existingConnection = getVoiceConnection(guild.id);
    if (existingConnection && existingConnection.state.status === VoiceConnectionStatus.Ready) {
        return;
    }

    const connection = joinVoiceChannel({
        channelId: VOICE_CHANNEL_ID,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
    });

    connection.on(VoiceConnectionStatus.Ready, () => {
        console.log(`✅ Bot berhasil masuk ke voice channel: ${channel.name}`);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        console.log('⚠️ Bot terputus dari voice channel, mencoba reconnect dalam 5 detik...');
        setTimeout(() => {
            joinVoiceChannelAndReconnect();
        }, 5000);
    });

    connection.on('error', (error) => {
        console.error('Voice connection error:', error);
    });

    currentConnection = connection;
}

client.once(Events.ClientReady, async (c) => {
    console.log(`✅ Bot ${c.user.tag} online!`);
    await joinVoiceChannelAndReconnect();
});

client.on(Events.GuildAvailable, async (guild) => {
    const connection = getVoiceConnection(guild.id);
    if (!connection || connection.state.status !== VoiceConnectionStatus.Ready) {
        await joinVoiceChannelAndReconnect();
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase();
    const member = message.member;

    const hasAllowedRole = member && member.roles.cache.has(ALLOWED_ROLE_ID);
    if (!hasAllowedRole) return;

    // Command !qr
    if (content === '!qr') {
        try {
            const imagePath = path.join(__dirname, 'assets', 'qris.jpg');
            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle(`${EMOJI_QRIS} QRIS ALL PAYMENT MARVINX TEAM ${EMOJI_PETIR}`)
                .setImage('attachment://qris.jpg')
                .setFooter({ text: 'Scan QRIS di atas untuk melakukan pembayaran dan kirim bukti pembayaran ke admin' });

            await message.channel.send({
                embeds: [embed],
                files: [imagePath]
            });
        } catch (error) {
            console.error('Gagal kirim QRIS embed:', error);
        }
    }
    // Command !pay (lama)
    else if (content === '!pay') {
        try {
            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle(`${EMOJI_DANA} 085752852674 (DANA)`)
                .setFooter({ text: 'Hanya untuk pembayaran via DANA selain QRIS' });

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Gagal kirim DANA embed:', error);
        }
    }
    // Command !allpay (dengan gambar QRIS)
    else if (content === '!allpay') {
        try {
            const imagePath = path.join(__dirname, 'assets', 'qris.jpg');
            const embed = new EmbedBuilder()
                .setColor(0x2B2D31)
                .setTitle(`${EMOJI_QRIS} QRIS ALLPAY ${EMOJI_CENTANG}\n${EMOJI_DANA} DANA ${EMOJI_CENTANG}`)
                .setImage('attachment://qris.jpg')
                .setFooter({ text: 'Pilih metode pembayaran yang tersedia' });

            await message.channel.send({
                embeds: [embed],
                files: [imagePath]
            });
        } catch (error) {
            console.error('Gagal kirim ALLPAY embed:', error);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
