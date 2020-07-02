import './LoginWindow.scss';
import fs from 'fs';
import path = require("path");
import { QWidget, FlexLayout, QMainWindow, QIcon, QLabel, QTextEdit, QBoxLayout, Direction, QPushButton, QGridLayout } from '@nodegui/nodegui';
import { Window } from '../Window/Window';

export class LoginWindow extends Window {
  private root: QWidget;

  constructor() {
    super();
    this.root = new QWidget();

    this.initializeWindow();
    this.loadControls();
  }

  protected initializeWindow() {
    this.setWindowTitle("Discord-Qt");
    this.setObjectName("LoginWindow");
    this.root.setLayout(new FlexLayout());
    this.root.setObjectName("Root");
    this.setCentralWidget(this.root);
  }

  protected loadControls() {
    const infoLabel = new QLabel();
    infoLabel.setObjectName("InfoLabel")
    infoLabel.setText("Welcome to Discord-Qt!\r\n\r\nIn order to start using this Discord client you need to provide your user token in the field below.");
    this.root.layout?.addWidget(infoLabel);

    const tokenField = new QTextEdit();
    tokenField.setPlaceholderText("Nvfsdfds...");
    this.root.layout?.addWidget(tokenField);

    const footer = new QWidget();
    footer.setLayout(new QGridLayout());
    footer.setObjectName("Footer");

    const okButton = new QPushButton();
    okButton.setText("Login");

    const exitButton = new QPushButton();
    exitButton.setText("Exit");
    exitButton.setInlineStyle("margin-right: 5px;");

    footer.layout?.addWidget(okButton);
    footer.layout?.addWidget(exitButton);
    this.root.layout?.addWidget(footer);
  }
}