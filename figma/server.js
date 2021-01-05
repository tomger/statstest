const http = require('http');
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });
const connections = [];

const requestListener = function (req, res) {
  let data = []
  req.on('data', chunk => {
    data.push(chunk)
  })
  req.on('end', () => {
    console.log(`incoming! ${data}`)

    connections.forEach(ws => ws.send(data.join('')))
  })

  res.writeHead(200);
  res.end('Yeo, World!');
}


const server = http.createServer(requestListener);
server.listen(5000);



wss.on('connection', function connection(ws) {
  connections.push(ws)
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  ws.send('something');
});