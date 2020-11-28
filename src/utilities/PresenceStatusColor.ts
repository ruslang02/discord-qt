const { TARGET_COLOR_SPACE } = process.env;

const convertToBGR = TARGET_COLOR_SPACE === 'BGR';

export const PresenceStatusColor = new Map([
  ['online', convertToBGR ? '#81b543' : '#43b581'],
  ['dnd', convertToBGR ? '#4747f0' : '#f04747'],
  ['idle', convertToBGR ? '#1aa6fa' : '#faa61a'],
  ['offline', convertToBGR ? '#8d7f74' : '#747f8d'],
  ['invisible', convertToBGR ? '#8d7f74' : '#747f8d'],
]);
