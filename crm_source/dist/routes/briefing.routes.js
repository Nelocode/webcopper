"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const briefing_controller_1 = require("../controllers/briefing.controller");
const router = (0, express_1.Router)();
router.post('/test', briefing_controller_1.sendTestBriefing);
exports.default = router;
