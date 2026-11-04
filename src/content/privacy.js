/**
 * Data protection notice, displayed on /privacy.
 *
 * The text lives here rather than in the language files: it changes rarely, it is long, and
 * above all it must be reviewable by the person responsible for the processing without opening
 * a component. The values between « » are to be replaced by the actual legal details.
 *
 * All four languages of the platform are covered. A review of the Greek by a native speaker
 * remains desirable, as for any translated legal notice.
 */

const fr = {
  link: 'Confidentialité',
  defaults: {
    controller: '« raison sociale à compléter »',
    address: '« adresse à compléter »',
    contact: '« adresse de contact à compléter »',
  },
  title: 'Protection des données',
  updated: 'Dernière mise à jour : 4 novembre 2026',
  intro:
    "Cette page décrit les données personnelles que la plateforme NYX traite, pourquoi, " +
    "combien de temps, et comment exercer vos droits. Aucun consentement ne vous est demandé : " +
    "les traitements décrits ici sont nécessaires au service.",
  back: 'Retour',
  sections: [
    {
      h: 'Qui est responsable du traitement',
      p: "{controller}, {address}. Contact pour toute question relative aux données " +
         "personnelles : {contact}.",
    },
    {
      h: 'Quelles données sont traitées',
      p: "Votre compte : adresse e-mail, prénom, nom, langue d'affichage, privilèges, filtres " +
         "d'écran et, si le double facteur est activé, numéro de téléphone. Le mot de passe " +
         "n'est jamais conservé en clair : seule son empreinte (pbkdf2-sha256) est enregistrée, " +
         "et elle ne permet pas de le retrouver.",
    },
    {
      h: "Traces d'utilisation",
      p: "Chaque appel à l'interface est enregistré pendant sept jours : date, adresse appelée, " +
         "méthode, durée, compte, code d'erreur éventuel. L'empreinte du jeton de session y " +
         "figure, jamais le jeton lui-même. Les tentatives de connexion refusées sont " +
         "enregistrées pendant sept jours également, avec l'adresse essayée, l'adresse IP et le " +
         "navigateur : c'est ce qui permet de reconnaître une attaque par force brute et de " +
         "protéger votre compte.",
    },
    {
      h: 'Pourquoi ces données',
      p: "Fournir le service et authentifier les utilisateurs ; assurer la sécurité de la " +
         "plateforme (détection de force brute, diagnostic d'incident, mesure de disponibilité) ; " +
         "répondre aux demandes de support. Les journaux servent à diagnostiquer une panne ou une " +
         "utilisation anormale : ils ne sont pas exploités pour évaluer le travail individuel.",
    },
    {
      h: 'Sur quelle base légale',
      p: "Exécution du contrat ou de la mission pour le compte et son usage (article 6.1.b du " +
         "RGPD) ; intérêt légitime pour la sécurité et les journaux techniques (article 6.1.f). " +
         "Aucune donnée n'est utilisée à des fins publicitaires, ni vendue, ni utilisée pour un " +
         "profilage commercial.",
    },
    {
      h: 'Combien de temps',
      p: "Le compte : aussi longtemps qu'il est actif, puis trente jours avant suppression. Les " +
         "journaux d'appels et les tentatives de connexion refusées : sept jours, supprimés " +
         "automatiquement par une tâche planifiée. Les journaux d'exécution des rapports et les " +
         "rapports produits : quatre-vingt-dix jours, supprimés de la même façon. Les sauvegardes " +
         "du serveur : trente jours.",
    },
    {
      h: 'Cookies et stockage du navigateur',
      p: "Un cookie de session (HttpOnly, Secure) et son équivalent dans le stockage local du " +
         "navigateur gardent votre session ouverte. C'est tout : aucun cookie publicitaire, " +
         "aucune mesure d'audience, aucun script chargé depuis un domaine tiers. Ces éléments " +
         "étant strictement nécessaires au service que vous demandez, aucune bannière de " +
         "consentement ne s'affiche — elle n'aurait rien à vous faire choisir.",
    },
    {
      h: 'Qui y a accès',
      p: "Les administrateurs de la plateforme, pour l'exploitation et le support, et " +
         "l'hébergeur du serveur, situé dans l'Union européenne. Aucune communication à des " +
         "tiers à des fins commerciales, aucun transfert en dehors de l'Union européenne.",
    },
    {
      h: 'Vos droits',
      p: "Vous pouvez demander l'accès à vos données, leur rectification, leur effacement, la " +
         "limitation d'un traitement, vous y opposer et en demander la portabilité. Écrivez à " +
         "{contact}. Si la réponse ne vous satisfait pas, vous pouvez " +
         "introduire une réclamation auprès de l'Autorité de protection des données, rue de la " +
         "Presse 35, 1000 Bruxelles (autoriteprotectiondonnees.be).",
    },
  ],
};

