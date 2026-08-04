// server/src/index.ts
import { env } from './config/env.js';
import { app } from './app.js';

app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});
