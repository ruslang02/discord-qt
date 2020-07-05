import './RootWindow.scss';
import { QWidget, FlexLayout } from '@nodegui/nodegui';
import { Window } from '../Window/Window';
import { Application } from '../..';
import { Client } from 'eris';
import { LoginWindow } from '../LoginWindow/LoginWindow';
import { GuildsList } from '../../components/GuildsList/GuildsList';

export class RootWindow extends Window {
  private root: QWidget;

  constructor() {
    super();
    this.root = new QWidget();

    this.initializeWindow();
    this.loadClient().then(result => {
      if (!result)
        ((global as any).loginWindow = new LoginWindow()).show();
    })
    this.loadControls();
  }

  protected initializeWindow() {
    this.setWindowTitle("Discord-Qt");
    this.root.setLayout(new FlexLayout());
    this.root.setObjectName("Root");
    this.setObjectName("RootWindow");
    this.setMinimumSize(400, 400);
    this.setCentralWidget(this.root);
  }

  protected loadControls() {
    const guildsList = new GuildsList();
    this.root.layout?.addWidget(guildsList);
  }

  public loadClient(): Promise<boolean> {
    let client: Client = Application.Client = new Client(Application.Config.token || 's');
    return new Promise((resolve) => {
      try {
        client.on('error', ex => {
          console.error('[error]', ex.message);
          if (ex.message.includes("Invalid token"))
            resolve(false);
          clearInterval(timer);
        });
        const timer = setInterval(() => {
          if (!!client.user)
            resolve(true);
          clearInterval(timer);
        }, 100);
        client.on('warn', console.warn.bind(this, '[warn]'));
        client.on('debug', (call) => {
          try {
            const { op } = JSON.parse(call);
            if(op === 12)
              resolve(true);
          } catch {
            console.debug.bind(this, '[debug]');
          }
        });
        client.connect();
      } catch {
        resolve(false);
      }
    }).then(result => {
      if (result)
        this.setWindowTitle(`Discord-Qt • ${client.user.username}#${client.user.discriminator})`);
      else this.setWindowTitle(`Discord-Qt • Not logged in`);
    }) as Promise<boolean>;
  }
}