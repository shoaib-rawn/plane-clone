import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { config } from './config/env.js';
import { app } from './app.js';

app.listen(config.server.port, () => {
  console.log(`Server listening on http://localhost:${config.server.port}`);
});
