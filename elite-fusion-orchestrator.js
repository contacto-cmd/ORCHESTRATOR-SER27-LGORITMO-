const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

// WEBHOOK RECEIVER
async function webhookReceiver(req, res) {
    try {
        const { event, data, signature, timestamp } = req.body;
        
        // Verify signature
        const expectedSig = crypto
            .createHmac('sha256', process.env.WEBHOOK_SECRET)
            .update(JSON.stringify(data))
            .digest('hex');
        
        if (signature !== expectedSig) {
            return res.status(401).json({ error: 'Invalid signature' });
        }
        
        console.log('📥 Webhook received:', event);
        
        // Process event
        switch(event) {
            case 'contract.generated':
                await processContract(data);
                await syncToAirtable(data);
                await notifyDiscord('💰 New Contract Generated', data);
                break;
                
            case 'payment.received':
                await updateRevenue(data);
                await triggerMakeWebhook(data);
                await notifyDiscord('💵 Payment Received', data);
                break;
                
            case 'analytics.contract':
                await syncToDatabricks(data);
                break;
        }
        
        // Audit log
        fs.appendFileSync('./data/audit.log', 
            JSON.stringify({ event, timestamp, data }) + '\n'
        );
        
        res.json({ success: true, event: event });
        
    } catch (error) {
        console.error('❌ Webhook error:', error);
        res.status(500).json({ error: error.message });
    }
}

// DATABRICKS INTEGRATION (kasal analytics)
async function syncToDatabricks(data) {
    if (!process.env.DATABRICKS_TOKEN) {
        console.log('⚠️  Databricks token not set - skipping');
        return;
    }
    
    try {
        await axios.post(
            process.env.DATABRICKS_URL + '/api/2.0/sql/statements',
            {
                statement: \INSERT INTO kasal.contracts (id, type, revenue, timestamp) 
                            VALUES ('\', '\', \, \)\,
                warehouse_id: process.env.DATABRICKS_WAREHOUSE_ID
            },
            {
                headers: { 
                    'Authorization': 'Bearer ' + process.env.DATABRICKS_TOKEN 
                }
            }
        );
        console.log('✅ Databricks sync OK');
    } catch (error) {
        console.error('❌ Databricks sync failed:', error.message);
    }
}

// AIRTABLE CRM SYNC
async function syncToAirtable(data) {
    if (!process.env.AIRTABLE_TOKEN) {
        console.log('⚠️  Airtable token not set - skipping');
        return;
    }
    
    try {
        await axios.post(
            \https://api.airtable.com/v0/\/Contracts\,
            { 
                fields: {
                    'Contract ID': data.id,
                    'Type': data.type,
                    'Revenue': data.revenue,
                    'Status': 'Generated',
                    'Created': new Date().toISOString()
                }
            },
            { 
                headers: { 
                    'Authorization': 'Bearer ' + process.env.AIRTABLE_TOKEN 
                }
            }
        );
        console.log('✅ Airtable sync OK');
    } catch (error) {
        console.error('❌ Airtable sync failed:', error.message);
    }
}

// DISCORD NOTIFICATIONS
async function notifyDiscord(title, data) {
    if (!process.env.ROYAL_DISCORD_WEBHOOK) {
        console.log('⚠️  Discord webhook not set - skipping');
        return;
    }
    
    try {
        await axios.post(process.env.ROYAL_DISCORD_WEBHOOK, {
            embeds: [{
                title: title,
                description: \\\json
\
\\\,
                color: 0x00ff00,
                timestamp: new Date(),
                footer: { text: 'KASAL Elite Fusion' }
            }]
        });
        console.log('✅ Discord notification sent');
    } catch (error) {
        console.error('❌ Discord failed:', error.message);
    }
}

// MAKE.COM TRIGGER
async function triggerMakeWebhook(data) {
    try {
        await axios.post(process.env.MAKE_COM_WEBHOOK_URL, data);
        console.log('✅ Make.com triggered');
    } catch (error) {
        console.error('❌ Make.com failed:', error.message);
    }
}

// Revenue tracking
async function updateRevenue(data) {
    const revenueFile = './data/revenue.json';
    let revenue = { total: 0, monthly: {} };
    
    if (fs.existsSync(revenueFile)) {
        revenue = JSON.parse(fs.readFileSync(revenueFile, 'utf8'));
    }
    
    revenue.total += data.amount;
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    revenue.monthly[month] = (revenue.monthly[month] || 0) + data.amount;
    
    fs.writeFileSync(revenueFile, JSON.stringify(revenue, null, 2));
    console.log(\💰 Total revenue: \$\\);
}

module.exports = { 
    webhookReceiver,
    syncToDatabricks,
    syncToAirtable,
    notifyDiscord
};

