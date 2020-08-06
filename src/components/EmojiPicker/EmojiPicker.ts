import { QWidget, QBoxLayout, Direction, QLineEdit, QMenu, WidgetAttribute, QListWidget, QSize, ScrollBarPolicy, QLabel, ListViewMode, ResizeMode, Flow, QListWidgetItem, QIcon, AlignmentFlag, QVariant, WidgetEventTypes } from '@nodegui/nodegui';
import { Emoji } from 'discord.js';
import { EventEmitter } from 'events';
import { app } from '../..';
import { getEmoji } from '../../utilities/GetEmoji';
import './EmojiPicker.scss';

export class EmojiPicker extends QMenu {
  events = new EventEmitter();
  controls = new QBoxLayout(this.dir);
  private root = new QWidget(this);
  private emojiView = new QListWidget(this);
  private textInput = new QLineEdit(this);

  constructor(parent?: any, private dir = Direction.TopToBottom) {
    super(parent);

    this.setInlineStyle('background: transparent;');
    this.setFixedSize(392, 350);
    this.setLayout(new QBoxLayout(Direction.TopToBottom));
    (this.layout as QBoxLayout).addWidget(this.root, 1);
    (this.layout as QBoxLayout).setContentsMargins(0, 0, 0, 0);
    this.initComponent();
    this.setAttribute(WidgetAttribute.WA_TranslucentBackground, true);
    this.addEventListener(WidgetEventTypes.Hide, this.clear.bind(this));
    this.addEventListener(WidgetEventTypes.Show, this.clear.bind(this));
  }

  clear() {
    this.textInput.clear();
    this.updateView();
  }

  hide() {
    super.hide();
    this.clear();
  }

  private initComponent() {
    const { controls, root, emojiView, textInput } = this;
    root.setLayout(controls);
    root.setObjectName('EmojiPicker');
    root.setFixedSize(392, 350);
    controls.setContentsMargins(0, 0, 0, 0);
    controls.setSpacing(0);
    const textLayout = new QBoxLayout(Direction.LeftToRight);
    textLayout.setContentsMargins(12, 12, 12, 12);
    textInput.setPlaceholderText('Find the perfect emoji');
    textInput.addEventListener('textEdited', this.updateView.bind(this));
    textLayout.addWidget(textInput);
    controls.addLayout(textLayout);
    emojiView.setObjectName("EmojiView");
    emojiView.setGridSize(new QSize(40, 40));
    emojiView.setUniformItemSizes(true);
    emojiView.setHorizontalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
    emojiView.setViewMode(ListViewMode.IconMode);
    emojiView.setResizeMode(ResizeMode.Adjust);
    emojiView.setFlow(Flow.LeftToRight);
    emojiView.setIconSize(new QSize(32, 32));
    emojiView.setItemAlignment(AlignmentFlag.AlignCenter);
    emojiView.addEventListener('itemClicked', item => {
      const emojiId = item.data(256).toString();
      const emoji = app.client.emojis.resolve(emojiId);
      if (!emoji) return;
      if (app.config.recentEmojis) {
        let add = true;
        app.config.recentEmojis = app.config.recentEmojis.map(obj => {
          if (obj[0] === emojiId) {
            obj[1] += 1;
            add = false;
          }
          return obj;
        });
        if (add) app.config.recentEmojis.push([emojiId, 1]);
        app.config.save();
      }
      this.events.emit('emoji', emoji);
    });
    controls.addWidget(emojiView, 1);
  }

  private updateView() {
    const { emojiView, textInput } = this;
    const { client, config } = app;
    const emojiName = textInput.text().trim();
    if (!client) return;
    emojiView.clear();
    if (emojiName === '' && config.recentEmojis) {
      const recents = config.recentEmojis.sort((a, b) => a[1] - b[1]);

      for (const item of recents) {
        const emoji = client.emojis.resolve(item[0]);
        if (!emoji) continue;
        this.insertEmoji(emoji);
      }
      return;
    }
    const emojis = client.emojis.cache.filter(emoji => {
      return emoji.name.toLowerCase().includes(emojiName.replace(/ /g, '').toLowerCase());
    }).array()
    emojis.length = Math.min(emojis.length, 100);
    for (const emoji of emojis) this.insertEmoji(emoji);
  }

  private async insertEmoji(emoji: Emoji) {
    const item = new QListWidgetItem();
    item.setToolTip(`:${emoji.name}:`);
    item.setData(256, new QVariant(emoji.id || ''));
    item.setSizeHint(new QSize(40, 40));
    const path = await getEmoji(emoji);
    if (!path) return;
    item.setIcon(new QIcon(path));
    this.emojiView.addItem(item);
  }
}