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