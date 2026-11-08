/**
 * L'URL d'un tableau de bord Kibana, telle que l'ecran de configuration d'une application l'ecrit
 * dans `config.url`.
 *
 * La construction etait en deux methodes de `ConfigDetails`, avec `rison` pour encoder les panneaux
 * et un enchainement de concatenations difficiles a suivre : la periode et le rafraichissement dans
 * `_g`, la description et les options dans `_a`, puis les panneaux et la recherche. Aucune branche
 * n'etait testable sans monter l'ecran et fabriquer un tableau de bord Kibana complet.
 *
 * Ici c'est une fonction pure : on lui donne l'objet du tableau de bord (celui que Kibana rend) et
 * ce que le formulaire a choisi, elle rend le chemin. `ConfigDetails` garde l'affectation a
 * `curConfig` et le rafraichissement de la vue.
 */

import rison from "rison";

/** La periode par defaut d'un tableau de bord, quand le formulaire n'en a pas encore choisi. */
export const DEFAULT_KIBANA_TIME = "from:now-7d,mode:quick,to:now";

/**
 * Le `#/dashboard/<id>?...` du tableau de bord.
 *
 * Rend `{ path, kibanaTime }` : `kibanaTime` est la periode effectivement retenue, que le composant
 * recopie dans la configuration (sinon le formulaire afficherait un champ vide la fois suivante).
 */
export function kibanaDashboardPath({
  dash,
  kibanaTime,
  timeRefresh = false,
  timeRefreshValue = null,
}) {
  const resolvedTime =
    kibanaTime != undefined && kibanaTime !== null ? kibanaTime : DEFAULT_KIBANA_TIME;

  // Le rafraichissement n'est ecrit que si la case est cochee et qu'une duree est choisie.
  let strRefresh = "refreshInterval:(pause:!t,value:0)";
  if (timeRefresh && timeRefreshValue != null) {
    strRefresh = "refreshInterval:(pause:!f,value:" + timeRefreshValue + ")";
  }

  let path = "/dashboard/" + dash.id;
  path += "?embed=true&_g=(" + strRefresh + ",time:(" + resolvedTime + "))";
  path += "&_a=(description:'" + dash.attributes.description + "'";
  path += ",filters:!(),fullScreenMode:!f";

  // Les options du tableau de bord sont du JSON : le format `_a` de Kibana veut `!t`/`!f`.
  if (dash.attributes.optionsJSON != undefined) {
    const options = JSON.parse(dash.attributes.optionsJSON);
    const urloptions = Object.entries(options)
      .map((entry) => entry.join(":"))
      .join(",")
      .replace(/true/g, "!t")
      .replace(/false/g, "!f");
    path += ",options:(" + urloptions + ")";
  } else {
    path += ",options:()";
  }

  // Les panneaux. En 7.0.0 les `panelRefName` renvoient a `references` : sans cette resolution, les
  // panneaux pointent dans le vide et le tableau de bord s'ouvre vide.
  const panels = [];
  const panelsJSON = JSON.parse(dash.attributes.panelsJSON);

  for (const panelKey in panelsJSON) {
    const isSeven = dash.migrationVersion != null && dash.migrationVersion.dashboard === "7.0.0";
    if (isSeven) {
      for (const referenceIndex in dash.references) {
        if (dash.references[referenceIndex].name == panelsJSON[panelKey].panelRefName) {
          panelsJSON[panelKey].id = dash.references[panelKey].id;
          panelsJSON[panelKey].type = dash.references[panelKey].type;
        }
      }
    }
    panels.push("" + rison.encode(panelsJSON[panelKey]));
  }

  const panelList = panels
    .join(",")
    .replace(/#/g, "%23")
    .replace(/&/g, "%26");

  path += ",panels:!(" + panelList + ")";

  // La recherche du tableau de bord, sinon la recherche libre par defaut.
  let querybag = "query:(language:lucene,query:'*')";
  const meta = dash.attributes.kibanaSavedObjectMeta;
  if (meta != undefined && meta.searchSourceJSON != undefined) {
    const searchSource = JSON.parse(meta.searchSourceJSON);
    if (searchSource.query != undefined) {
      querybag = "query:" + rison.encode(searchSource.query);
    }
  }

  path += "," + querybag + ",timeRestore:!f,title:Test,viewMode:view)";

  return { path, kibanaTime: resolvedTime };
}

/**
 * L'URL complete : la base Kibana de l'installation, l'espace, et le chemin du tableau de bord.
 *
 * L'instance Nyx passe par `kibananyx` et non `kibana` — c'est la base configuree dans le store, et
 * le remplacement est fait ici pour que l'appelant n'ait qu'une chaine a passer.
 */
export function kibanaAppUrl({ dash, baseUrl = "", dashboardPath = "" }) {
  const space = dash.space !== "default" ? "s/" + dash.space : "";
  return "." + String(baseUrl).replace("kibana", "kibananyx") + space + "/app/kibana#" + dashboardPath;
}
