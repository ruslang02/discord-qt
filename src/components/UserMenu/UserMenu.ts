import {
  CursorShape,
  Direction,
  Orientation,
  QAction,
  QBoxLayout,
  QClipboardMode,
  QLabel,
  QMenu,
  QPoint,
  QSlider,
  QWidget,
  WidgetAttribute,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { GuildMember, User } from 'discord.js';
import { __ } from 'i18n';
import { app } from '../..';
import { Events } from '../../utilities/Events';

export class UserMenu extends QMenu {
  private someone?: GuildMember | User;

  private point?: QPoint;

  private items = new Map<string, QAction>();

  private userVol = new QWidget(this);

  private userVolSlider = new QSlider();

  constructor(parent?: any) {
    super(parent);
    this.setInlineStyle('border-radius: 4px');
    this.setAttribute(WidgetAttribute.WA_TranslucentBackground, true);
    this.initItems();
    this.addEventListener(WidgetEventTypes.Resize, () => {
      this.userVol.setMinimumSize(this.size().width() - 14, 0);
    });
    app.on(Events.OPEN_USER_MENU, this.popout.bind(this));
  }

  private initItems() {
    const { clipboard } = app;
    {
      const item = new QAction();
      item.setText(__('PROFILE'));
      item.addEventListener('triggered', async () => {
        if (!this.someone || !this.point) return;
        app.emit(Events.OPEN_USER_PROFILE, this.someone.id, app.currentGuildId, this.point);
      });
      this.addAction(item);
      this.items.set('PROFILE', item);
    }
    {
      const item = new QAction();
      item.setText(__('MENTION'));
      item.addEventListener('triggered', async () => {
        if (!this.someone) return;
        app.emit(Events.MENTION_USER, this.someone.id);
      });
      this.addAction(item);
      this.items.set('MENTION', item);
    }
    {
      const item = new QAction();
      item.setText(__('SEND_DM'));
      item.addEventListener('triggered', async () => {
        if (!this.someone) return;
        app.emit(Events.SWITCH_VIEW, 'dm', {
          dm: await (this.someone instanceof User
            ? this.someone.createDM()
            : this.someone.user?.createDM()),
        });
      });
      this.addAction(item);
      this.items.set('SEND_DM', item);
    }
    this.items.set('VOLUME_SEPARATOR', this.addSeparator());
    {
      const item = new QAction();
      item.setText('');
      item.setEnabled(false);
      this.addAction(item);
      this.items.set('USER_VOLUME', item);
      this.userVol.move(7, 72);
      const layout = new QBoxLayout(Direction.TopToBottom);
      layout.setSpacing(0);
      const userVolLabel = new QLabel(this);
      userVolLabel.setText(__('USER_VOLUME'));
      userVolLabel.setObjectName('UserVolumeLabel');
      this.userVolSlider.setOrientation(Orientation.Horizontal);
      this.userVolSlider.setCursor(CursorShape.SizeHorCursor);
      this.userVolSlider.setMaximum(150);
      this.userVolSlider.addEventListener('sliderReleased', async () => {
        if (!this.someone) return;
        const settings = app.config.userVolumeSettings[this.someone.id];
        if (settings) settings.volume = this.userVolSlider.value();
        else {
          app.config.userVolumeSettings[this.someone.id] = {
            volume: this.userVolSlider.value(),
            muted: false,
          };
        }
        await app.configManager.save();
      });
      layout.addWidget(userVolLabel);
      layout.addWidget(this.userVolSlider);
      this.userVol.setLayout(layout);
    }
    this.items.set('GUILD_SEPARATOR', this.addSeparator());
    {
      const item = new QAction();
      item.setText(__('MUTE'));
      item.addEventListener('triggered', async () => {
        if (!this.someone) return;
        const settings = app.config.userVolumeSettings[this.someone.id];
        if (settings) settings.muted = !settings.muted;
        else {
          app.config.userVolumeSettings[this.someone.id] = {
            volume: 100,
            muted: true,
          };
        }
        await app.configManager.save();
        this.updateVisibility();
      });
      this.addAction(item);
      this.items.set('MUTE', item);
    }
    {
      const item = new QAction();
      item.setText(__('CHANGE_NICKNAME'));
      item.addEventListener('triggered', async () => {
        if (!(this.someone instanceof GuildMember)) return;
        app.window.dialogs.nicknameChange.openForMember(this.someone);
      });
      this.addAction(item);
      this.items.set('CHANGE_NICKNAME', item);
    }
    {
      const item = new QAction();
      item.setText(__('INVITE_TO_SERVER'));
      item.addEventListener('triggered', async () => {
        if (!this.someone) return;
        app.emit(Events.SWITCH_VIEW, 'dm', {
          dm: await (this.someone instanceof User
            ? this.someone.createDM()
            : this.someone.user?.createDM()),
        });
      });
      // this.addAction(item);
      this.items.set('INVITE_TO_SERVER', item);
    }
    this.items.set('LAST_SEPARATOR', this.addSeparator());
    {
      const item = new QAction();
      item.setText(__('COPY_ID'));
      item.addEventListener('triggered', async () => {
        if (!this.someone) return;
        clipboard.setText(this.someone.id, QClipboardMode.Clipboard);
      });
      this.addAction(item);
      this.items.set('COPY_ID', item);
    }
  }

  private updateVisibility() {
    this.items.get('MENTION')?.setProperty('visible', this.someone instanceof GuildMember);
    this.items.get('PROFILE')?.setProperty('visible', this.someone instanceof User);
    this.items.get('CHANGE_NICKNAME')?.setProperty('visible',
      !!app.client.user
      && this.someone instanceof GuildMember
      && (
        this.someone.user === app.client.user
        || (this.someone.guild.member(app.client.user)?.hasPermission('CHANGE_NICKNAME') ?? false)
        || (this.someone.guild.member(app.client.user)?.hasPermission('MANAGE_NICKNAMES') ?? false)
      ));
    if (this.someone) {
      const settings = app.config.userVolumeSettings[this.someone.id];
      this.items.get('MUTE')?.setText(__((!settings || !settings.muted) ? 'MUTE' : 'UNMUTE'));
      this.userVolSlider.setValue(settings ? settings.volume || 100 : 100);
    }
  }

  private popout(someone: User | GuildMember, point: QPoint) {
    this.point = point;
    this.someone = someone;
    this.updateVisibility();
    super.popup(point);
  }
}
