const { default: mongoose } = require("mongoose");

const personal_ear_exp_SubjectSchema = new mongoose.Schema({
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
    earExpSubjectId: {
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

const expEarSubject = new mongoose.model('earExpSubject', personal_ear_exp_SubjectSchema)
module.exports={
    expEarSubject
}