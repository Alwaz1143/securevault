export type PasswordGeneratorOptions = {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
};

export const DEFAULT_PASSWORD_OPTIONS: PasswordGeneratorOptions = {
  length: 16,
  includeUppercase: true,
  includeLowercase: true,
  includeNumbers: true,
  includeSymbols: true,
};

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const NUMBERS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.<>/?";

function getSecureRandomInt(maxExclusive: number) {
  if (maxExclusive <= 0) {
    throw new Error("maxExclusive must be greater than 0");
  }

  const randomValues = new Uint32Array(1);
  const maxUint32 = 0x100000000;
  const limit = Math.floor(maxUint32 / maxExclusive) * maxExclusive;

  let randomValue: number;

  do {
    crypto.getRandomValues(randomValues);
    randomValue = randomValues[0];
  } while (randomValue >= limit);

  return randomValue % maxExclusive;
}

function getRandomChar(charset: string) {
  return charset[getSecureRandomInt(charset.length)];
}

function shuffleCharacters(characters: string[]) {
  for (let i = characters.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    [characters[i], characters[j]] = [characters[j], characters[i]];
  }

  return characters;
}

export function generatePassword(options: PasswordGeneratorOptions) {
  const enabledCharsets: string[] = [];

  if (options.includeUppercase) enabledCharsets.push(UPPERCASE);
  if (options.includeLowercase) enabledCharsets.push(LOWERCASE);
  if (options.includeNumbers) enabledCharsets.push(NUMBERS);
  if (options.includeSymbols) enabledCharsets.push(SYMBOLS);

  if (enabledCharsets.length === 0) {
    throw new Error("Select at least one character type.");
  }

  if (options.length < enabledCharsets.length) {
    throw new Error(
      `Password length must be at least ${enabledCharsets.length}.`
    );
  }

  const allCharacters = enabledCharsets.join("");

  const passwordCharacters: string[] = [];

  for (const charset of enabledCharsets) {
    passwordCharacters.push(getRandomChar(charset));
  }

  while (passwordCharacters.length < options.length) {
    passwordCharacters.push(getRandomChar(allCharacters));
  }

  return shuffleCharacters(passwordCharacters).join("");
}