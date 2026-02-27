const axios = require("axios");

/**
 * Send WhatsApp Template via Whinta
 * @param {string} phone - with country code (+91XXXXXXXXXX)
 * @param {string} templateName - approved template name
 * @param {string} languageCode - template language (ex: en)
 * @param {Array} bodyParams - array of text variables for {{1}}, {{2}} etc.
 */

const sendWhatsAppTemplate = async (
  phone,
  templateName,
  languageCode = "en",
  bodyParams = []
) => {
  try {
    const { WHINTA_API_TOKEN, WHINTA_BASE_URL } = process.env;

    if (!WHINTA_API_TOKEN || !WHINTA_BASE_URL) {
      throw new Error("Whinta environment variables missing");
    }

    const components = [];

    // If template has body variables
    if (bodyParams.length > 0) {
      components.push({
        type: "body",
        parameters: bodyParams.map((param) => ({
          type: "text",
          text: String(param)
        }))
      });
    }

    const payload = {
      messaging_product: "whatsapp",
      to: phone,
      phone: phone, // Keep phone for backward compatibility if needed
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components
      }
    };

    console.log("📤 Sending WhatsApp Template:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${WHINTA_BASE_URL}/api/send/template`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHINTA_API_TOKEN}`
        }
      }
    );

    console.log("✅ WhatsApp Sent:", response.data);
    return response.data;

  } catch (error) {
    console.error(
      "❌ WhatsApp Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};
/**
 * Send Direct WhatsApp Message via Whinta
 * @param {string} phone - with country code (+91XXXXXXXXXX)
 * @param {string} message - free text message
 */
const sendWhatsAppMessage = async (phone, message) => {
  try {
    const { WHINTA_API_TOKEN, WHINTA_BASE_URL } = process.env;

    if (!WHINTA_API_TOKEN || !WHINTA_BASE_URL) {
      throw new Error("Whinta environment variables missing");
    }

    const payload = {
      phone: phone,
      message: message
    };

    console.log("📤 Sending Direct WhatsApp (Simplified):", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${WHINTA_BASE_URL}/api/send`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          Authorization: `Bearer ${WHINTA_API_TOKEN}`
        }
      }
    );

    console.log("✅ WhatsApp Sent:", response.data);
    return response.data;

  } catch (error) {
    console.error(
      "❌ WhatsApp Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
};

module.exports = { sendWhatsAppTemplate, sendWhatsAppMessage };