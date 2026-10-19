import { createApp } from './app.js';
import { IS_PRODUCTION, PORT } from './config.js';

createApp().listen(PORT, () => {
  console.log(`Case queue API listening on http://localhost:${PORT}`);
  if (!IS_PRODUCTION) console.log('Dev affordances enabled: ?delay=<ms> and ?fail=1 on GET requests');
});
