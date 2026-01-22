import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Test server is running' });
});

// Basic submissions endpoint
app.get('/api/submissions', (req, res) => {
    res.json([]);
});

app.post('/api/submissions', (req, res) => {
    res.json({ message: 'Test submission endpoint working' });
});

app.put('/api/submissions/:id', (req, res) => {
    res.json({ message: 'Test update endpoint working' });
});

app.delete('/api/submissions/:id', (req, res) => {
    res.json({ message: 'Test delete endpoint working' });
});

app.listen(PORT, () => {
    console.log(`Test server is running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
});
