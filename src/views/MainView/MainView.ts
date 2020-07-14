import { QStackedWidget } from "@nodegui/nodegui";
import { GuildView } from "../GuildView/GuildView";
import { DMView } from "../DMView/DMView";
import './MainView.scss';

export class MainView extends QStackedWidget {
  private guildView = new GuildView();
  private dmView = new DMView();

  constructor() {
    super();

    this.initView();
  }

  private initView() {
    const { guildView, dmView } = this;
    [guildView, dmView]
      .forEach(w => this.addWidget(w));
    this.setCurrentWidget(dmView);
  }
}