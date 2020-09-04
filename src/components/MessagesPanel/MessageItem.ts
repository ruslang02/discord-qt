import { AlignmentFlag, ContextMenuPolicy, CursorShape, Direction, MouseButton, NativeElement, QAction, QApplication, QBoxLayout, QClipboardMode, QLabel, QMenu, QMouseEvent, QPixmap, QPoint, QWidget, TextInteractionFlag, WidgetEventTypes } from "@nodegui/nodegui";
import { Collection, Message, MessageAttachment, Snowflake } from "discord.js";
import open from 'open';
import { URL } from 'url';
import { app, MAX_QSIZE } from '../..';
import { Events } from '../../structures/Events';
import { CancelToken } from '../../utilities/CancelToken';
import { pictureWorker } from "../../utilities/PictureWorker";
import { processEmojis, processMarkdown, processMentions } from './MessageUtilities';

const INVITE_REGEX = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[A-z]/g;
const avatarCache = new Map<Snowflake, QPixmap>();

export class MessageItem extends QWidget {
  controls = new QBoxLayout(Direction.LeftToRight);
  private avatar = new QLabel(this);
  private userNameLabel = new QLabel(this);
  private dateLabel = new QLabel(this);
  private contentLabel = new QLabel(this);

  private msgLayout = new QBoxLayout(Direction.TopToBottom);
  private infoLayout = new QBoxLayout(Direction.LeftToRight);

  private menu = new QMenu(this);
  private clipboard = QApplication.clipboard();

  message?: Message;

  constructor(parent?: any) {
    super(parent);

    this.setObjectName('MessageItem');
    this.setLayout(this.controls);
    this.initComponent();
    this.initMenu();
  }

  private initMenu() {
    const { menu, clipboard } = this;
    menu.setCursor(CursorShape.PointingHandCursor);
    {
      const action = new QAction(menu);
      action.setText('Quote (>)');
      action.addEventListener('triggered', () => {
        app.emit(Events.QUOTE_MESSAGE_NOEMBED, this.message);
      });
      menu.addAction(action);
    }
    {
      const action = new QAction(menu);
      action.setText('Quote (embed)');
      action.addEventListener('triggered', () => {
        app.emit(Events.QUOTE_MESSAGE_EMBED, this.message);
      });
      menu.addAction(action);
    }
    menu.addSeparator();
    {
      const action = new QAction(menu);
      action.setText('Copy Message');
      action.addEventListener('triggered', () => {
        clipboard.setText(this.message?.cleanContent || '', QClipboardMode.Clipboard);
      });
      menu.addAction(action);
    }
    {
      const action = new QAction(menu);
      action.setText('Copy Message (source)');
      action.addEventListener('triggered', () => {
        clipboard.setText(this.message?.content || '', QClipboardMode.Clipboard);
      });
      menu.addAction(action);
    }
    {
      const action = new QAction(menu);
      action.setText('Copy ID');
      action.addEventListener('triggered', () => {
        clipboard.setText(this.message?.id || '', QClipboardMode.Clipboard);
      });
      menu.addAction(action);
    }
    this.setContextMenuPolicy(ContextMenuPolicy.CustomContextMenu);
    this.addEventListener(WidgetEventTypes.MouseButtonPress, (e) => {
      const ev = new QMouseEvent(e as NativeElement);
      ev.button() === MouseButton.RightButton && menu.popup(new QPoint(ev.globalX(), ev.globalY()));
    })
  }

