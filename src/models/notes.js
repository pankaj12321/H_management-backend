const mongoose = require("mongoose");

const notesSchema = new mongoose.Schema({
    notesId: {
        type: String,
    },
    title: {
        type: String,
    },
    note: {
        type: String,
        required: true
    },
    creatredAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
    },

}, {
    timestamps: true
})

module.exports = mongoose.model("Notes", notesSchema);