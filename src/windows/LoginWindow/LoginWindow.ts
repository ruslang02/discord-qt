import './LoginWindow.scss';
import fs from 'fs';
import path = require("path");
import { QWidget, FlexLayout, QMainWindow, QIcon } from '@nodegui/nodegui';
import { Window } from '../Window/Window';

export class LoginWindow extends Window {
  constructor() {
    super();

    this.initializeComponents();
  }

  protected initializeComponents() {
    this.setWindowTitle("Discord-Qt");
    this.setLayout(new FlexLayout());
    this.setObjectName("LoginWindow");
    this.setMinimumSize(400, 400);
  }
}