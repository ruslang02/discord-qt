import {
  AlignmentFlag,
  Direction,
  QBoxLayout,
  QLabel,
  QPixmap,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { app, MAX_QSIZE } from '../..';
import { DChannelButton } from '../DChannelButton/DChannelButton';

/**
 * Represents a button with an avatar, a name and a status label.
 */
export abstract class BaseUserButton extends DChannelButton {
  avatar = new QLabel();

  protected infoControls = new QBoxLayout(Direction.TopToBottom);

  protected nameLabel = new QLabel();

  protected nameLayout = new QBoxLayout(Direction.LeftToRight);

  protected statusLabel = new QLabel();

  abstract loadAvatar(): void;

  abstract get name(): string;

  constructor(parent?: any) {
    super(parent);

    this.setProperty('type', 'BaseUserButton');
    this.setFixedSize(224, 42);

    this.initComponent();
  }

  private initComponent() {
    const { avatar, nameLabel, nameLayout, layout, infoControls, statusLabel } = this;

    if (!app.config.get('enableAvatars')) {
      avatar.hide();
    }

    avatar.setFixedSize(32, 32);
    avatar.setObjectName('Avatar');
    infoControls.setSpacing(0);
    infoControls.setContentsMargins(0, 0, 0, 0);
    nameLabel.setObjectName('NameLabel');
    nameLabel.setMinimumSize(24, 0);
    statusLabel.setAlignment(AlignmentFlag.AlignVCenter);
    statusLabel.setObjectName('StatusLabel');
    nameLayout.setSpacing(6);
    nameLayout.addWidget(nameLabel);

    infoControls.addLayout(nameLayout);

    layout.setSpacing(10);
    layout.addWidget(avatar, 0);
    layout.addLayout(infoControls, 1);
    this.labels = [nameLabel, statusLabel];

    this.addEventListener(WidgetEventTypes.HoverEnter, () => this.setHovered(true));
    this.addEventListener(WidgetEventTypes.HoverLeave, () => this.setHovered(false));
  }

  /**
   * Set the avatar's image
   * @param path Path to the image file
   */
  setAvatar(path: string) {
    if (this.native.destroyed) {
      return;
    }

    this.avatar.setPixmap(new QPixmap(path).scaled(32, 32, 1, 1));
  }

  setStatus(status: string) {
    if (status === '') {
      this.statusLabel.setMaximumSize(MAX_QSIZE, 0);

      return;
    }

    this.statusLabel.setMaximumSize(MAX_QSIZE, MAX_QSIZE);
    this.statusLabel.setText(status);
  }

  setName(text: string) {
    this.nameLabel.setText(text);
  }
}
