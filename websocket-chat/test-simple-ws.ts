// Simple Bun WebSocket test
const server = Bun.serve({
  port: 3001,
  fetch(req, server) {
    console.log('Fetch called:', req.method, req.url, req.headers.get('upgrade'));
    
    if (req.headers.get("upgrade") === "websocket") {
      const url = new URL(req.url);
      const username = url.searchParams.get('username') || 'Anonymous';
      
      const success = server.upgrade(req, {
        data: { url: req.url, username }
      });
      
      if (success) {
        console.log('WebSocket upgrade successful');
        return;
      }
      
      console.log('WebSocket upgrade failed');
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    
    return new Response("Hello from test server!");
  },
  websocket: {
    open(ws) {
      console.log('WebSocket opened:', ws.data);
      ws.send(JSON.stringify({ type: 'welcome', username: ws.data?.username }));
    },
    message(ws, message) {
      console.log('WebSocket message:', message);
      ws.send(`Echo: ${message}`);
    },
    close(ws) {
      console.log('WebSocket closed');
    }
  }
});

console.log('Test WebSocket server running on port 3001');
console.log('Test URL: ws://localhost:3001/?username=TestUser');