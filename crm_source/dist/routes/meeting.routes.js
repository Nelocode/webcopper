"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const meeting_controller_1 = require("../controllers/meeting.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// POST /api/meetings/contact/:contactId/process-audio
router.post('/contact/:contactId/process-audio', upload.single('audio'), meeting_controller_1.processMeetingAudio);
exports.default = router;
