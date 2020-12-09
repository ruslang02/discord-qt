import { __ as _i } from 'i18n';
import { PhraseID } from './PhraseID';

export function __(id: PhraseID, ...args: any[]) {
  return _i(id, ...args);
}
