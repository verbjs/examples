import { createServer, ServerProtocol } from 'verb';

console.log('Creating server...');

const app = createServer(ServerProtocol.WEBSOCKET);

console.log('Adding routes...');

app.get('/test', async (req, res) => {
  console.log('Test route hit');
  return res.json({ message: 'test' });
});

app.websocket({
  open: (ws) => {
    console.log('WebSocket opened!');
    ws.send('Hello');
  },
  message: (ws, message) => {
    console.log('WebSocket message:', message);
  }
});

console.log('Starting server...');

app.withOptions({
  port: 3002,
  hostname: 'localhost'
});

try {
  app.listen();
  console.log('Server started on port 3002');
} catch (error) {
  console.error('Server error:', error);
}