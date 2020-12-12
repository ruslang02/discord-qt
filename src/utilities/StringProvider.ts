import { __ } from 'i18n';
import { PhraseID } from './PhraseID';

const translate = (id: PhraseID, ...args: any[]) => __(id, ...args);

export { translate as __ };
