const express = require('express');
const router = express.Router();

const { Expo } = require('expo-server-sdk');

const expo = new Expo();

router.post('/send', async (req, res) => {

  try {

    const { token, title, body } = req.body;

    if (!Expo.isExpoPushToken(token)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Expo token',
      });
    }

    const messages = [
      {
        to: token,
        sound: 'default',
        title: title,
        body: body,
      },
    ];

    const chunks =
      expo.chunkPushNotifications(messages);

    for (let chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }

    res.json({
      success: true,
      message: 'Notification sent',
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;