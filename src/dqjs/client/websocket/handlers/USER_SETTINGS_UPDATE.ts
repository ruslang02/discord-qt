'use strict';

import { DQClient } from '../../Client';
import { Packet } from '../WebSocketManager';

export default function UserSettingsUpdateHandler(client: DQClient, packet: Packet) {
  client.user?.settings?._patch(packet.d);
  // @ts-ignore
  client.actions.UserSettingsUpdate.handle(packet.d);
};