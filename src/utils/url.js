/**
 * Les petites choses qu'on fait a une URL avant de la donner a une iframe.
 *
 * Une application externe recoit son contexte par l'URL (token, API, langue, theme). Oublier un
 * parametre dans la configuration d'une application ne produit aucune erreur : l'application
 * s'ouvre, simplement sans le contexte — c'est ainsi qu'un theme sombre reste clair sans que rien
 * ne le signale.
 */

/**
 * Ajoute un parametre a une URL, en respectant ce qu'elle porte deja.
 *
 * Le parametre va avant le fragment : `./cerebro/#!/overview?host=x` + `theme=dark` donne
 * `./cerebro/?theme=dark#!/overview?host=x`, et non `…?host=x&theme=dark` qui atterrirait dans le
 * fragment et ne serait lu par personne.
 */
export function appendQueryParam(url, name, value) {
  if (url == undefined || url === "") return url;

  const text = String(url);
  const hashAt = text.indexOf("#");
  const beforeHash = hashAt >= 0 ? text.slice(0, hashAt) : text;
  const fragment = hashAt >= 0 ? text.slice(hashAt) : "";

  // Deja present ? On ne touche a rien : la configuration fait foi.
  const already = new RegExp("[?&]" + name + "=").test(beforeHash);
  if (already) return text;

  const separator = beforeHash.indexOf("?") >= 0 ? "&" : "?";
  return beforeHash + separator + name + "=" + value + fragment;
}
