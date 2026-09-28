"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const ocr_controller_1 = require("../controllers/ocr.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Accept up to 2 images (front + back of card)
router.post('/scan', upload.array('images', 2), ocr_controller_1.scanCard);
router.post('/preview', upload.array('images', 2), ocr_controller_1.previewCard);
exports.default = router;
