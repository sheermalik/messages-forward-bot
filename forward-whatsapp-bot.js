const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
require('dotenv').config();  // To load environment variables from .env file

const client = new Client({
    authStrategy: new LocalAuth()
});

// ✅ Set the environment variables for dynamic group selection
const SOURCE_GROUP_NAME = process.env.SOURCE_GROUP_NAME || 'Hey';  // Default to 'Hey' if not provided
const DEST_GROUP_NAME = process.env.DEST_GROUP_NAME || 'Heyy222';  // Default to 'Heyy222' if not provided

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('📲 Scan the QR code above');
});

client.on('ready', async () => {
    console.log('✅ WhatsApp client is ready!');

    // 🔍 List all group chats and find the source and destination groups dynamically
    const chats = await client.getChats();
    const groups = chats.filter(chat => chat.isGroup);

    let sourceGroup = groups.find(group => group.name === SOURCE_GROUP_NAME);
    let destGroup = groups.find(group => group.name === DEST_GROUP_NAME);

    // If either group is not found, log an error and exit
    if (!sourceGroup) {
        console.log(`❌ Source group "${SOURCE_GROUP_NAME}" not found.`);
        return;
    }
    if (!destGroup) {
        console.log(`❌ Destination group "${DEST_GROUP_NAME}" not found.`);
        return;
    }

    console.log('\n--- 👥 GROUPS YOU ARE PART OF ---');
    groups.forEach(group => {
        console.log(`📛 ${group.name} | 🆔 ${group.id._serialized}`);
    });
    console.log('--------------------------------\n');

    console.log(`✅ Found source group "${sourceGroup.name}" with ID: ${sourceGroup.id._serialized}`);
    console.log(`✅ Found destination group "${destGroup.name}" with ID: ${destGroup.id._serialized}`);

    // Listen for messages in the source group and forward them to the destination group
    client.on('message', async (message) => {
        try {
            const chat = await message.getChat();

            // ✅ Only process messages from the SOURCE group
            if (
                chat.isGroup &&
                chat.id._serialized === sourceGroup.id._serialized &&
                message.type === 'chat' &&
                !message.fromMe // ✅ Ignore messages sent by the bot itself
            ) {
                const sender = await message.getContact();
                const senderName = sender.pushname || sender.number || 'Unknown';

                const destChat = await client.getChatById(destGroup.id._serialized);
                await destChat.sendMessage(`📨 *${senderName}*: ${message.body}`);

                console.log(`🔁 Forwarded message from ${senderName}`);
            }
        } catch (err) {
            console.error('❌ Error in forwarding:', err);
        }
    });
});

client.initialize();
