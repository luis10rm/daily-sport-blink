export const POSITIVE_QUOTES: string[] = [
  "Dziś świat zrobił krok w dobrą stronę.",
  "Dobre wiadomości też są prawdziwe.",
  "Zwolnij — coś dobrego chce zostać zauważone.",
  "Mała dobra rzecz to nadal dobra rzecz.",
  "Nadzieja to nie naiwność. To decyzja.",
  "Codziennie ktoś ratuje czyjś dzień.",
  "Świat jest lepszy, niż mówią nagłówki.",
  "Uśmiech to najkrótsza droga między dwoma osobami.",
  "Dobro robi się małymi ruchami.",
  "Ktoś dziś dokonał czegoś odważnego. Zaraz przeczytasz o kim.",
  "Nie wszystko musi być kryzysem.",
  "Życzliwość jest zaraźliwa — puść ją dalej.",
  "Warto szukać dobrych wiadomości. Właśnie znalazłeś.",
  "Coś pięknego wydarzyło się, gdy nie patrzyłeś.",
  "Świat składa się też z tych, którzy pomagają.",
  "Postęp bywa cichy. My go słyszymy.",
  "Za każdym dobrym newsem stoi konkretny człowiek.",
  "Optymizm to trening, nie talent.",
  "Miej dobry dzień. Serio, spróbuj.",
  "Coś, co dziś przeczytasz, może zmienić czyjś tydzień.",
];

// Deterministic string hash (djb2 variant) so the same date returns the same quote across visits.
const hashString = (s: string): number => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

export const getQuoteOfDay = (date: Date = new Date()): string => {
  const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  return POSITIVE_QUOTES[hashString(key) % POSITIVE_QUOTES.length];
};

export const getGreeting = (date: Date = new Date()): string => {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "Dzień dobry ☀️";
  if (h >= 12 && h < 18) return "Miłego popołudnia 🌿";
  if (h >= 18 && h < 23) return "Dobry wieczór ✨";
  return "Dobrej nocy 🌙";
};