const nl = {
  link: 'Privacy',
  defaults: {
    controller: '« rechtsvorm aan te vullen »',
    address: '« adres aan te vullen »',
    contact: '« contactadres aan te vullen »',
  },
  title: 'Gegevensbescherming',
  updated: 'Laatst bijgewerkt: 4 november 2026',
  intro:
    'Deze pagina beschrijft welke persoonsgegevens het NYX-platform verwerkt, waarom, hoe lang, ' +
    'en hoe u uw rechten uitoefent. Er wordt u geen toestemming gevraagd: de hier beschreven ' +
    'verwerkingen zijn noodzakelijk voor de dienst.',
  back: 'Terug',
  sections: [
    {
      h: 'Wie is verwerkingsverantwoordelijke',
      p: '{controller}, {address}. Contact voor vragen over persoonsgegevens: {contact}.',
    },
    {
      h: 'Welke gegevens',
      p: 'Uw account: e-mailadres, voornaam, naam, taal, rechten, schermfilters en, indien ' +
         'tweestapsverificatie actief is, telefoonnummer. Het wachtwoord wordt nooit in ' +
         'klare tekst bewaard: enkel de afdruk (pbkdf2-sha256) wordt opgeslagen en laat niet ' +
         'toe het wachtwoord te achterhalen.',
    },
    {
      h: 'Gebruikssporen',
      p: 'Elke oproep aan de interface wordt zeven dagen bewaard: datum, opgeroepen adres, ' +
         'methode, duur, account, eventuele foutcode. De afdruk van het sessietoken staat ' +
         'erin, nooit het token zelf. Geweigerde aanmeldingen worden ook zeven dagen bewaard, ' +
         'met het geprobeerde adres, het IP-adres en de browser: zo wordt een brute-force-aanval ' +
         'herkend en uw account beschermd.',
    },
    {
      h: 'Waarom',
      p: 'De dienst leveren en gebruikers authenticeren; de veiligheid van het platform ' +
         'verzekeren (detectie van brute force, incidentanalyse, beschikbaarheid); ' +
         'supportvragen behandelen. De logboeken dienen om een storing of abnormaal gebruik te ' +
         'diagnosticeren: ze worden niet gebruikt om individueel werk te beoordelen.',
    },
    {
      h: 'Rechtsgrond',
      p: 'Uitvoering van de overeenkomst of de opdracht voor het account en het gebruik ervan ' +
         '(artikel 6.1.b AVG); gerechtvaardigd belang voor veiligheid en technische logboeken ' +
         '(artikel 6.1.f). Geen enkel gegeven wordt gebruikt voor advertenties, verkocht of ' +
         'gebruikt voor commerciële profilering.',
    },
    {
      h: 'Hoe lang',
      p: 'Het account: zolang het actief is, daarna dertig dagen vóór verwijdering. Oproeplogboeken ' +
         'en geweigerde aanmeldingen: zeven dagen, automatisch verwijderd door een geplande ' +
         'taak. Uitvoeringslogboeken van rapporten en geproduceerde rapporten: negentig dagen, op ' +
         'dezelfde manier verwijderd. Serverback-ups: dertig dagen.',
    },
    {
      h: 'Cookies en browseropslag',
      p: 'Een sessiecookie (HttpOnly, Secure) en het equivalent in de lokale opslag van de ' +
         'browser houden uw sessie open. Meer niet: geen advertentiecookie, geen ' +
         'bezoekersmeting, geen script van een extern domein. Omdat die elementen strikt ' +
         'noodzakelijk zijn voor de gevraagde dienst, verschijnt er geen toestemmingsbanner — ' +
         'die zou u niets te kiezen geven.',
    },
    {
      h: 'Wie heeft toegang',
      p: 'De beheerders van het platform, voor exploitatie en support, en de hostingprovider, ' +
         'gevestigd in de Europese Unie. Geen mededeling aan derden voor commerciële doeleinden, ' +
         'geen doorgifte buiten de Europese Unie.',
    },
    {
      h: 'Uw rechten',
      p: 'U kunt inzage, rectificatie, wissing, beperking, verzet en overdraagbaarheid vragen. ' +
         'Schrijf naar {contact}. Bent u niet tevreden met het antwoord, dan ' +
         'kunt u een klacht indienen bij de Gegevensbeschermingsautoriteit, Drukpersstraat 35, ' +
         '1000 Brussel (gegevensbeschermingsautoriteit.be).',
    },
  ],
};

