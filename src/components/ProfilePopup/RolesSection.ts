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
import { __ } from '../../utilities/StringProvider';
import { MAX_QSIZE } from '../..';

export class RolesSection extends QWidget {
  layout = new QBoxLayout(Direction.TopToBottom);

  private label = new QLabel(this);

  private topRole = new QWidget(this);

  private topRoleCircle = new QWidget(this);

  private topRoleLabel = new QLabel(this);

  private rolesList = new QListWidget(this);

  constructor(parent?: any) {
    super(parent);
    this.initComponent();
    this.setObjectName('RolesSection');
  }

  private initComponent() {
    const { label, rolesList, topRole, layout, topRoleCircle, topRoleLabel } = this;

    layout.setContentsMargins(16, 8, 16, 8);
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
    const mainRolesLayout = new QBoxLayout(Direction.LeftToRight);
    const topRoleLayout = new QBoxLayout(Direction.LeftToRight);

    topRole.setObjectName('RoleBadge');
    topRole.setMinimumSize(0, 22);
    topRole.setMaximumSize(MAX_QSIZE, 22);
    topRole.setLayout(topRoleLayout);
    topRoleLayout.setContentsMargins(5, 2, 9, 2);
    topRoleLayout.setSpacing(4);
    topRoleLayout.addWidget(topRoleCircle);
    topRoleLayout.addWidget(topRoleLabel, 1);
    topRoleCircle.setFixedSize(12, 12);
    topRoleCircle.setObjectName('Circle');
    topRoleLabel.setObjectName('RoleName');
    mainRolesLayout.addWidget(topRole);
    mainRolesLayout.addStretch(1);
    layout.addWidget(label);
    layout.addLayout(mainRolesLayout);
    layout.addWidget(rolesList);
    rolesList.hide();
    this.setLayout(layout);
  }

  private isOpened = false;

  setOpened(value: boolean) {
    const { label, rolesList } = this;

    if (label.text() === __('NO_ROLES') && value !== false) {
      return;
    }

    label.setText(`${__('ROLES')}&nbsp;<font size=2>${value ? '▲' : '▼'}</font>`);

    if (value) {
      rolesList.show();
    } else {
      rolesList.hide();
    }

    this.isOpened = value;
  }

  loadRoles(roles: GuildMemberRoleManager | undefined) {
    const { label, rolesList, topRole, topRoleCircle, topRoleLabel } = this;

    if (roles) {
      this.show();
    } else {
      label.setText(__('NO_ROLES'));
      this.hide();
    }

    this.setOpened(false);
    rolesList.clear();

    if (!roles) {
      return;
    }

    if (roles.highest.name !== '@everyone') {
      topRoleCircle.setInlineStyle(`background-color: ${roles.highest.hexColor};`);
      topRoleLabel.setText(roles.highest.name);
      topRole.setInlineStyle(`border-color: ${roles.highest.hexColor}`);
      topRole.show();
    } else {
      topRole.hide();
    }

    roles.cache
      .array()
      .sort((a, b) => a.position - b.position)
      .forEach((a) => {
        if (a.name === '@everyone') {
          return;
        }

        const item = new QListWidgetItem(a.name);

        rolesList.addItem(item);
      });
  }
}
