export function isURL(input: string): boolean {
  try {
    const uri = new URL(input);
    return !!uri.toString();
  } catch (e) {
    return false;
  }
}

export function getString(props: any, key = ''): string {
  if (!props) return '';
  if (key === '') return props.value.trim();
  if (props.value[key] === undefined) return '';
  if (typeof props.value[key].value === 'string') return props.value[key].value.trim();
  if (typeof props.value[key].value === 'object' && props.value[key].value.length !== 0) return props.value[key].value[0].toString().trim();
  return '';
}

export function getNumber(props: any, key = ''): number {
  if (!props) return 0;
  if (key === '') return Number(props.value);
  if (props.value[key] === undefined) return 0;
  if (typeof props.value[key].value !== 'object') return Number(props.value[key].value);
  if (props.value[key].value.length !== 0) return Number(props.value[key].value[0]);
  return 0;
}

export function ms2str(durationPs: number): string {
  const durationMs = durationPs / 1000;
  return `${Math.floor(durationMs / 60)}:${durationMs % 60 < 10 ? '0' : ''}${Math.floor(durationMs % 60)}`;
}
