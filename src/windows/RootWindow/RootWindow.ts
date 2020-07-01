import './RootWindow.scss';
import fs from 'fs';
import path = require("path");
import { QWidget, FlexLayout, QMainWindow, QIcon } from '@nodegui/nodegui';
import { Window } from '../Window/Window';
import { Application } from '../..';
import { Client } from 'discord.js';

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
    Application.Client = new Client();
    Application.Client.login(Application.Config.token);
  }
}