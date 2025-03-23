const fs = require('fs');
const { Client } = require('discord.js-selfbot-v13');
const { joinVoiceChannel } = require('@discordjs/voice');

// config.json dosyasını yükleme
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Bot token'ı ve kullanıcı ID'si config.json'dan alınır
const token = config.BOT_TOKEN;
const allowedUserId = config.ALLOWED_USER_ID;
const prefix = '!';  // Komut prefixi

const client = new Client({
    checkUpdate: false,
    intents: [
        'GUILDS',
        'GUILD_MESSAGES',
        'DIRECT_MESSAGES',
        'MESSAGE_CONTENT',
        'GUILD_VOICE_STATES',
    ]
});

// Botun hazır olduğu anda yapılacak işlemler
client.on('ready', () => {
    console.log('Selfbot hazır!');
});

// Mesajları dinle
client.on('messageCreate', async (mesaj) => {  // Buraya async ekledik
    try {
        // Eğer mesaj bot tarafından gönderilmişse, işlemi durdur
        if (mesaj.author.bot) return;

        // Eğer komut prefix ile başlamıyorsa, işlem yapma
        if (!mesaj.content.startsWith(prefix)) return;

        // Komutları ayırma
        const args = mesaj.content.slice(prefix.length).trim().split(/ +/);
        const komut = args.shift().toLowerCase();

        // Eğer komutu kullanan kişi izinli değilse komut çalıştırılmasın
        if (mesaj.author.id !== allowedUserId) return;

        // Ses kanalına katılma komutu
        if (komut === 'katıl') {
            const sesKanalID = args[0];

            // Kanal ID'si geçerli değilse işlem yapma
            if (!sesKanalID.match(/^\d+$/)) {
                return mesaj.reply('Geçerli bir kanal ID\'si girin.').then(m => m.delete({ timeout: 5000 }));
            }

            // Kanalı bul
            const channel = client.channels.cache.get(sesKanalID);

            if (!channel || !channel.isVoice()) {
                return mesaj.reply('Geçerli bir ses kanalı değil.').then(m => m.delete({ timeout: 5000 }));
            }

            // Ses kanalına katılma işlemi
            try {
                const connection = joinVoiceChannel({
                    channelId: channel.id,
                    guildId: mesaj.guild.id,
                    adapterCreator: mesaj.guild.voiceAdapterCreator,
                    selfDeaf: false,
                    selfMute: false,
                });

                connection.on('error', (error) => {
                    console.error('Bağlantı hatası:', error);
                    mesaj.reply('Ses kanalına katılırken bir hata oluştu.').then(m => m.delete({ timeout: 5000 }));
                });

                // Bot kanalına katıldığında gönderilen mesajı silme
                const replyMessage = await mesaj.reply(`${channel.name} katıldım knk`);
                
                // Bot ve komut mesajını silme
                await mesaj.delete({ timeout: 1000 }); // Komut mesajını sil
                await replyMessage.delete({ timeout: 1000 }); // Bot mesajını sil

            } catch (error) {
                console.error('Ses kanalına katılırken hata oluştu:', error);
                mesaj.reply('Ses kanalına katılamadım.').then(m => m.delete({ timeout: 5000 }));
            }
        }
    } catch (error) {
        console.error('Mesaj işlenirken bir hata oluştu:', error);
    }
});

// Botu başlatma
client.login(token).catch((error) => {
    console.error('Bot giriş hatası:', error);
});