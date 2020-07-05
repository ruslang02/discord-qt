import './LoginWindow.scss';
import { QWidget, FlexLayout, QLabel, QTextEdit, QPushButton } from '@nodegui/nodegui';
import { Window } from '../Window/Window';
import { Application } from '../..';
import { RootWindow } from '../RootWindow/RootWindow';

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
    tokenField.setInlineStyle(`height: 30px`);
    tokenField.setAcceptRichText(false);
    this.root.layout?.addWidget(tokenField);

    const footer = new QWidget();
    footer.setLayout(new FlexLayout());
    footer.setObjectName("Footer");

    const okButton = new QPushButton();
    okButton.setText("Login");
    okButton.addEventListener('clicked', () => {
      console.log(tokenField.toPlainText());
      Application.Config.token = tokenField.toPlainText();
      (Application.GlobalWindow as RootWindow).loadClient();
    });

    const exitButton = new QPushButton();
    exitButton.setText("Exit");
    exitButton.setInlineStyle("left:10px;");
    exitButton.addEventListener('clicked', () => {
      process.exit(0);
    });

    footer.layout?.addWidget(okButton);
    footer.layout?.addWidget(exitButton);
    this.root.layout?.addWidget(footer);
  }
}