  private p0 = new QPoint(0, 0);
  private initComponent() {
    const { controls, avatar, userNameLabel, dateLabel, contentLabel, msgLayout, infoLayout } = this;
    controls.setContentsMargins(16, 4, 16, 4);
    controls.setSpacing(10);

    avatar.setObjectName('Avatar');
    avatar.setMinimumSize(48, 0);
    avatar.setAlignment(AlignmentFlag.AlignTop);
    avatar.setCursor(CursorShape.PointingHandCursor);
    avatar.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      if (!this.message) return;
      const { miniProfile } = app.window.dialogs;
      const map = avatar.mapToGlobal(this.p0);
      map.setX(map.x() + avatar.size().width());
      miniProfile.loadProfile(this.message.member || this.message.author)
      miniProfile.popup(map);
    })
    if (!app.config.enableAvatars) avatar.hide();

    infoLayout.setSpacing(8);
    infoLayout.setContentsMargins(0, 0, 0, 0);

    msgLayout.setContentsMargins(0, 0, 0, 0);
    msgLayout.setSpacing(2);

    userNameLabel.setObjectName('UserNameLabel');
    dateLabel.setObjectName('DateLabel');

    contentLabel.setObjectName('Content');
    contentLabel.setTextInteractionFlags(TextInteractionFlag.TextBrowserInteraction);
    contentLabel.setAlignment(AlignmentFlag.AlignVCenter);
    contentLabel.setWordWrap(true);
    contentLabel.setCursor(CursorShape.IBeamCursor);
    contentLabel.setContextMenuPolicy(ContextMenuPolicy.NoContextMenu);
    contentLabel.addEventListener(WidgetEventTypes.HoverLeave, () => contentLabel.setProperty('toolTip', ''));
    contentLabel.addEventListener('linkActivated', (link) => {
      const url = new URL(link);
      if (url.hostname === 'discord.gg') app.window.dialogs.acceptInvite.checkInvite(link)
      else open(link);
    })
    contentLabel.addEventListener('linkHovered', (link: string) => {
      try {
        const uri = new URL(link);
        const name = uri.searchParams.get('emojiname');
        if (name) contentLabel.setProperty('toolTip', `:${name}:`);
      } catch (e) { }
    });

    infoLayout.addWidget(userNameLabel);
    infoLayout.addWidget(dateLabel, 1);

    msgLayout.addLayout(infoLayout);
    msgLayout.addWidget(contentLabel, 1);

    controls.addWidget(avatar);
    controls.addLayout(msgLayout, 1);
  }

  private attachs = new Map<QLabel, string>();
  private async processAttachments(attachments: Collection<string, MessageAttachment>) {
    for (const attach of attachments.values()) {
      let url = attach.proxyURL;
      let width = attach.width;
      let height = attach.height;
      if (width === null || height === null) continue;
      const ratio = width / height;

      if (width > 400) {
        width = 400;
        height = width / ratio;
      }
      if (height > 300) {
        height = 300;
        width = height * ratio;
      }
      width = Math.ceil(width);
      height = Math.ceil(height);
      url += `?width=${width}&height=${height}`;

      const qimage = new QLabel(this);
      qimage.setFixedSize(width, height);
      qimage.setInlineStyle('background-color: #2f3136');
      qimage.setCursor(CursorShape.PointingHandCursor);
      qimage.addEventListener(WidgetEventTypes.MouseButtonPress, (e) => {
        open(attach.url);
      })
      this.attachs.set(qimage, url);
      this.msgLayout.addWidget(qimage);
    }
  }
  private alreadyRendered = false;
  async renderImages() {
    const { message, avatar } = this;
    if (!message || this.alreadyRendered) return;
    (async () => {
      const cachePixmap = avatarCache.get(message.author.id);
      if (cachePixmap) return avatar.setPixmap(cachePixmap);
      const image = await pictureWorker.loadImage(
        message.author.displayAvatarURL({ format: 'png', size: 256 })
      );
      if (image) {
        const pixmap = new QPixmap(image).scaled(40, 40, 1, 1);
        avatar.setPixmap(pixmap);
        avatarCache.set(message.author.id, pixmap);
      }
    })();
    this.attachs.forEach(async (url, label) => {
      this.attachs.delete(label);
      const image = await pictureWorker.loadImage(url);
      image && label.setPixmap(new QPixmap(image));
    });
    this.alreadyRendered = true;
  }

  private async processInvites(message: Message) {
    const invites = message.content.match(INVITE_REGEX) || [];
    for (const inviteLink of invites) {
      try {
        const invite = await app.client.fetchInvite(inviteLink);
        const item = new QWidget(this);
        item.setObjectName('InviteContainer');
        item.setMinimumSize(432, 0);
        item.setMaximumSize(432, MAX_QSIZE);
        const layout = new QBoxLayout(Direction.TopToBottom);
        item.setLayout(layout);
        layout.setContentsMargins(16, 16, 16, 16);
        layout.setSpacing(12);
        const helperText = new QLabel(item);
        helperText.setText('An invite to join a server');
        helperText.setObjectName('Helper');
        const mainLayout = new QBoxLayout(Direction.LeftToRight);
        const avatar = new QLabel(item);
        pictureWorker.loadImage(invite.guild?.iconURL({ size: 256, format: 'png' }) || '')
          .then(path => {
            if (!path) return;
            avatar.setPixmap(new QPixmap(path).scaled(50, 50, 1, 1));
          });
        const nameLabel = new QLabel(item);
        nameLabel.setText(`${invite.guild?.name || 'A server'} <span style='font-size: small; color: #72767d'>${invite.memberCount} Members</span>`);
        nameLabel.setAlignment(AlignmentFlag.AlignVCenter);
        nameLabel.setObjectName('Name');
        mainLayout.addWidget(avatar);
        mainLayout.addWidget(nameLabel, 1);
        layout.addWidget(helperText);
        layout.addLayout(mainLayout, 1);
        this.msgLayout.addWidget(item);
      } catch (e) { }
    }
  }

  async loadMessage(message: Message, token?: CancelToken) {
    const { userNameLabel, dateLabel, contentLabel } = this;
    const user = message.author;
    const member = message.guild?.member(user)// || await message.guild?.members.fetch({ user });
    this.message = message;
    userNameLabel.setText(member?.nickname || user.username);
    if (token?.cancelled) return;
    dateLabel.setText(message.createdAt.toLocaleString());
    if (message.system) return this.loadSystemMessage(message);
    if (message.content.trim() == "") contentLabel.hide();
    else {
      let content = message.content;
      if (token?.cancelled) return;
      content = await processMarkdown(content);
      if (token?.cancelled) return;
      content = await processMentions(content.replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
      content = await processEmojis(content.replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
      contentLabel.setText('<style>* {vertical-align: middle;} img {max-height: 24px; max-width: 24px;}</style>' + content);
    }
    if (token?.cancelled) return;
    await this.processAttachments(message.attachments);
    await this.processInvites(message);
  }

  private loadSystemMessage(message: Message) {
    let content = '';
    switch (message.type) {
      case 'GUILD_MEMBER_JOIN':
        content = 'joined the server.';
        break;
      case 'RECIPIENT_ADD':
        content = 'was added to the group DM.';
        break;
      case 'RECIPIENT_REMOVE':
        content = 'was removed from the group DM.';
        break;
      case 'CALL':
        content = 'called.';
        break;
      case 'PINS_ADD':
        content = 'pinned a message to this channel.';
        break;
    }
    this.dateLabel.hide();
    this.contentLabel.setText('<i>&nbsp;</i>' + content);
    this.msgLayout.setDirection(Direction.LeftToRight);
  }
}