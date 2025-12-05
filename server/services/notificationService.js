export const notificationService = {
  async queue(template, recipient, payload) {
    console.log('Queue notification', template, recipient, payload);
    return { template, recipient };
  }
};
