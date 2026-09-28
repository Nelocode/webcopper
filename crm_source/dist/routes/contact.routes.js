"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const contact_controller_1 = require("../controllers/contact.controller");
const batch_controller_1 = require("../controllers/batch.controller");
const router = (0, express_1.Router)();
const batchLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 5,
    message: { error: 'Demasiados imports por minuto. Esperá 60s.' }
});
router.get('/', contact_controller_1.getContacts);
router.get('/:id', contact_controller_1.getContactById);
router.post('/batch', batchLimiter, batch_controller_1.batchCreateContacts);
router.post('/', contact_controller_1.createContact);
router.put('/:id', contact_controller_1.updateContact);
router.get('/:id/changelog', contact_controller_1.getContactChangeLog);
router.delete('/:id', contact_controller_1.deleteContact);
exports.default = router;
