import {
  AlignmentFlag,
  CursorShape,
  Direction,
  EchoMode,
  Flow,
  FocusReason,
  ItemFlag,
  Key,
  KeyboardModifier,
  LayoutMode,
  ListViewMode,
  Movement,
  NativeElement,
  QBoxLayout,
  QIcon,
  QKeyEvent,
  QLabel,
  QLineEdit,
  QListWidget,
  QListWidgetItem,
  QMenu,
  QSize,
  QVariant,
  QWidget,
  ScrollBarPolicy,
  WidgetAttribute,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { Emoji } from 'discord.js';
import { EventEmitter } from 'events';
import { __ } from 'i18n';
import { app } from '../..';
import { CancelToken } from '../../utilities/CancelToken';
import { createLogger } from '../../utilities/Console';
import { resolveEmoji } from '../../utilities/ResolveEmoji';

const { error } = createLogger('EmojiPicker');

const mod = (a: number, x: number) => {
  if (Math.abs(a) === x) return 0;
  if (a >= 0) return a % x;
  return x - (-a % x);
};

const EMOJI_REGEX = /\w+/g;

const MAX_EMOJIS = 54;

/**
 * Emoji picker widget.
 */
export class EmojiPicker extends QMenu {
  events = new EventEmitter();

  controls: QBoxLayout;

  private root = new QWidget(this);

  private emojiView = new QListWidget(this);

  private textInput = new QLineEdit(this);

  private controlPressed = false;

  constructor(parent?: any, dir = Direction.TopToBottom) {
    super(parent);
    this.controls = new QBoxLayout(dir);
    this.setInlineStyle('background: transparent;');
    this.setFixedSize(377, 335);
    this.setLayout(new QBoxLayout(Direction.TopToBottom));
    (this.layout as QBoxLayout).addWidget(this.root, 1);
    (this.layout as QBoxLayout).setContentsMargins(0, 0, 0, 0);
    this.initComponent();
    this.setAttribute(WidgetAttribute.WA_TranslucentBackground, true);
    this.addEventListener(WidgetEventTypes.Hide, this.clear.bind(this));
    this.addEventListener(WidgetEventTypes.Show, () => {
      this.clear();
      this.textInput.setFocus(FocusReason.PopupFocusReason);
    });
  }

  clear() {
    this.textInput.clear();
    this.textInput.setPlaceholderText(__('SEARCH_FOR_EMOJI'));
    this.updateView();
  }

  hide() {
    super.hide();
    this.textInput.setReadOnly(false);
    this.controlPressed = false;
    this.clear();
  }

  private initComponent() {
    const {
      controls, root, emojiView, textInput,
    } = this;
    root.setLayout(controls);
    root.setObjectName('EmojiPicker');
    root.setFixedSize(377, 335);
    controls.setSpacing(0);
    controls.setContentsMargins(0, 0, 0, 12);
    const textLayout = new QBoxLayout(Direction.LeftToRight);
    textLayout.setContentsMargins(12, 0, 12, 0);
    textInput.setPlaceholderText(__('SEARCH_FOR_EMOJI'));
    textInput.setReadOnly(false);
    textInput.setCursor(CursorShape.IBeamCursor);
    textInput.setEchoMode(EchoMode.NoEcho);
    textInput.addEventListener(WidgetEventTypes.KeyPress, this.handleKeyPress.bind(this));
    textInput.addEventListener(WidgetEventTypes.InputMethodQuery, () => textInput.clear());
    textInput.addEventListener(WidgetEventTypes.KeyRelease, this.handleKeyRelease.bind(this));
    textLayout.addWidget(textInput);
    controls.addLayout(textLayout);
    emojiView.setObjectName('EmojiView');
    emojiView.setGridSize(new QSize(40, 40));
    emojiView.setUniformItemSizes(true);
    emojiView.setVerticalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
    emojiView.setViewMode(ListViewMode.IconMode);
    emojiView.setMovement(Movement.Static);
    emojiView.setFlow(Flow.LeftToRight);
    emojiView.setBatchSize(MAX_EMOJIS);
    emojiView.setLayoutMode(LayoutMode.Batched);
    emojiView.setIconSize(new QSize(32, 32));
    emojiView.setItemAlignment(AlignmentFlag.AlignCenter);
    emojiView.addEventListener('itemClicked', this.handleItemClicked.bind(this));
    controls.addWidget(emojiView, 1);
    const proTip = new QLabel(this);
    proTip.setObjectName('ProTip');
    proTip.setAlignment(AlignmentFlag.AlignCenter);
    proTip.setText(`<b>${__('PINNED_MESSAGES_PRO_TIP')}</b> ${__('EMOJI_PICKER_PRO_TIP_BODY')}`);
    if (controls.direction() === Direction.TopToBottom) {
      controls.addSpacing(12);
      controls.addWidget(proTip);
    } else {
      controls.insertSpacing(0, 12);
      controls.insertWidget(0, proTip);
    }
  }

  private handleControlPressed(event: any) {
    const e = new QKeyEvent(event as NativeElement) as QKeyEvent & { ignore: () => void };
    this.controlPressed = (e.modifiers() & KeyboardModifier.ControlModifier)
      === KeyboardModifier.ControlModifier;
    this.textInput.clear();
  }

  private handleKeyPress(event: any) {
    const { emojiView, textInput } = this;
    this.handleControlPressed(event);
    const e = new QKeyEvent(event as NativeElement);
    let text = textInput.placeholderText();
    if (text.includes(' ')) text = '';
    const input = e.text();
    switch (e.key()) {
      case Key.Key_Up:
        emojiView.setCurrentRow(
          mod(emojiView.currentRow() - 9, emojiView.count()),
        );
        break;
      case Key.Key_Left:
        emojiView.setCurrentRow(
          mod(emojiView.currentRow() - 1, emojiView.count()),
        );
        break;
      case Key.Key_Down:
        emojiView.setCurrentRow(
          mod(emojiView.currentRow() + 9, emojiView.count()),
        );
        break;
      case Key.Key_Right:
        emojiView.setCurrentRow(
          mod(emojiView.currentRow() + 1, emojiView.count()),
        );
        break;
      case Key.Key_Return:
      case Key.Key_Space:
        break;
      case Key.Key_Delete:
      case Key.Key_Backspace:
        textInput.setPlaceholderText(text.slice(0, -1));
        this.updateView();
        break;
      default: {
        const newText = (text + input).trim();
        const check = newText.match(EMOJI_REGEX);
        if (!check || !check.length || check[0] !== newText) break;
        textInput.setPlaceholderText(newText);
        this.updateView();
      }
    }
    const newValue = textInput.placeholderText();
    if (!newValue) textInput.setPlaceholderText(__('SEARCH_FOR_EMOJI'));
  }

  private handleKeyRelease(event: any) {
    const { emojiView } = this;
    this.handleControlPressed(event);
    const e = new QKeyEvent(event as NativeElement);
    switch (e.key()) {
      case Key.Key_Return:
        this.handleItemClicked(emojiView.currentItem());
        break;
      default:
    }
  }

  private handleItemClicked(item: QListWidgetItem) {
    const emojiId = item.data(256).toString();
    const emoji = app.client.emojis.resolve(emojiId);
    if (!emoji) return;
    if (app.config.recentEmojis) {
      let add = true;
      app.config.recentEmojis = app.config.recentEmojis.map((obj) => {
        const o = obj;
        if (o[0] === emojiId) {
          o[1] += 1;
          add = false;
        }
        return obj;
      });
      if (add) app.config.recentEmojis.push([emojiId, 1]);
      app.config.save();
    }
    this.events.emit('emoji', emoji, this.controlPressed);
  }

  private token?: CancelToken;

  /**
   * Updates emojis displayed on the screen according to the search input.
   */
  private async updateView() {
    const { emojiView, textInput } = this;
    const { client, config } = app;
    const emojiName = textInput.placeholderText().trim();
    if (!client) return;
    this.token?.cancel();
    this.token = new CancelToken();
    emojiView.clear();
    emojiView.setCurrentRow(0);
    if (emojiName === __('SEARCH_FOR_EMOJI') && config.recentEmojis) {
      const recents = config.recentEmojis.sort((a, b) => a[1] - b[1]);
      for (const item of recents) {
        const emoji = client.emojis.resolve(item[0]);
        if (emoji) this.insertEmoji(emoji, this.token);
      }
      return;
    }
    const result = client.emojis.cache
      .filter((emoji) => emoji.name.toLowerCase().includes(emojiName.replace(/ /g, '').toLowerCase()))
      .partition((v) => v.guild.id === app.currentGuildId);
    const thisGuild = result[0].first(MAX_EMOJIS);
    const otherGuilds = result[1].first(MAX_EMOJIS - thisGuild.length);
    let max = Math.min(MAX_EMOJIS, thisGuild.length + otherGuilds.length);
    for (let i = 0; i < max; i += 1) {
      if (thisGuild.length !== 0 && i === thisGuild.length) {
        const item = new QListWidgetItem();
        item.setFlags(~ItemFlag.ItemIsEnabled);
        item.setText('●');
        this.emojiView.addItem(item);
        max -= 1;
      }
      // // eslint-disable-next-line no-await-in-loop
      this.insertEmoji(i < thisGuild.length
        ? thisGuild[i]
        : otherGuilds[i - thisGuild.length], this.token);
    }
    emojiView.setCurrentRow(0);
  }

  /**
   * Inserts emoji into the view.
   * @param emoji Emoji to render.
   */
  private insertEmoji(emoji: Emoji, cancel: CancelToken) {
    const item = new QListWidgetItem();
    item.setToolTip(`:${emoji.name}:`);
    item.setData(256, new QVariant(emoji.id || ''));
    item.setSizeHint(new QSize(40, 40));
    resolveEmoji({ emoji_id: emoji.id || undefined, emoji_name: emoji.name })
      .then((path) => !cancel.cancelled && item.setIcon(new QIcon(path)))
      .catch((e) => {
        if (cancel.cancelled) return;
        item.setText(emoji.name);
        error(`Couldn't retrieve emoji ${emoji}`, e);
      });
    this.emojiView.addItem(item);
  }
}
