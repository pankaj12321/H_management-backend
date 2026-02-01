const axios = require("axios");

const WHATSAPP_BASE_URL = process.env.WHATSAPP_BASE_URL;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

const sendWhatsAppMessage = async (phone, message) => {
  try {
    const response = await axios.post(
      `${WHATSAPP_BASE_URL}/api/send`,
      { phone, message },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(response.data)
    return response.data;
  } catch (error) {
    console.error(
      "WhatsApp send failed:",
      error.response?.data || error.message
    );
    throw error;
  }
};

module.exports = sendWhatsAppMessage;
