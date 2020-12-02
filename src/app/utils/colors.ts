const colors = [
  '#01A8A7',
  '#26CDBF',
  '#FDFFF7',
  '#FF98A1',
  '#5C5C5C',
  '#192021',
  '#F6EEDA',
  '#C2B9AB',
  '#6E6E6E',
  '#6D6D6D',
  '#FCF1A5',
  '#0071AD',
  '#011524',
  '#A4D8A0',
  '#495967',
  '#412650',
  '#7958B5',
  '#EBDAED',
  '#FFAE01',
  '#E9E8AA',
  '#A2CC6D',
  '#F57B12'
];

export function getRandomColor() {
  return colors[Math.floor(Math.random() * colors.length)];
}
