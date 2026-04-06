export default {
  async scheduled(event, env) {
    const url = `${env.APP_URL}/api/cron/reminders`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    });
    const data = await response.json();
    console.log(`Reminders: ${data.sent} sent, ${data.failed} failed`);
  },
};
