/** Deja solo letras y números, en mayúsculas (los códigos y claves siempre van así). */
export const cleanCode = (v: string, max = 12) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, max);

/** Sugerencia de código a partir del nombre de la clase: «1A» → «KID1A». */
export const suggestCode = (name: string) => cleanCode(`KID${cleanCode(name)}`);

/** Sugerencia de clave: el grado, p. ej. «1A». */
export const suggestPassword = (name: string) => cleanCode(name, 8);

export const CODE_RULE = "El código debe tener entre 4 y 12 letras o números.";
