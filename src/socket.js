const WebSocket = require('ws');

let wss;

const clients = new Map(); // Map client -> subscribed productIds array

function setupWebSocket(server) {
    wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        console.log('New client connected');

        // Initialize with empty subscription
        clients.set(ws, []);

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                // Expect { action: 'subscribe', productIds: [id1, id2, ...] }
                if (data.action === 'subscribe' && Array.isArray(data.productIds)) {
                    clients.set(ws, data.productIds);
                    ws.send(JSON.stringify({ message: `Subscribed to products: ${data.productIds.join(', ')}` }));
                }
            } catch (err) {
                ws.send(JSON.stringify({ error: 'Invalid message format' }));
            }
        });

        ws.on('close', () => {
            clients.delete(ws);
            console.log('Client disconnected');
        });
    });
}

function broadcastStockUpdate(productId, newStock) {
    for (const [ws, productIds] of clients.entries()) {
        if (productIds.includes(productId.toString()) && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                productId,
                stock: newStock
            }));
        }
    }
}

module.exports = {
    setupWebSocket,
    broadcastStockUpdate
};
