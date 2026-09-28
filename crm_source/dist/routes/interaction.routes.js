"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const interaction_controller_1 = require("../controllers/interaction.controller");
const router = (0, express_1.Router)();
// Global interactions list
router.get('/', interaction_controller_1.getAllInteractions);
// Global: all pending follow-ups
router.get('/follow-ups', interaction_controller_1.getPendingFollowUps);
// Per-contact interactions
router.get('/contact/:contactId', interaction_controller_1.getInteractions);
router.post('/contact/:contactId', interaction_controller_1.createInteraction);
router.put('/:id', interaction_controller_1.updateInteraction);
router.delete('/:id', interaction_controller_1.deleteInteraction);
exports.default = router;
