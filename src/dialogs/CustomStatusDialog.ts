import { Dialog } from './Dialog';
import { QLabel, QLineEdit, QComboBox, QBoxLayout, Direction, QWidget, CursorShape, QPixmap, AlignmentFlag, WidgetAttribute, WidgetEventTypes, QPushButton, QIcon, QPoint, QSize } from '@nodegui/nodegui';
import { app } from '..';
import { Events } from '../structures/Events';
import { DColorButton, DColorButtonColor } from '../components/DColorButton/DColorButton';
import { DIconButton } from '../components/DIconButton/DIconButton';
import { pictureWorker } from '../utilities/PictureWorker';
import { resolveEmoji } from '../utilities/ResolveEmoji';
import { RootWindow } from '../windows/RootWindow';
import { Emoji } from 'discord.js';
import { getEmoji } from '../utilities/GetEmoji';

export class CustomStatusDialog extends Dialog {
  private statusLabel = new QLabel(this);
  private emojiInput = new QLabel(this);
  private statusInput = new QLineEdit(this);
  private clearLabel = new QLabel(this);
  private clearInput = new QComboBox(this);
  private emoji?: Emoji;

  constructor(parent?: any) {
    super(parent);
    this.header.setText('Set a custom status');
    this.init();
    this.initFooter();
  }

  show() {
    if (!app.client?.user) return;
    super.show();
    this.statusLabel.setText(`What's cookin', ${app.client?.user?.username}?`);
    this.statusInput.setText(app.client.user.customStatus?.text || '');
    const eid = app.client.user.customStatus?.emoji_id;
    if (!eid) return;
    const emoji = app.client.emojis.resolve(eid);
    if (!emoji) return;
    this.loadEmoji(emoji);
  }

  private async loadEmoji(emoji: Emoji) {
    const emojiFile = await getEmoji(emoji);
    if (!emojiFile) return;
    this.emoji = emoji;
    this.emojiInput.setPixmap(new QPixmap(emojiFile).scaled(32, 32, 1, 1));
  }

  private init() {
    const { statusLabel, emojiInput, statusInput, clearLabel, clearInput } = this;
    const layout = new QBoxLayout(Direction.TopToBottom);
    layout.setSpacing(8);
    layout.setContentsMargins(16, 0, 16, 16);
    statusLabel.setObjectName('FormLabel');
    const statusLayout = new QBoxLayout(Direction.LeftToRight);
    emojiInput.setObjectName('EmojiInput');
    emojiInput.setFixedSize(48, 48);
    emojiInput.setCursor(CursorShape.PointingHandCursor);
    emojiInput.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      const map = emojiInput.mapToGlobal(this.p0);
      const point = new QPoint(map.x(), map.y() + emojiInput.size().height());
      app.window.emojiPicker.popup(point);
      app.window.emojiPicker.events.once('emoji', async (emoji: Emoji) => {
        await this.loadEmoji(emoji);
        app.window.emojiPicker.hide();
      })
    });
    statusInput.setObjectName('StatusInput');
    statusInput.setPlaceholderText('Yay! Cookies!');
    const resetButton = new DColorButton(DColorButtonColor.RED_TEXT);
    resetButton.setText('×');
    resetButton.setFixedSize(38, 38);
    resetButton.setInlineStyle('font-size: 32px; padding: 0');
    resetButton.addEventListener('clicked', () => app.client.user?.setCustomStatus({text: undefined}));
    statusLayout.setSpacing(5);
    statusLayout.setContentsMargins(0, 0, 0, 0);
    statusLayout.addWidget(emojiInput);
    statusLayout.addWidget(statusInput);
    statusLayout.addWidget(resetButton);
    statusLabel.setText('How is it going?');
    statusLabel.setBuddy(statusInput);
    clearLabel.setObjectName('FormLabel');
    clearInput.setObjectName('ClearInput');
    clearInput.addItems(["Don't clear", "Today", "4 hours", '1 hour', '30 minutes']);
    clearInput.setStyleSheet("::down-arrow { image: url(assets/icons/menu-down.png) }");
    clearLabel.setText('Clear after');
    clearInput.setCursor(CursorShape.PointingHandCursor);
    clearLabel.setBuddy(clearInput);
    layout.addWidget(statusLabel);
    layout.addLayout(statusLayout);
    layout.addSpacing(8);
    [clearLabel, clearInput].forEach(w => layout.addWidget(w));
    this.controls.addLayout(layout);
  }

  private initFooter() {
    const footer = new QWidget(this);
    footer.setObjectName('Footer');
    const footLayout = new QBoxLayout(Direction.LeftToRight);
    footLayout.addStretch(1);
    footLayout.setContentsMargins(16, 16, 16, 16);
    const saveBtn = new DColorButton(DColorButtonColor.BLURPLE);
    saveBtn.setText('Save');
    saveBtn.setFixedSize(96, 38);
    saveBtn.addEventListener('clicked', () => {
      let date: Date | null = new Date();
      switch (this.clearInput.currentText()) {
        case 'Today':
          date.setDate(date.getDate() + 1);
          date.setHours(0, 0, 0, 0);
          break;
        case '4 hours':
          date.setHours(date.getHours() + 4);
          break;
        case '1 hour':
          date.setHours(date.getHours() + 1);
          break;
        case '30 minutes':
          date.setMinutes(date.getMinutes() + 30);
          break;
        default:
          date = null;
          break;
      }
      app.client.user?.setCustomStatus({
        emoji_id: this.emoji?.id || undefined,
        emoji_name: this.emoji?.name,
        expires_at: date?.toISOString(),
        text: this.statusInput.text() || undefined
      });
      this.hide();
    })
    const cancelBtn = new DColorButton(DColorButtonColor.WHITE_TEXT);
    cancelBtn.setText('Cancel');
    cancelBtn.setFixedSize(80, 38);
    cancelBtn.addEventListener('clicked', () => this.hide());
    footLayout.addWidget(cancelBtn);
    footLayout.addWidget(saveBtn);
    footer.setLayout(footLayout);
    this.controls.addWidget(footer);
  }
}