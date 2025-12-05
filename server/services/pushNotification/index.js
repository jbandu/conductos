import webpush from 'web-push';
import { db } from '../../db/client.js';

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@conductos.in',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export class PushNotificationService {
  async subscribe(userId, subscription) {
    await db.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, keys)
       VALUES ($1,$2,$3)
       ON CONFLICT (user_id, endpoint) DO UPDATE SET keys=EXCLUDED.keys, updated_at=NOW()`,
      [userId, subscription.endpoint, JSON.stringify(subscription.keys)]
    );
  }

  async unsubscribe(userId, endpoint) {
    await db.query('DELETE FROM push_subscriptions WHERE user_id=$1 AND endpoint=$2', [userId, endpoint]);
  }

  async sendToUser(userId, payload) {
    const subs = await db.query('SELECT * FROM push_subscriptions WHERE user_id=$1', [userId]);
    for (const sub of subs.rows) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: JSON.parse(sub.keys)
          },
          JSON.stringify(payload)
        );
      } catch (error) {
        if (error?.statusCode === 410) {
          await this.unsubscribe(userId, sub.endpoint);
        }
      }
    }
  }
}
