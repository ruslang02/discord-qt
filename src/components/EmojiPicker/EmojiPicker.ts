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
import { NativeRawPointer } from '@nodegui/nodegui/dist/lib/core/Component';
import { Emoji, GuildEmoji } from 'discord.js';
import { EventEmitter } from 'events';
import { app } from '../..';
import { CancelToken } from '../../utilities/CancelToken';
import { createLogger } from '../../utilities/Console';
import { resolveEmoji } from '../../utilities/ResolveEmoji';
import { __ } from '../../utilities/StringProvider';

const { error } = createLogger('EmojiPicker');

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

  private token?: CancelToken;

  constructor(parent?: any, dir = Direction.TopToBottom) {
    super(parent);

    this.setInlineStyle('background: transparent;');
    this.setFixedSize(377, 335);
    this.setLayout(new QBoxLayout(Direction.TopToBottom));

    this.controls = new QBoxLayout(dir);
    this.layout?.addWidget(this.root, 1);
    this.layout?.setContentsMargins(0, 0, 0, 0);

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

    void this.updateView();
  }

  hide() {
    super.hide();

    this.textInput.setReadOnly(false);
    this.controlPressed = false;
    this.clear();
  }

  private initComponent() {
    const { controls, root, emojiView, textInput } = this;

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
    textInput.addEventListener(WidgetEventTypes.KeyRelease, this.handleKeyRelease.bind(this));
    textInput.addEventListener(WidgetEventTypes.InputMethodQuery, () => textInput.clear());

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

  private handleControlPressed(event: QKeyEvent) {
    // @TODO: Verify if it works
    // const e = new QKeyEvent(event as NativeElement) as QKeyEvent & { ignore: () => void };

    this.controlPressed =
      (event.modifiers() & KeyboardModifier.ControlModifier) === KeyboardModifier.ControlModifier;

    this.textInput.clear();
  }

  private handleKeyPress(event?: NativeRawPointer<'QEvent'>) {
    if (!event) {
      return;
    }

    const { emojiView, textInput } = this;

    const e = new QKeyEvent(event);

    this.handleControlPressed(e);

    let text = textInput.placeholderText();

    if (text.includes(' ')) {
      text = '';
    }

    switch (e.key()) {
      case Key.Key_Up:
        emojiView.setCurrentRow((emojiView.currentRow() - 9) % emojiView.count());
        break;

      case Key.Key_Left:
        emojiView.setCurrentRow((emojiView.currentRow() - 1) % emojiView.count());
        break;

      case Key.Key_Down:
        emojiView.setCurrentRow((emojiView.currentRow() + 9) % emojiView.count());
        break;

      case Key.Key_Right:
        emojiView.setCurrentRow((emojiView.currentRow() + 1) % emojiView.count());
        break;

      case Key.Key_Return:

      case Key.Key_Space:
        break;

      case Key.Key_Delete:

      case Key.Key_Backspace:
        textInput.setPlaceholderText(text.slice(0, -1));
        void this.updateView();
        break;

      default: {
        const newText = (text + e.text()).trim();
        const check = newText.match(EMOJI_REGEX);

        if (check && check.length && check[0] === newText) {
          textInput.setPlaceholderText(newText);
          void this.updateView();
        }
      }
    }

    if (!textInput.placeholderText()) {
      textInput.setPlaceholderText(__('SEARCH_FOR_EMOJI'));
    }
  }

  private handleKeyRelease(event?: NativeRawPointer<'QEvent'>) {
    if (!event) {
      return;
    }

    const { emojiView } = this;

    const e = new QKeyEvent(event);

    this.handleControlPressed(e);

    if (e.key() === Key.Key_Return) {
      this.handleItemClicked(emojiView.currentItem());
    }
  }

  private handleItemClicked(item: QListWidgetItem) {
    const emojiId = item.data(256).toString();
    const emoji = app.client.emojis.resolve(emojiId);

    if (!emoji) {
      return;
    }

    const recentEmojis = app.config.get('recentEmojis');

    if (recentEmojis) {
      let add = true;

      const newEmojis = recentEmojis.map((obj) => {
        const o = obj;

        if (o[0] === emojiId) {
          o[1] += 1;
          add = false;
        }

        return obj;
      });

      if (add) {
        newEmojis.push([emojiId, 1]);
      }

      app.config.set('recentEmojis', newEmojis);

      void app.config.save();
    }

    this.events.emit('emoji', emoji, this.controlPressed);
  }

  /**
   * Updates emojis displayed on the screen according to the search input.
   */
  private async updateView() {
    const { emojiView, textInput } = this;
    const { client, config } = app;
    const emojiName = textInput.placeholderText().trim();

    if (!client) {
      return;
    }

    this.token?.cancel();
    this.token = new CancelToken();

    emojiView.clear();
    emojiView.setCurrentRow(0);

    if (emojiName === __('SEARCH_FOR_EMOJI') && config.get('recentEmojis')) {
      const recents = config.get('recentEmojis').sort((a, b) => a[1] - b[1]);

      for (const item of recents) {
        const emoji = client.emojis.resolve(item[0]);

        if (emoji) {
          this.insertEmoji(emoji, this.token);
        }
      }

      return;
    }

    const result = client.emojis.cache
      .filter((emoji) =>
        emoji.name.toLowerCase().includes(emojiName.replace(/ /g, '').toLowerCase())
      )
      .partition((v) => v.guild.id === app.currentGuildId);

    const thisGuild = result[0].first(MAX_EMOJIS);
    const otherGuilds = result[1].first(MAX_EMOJIS - thisGuild.length);

    const max = Math.min(MAX_EMOJIS, thisGuild.length + otherGuilds.length);

    const index = Math.min(max, thisGuild.length);

    for (let i = 0; i < max; i += 1) {
      if (i < index) {
        this.insertEmoji(thisGuild[i], this.token);
      } else if (i === index && index !== 0) {
        const item = new QListWidgetItem();

        item.setFlags(~ItemFlag.ItemIsEnabled);
        item.setText('●');

        this.emojiView.addItem(item);
      } else {
        this.insertEmoji(otherGuilds[i - (index || -1) - 1], this.token);
      }
    }

    emojiView.setCurrentRow(0);
  }

  /**
   * Inserts emoji into the view.
   * @param emoji Emoji to render.
   */
  private insertEmoji(emoji: Emoji, cancel: CancelToken) {
    const item = new QListWidgetItem();

    item.setToolTip(
      `<b>:${emoji.name}:</b><br />${
        emoji instanceof GuildEmoji ? emoji.guild.name : 'Default emoji'
      }`
    );

    item.setData(256, new QVariant(emoji.id || ''));
    item.setSizeHint(new QSize(40, 40));

    resolveEmoji({ emoji_id: emoji.id || undefined, emoji_name: emoji.name })
      .then((path) => {
        if (!cancel.cancelled && !item.native.destroyed) {
          item.setIcon(new QIcon(path));
        }
      })
      .catch((e) => {
        if (!cancel.cancelled && !item.native.destroyed) {
          item.setText(emoji.name);
          error(`Couldn't retrieve emoji ${emoji}`, e);
        }
      });

    this.emojiView.addItem(item);
  }
}
