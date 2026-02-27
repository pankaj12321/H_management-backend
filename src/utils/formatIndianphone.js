const formatIndianPhone = (mobile) => {
    const cleaned = mobile.replace(/\D/g, "");

    if (cleaned.startsWith("91")) {
        return `+${cleaned}`;
    }

    return `+91${cleaned}`;
};

module.exports = { formatIndianPhone };