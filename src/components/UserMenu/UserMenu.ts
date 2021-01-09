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
import { app } from '../..';
import { Events } from '../../utilities/Events';
import { PhraseID } from '../../utilities/PhraseID';
import { __ } from '../../utilities/StringProvider';

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

    this.addEventListener(WidgetEventTypes.Close, () => app.config.save());
    app.on(Events.OPEN_USER_MENU, this.popout.bind(this));
  }

  /**
   * Add a clickable button to the user menu
   * @param id Translation ID, also used in this.items
   * @param callback Callback
   */
  private addSimpleItem(id: PhraseID, callback: () => void) {
    const item = new QAction();

    item.setText(__(id));
    item.addEventListener('triggered', callback);

    this.addAction(item);
    this.items.set(id, item);
  }

  private initItems() {
    const { updateUserVolume } = this;
    const { clipboard } = app;

    this.addSimpleItem('PROFILE', async () => {
      if (!this.someone || !this.point) {
        return;
      }

      app.emit(Events.OPEN_USER_PROFILE, this.someone.id, app.currentGuildId, this.point);
    });

    this.addSimpleItem('MENTION', async () => {
      if (!this.someone) {
        return;
      }

      app.emit(Events.MENTION_USER, this.someone.id);
    });

    this.addSimpleItem('SEND_DM', async () => {
      if (!this.someone) {
        return;
      }

      app.emit(Events.SWITCH_VIEW, 'dm', {
        dm: await (this.someone instanceof User
          ? this.someone.createDM()
          : this.someone.user?.createDM()),
      });
    });

    this.items.set('VOLUME_SEPARATOR', this.addSeparator());

    {
      // User volume slider
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
      this.userVolSlider.addEventListener('valueChanged', updateUserVolume);
      this.userVolSlider.addEventListener('sliderMoved', updateUserVolume);

      layout.addWidget(userVolLabel);
      layout.addWidget(this.userVolSlider);

      this.userVol.setLayout(layout);
    }

    this.items.set('GUILD_SEPARATOR', this.addSeparator());

    this.addSimpleItem('MUTE', async () => {
      if (!this.someone) {
        return;
      }

      const userVolumeSettings = app.config.get('userVolumeSettings');
      const settings = userVolumeSettings[this.someone.id];

      if (settings) {
        settings.muted = !settings.muted;
      } else {
        userVolumeSettings[this.someone.id] = {
          volume: 100,
          muted: true,
        };
      }

      await app.config.save();
      this.updateVisibility();
    });

    this.addSimpleItem('CHANGE_NICKNAME', async () => {
      if (!(this.someone instanceof GuildMember)) {
        return;
      }

      app.window.dialogs.nicknameChange.openForMember(this.someone);
    });

    this.addSimpleItem('INVITE_TO_SERVER', async () => {
      if (!this.someone) {
        return;
      }

      app.emit(Events.SWITCH_VIEW, 'dm', {
        dm: await (this.someone instanceof User
          ? this.someone.createDM()
          : this.someone.user?.createDM()),
      });
    });

    this.items.set('LAST_SEPARATOR', this.addSeparator());

    this.addSimpleItem('COPY_ID', async () => {
      if (!this.someone) {
        return;
      }

      clipboard.setText(this.someone.id, QClipboardMode.Clipboard);
    });
  }

  private updateUserVolume = () => {
    if (!this.someone) {
      return;
    }

    const userVolumeSettings = app.config.get('userVolumeSettings');
    const settings = userVolumeSettings[this.someone.id];

    if (settings) {
      settings.volume = this.userVolSlider.value();
    } else {
      userVolumeSettings[this.someone.id] = {
        volume: this.userVolSlider.value(),
        muted: false,
      };
    }

    this.userVolSlider.setProperty('toolTip', `${this.userVolSlider.value()}%`);
  };

  private updateVisibility() {
    this.items.get('MENTION')?.setProperty('visible', this.someone instanceof GuildMember);
    this.items.get('PROFILE')?.setProperty('visible', this.someone instanceof User);
    this.items.get('MESSAGE')?.setProperty('visible', this.someone !== app.client.user);
    this.items.get('INVITE_TO_SERVER')?.setProperty('visible', this.someone !== app.client.user);
    this.items.get('MUTE')?.setProperty('visible', this.someone !== app.client.user);
    this.items.get('USER_VOLUME')?.setProperty('visible', this.someone !== app.client.user);
    this.userVol.setProperty('visible', this.someone !== app.client.user);

    let canChangeNickname: boolean = false;

    if (app.client.user && this.someone instanceof GuildMember) {
      const userMember = this.someone.guild.member(app.client.user);

      if (this.someone.user === app.client.user && userMember?.hasPermission('CHANGE_NICKNAME')) {
        canChangeNickname = true;
      } else if (userMember?.hasPermission('MANAGE_NICKNAMES')) {
        canChangeNickname = true;
      }
    }

    this.items.get('CHANGE_NICKNAME')?.setProperty('visible', canChangeNickname);

    if (this.someone) {
      const settings = app.config.get('userVolumeSettings')[this.someone.id];

      this.items.get('MUTE')?.setText(__(!settings || !settings.muted ? 'MUTE' : 'UNMUTE'));
      this.userVolSlider.setValue(settings ? settings.volume || 100 : 100);
      this.userVolSlider.setProperty('toolTip', `${this.userVolSlider.value()}%`);
    }
  }

  private popout(someone: User | GuildMember, point: QPoint) {
    this.point = point;
    this.someone = someone;
    this.updateVisibility();
    super.popup(point);
  }
}
