"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const integration_controller_1 = require("../controllers/integration.controller");
const router = (0, express_1.Router)();
router.get('/', integration_controller_1.getIntegrations);
router.post('/', integration_controller_1.saveIntegration);
exports.default = router;
