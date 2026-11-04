// utils/dateUtils.ts

export function calcolaGiorniMancanti(dataScadenzaStringa: string): string {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  const scadenza = new Date(dataScadenzaStringa);
  scadenza.setHours(0, 0, 0, 0);

  const differenzaMs = scadenza.getTime() - oggi.getTime();
  const giorniMancanti = Math.ceil(differenzaMs / (1000 * 60 * 60 * 24));

  if (giorniMancanti < 0) {
    return `Scaduta da ${Math.abs(giorniMancanti)} giorni`;
  } else if (giorniMancanti === 0) {
    return "Scade oggi!";
  } else {
    return `Mancano ${giorniMancanti} giorni`;
  }
}