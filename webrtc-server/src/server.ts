import express from "express";

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('TypeScript server is running!');
});

app.listen(PORT, () => {
  console.log(`Server is live on http://localhost:${PORT}`);
});