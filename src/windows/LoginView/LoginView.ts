import './LoginView.scss';
import { QWidget, FlexLayout, QLabel, QTextEdit, QPushButton } from '@nodegui/nodegui';
import { Window } from '../Window/Window';
import { Application } from '../..';
import { RootWindow } from '../RootWindow/RootWindow';

export class LoginView extends QWidget {
  constructor() {
    super();

    this.initializeView();
    this.loadControls();
  }

  protected initializeView() {
    this.setObjectName("LoginView");
    this.setLayout(new FlexLayout());
  }

  protected loadControls() {
    const infoLabel = new QLabel();
    infoLabel.setObjectName("InfoLabel")
    infoLabel.setText("Welcome to Discord-Qt!\r\n\r\nIn order to start using this Discord client you need to provide your user token in the field below.");
    this.layout?.addWidget(infoLabel);

    const tokenField = new QTextEdit();
    tokenField.setPlaceholderText("Nvfsdfds...");
    tokenField.setInlineStyle(`height: 30px`);
    tokenField.setAcceptRichText(false);
    this.layout?.addWidget(tokenField);

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
    this.layout?.addWidget(footer);
  }
}