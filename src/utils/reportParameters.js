/**
 * Les valeurs proposees pour les parametres d'un rapport.
 *
 * Les deux ecrans de rapport (`ReportGenerator` et `ReportPeriodicEditor`) portaient la meme
 * methode `getESValues`, recopiee a l'identique : elle construit la requete d'agregation qui liste
 * les valeurs distinctes d'un champ, la lance, et remplit la liste deroulante du parametre. Cent dix
 * lignes chacune, dans des composants a 0 % de couverture, pour un code qui ne touche ni au DOM ni a
 * Vue — sauf l'appel `axios`, reste dans les composants.
 */

/**
 * La requete d'agregation des valeurs distinctes d'un champ.
 *
 * `par` est la definition du parametre : `escomboindex` / `escombokey`, et selon les cas un champ de
 * temps (`usetimestamp`, `timestampfield`) et un champ booleen (`useboolean`, `booleanfield`).
 * `interval` (une periode choisie) et `fixdate` (une date fixe) bornent la recherche ; la date fixe
 * l'emporte quand les deux sont demandees.
 *
 * La fin de journee est poussee a 23:59:59.999 : sans cela, un rapport du jour meme raterait tout ce
 * qui s'est passe apres minuit.
 */
export function buildParameterValuesQuery({
  par,
  interval = false,
  fixdate = false,
  intervalValue = null,
  fixdateValue = null,
} = {}) {
  const query = {
    size: 0,
    aggs: {
      values_uniques: {
        terms: {
          field: par.escombokey,
          size: 10000,
        },
      },
    },
  };

  if (par.usetimestamp && interval && intervalValue) {
    query.query = {
      bool: {
        must: [
          {
            range: {
              [par.timestampfield]: {
                gte: intervalValue.start.toISOString(),
                lte: new Date(intervalValue.end.setHours(23, 59, 59, 999)).toISOString(),
              },
            },
          },
        ],
      },
    };
  }

  if (par.usetimestamp && fixdate && fixdateValue) {
    query.query = {
      bool: {
        must: [
          {
            range: {
              [par.timestampfield]: {
                gte: fixdateValue.toISOString(),
                lte: new Date(fixdateValue.setHours(23, 59, 59, 999)).toISOString(),
              },
            },
          },
        ],
      },
    };
  }

  if (par.useboolean) {
    if (par.usetimestamp) {
      // La clause de temps occupe deja `must[0]` : le booleen la complete.
      if (query.query && query.query.bool) {
        query.query.bool.must[1] = { term: { [par.booleanfield]: true } };
      }
    } else {
      query.query = {
        bool: {
          must: [{ term: { [par.booleanfield]: true } }],
        },
      };
    }
  }

  return query;
}

/** L'URL de recherche generique pour un index, la meme que celle des tableaux. */
export function parameterValuesUrl({ apiurl = "", token, index }) {
  return apiurl + "generic_search/" + index + "?token=" + token;
}

/**
 * Les valeurs distinctes rendues par Elasticsearch, triees.
 *
 * Une reponse sans agregation rend une liste vide plutot qu'une exception : un index vide ou un
 * champ absent ne doivent pas empecher le formulaire de s'ouvrir.
 */
export function valuesFromBuckets(responseData) {
  const buckets =
    responseData &&
    responseData.aggs &&
    responseData.aggs.values_uniques &&
    responseData.aggs.values_uniques.buckets;

  if (!buckets) return [];

  return buckets.map((bucket) => bucket.key).sort();
}

/** Les parametres que l'ecran affiche : un parametre `hidden` n'est pas une question a poser. */
export function visibleParameters(parameters) {
  return (parameters || []).filter((parameter) => !parameter.hidden);
}

/**
 * Les bornes d'un raccourci de periode (`Aujourd'hui`, `7 derniers jours`, ...).
 *
 * `today` part de minuit et va jusqu'a minuit du lendemain ; les autres reculent de N jours depuis
 * maintenant. Le `now` est un parametre pour que les tests n'aient pas d'horloge a simuler.
 */
export function rangeShortcut(shortcut, now = new Date()) {
  if (shortcut === "today") {
    const start = new Date(now.getTime());
    start.setHours(0, 0, 0, 0);

    const end = new Date(start.getTime());
    end.setDate(end.getDate() + 1);

    return [start, end];
  }

  const days = { "1d": 1, "7d": 7, "30d": 30, "90d": 90 }[shortcut] || 0;
  return [new Date(now.getTime() - 3600 * 1000 * 24 * days), new Date(now.getTime())];
}
