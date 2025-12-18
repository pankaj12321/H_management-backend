const twilio = require('twilio');

const { AccountSid, AuthToken } = process.env;
const client = twilio(AccountSid, AuthToken);

/**
 * @param {string} toPhoneNumber - The recipient's phone number with the country code (e.g., +11234567890)
 * @param {string} messageBody - The message body to send
 * @returns {Promise} - Resolves when the message is sent, rejects if there's an error
 */
const sendWhatsAppMessage = async (toPhoneNumber, messageBody) => {
  try {
    const message = await client.messages.create({
      body: messageBody,
      from: 'whatsapp:+14155238886', 
      to: `whatsapp:${toPhoneNumber}` 
    });

    console.log(`Message sent successfully to ${toPhoneNumber}: ${message.sid}`);
    return message; 
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error; 
  }
};

module.exports = sendWhatsAppMessage;