const en = {
  link: 'Privacy',
  defaults: {
    controller: '« company name to be completed »',
    address: '« address to be completed »',
    contact: '« contact address to be completed »',
  },
  title: 'Data protection',
  updated: 'Last updated: 4 November 2026',
  intro:
    'This page describes the personal data the NYX platform processes, why, for how long, and ' +
    'how to exercise your rights. No consent is requested: the processing described here is ' +
    'necessary for the service.',
  back: 'Back',
  sections: [
    {
      h: 'Who is the controller',
      p: '{controller}, {address}. Contact for any question about personal data: {contact}.',
    },
    {
      h: 'What data is processed',
      p: 'Your account: e-mail address, first name, last name, display language, privileges, ' +
         'screen filters and, if two-factor authentication is enabled, phone number. The ' +
         'password is never stored in clear: only its hash (pbkdf2-sha256) is kept, and it does ' +
         'not allow the password to be recovered.',
    },
    {
      h: 'Usage traces',
      p: 'Every call to the interface is recorded for seven days: date, address called, method, ' +
         'duration, account, error code if any. The session token fingerprint appears there, ' +
         'never the token itself. Rejected sign-in attempts are recorded for seven days as well, ' +
         'with the attempted address, the IP address and the browser: that is what makes a ' +
         'brute-force attack recognisable and protects your account.',
    },
    {
      h: 'Why',
      p: 'To provide the service and authenticate users; to keep the platform secure (brute-force ' +
         'detection, incident diagnosis, availability measurement); to answer support requests. ' +
         'The logs serve to diagnose an outage or abnormal use: they are not used to assess ' +
         'individual work.',
    },
    {
      h: 'Legal basis',
      p: 'Performance of the contract or assignment for the account and its use (Article 6.1.b ' +
         'GDPR); legitimate interest for security and technical logs (Article 6.1.f). No data is ' +
         'used for advertising, sold, or used for commercial profiling.',
    },
    {
      h: 'How long',
      p: 'The account: as long as it is active, then thirty days before deletion. Call logs and ' +
         'rejected sign-in attempts: seven days, deleted automatically by a scheduled task. ' +
         'Report execution logs and the reports produced: ninety days, deleted the same way. ' +
         'Server backups: thirty days.',
    },
    {
      h: 'Cookies and browser storage',
      p: 'A session cookie (HttpOnly, Secure) and its equivalent in the browser local storage ' +
         'keep your session open. That is all: no advertising cookie, no audience measurement, no ' +
         'script loaded from a third-party domain. Because those elements are strictly necessary ' +
         'for the service you request, no consent banner is displayed — it would have nothing to ' +
         'let you choose.',
    },
    {
      h: 'Who has access',
      p: 'The platform administrators, for operations and support, and the hosting provider, ' +
         'located in the European Union. No disclosure to third parties for commercial purposes, ' +
         'no transfer outside the European Union.',
    },
    {
      h: 'Your rights',
      p: 'You may request access to your data, its rectification, erasure, restriction of ' +
         'processing, object to it and request portability. Write to {contact}. If the answer ' +
         'does not satisfy you, you may lodge a complaint with the ' +
         'Belgian Data Protection Authority, Rue de la Presse 35, 1000 Brussels ' +
         '(autoriteprotectiondonnees.be).',
    },
  ],
};


