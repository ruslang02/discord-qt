import { QMainWindow, QIcon } from "@nodegui/nodegui";
import path from "path";
import fs from "fs";

export class Window extends QMainWindow {
  constructor() {
    super();
    this.loadIcon();
    this.loadStyles();
  }
  protected async loadStyles() {
    const stylesheet = await fs.promises.readFile(path.resolve(__dirname, "main.css"), "utf8");
    this.setStyleSheet(stylesheet);
  }
  protected loadIcon() {
    const icon = new QIcon(path.resolve(__dirname, "../assets/images/logo.png"));
    this.setWindowIcon(icon);
  }
}
