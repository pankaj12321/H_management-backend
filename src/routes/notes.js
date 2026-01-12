const express = require("express");
const { verifyToken } = require("../middleware/verifyToken");
const router = express.Router();


const notesController = require("../controller/notes");

router.post("/add", verifyToken, notesController.createNotes);

router.get("/get/all", verifyToken, notesController.getNotes);

router.patch("/update", verifyToken, notesController.updateNotes);














const notesRouter = router
module.exports = notesRouter;