const el = {
  link: 'Απόρρητο',
  title: 'Προστασία δεδομένων',
  updated: 'Τελευταία ενημέρωση: 4 Νοεμβρίου 2026',
  defaults: {
    controller: '« επωνυμία προς συμπλήρωση »',
    address: '« διεύθυνση προς συμπλήρωση »',
    contact: '« διεύθυνση επικοινωνίας προς συμπλήρωση »',
  },
  intro:
    'Η σελίδα αυτή περιγράφει ποια προσωπικά δεδομένα επεξεργάζεται η πλατφόρμα NYX, για ποιον ' +
    'σκοπό, για πόσο διάστημα, και πώς μπορείτε να ασκήσετε τα δικαιώματά σας. Δεν σας ζητείται ' +
    'συγκατάθεση: οι επεξεργασίες που περιγράφονται εδώ είναι απαραίτητες για την υπηρεσία.',
  back: 'Πίσω',
  sections: [
    {
      h: 'Ποιος είναι ο υπεύθυνος επεξεργασίας',
      p: '{controller}, {address}. Επικοινωνία για οποιοδήποτε ζήτημα σχετικά με τα προσωπικά ' +
         'δεδομένα: {contact}.',
    },
    {
      h: 'Ποια δεδομένα επεξεργάζονται',
      p: 'Ο λογαριασμός σας: διεύθυνση email, όνομα, επώνυμο, γλώσσα εμφάνισης, δικαιώματα, ' +
         'φίλτρα οθόνης και, εφόσον είναι ενεργή η επαλήθευση δύο παραγόντων, αριθμός ' +
         'τηλεφώνου. Ο κωδικός πρόσβασης δεν αποθηκεύεται ποτέ σε καθαρή μορφή: διατηρείται ' +
         'μόνο η σύνοψή του (pbkdf2-sha256), από την οποία δεν είναι δυνατή η ανάκτησή του.',
    },
    {
      h: 'Ίχνη χρήσης',
      p: 'Κάθε κλήση στη διεπαφή καταγράφεται για επτά ημέρες: ημερομηνία, διεύθυνση που ' +
         'κλήθηκε, μέθοδος, διάρκεια, λογαριασμός, κωδικός σφάλματος εφόσον υπάρχει. ' +
         'Καταγράφεται η σύνοψη του token συνεδρίας, ποτέ το ίδιο το token. Οι απορριφθείσες ' +
         'απόπειρες σύνδεσης καταγράφονται επίσης για επτά ημέρες, με τη διεύθυνση που ' +
         'δοκιμάστηκε, τη διεύθυνση IP και το πρόγραμμα περιήγησης: έτσι αναγνωρίζεται μια ' +
         'επίθεση brute force και προστατεύεται ο λογαριασμός σας.',
    },
    {
      h: 'Γιατί',
      p: 'Για την παροχή της υπηρεσίας και τον έλεγχο ταυτότητας των χρηστών· για την ασφάλεια ' +
         'της πλατφόρμας (ανίχνευση brute force, διάγνωση περιστατικών, μέτρηση διαθεσιμότητας)· ' +
         'για την απάντηση σε αιτήματα υποστήριξης. Τα αρχεία καταγραφής χρησιμεύουν στη ' +
         'διάγνωση βλάβης ή ανώμαλης χρήσης: δεν χρησιμοποιούνται για την αξιολόγηση της ' +
         'ατομικής εργασίας.',
    },
    {
      h: 'Νομική βάση',
      p: 'Εκτέλεση της σύμβασης ή της εντολής για τον λογαριασμό και τη χρήση του (άρθρο 6.1.β ' +
         'ΓΚΠΔ)· έννομο συμφέρον για την ασφάλεια και τα τεχνικά αρχεία καταγραφής (άρθρο ' +
         '6.1.στ). Κανένα δεδομένο δεν χρησιμοποιείται για διαφήμιση, δεν πωλείται και δεν ' +
         'χρησιμοποιείται για εμπορική κατάρτιση προφίλ.',
    },
    {
      h: 'Για πόσο διάστημα',
      p: 'Ο λογαριασμός: όσο είναι ενεργός, και στη συνέχεια τριάντα ημέρες πριν από τη ' +
         'διαγραφή. Τα αρχεία κλήσεων και οι απορριφθείσες απόπειρες σύνδεσης: επτά ημέρες, με ' +
         'αυτόματη διαγραφή από προγραμματισμένη εργασία. Τα αρχεία εκτέλεσης αναφορών και οι ' +
         'παραγόμενες αναφορές: ενενήντα ημέρες, με τον ίδιο τρόπο. Τα αντίγραφα ασφαλείας του ' +
         'διακομιστή: τριάντα ημέρες.',
    },
    {
      h: 'Cookies και αποθήκευση στον περιηγητή',
      p: 'Ένα cookie συνεδρίας (HttpOnly, Secure) και το αντίστοιχό του στην τοπική αποθήκευση ' +
         'του περιηγητή διατηρούν τη συνεδρία σας ανοικτή. Τίποτε άλλο: κανένα διαφημιστικό ' +
         'cookie, καμία μέτρηση κοινού, κανένα σενάριο από εξωτερικό τομέα. Επειδή τα στοιχεία ' +
         'αυτά είναι απολύτως απαραίτητα για την υπηρεσία που ζητάτε, δεν εμφανίζεται banner ' +
         'συγκατάθεσης — δεν θα είχε τίποτε να σας αφήσει να επιλέξετε.',
    },
    {
      h: 'Ποιοι έχουν πρόσβαση',
      p: 'Οι διαχειριστές της πλατφόρμας, για λειτουργία και υποστήριξη, και ο πάροχος ' +
         'φιλοξενίας, εγκατεστημένος στην Ευρωπαϊκή Ένωση. Καμία κοινοποίηση σε τρίτους για ' +
         'εμπορικούς σκοπούς, καμία διαβίβαση εκτός Ευρωπαϊκής Ένωσης.',
    },
    {
      h: 'Τα δικαιώματά σας',
      p: 'Μπορείτε να ζητήσετε πρόσβαση στα δεδομένα σας, διόρθωση, διαγραφή, περιορισμό της ' +
         'επεξεργασίας, να αντιταχθείτε και να ζητήσετε τη φορητότητα. Γράψτε στη διεύθυνση ' +
         '{contact}. Αν η απάντηση δεν σας ικανοποιεί, μπορείτε να υποβάλετε καταγγελία στην ' +
         'Αρχή Προστασίας Δεδομένων (APD), rue de la Presse 35, 1000 Βρυξέλλες ' +
         '(autoriteprotectiondonnees.be).',
    },
  ],
};

const notices = { fr, nl, en, el };

/**
 * Replaces the {controller}, {address} and {contact} tokens with the actual legal details.
 *
 * The values come from the API environment (PRIVACY_CONTROLLER, PRIVACY_ADDRESS,
 * PRIVACY_CONTACT): filling them in therefore requires neither an image rebuild nor a
 * republication of the interface, only an API restart. While they are empty, the text keeps
 * its "to be completed" placeholders, visible on screen: an incomplete notice must show.
 */
export function fillNotice(notice, values) {
  const resolved = {};
  for (const key of ['controller', 'address', 'contact']) {
    const provided = values && values[key];
    resolved[key] = provided && String(provided).trim() ? String(provided).trim() : notice.defaults[key];
  }
  const substitute = (text) =>
    String(text).replace(/\{(controller|address|contact)\}/g, (match, key) => resolved[key]);

  return {
    ...notice,
    sections: notice.sections.map((section) => ({ h: substitute(section.h), p: substitute(section.p) })),
  };
}

export function privacyNotice(locale) {
  return notices[locale] || notices.en;
}

export default notices;
