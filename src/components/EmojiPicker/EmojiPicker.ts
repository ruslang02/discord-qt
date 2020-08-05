import { QWidget, QBoxLayout, Direction, QLineEdit, QMenu, WidgetAttribute, QListWidget, QSize, ScrollBarPolicy, QLabel, ListViewMode, ResizeMode, Flow, QListWidgetItem, QIcon, AlignmentFlag, ItemDataRole, QVariant } from '@nodegui/nodegui';
import './EmojiPicker.scss';
import { app } from '../..';
import { EventEmitter } from 'events';
import { getEmoji } from '../../utilities/GetEmoji';
import { Emoji } from 'discord.js';
export class EmojiPicker extends QMenu {
  events = new EventEmitter();
  controls = new QBoxLayout(Direction.TopToBottom);
  private root = new QWidget(this);
  private emojiView = new QListWidget(this);
  private footer = new QLabel(this);
  private textInput = new QLineEdit(this);

  constructor(parent?: any) {
    super(parent);

    this.setInlineStyle('background: transparent;');
    this.setFixedSize(392, 350);
    this.setLayout(new QBoxLayout(Direction.TopToBottom));
    (this.layout as QBoxLayout).addWidget(this.root, 1)
    this.layout?.setContentsMargins(0, 0, 0, 0);
    this.initComponent();
    this.setAttribute(WidgetAttribute.WA_TranslucentBackground, true);
  }

  private initComponent() {
    const { controls, root, emojiView, footer, textInput } = this;
    root.setLayout(controls);
    root.setMouseTracking(false);
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
      // @ts-ignore
      const emoji = app.client.emojis.resolve(emojiId);
      if (!emoji) return;
      console.log(emoji);
      this.events.emit('emoji', emoji);
    });
    controls.addWidget(emojiView, 1);
  }

  private updateView() {
    const { emojiView, textInput } = this;

    const emojiName = textInput.text();
    emojiView.clear();
    if (emojiName.length <= 3) return;
    app.client.emojis.cache.filter(emoji => {
      return emoji.name.toLowerCase().includes(emojiName.replace(/ /g, '').toLowerCase());
    }).array().forEach(emoji => {
      const item = new QListWidgetItem();
      item.setToolTip(`:${emoji.name}:`);
      item.setData(256, new QVariant(emoji.id));
      item.setSizeHint(new QSize(40, 40));
      getEmoji(emoji).then(path => {
        if (!path) return;
        item.setIcon(new QIcon(path));
        emojiView.addItem(item);
      });
    })
  }
}