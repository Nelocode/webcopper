"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerIntegrations = exports.saveIntegration = exports.getIntegrations = void 0;
const index_1 = require("../index");
const axios_1 = __importDefault(require("axios"));
// Get all integrations
const getIntegrations = async (req, res) => {
    try {
        const integrations = await index_1.prisma.integration.findMany();
        res.json(integrations);
    }
    catch (error) {
        console.error('Error fetching integrations:', error);
        res.status(500).json({ error: 'Failed to fetch integrations' });
    }
};
exports.getIntegrations = getIntegrations;
// Save or update an integration
const saveIntegration = async (req, res) => {
    try {
        const { key, value, isEnabled } = req.body;
        if (!key) {
            return res.status(400).json({ error: 'Key is required' });
        }
        const integration = await index_1.prisma.integration.upsert({
            where: { key },
            update: {
                value: value !== undefined ? value : '',
                isEnabled: isEnabled !== undefined ? isEnabled : true,
            },
            create: {
                key,
                value: value || '',
                isEnabled: isEnabled !== undefined ? isEnabled : true,
            },
        });
        res.json(integration);
    }
    catch (error) {
        console.error('Error saving integration:', error);
        res.status(500).json({ error: 'Failed to save integration' });
    }
};
exports.saveIntegration = saveIntegration;
// Helper function to trigger enabled integrations (like Zapier, Make, n8n, Mailchimp)
const triggerIntegrations = async (action, contactData) => {
    try {
        // 1. Check for custom Webhook (e.g., Zapier, n8n, Make)
        const webhookIntegration = await index_1.prisma.integration.findUnique({
            where: { key: 'webhook_url' }
        });
        if (webhookIntegration && webhookIntegration.isEnabled && webhookIntegration.value) {
            try {
                console.log(`[Integration] Triggering webhook: ${webhookIntegration.value} for contact ${contactData.name}`);
                await axios_1.default.post(webhookIntegration.value, {
                    event: `contact.${action}d`,
                    timestamp: new Date().toISOString(),
                    contact: contactData
                });
            }
            catch (err) {
                console.error(`[Integration] Webhook dispatch failed:`, err.message);
            }
        }
        // 2. Check for Mailchimp Integration
        const mcKey = await index_1.prisma.integration.findUnique({ where: { key: 'mailchimp_key' } });
        const mcAudience = await index_1.prisma.integration.findUnique({ where: { key: 'mailchimp_audience' } });
        const mcEnabled = await index_1.prisma.integration.findUnique({ where: { key: 'mailchimp_enabled' } });
        const isMailchimpEnabled = mcEnabled ? mcEnabled.value === 'true' && mcEnabled.isEnabled : false;
        if (isMailchimpEnabled && mcKey?.value && mcAudience?.value && contactData.email) {
            try {
                // Mailchimp keys end with datacentre, e.g. -us19
                const apiKey = mcKey.value;
                const audienceId = mcAudience.value;
                const dc = apiKey.split('-')[1] || 'us1';
                console.log(`[Integration] Syncing contact ${contactData.name} (${contactData.email}) to Mailchimp audience ${audienceId}`);
                // Simple md5 of email for mailchimp subscriber hash
                const crypto = require('crypto');
                const subscriberHash = crypto.createHash('md5').update(contactData.email.toLowerCase()).digest('hex');
                // Upsert subscriber in Mailchimp
                const url = `https://${dc}.api.mailchimp.com/3.0/lists/${audienceId}/members/${subscriberHash}`;
                const [firstName, ...lastNameParts] = contactData.name.split(' ');
                const lastName = lastNameParts.join(' ');
                await axios_1.default.put(url, {
                    email_address: contactData.email,
                    status_if_new: 'subscribed',
                    merge_fields: {
                        FNAME: firstName || '',
                        LNAME: lastName || '',
                        PHONE: contactData.phone || '',
                        COMPANY: contactData.company || ''
                    }
                }, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
            catch (err) {
                // Log error but don't crash contact operations
                console.error(`[Integration] Mailchimp sync failed:`, err.response?.data || err.message);
            }
        }
    }
    catch (err) {
        console.error(`[Integration] System error during triggers:`, err.message);
    }
};
exports.triggerIntegrations = triggerIntegrations;
