const User = require('discord.js/src/structures/User');

Object.defineProperty(User.prototype, 'note', {
  get() {
    return this.client.user.notes.get(this.id) || null;
  }
});

User.prototype.setNote = function(note: string) {
  return (this.client.api as any).users('@me').notes(this.id).put({
    data: { note }
  })
}
