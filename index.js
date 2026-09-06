require("dotenv").config();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const https = require("https");

// --- CONFIGURATION FROM .ENV ---
const apiId = parseInt(process.env.TELEGRAM_API_ID, 10);
const apiHash = process.env.TELEGRAM_API_HASH;
const targetPeer = process.env.TARGET_PEER;
const BOT_TOKEN = process.env.BOT_TOKEN;
const savedSessionString = process.env.TELEGRAM_SESSION_STRING;

const keywords = ['flipkart', 'shopsy', 'laptop', 'only order', 'order only', 'commission', 'meesho' , 'msho', 'fk', 'fkt', 'empty'];
const stringSession = new StringSession(savedSessionString);

const lastProcessedTimestamps = new Map();
const entityCache = new Map();

// Helper function to send messages via the Telegram Bot API using HTML format
function sendBotNotification(chatId, text) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: "HTML",
            disable_web_page_preview: true
        });

        const options = {
            hostname: 'api.telegram.org',
            port: 443,
            path: `/bot${BOT_TOKEN}/sendMessage`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };

        const req = https.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => responseBody += chunk);

            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve();
                } else {
                    reject(new Error(`Status ${res.statusCode}: ${responseBody}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(data);
        req.end();
    });
}

// Helper to escape HTML special characters so raw message text doesn't break parsing
function escapeHTML(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

(async () => {
    console.log("🔄 Initializing Telegram Client via Session Token...");
    const client = new TelegramClient(stringSession, apiId, apiHash, {
        connectionRetries: 10,
        timeout: 10000
    });

    await client.start({
        phoneNumber: async () => "",
        password: async () => "",
        phoneCode: async () => "",
        onError: (err) => console.log("⚠️ Session Note:", err.message),
    });

    const me = await client.getMe();
    const myId = me.id.toString();
    console.log(`✅ Connected as: ${me.username || myId}`);
    console.log("Telegram Deal Forwarder Activated\n");

    client.addEventHandler(async (event) => {
        const message = event.message;
        if (!message) return;

        const currentChatId = message.chatId ? message.chatId.toString() : "";
        if (currentChatId === targetPeer.toString() || currentChatId === "3885749609") return;

        const senderId = message.senderId ? message.senderId.toString() : "";
        if (senderId === myId) return;

        const text = message.message || message.media?.caption || "";
        if (!text || text.trim().length === 0) return;

        const lowerText = text.toLowerCase();

        if (keywords.some(word => lowerText.includes(word))) {
            try {
                const now = Date.now();
                const messageFingerprint = text.trim();

                if (lastProcessedTimestamps.has(messageFingerprint)) {
                    const lastSentTime = lastProcessedTimestamps.get(messageFingerprint);
                    if (now - lastSentTime < 21600000) return;
                }
                lastProcessedTimestamps.set(messageFingerprint, now);

                let sourceName = "Group/Channel";
                let senderHandle = "Unknown Sender";

                // 1. Resolve Chat Metadata
                if (message.chatId) {
                    const chatIdStr = message.chatId.toString();
                    if (entityCache.has(chatIdStr)) {
                        sourceName = entityCache.get(chatIdStr);
                    } else {
                        try {
                            const chat = await client.getEntity(message.chatId);
                            if (chat) {
                                if (chat.username) {
                                    sourceName = `<a href="https://t.me/${chat.username}">@${chat.username}</a>`;
                                } else {
                                    const cleanId = chatIdStr.replace("-100", "");
                                    const title = chat.title ? escapeHTML(chat.title) : "Private Group";
                                    sourceName = `<a href="https://t.me/c/${cleanId}/999999999">${title}</a>`;
                                }
                                entityCache.set(chatIdStr, sourceName);
                            }
                        } catch (e) {
                            const cleanId = chatIdStr.replace("-100", "");
                            sourceName = `<a href="https://t.me/c/${cleanId}/999999999">Private Chat</a>`;
                        }
                    }
                }

                // 2. Resolve Sender Metadata
                if (message.senderId) {
                    const senderIdStr = message.senderId.toString();
                    if (entityCache.has(senderIdStr)) {
                        senderHandle = entityCache.get(senderIdStr);
                    } else {
                        try {
                            const sender = await client.getEntity(message.senderId);
                            if (sender) {
                                if (sender.username) {
                                    senderHandle = `<a href="https://t.me/${sender.username}">@${sender.username}</a>`;
                                } else {
                                    const name = sender.firstName ? escapeHTML(sender.firstName) : "User";
                                    senderHandle = `<a href="tg://user?id=${senderIdStr}">${name}</a>`;
                                }
                                entityCache.set(senderIdStr, senderHandle);
                            }
                        } catch (e) {
                            senderHandle = `User ID: <code>${senderIdStr}</code>`;
                        }
                    }
                } else {
                    senderHandle = sourceName !== "Group/Channel" ? `${sourceName} (Anon Admin)` : "Anonymous Admin";
                }

                // Escape raw payload text layout to block syntax interference
                const cleanPayloadText = escapeHTML(text);

                const alertText = `📂 <b>Source:</b> ${sourceName}\n` +
                                  `👤 <b>Sender:</b> ${senderHandle}\n\n` +
                                  `💬 <b>Text:\n</b>${cleanPayloadText}\n\n` +
                                  `<i>💨</i>`;

                // Fire via Bot API to ensure device notification pops up
                await sendBotNotification(targetPeer, alertText);

                console.log(`✅ Forwarded to Bot.`);

                if (entityCache.size > 300) entityCache.clear();
                if (lastProcessedTimestamps.size > 150) {                                       
                    const firstKey = lastProcessedTimestamps.keys().next().value;               
                    lastProcessedTimestamps.delete(firstKey);                                   
                }
            } catch (err) {                     
                console.error("❌ Error processing forward:", err.message);                     
            }                                   
        }                                       
    }, new NewMessage({}));
})();

