const { default: mongoose } = require("mongoose");

const personalTransectionalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String
    },
    address: {
        City: {
            type: String,
        },
        State: {
            type: String,
        }
    },
    personalTransectionalUserId: {
        type: String
    },
    status: {
        type: String,

    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const personalTransectionalUser = new mongoose.model('personalTransection_user', personalTransectionalSchema)
module.exports={
    personalTransectionalUser
}