import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.get('/', (req, res) => res.send('ok'));

httpServer.listen(5001, () => {
    console.log('Test Server running on 5001');
    process.exit(0);
});
