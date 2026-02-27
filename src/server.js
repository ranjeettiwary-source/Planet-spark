import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();
app.listen(env.PORT, () => {
  console.log(`Math Rapid Fire Pro API listening on ${env.PORT}`);
});
