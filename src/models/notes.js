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
    imageUrl:{
        type:String
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