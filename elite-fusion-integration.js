const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

class EliteFusionIntegration {
    constructor() {
        this.botEndpoint = process.env.SER27_BOT_ENDPOINT;
        this.orchestratorUrl = process.env.ORCHESTRATOR_URL;
        this.webhookSecret = process.env.WEBHOOK_SECRET;
    }

    // Llamar a SER27-BOT (tiene las API keys)
    async callAI(prompt, model = 'gemini') {
        try {
            const response = await axios.post(${this.botEndpoint}/ai, {
                prompt: prompt,
                model: model,
                source: 'kasal-throne-protocol'
            });
            return response.data;
        } catch (error) {
            console.error('❌ AI call failed:', error.message);
            throw error;
        }
    }

    // Generar contrato usando SER27-BOT
    async generateContract(contractData) {
        const prompt = Generate NOM-151 compliant cannabis contract:
Type: 
Parties: 
Terms: 
Format: Legal Spanish, professional;

        return await this.callAI(prompt, 'gemini');
    }

    // Webhook al ORCHESTRATOR
    async sendWebhook(eventType, payload) {
        try {
            const signature = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(JSON.stringify(payload))
                .digest('hex');
            
            await axios.post(${this.orchestratorUrl}/webhook, {
                event: eventType,
                data: payload,
                signature: signature,
                timestamp: Date.now()
            });
            
            console.log('✅ Webhook sent:', eventType);
        } catch (error) {
            console.error('❌ Webhook failed:', error.message);
        }
    }

    // Events
    async onContractGenerated(contract) {
        await this.sendWebhook('contract.generated', contract);
        
        // Analytics a Databricks via ORCHESTRATOR
        await this.sendWebhook('analytics.contract', {
            id: contract.id,
            type: contract.type,
            revenue: contract.revenue,
            timestamp: Date.now()
        });
    }

    async onPaymentReceived(payment) {
        await this.sendWebhook('payment.received', payment);
    }
}

module.exports = EliteFusionIntegration;
