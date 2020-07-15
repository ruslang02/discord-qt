import { QWidget, QBoxLayout, Direction, QLabel, QPixmap, AspectRatioMode, TransformationMode, AlignmentFlag, CursorShape, WidgetEventTypes } from "@nodegui/nodegui";
import { Message } from "discord.js";
import { pictureWorker } from "../../utilities/PictureWorker";
import Axios from "axios";
import { app } from "../..";
import fs from "fs";
import open from 'open';

export class MessageItem extends QWidget {
  controls = new QBoxLayout(Direction.LeftToRight);
  private avatar = new QLabel();
  private userNameLabel = new QLabel();
  private dateLabel = new QLabel();
  private contentLabel = new QLabel();

  private msgContainer = new QWidget();
  private msgLayout = new QBoxLayout(Direction.TopToBottom);

  private infoContainer = new QWidget();
  private infoLayout = new QBoxLayout(Direction.LeftToRight);

  constructor(parent: any) {
    super(parent);

    this.setObjectName('MessageItem');
    this.setLayout(this.controls);
    this.initComponent();
  }

  private initComponent() {
    const { controls, avatar, userNameLabel, dateLabel, contentLabel, msgContainer, msgLayout, infoContainer, infoLayout } = this;
    controls.setContentsMargins(16, 4, 16, 4);
    controls.setSpacing(16);

    avatar.setObjectName('Avatar');
    avatar.setAlignment(AlignmentFlag.AlignTop);

    infoLayout.setSpacing(8);
    infoLayout.setContentsMargins(0, 0, 0, 0);

    msgLayout.setContentsMargins(0, 0, 0, 0);
    msgLayout.setSpacing(2);

    userNameLabel.setObjectName('UserNameLabel');
    dateLabel.setObjectName('DateLabel');
    contentLabel.setObjectName('Content');

    infoContainer.setLayout(infoLayout);
    msgContainer.setLayout(msgLayout);

    infoLayout.addWidget(userNameLabel);
    infoLayout.addWidget(dateLabel, 1);

    msgLayout.addWidget(infoContainer);
    msgLayout.addWidget(contentLabel, 1);

    controls.addWidget(avatar);
    controls.addWidget(msgContainer, 1);
  }

  async loadMessage(message: Message) {
    const { avatar, userNameLabel, dateLabel, contentLabel } = this;
    userNameLabel.setText(message.member?.nickname || message.author.username);
    dateLabel.setText(message.createdAt.toLocaleString());
    if (message.content.trim() == "")
      contentLabel.hide();

    let content = message.content;
    const emoIds = content.match(/<:\w+:[0-9]+>/g) || [];
    for (const emo of emoIds) {
      const [name, id] = emo.replace('<:', '').replace('>', '').split(':');
      const emoji = app.client.emojis.get(id.toString());
      if (!emoji)
        continue;
      const buffer = await pictureWorker.loadImage(emoji.url, {size: 64, roundify: false});
      if(!buffer)
        return;
      content = content.replace(emo, `<a title='${emoji.name}' href='${emoji.url}'><img width=48 title='${emoji.name}' src='data:image/png;base64,${buffer.toString('base64')}'></a>`);
      contentLabel.addEventListener('linkHovered', (link: string) => {
        if (link === emoji.url)
          contentLabel.setProperty('toolTip', `:${emoji.name}:`);
      })
    }
    contentLabel.addEventListener(WidgetEventTypes.HoverLeave, () => contentLabel.setProperty('toolTip', ''));
    contentLabel.setText(content);
    for (const embed of message.attachments.values()) {
      const qimage = new QLabel();
      let pixmap = new QPixmap();
      pixmap.loadFromData((await Axios.get(embed.url, { responseType: 'arraybuffer' })).data);
      if (pixmap.width() > 400 || pixmap.height() > 300)
        pixmap = pixmap.scaled(400, 300, AspectRatioMode.KeepAspectRatio, TransformationMode.SmoothTransformation);
      qimage.setCursor(CursorShape.PointingHandCursor);
      qimage.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
        open(embed.url);
      })
      qimage.setPixmap(pixmap);
      this.msgLayout.addWidget(qimage);
    }

    const image = await pictureWorker.loadImage(message.author.avatarURL || message.author.defaultAvatarURL);
    if (image) {
      const pixmap = new QPixmap();
      pixmap.loadFromData(image);
      avatar.setPixmap(pixmap.scaled(40, 40, AspectRatioMode.KeepAspectRatio, TransformationMode.SmoothTransformation));
    }
  }
}