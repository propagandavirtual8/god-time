import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', workers: 1, timeout: 30000,
  use: { baseURL: 'http://127.0.0.1:4183', channel: 'chrome', headless: true, screenshot: 'only-on-failure' },
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: { command: 'node serve.mjs', url: 'http://127.0.0.1:4183', reuseExistingServer: false,
    env: { PORT:'4183', SUPABASE_URL:'https://test-project.supabase.co', SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test' } }
});
