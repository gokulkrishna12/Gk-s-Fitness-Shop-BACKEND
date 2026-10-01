const { Expo } = require('expo-server-sdk');

let expo = new Expo();

const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
    if (!Expo.isExpoPushToken(expoPushToken)) {
        console.error(`🚨 Invalid Expo push token: ${expoPushToken}`);
        return;
    }

    const messages = [{
        to: expoPushToken,
        sound: 'default',
        title: title,
        body: body,
        data: data,
    }];

    try {
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];

        for (let chunk of chunks) {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }
        console.log("✅ Push notification sent successfully");
    } catch (error) {
        console.error("🚨 Error sending push notification:", error);
    }
};

module.exports = { sendPushNotification };