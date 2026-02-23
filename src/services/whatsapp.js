const axios = require('axios');

/**
 * @param {string} toPhoneNumber - The recipient's phone number with the country code (e.g., +919829699891)
 * @param {Object} templateData - The template data object
 * @returns {Promise} - Resolves when the message is sent, rejects if there's an error
 */
const sendWhatsAppTemplate = async (toPhoneNumber, templateData) => {
  const { WHINTA_API_TOKEN, WHINTA_BASE_URL, WHINTA_TEMPLATE_NAME, WHINTA_TEMPLATE_LANG } = process.env;

  if (!WHINTA_API_TOKEN) {
    console.error("WHINTA_API_TOKEN is not defined in .env");
  }

  try {
    const data = JSON.stringify({
      "phone": toPhoneNumber,
      "template": {
        "name": WHINTA_TEMPLATE_NAME || templateData.name || "car_insurance",
        "language": {
          "code": WHINTA_TEMPLATE_LANG || (templateData.language && templateData.language.code) || "en"
        },
        "components": templateData.components
      }
    });

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${WHINTA_BASE_URL || 'https://app.whinta.com'}/api/send/template`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WHINTA_API_TOKEN || 'u1B0nET738Mx5dl6yYIgj88ZAe7aoqCmLEgtyACb'}`
      },
      data: data
    };

    const response = await axios(config);
    console.log(response.data)
    const isSuccess = response.data && (response.data.success === true || (response.data.data && response.data.data.success === true));

    if (isSuccess) {
      console.log(`✅ Whinta template sent successfully to ${toPhoneNumber}`);
    } else {
      console.error(`❌ Whinta template failed for ${toPhoneNumber}:`, JSON.stringify(response.data));
    }
    return response.data;
  } catch (error) {
    console.error('Error sending Whinta WhatsApp template:', error.response ? error.response.data : error.message);
    throw error;
  }
};

module.exports = { sendWhatsAppTemplate };
