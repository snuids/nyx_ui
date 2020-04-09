export function computeTranslatedText(inText, inLocale) {
    if (inText == undefined)
      return "";
    if (!(inText.startsWith("@") && inText.endsWith("@")))
      return inText;
    var res = inText.substring(1, inText.length - 1).split(";");
  
    var resht = {}
    res.forEach((x) => {
      var rec = x.split("=");
      if (rec.length > 0) {
        resht[rec[0]] = rec[1];
      }
    });
    if (resht[inLocale] != undefined)
      return resht[inLocale]
    return res;
  }

  export function extractURLParts(href) {
    var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)([\/]{0,1}[^?#]*)(\?[^#]*|)(#.*|)$/);
    return match && {
        href: href,
        protocol: match[1],
        host: match[2],
        hostname: match[3],
        port: match[4],
        pathname: match[5],
        search: match[6],
        hash: match[7]
    }
  }