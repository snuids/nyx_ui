/**
 * The URL of a Kibana dashboard, as an application's configuration screen writes it into
 * `config.url`.
 *
 * The construction was in two `ConfigDetails` methods, with `rison` to encode the panels and a
 * chain of concatenations hard to follow: the period and the refresh in `_g`, the description and
 * the options in `_a`, then the panels and the search. No branch was testable without mounting
 * the screen and building a complete Kibana dashboard.
 *
 * Here it is a pure function: it is given the dashboard object (the one Kibana returns) and what
 * the form chose, it returns the path. `ConfigDetails` keeps the assignment to `curConfig` and
 * the view refresh.
 */

import rison from "rison";

/** The default period of a dashboard, when the form has not chosen one yet. */
export const DEFAULT_KIBANA_TIME = "from:now-7d,mode:quick,to:now";

/**
 * The dashboard's `#/dashboard/<id>?...`.
 *
 * Returns `{ path, kibanaTime }`: `kibanaTime` is the period actually kept, which the component
 * copies back into the configuration (otherwise the form would show an empty field next time).
 */
export function kibanaDashboardPath({
  dash,
  kibanaTime,
  timeRefresh = false,
  timeRefreshValue = null,
}) {
  const resolvedTime =
    kibanaTime != undefined && kibanaTime !== null ? kibanaTime : DEFAULT_KIBANA_TIME;

  // The refresh is written only when the box is ticked and a duration is chosen.
  let strRefresh = "refreshInterval:(pause:!t,value:0)";
  if (timeRefresh && timeRefreshValue != null) {
    strRefresh = "refreshInterval:(pause:!f,value:" + timeRefreshValue + ")";
  }

  let path = "/dashboard/" + dash.id;
  path += "?embed=true&_g=(" + strRefresh + ",time:(" + resolvedTime + "))";
  path += "&_a=(description:'" + dash.attributes.description + "'";
  path += ",filters:!(),fullScreenMode:!f";

  // The dashboard's options are JSON: Kibana's `_a` format wants `!t`/`!f`.
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

  // The panels. In 7.0.0 the `panelRefName`s point to `references`: without that resolution the
  // panels point at nothing and the dashboard opens empty.
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

  // The dashboard's search, otherwise the default free-text search.
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
 * The full URL: the installation's Kibana base, the space, and the dashboard path.
 *
 * The Nyx instance goes through `kibanyx` and not `kibana` — that is the base configured in the
 * store, and the replacement is done here so that the caller has only one string to pass.
 */
export function kibanaAppUrl({ dash, baseUrl = "", dashboardPath = "" }) {
  const space = dash.space !== "default" ? "s/" + dash.space : "";
  return "." + String(baseUrl).replace("kibana", "kibananyx") + space + "/app/kibana#" + dashboardPath;
}
