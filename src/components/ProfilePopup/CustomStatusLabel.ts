import { AlignmentFlag, Direction, QBoxLayout, QLabel, QPixmap, QWidget } from '@nodegui/nodegui';
import { User } from 'discord.js';
import { app } from '../..';
import { CustomStatus } from '../../utilities/CustomStatus';
import { createLogger } from '../../utilities/Console';
import { resolveEmoji } from '../../utilities/ResolveEmoji';

const { error } = createLogger('CustomStatusLabel');

/**
 * Renders a custom status widget in the profile popup.
 */
export class CustomStatusLabel extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  private statusIcon = new QLabel(this);

  private statusLabel = new QLabel(this);

  constructor() {
    super();
    this.initComponent();
    this.setObjectName('CustomStatusLabel');
  }

  private initComponent() {
    const { layout, statusIcon, statusLabel } = this;

    this.setLayout(layout);
    layout.setContentsMargins(0, 12, 0, 0);
    layout.setSpacing(12);
    layout.addStretch();
    layout.addWidget(statusIcon, 0);
    layout.addWidget(statusLabel, 1);
    layout.addStretch();

    statusIcon.setObjectName('Icon');
    statusLabel.setObjectName('Text');
    statusIcon.setAlignment(AlignmentFlag.AlignCenter);
    statusLabel.setAlignment(AlignmentFlag.AlignCenter);
    statusLabel.setWordWrap(true);
  }

  /**
   * Renders the status.
   * @param user User to retrieve status from.
   */
  async loadStatus(user: User) {
    const { statusIcon, statusLabel } = this;
    let emojiId: string;
    let emojiName: string;
    let statusText: string;

    if (user === app.client.user && app.client.user.customStatus) {
      const { emoji_id: eId, emoji_name: eName, text } = app.client.user.customStatus;

      emojiId = eId || '';
      emojiName = eName || '';
      statusText = text || '';
    } else {
      const activity = user.presence.activities.find((p) => p.type === 'CUSTOM_STATUS');

      emojiId = activity?.emoji?.id || '';
      emojiName = activity?.emoji?.name || '';
      statusText = activity?.state || '';
    }

    if (!statusText && !emojiName) {
      this.hide();

      return;
    }

    if (!statusText) {
      statusLabel.hide();
    } else {
      statusLabel.show();
    }

    if (!emojiName) {
      statusIcon.hide();
    } else {
      statusIcon.show();
    }

    statusLabel.setText(statusText);

    if (!emojiId && !emojiName) {
      return;
    }

    const status = { emoji_id: emojiId, emoji_name: emojiName } as CustomStatus;

    try {
      const emojiPath = await resolveEmoji(status);

      if (this.native.destroyed) {
        return;
      }

      const pix = new QPixmap(emojiPath);
      const size = statusText ? 24 : 48;

      statusIcon.setPixmap(pix.scaled(size, size, 1, 1));
    } catch (e) {
      error(`Couldn't retrieve emoji ${emojiName}#${emojiId}`);
    }

    statusIcon.setProperty('toolTip', `:${emojiName}:`);
    statusIcon.show();
    this.show();
  }
}
