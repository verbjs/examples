const ws = new WebSocket('ws://localhost:3000/?username=TestUser&guest=true');

ws.onopen = function() {
    console.log('✅ WebSocket connected successfully!');
    ws.close();
};

ws.onerror = function(error) {
    console.log('❌ WebSocket error:', error);
};

ws.onclose = function() {
    console.log('WebSocket closed');
    process.exit(0);
};

setTimeout(() => {
    console.log('❌ Connection timeout');
    process.exit(1);
}, 5000);