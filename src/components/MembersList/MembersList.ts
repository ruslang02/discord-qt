import { Shape, QListWidget, QListWidgetItem, QSize, ScrollBarPolicy, QBrush, QColor, BrushStyle, QMenu, ContextMenuPolicy, QPoint, QPushButton, QAction, QClipboard, QApplication, QClipboardMode, CursorShape } from '@nodegui/nodegui';
import { TextChannel } from 'discord.js';
import { MAX_QSIZE, app } from '../..';
import { UserButton } from '../UserButton/UserButton';
import { ViewOptions } from '../../views/ViewOptions';
import { CancelToken } from '../../utilities/CancelToken';
import { Events } from '../../structures/Events';


export class MembersList extends QListWidget {
  private cancelToken?: CancelToken;
  private channel?: TextChannel;

  private menu = new QMenu(this);
  private p0 = new QPoint(0, 0);
  private active?: UserButton;
  private clipboard = QApplication.clipboard();

  constructor() {
    super();
    this.setObjectName('MembersList');
    this.setFrameShape(Shape.NoFrame);
    this.setSelectionRectVisible(false);
    this.setHorizontalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
    this.setMinimumSize(240, 0);
    this.setMaximumSize(240, MAX_QSIZE);
    this.initMenu();

    app.on(Events.SWITCH_VIEW, (view: string, options?: ViewOptions) => {
      if (view === 'dm' || view === 'guild' && !options?.channel) return this.hide();
      if (view !== 'guild' || !options?.channel) return;
      if (this.cancelToken) this.cancelToken.cancel();
      const cancel = new CancelToken();
      if (options.channel !== this.channel)
        this.loadList(options.channel, cancel);
      this.cancelToken = cancel;
      this.show()
    })
  }

  private initMenu() {
    const { menu, clipboard } = this;
    {
      const item = new QAction();
      item.setText('Message');
      item.addEventListener('triggered', async () => {
        if (!this.active) return;
        app.emit(Events.SWITCH_VIEW, 'dm', { dm: await this.active.user?.createDM() })
      });
      menu.addAction(item);
    }
    menu.addSeparator();
    {
      const item = new QAction();
      item.setText('Copy ID');
      item.addEventListener('triggered', async () => {
        if (!this.active || !this.active.user) return;
        clipboard.setText(this.active.user.id, QClipboardMode.Clipboard);
      });
      menu.addAction(item);
    }
  }

  private async loadList(channel: TextChannel, token: CancelToken) {
    const { menu, p0 } = this;
    this.channel = channel;
    this.clear();
    if (token.cancelled) return;
    for (const member of channel.members.values()) {
      if (token.cancelled) return;
      const btn = new UserButton(this);
      const item = new QListWidgetItem();
      item.setSizeHint(new QSize(224, 44));
      item.setFlags(0);
      item.setBackground(new QBrush(new QColor('transparent'), BrushStyle.NoBrush));
      btn.loadUser(member);
      btn.setContextMenuPolicy(ContextMenuPolicy.CustomContextMenu);
      btn.addEventListener('clicked', async () => {
        const { miniProfile } = app.window.dialogs;
        const map = btn.mapToGlobal(this.p0);
        map.setX(map.x() - 250);
        miniProfile.loadProfile(member)
        miniProfile.popup(map);
      });

      btn.addEventListener('customContextMenuRequested', ({ x, y }) => {
        this.active = btn;
        menu.popup(btn.mapToGlobal(new QPoint(x, y)));
      });
      btn.loadAvatar();
      this.addItem(item);
      this.setItemWidget(item, btn);
    }
  }
}