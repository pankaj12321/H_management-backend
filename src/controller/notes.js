require("dotenv").config();
const Notes = require("../models/notes");
const asyncHandler = require("express-async-handler");
const { entityIdGenerator } = require("../utils/entityGenerator")

const getBaseUrl = (req) => {
    const protocol = (req.headers['x-forwarded-proto'] || req.protocol).split(',')[0].trim();
    const host = (req.headers['x-forwarded-host'] || req.get('host')).split(',')[0].trim();
    return `${protocol}://${host}`;
};

const createNotes = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role.toLowerCase() !== "admin") {
            return res.status(403).json({
                message: "Forbidden! You are not authorized to create notes.",
            });
        }
        let imageUrl=null;
        if(req.file){
            imageUrl= `${getBaseUrl(req)}/uploads/paymentScreenshots/${req.file.filename}`;
        }
        const payload = req.body;
        const notesId = entityIdGenerator("Notes")
        const notes = await Notes.create({
            notesId,
            ...payload,
            imageUrl:imageUrl
        });
        await notes.save();
        res.status(201).json(notes);
    } catch (err) {
        console.error("Error creating notes:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const getNotes = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role.toLowerCase() !== "admin") {
            return res.status(403).json({
                message: "Forbidden! You are not authorized to view notes.",
            });
        }
        const matchQuery = {}
        const query = req.query;
        if (query.notesId) {
            matchQuery.notesId = query.notesId
        }
        const notes = await Notes.find(matchQuery);
        res.status(200).json(notes);
    } catch (err) {
        console.error("Error fetching notes:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

const updateNotes = asyncHandler(async (req, res) => {
    try {
        const decodedToken = req.user;

        if (!decodedToken || decodedToken.role.toLowerCase() !== "admin") {
            return res.status(403).json({
                message: "Forbidden! You are not authorized to update notes.",
            });
        }
        const payload = req.body;

        const notes = await Notes.updateOne({ notesId: payload.notesId }, payload);
        res.status(200).json({ message: "Notes updated successfully" }, notes);
    } catch (err) {
        console.error("Error updating notes:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


module.exports = {
    createNotes,
    getNotes,
    updateNotes
}