import { QWidget } from "@nodegui/nodegui";
import './Page.scss';

export abstract class Page extends QWidget {
  abstract title: string;
}