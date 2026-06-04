import dotenv from 'dotenv';
import app from './src/app.js';
import { validateConfig } from './src/config/validation.js';

dotenv.config();
validateConfig();

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Mining Now backend listening on port ${PORT}`);
});
