// middlewares/uploadScreenshot.js
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/paymentScreenshots/"); 
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
        cb(new Error("Only images are allowed"), false);
    } else {
        cb(null, true);
    }
};

const upload = multer({
    storage,
    fileFilter
});

module.exports = upload;
