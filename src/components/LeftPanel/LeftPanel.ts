import { Direction, QBoxLayout, QStackedWidget, QWidget } from '@nodegui/nodegui';
import { app, MAX_QSIZE } from '../..';
import { Events } from '../../utilities/Events';
import { DMPanel } from '../DMPanel/DMPanel';
import { GuildPanel } from '../GuildPanel/GuildPanel';
import { UserPanel } from '../UserPanel/UserPanel';
import { VoicePanel } from '../VoicePanel/VoicePanel';

export class LeftPanel extends QWidget {
  private container = new QStackedWidget();

  private guildPanel = new GuildPanel();

  private dmPanel = new DMPanel();

  private voicePanel = new VoicePanel();

  private userPanel = new UserPanel();

  private controls = new QBoxLayout(Direction.TopToBottom);

  constructor() {
    super();
    this.initLeftPanel();
    app.on(Events.SWITCH_VIEW, (view: string) => {
      switch (view) {
        case 'dm':
          this.container.setCurrentWidget(this.dmPanel);
          break;
        case 'guild':
          this.container.setCurrentWidget(this.guildPanel);
          break;
        default:
      }
    });
  }

  private initLeftPanel() {
    const { guildPanel, dmPanel, userPanel, voicePanel, container, controls } = this;
    this.setLayout(controls);
    this.setObjectName('LeftPanel');
    this.setMaximumSize(240, MAX_QSIZE);
    container.addWidget(guildPanel);
    container.addWidget(dmPanel);
    container.setCurrentWidget(dmPanel);
    container.setObjectName('Container');
    controls.setSpacing(0);
    controls.setContentsMargins(0, 0, 0, 0);
    controls.addWidget(container, 1);
    controls.addWidget(voicePanel, 0);
    controls.addWidget(userPanel, 0);
  }
}
