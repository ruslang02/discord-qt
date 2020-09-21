import {
  CursorShape,
  Direction,
  QBoxLayout,
  QLabel,
  QListWidget,
  QListWidgetItem,
  QWidget,
  Shape,
  WidgetEventTypes,
} from '@nodegui/nodegui';
import { GuildMemberRoleManager } from 'discord.js';
import { __ } from 'i18n';
import { MAX_QSIZE } from '../..';

export class RolesSection extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  private label = new QLabel(this);

  private topRole = new QLabel(this);

  private rolesList = new QListWidget(this);

  constructor(parent?: any) {
    super(parent);
    this.initComponent();
    this.setObjectName('RolesSection');
  }

  private initComponent() {
    const {
      label, rolesList, topRole, layout,
    } = this;
    layout.setContentsMargins(16, 16, 16, 16);
    layout.setSpacing(8);
    label.setObjectName('SectionHeader');
    label.setCursor(CursorShape.PointingHandCursor);
    label.addEventListener(WidgetEventTypes.MouseButtonPress, () => {
      this.setOpened(!this.isOpened);
    });
    rolesList.setObjectName('RolesList');
    rolesList.setMaximumSize(MAX_QSIZE, 150);
    rolesList.setFrameShape(Shape.NoFrame);
    rolesList.setVerticalScrollMode(1);

    topRole.setObjectName('RoleBadge');
    topRole.setMinimumSize(0, 22);
    topRole.setMaximumSize(MAX_QSIZE, 22);
    layout.addWidget(label);
    layout.addWidget(topRole);
    layout.addWidget(rolesList);
    rolesList.hide();
    this.setLayout(layout);
  }

  private isOpened = false;

  setOpened(value: boolean) {
    const { label, rolesList } = this;
    if (label.text() === __('NO_ROLES') && value !== false) return;
    label.setText(`${__('ROLES')}&nbsp;<font size=2>${value ? '▲' : '▼'}</font>`);
    if (value) rolesList.show(); else rolesList.hide();
    this.isOpened = value;
  }

  loadRoles(roles: GuildMemberRoleManager | undefined) {
    const { label, rolesList, topRole } = this;
    if (roles) this.show(); else {
      label.setText(__('NO_ROLES'));
      this.hide();
    }
    this.setOpened(false);
    rolesList.clear();
    if (!roles) return;

    if (roles.highest.name !== '@everyone') {
      topRole.setText(`<font color='${roles.highest.hexColor}'>⬤</font>&nbsp;&nbsp;${roles.highest.name}`);
      topRole.setMaximumSize(MAX_QSIZE, 22);
      topRole.setInlineStyle(`border-color: ${roles.highest.hexColor}`);
      topRole.show();
    } else topRole.hide();
    roles.cache.array().sort((a, b) => a.position - b.position).forEach((a) => {
      if (a.name === '@everyone') return;
      const item = new QListWidgetItem(a.name);
      rolesList.addItem(item);
    });
  }
}
