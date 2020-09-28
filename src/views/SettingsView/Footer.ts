import {
  CursorShape, Direction, QBoxLayout, QLabel, QSize, QWidget, TextInteractionFlag,
} from '@nodegui/nodegui';
import open from 'open';
import { join } from 'path';
import { app } from '../..';
import { DIconButton } from '../../components/DIconButton/DIconButton';

export class Footer extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  constructor() {
    super();

    this.setLayout(this.layout);
    this.initComponent();
  }

  private async initComponent() {
    const github = new DIconButton({
      iconPath: join(__dirname, './assets/icons/github.png'),
      iconQSize: new QSize(24, 24),
      tooltipText: 'GitHub',
    });
    github.setFixedSize(24, 24);
    const label = new QLabel();
    const me = await import('../../../package.json') as { version: string; repository: { url: string; }; };
    github.addEventListener('clicked', () => open(me.repository.url));
    // @ts-ignore
    label.setText(`${app.name} ${me.version}${__BUILDNUM__ !== 0 ? ` (build ${__BUILDNUM__})` : ''}<br>node ${process.versions.node}<br>qode ${process.versions.qode}<br>${process.platform} ${process.arch}`);
    label.setOpenExternalLinks(true);
    label.setObjectName('Footer');
    label.setTextInteractionFlags(TextInteractionFlag.TextBrowserInteraction);
    label.setCursor(CursorShape.IBeamCursor);
    this.layout.addWidget(github);
    this.layout.addWidget(label, 1);
  }
}
