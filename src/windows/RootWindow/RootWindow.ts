import './RootWindow.scss';
import fs from 'fs';
import path = require("path");
import { QWidget, FlexLayout, QMainWindow, QIcon } from '@nodegui/nodegui';
import { Window } from '../Window/Window';
import { Application } from '../..';
import Eris, { Client } from 'eris';
import { LoginWindow } from '../LoginWindow/LoginWindow';

export class RootWindow extends Window {
  constructor() {
    super();
    this.initializeWindow();
    this.loadClient()
  }

  protected initializeWindow() {
    this.setWindowTitle("Discord-Qt");
    this.setLayout(new FlexLayout());
    this.setObjectName("RootWindow");
    this.setMinimumSize(400, 400);
  }

  protected loadClient() {
    const client = Application.Client = new Client(Application.Config.token || '');
    client.connect().then(() => {
      this.setWindowTitle(`Discord-Qt (logged in as ${client.user.username})`);
    }).catch(() => {
      this.setWindowTitle(`Discord-Qt (failed to log in)`);
      ((global as any).loginWindow = new LoginWindow()).show();
    });
  }
}