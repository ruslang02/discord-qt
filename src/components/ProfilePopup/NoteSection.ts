import {
  Direction,
  QBoxLayout,
  QLabel,
  QTextEdit,
  QWidget,
  ScrollBarPolicy,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { User } from 'discord.js';
import { __ } from '../../utilities/StringProvider';
import { MAX_QSIZE } from '../..';

export class NoteSection extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  private noteLabel = new QLabel(this);

  private noteContent = new QTextEdit(this);

  private user?: User;

  constructor(parent?: any) {
    super(parent);
    this.initComponent();
    this.setObjectName('NoteSection');
  }

  private initComponent() {
    const { layout, noteLabel, noteContent } = this;

    layout.setContentsMargins(16, 8, 16, 16);
    layout.setSpacing(4);
    this.setLayout(layout);

    noteLabel.setText(__('NOTE'));
    noteLabel.setObjectName('SectionHeader');

    noteContent.setPlaceholderText(__('NOTE_PLACEHOLDER'));
    noteContent.setObjectName('NoteContent');
    noteContent.setMinimumSize(0, 36);
    noteContent.setMaximumSize(MAX_QSIZE, 36);
    noteContent.setVerticalScrollBarPolicy(ScrollBarPolicy.ScrollBarAlwaysOff);
    noteContent.addEventListener(WidgetEventTypes.FocusOut, () => {
      const note = noteContent.toPlainText();

      if (this.user && this.user.note !== note) {
        this.user.setNote(note);
      }
    });

    layout.addWidget(noteLabel);
    layout.addWidget(noteContent, 1);
  }

  loadNote(user: User) {
    this.user = user;
    this.noteContent.setText(user.note || '');
  }
}
