/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */
// Pass for gmail wokwkphnkt+pdpcfv
// const {onRequest} = require("firebase-functions/v2/https");


// für Simulation
// const simulprefix = "Simul/Test";
// fuer Produktivdatenbank
const simulprefix = "";


const v2 = require("firebase-functions/v2");

// 1. v1-Core-Modul für Triggers -> V1 verwenden weil der auth Emulator nicht mit V2 funktioniert
const functionsv1 = require("firebase-functions/v1");

const functions = require("firebase-functions");

// const { onUserCreated } = require("firebase-functions/v2/auth");
const nodemailer = require("nodemailer");

const cors = require("cors")({origin: true}); // ← erlaubt alle Domains


const {onSchedule} = require("firebase-functions/v2/scheduler");
const {log} = require("firebase-functions/logger");

const admin = require("firebase-admin");
admin.initializeApp();

const fs = require("fs");
let gmailConfig;

// Versuch, die lokale runtimeconfig zu laden und daraus das App-Passwort zu extraieren dann bauen wir aber noch was dazu damit das echte Passwort nicht in git gespeichert ist
// e s l int-disable-next-line no-unused-vars
const startChar = "a";
const resultChar = String.fromCharCode(startChar.charCodeAt(0) + 22);
const resultLastChar = "pdpcf" + String.fromCharCode(startChar.charCodeAt(0) + 21);
console.log("First:", resultChar, " Last", resultLastChar);

try {
  const raw = fs.readFileSync(__dirname + "/runtimeconfig.json");
  gmailConfig = JSON.parse(raw).gmail;
  gmailConfig.password = resultChar + "okwkphnkt"+resultLastChar;
  // console.log("Passwortt:",gmailConfig.password);
}
catch (error) {
  // Fallback auf Firebase Functions Runtime
  gmailConfig = functions.config().gmail;
}

console.log("Gmail Config:", gmailConfig);

const {email: gmailEmail, password: gmailPassword} = gmailConfig;

// Beispiel Nodemailer-Setup
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {user: gmailEmail, pass: gmailPassword}
});


// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
// Elint abschalten
/* eslint-disable */

// Das ist die eigentliche Funktion um die Datenbank aufzuraeumen
// hier sollten wir als Paramater die Eintraage wo geloescht, wo die
// Maxmalzeit gelesen
// wird und wo hinprotokoliiert wird mitgeben d.h.
// Wasserwerk/CleanupConfig/Pfad
async function aufraeumen(cfgpfad, loeschpfad,boolloeschen, fblog) {
  //debugger; // dies ist ein Breakpoint
  // unter der url: chrome://inspect/#devices taucht ein inpect Link am Ende auf unter Remote Target
  // auf dann startet der Chrom debugger und das Programm stoppt an der entsprechenden Stelle und man 
  // kann im Single Step Betrieb weiter machen
  // perfekt !
  console.log("Aufraeumen wurde aufgerufen Pfad:"+cfgpfad+" loeschen:"+boolloeschen);
  // fblog("Scheduler mit Namen aufraeumen wurde aufgerufen"+param);

  const cfgpath = "Wasserwerk/CleanupConfig/"+cfgpfad;
  console.log("Cfgpath:", cfgpath);
  // const ref = admin.database().ref("Wasserwerk/CleanupConfig/Pumpenlogging");
  const ref = admin.database().ref(cfgpath);
  var strQueryInfo = "";
  if (boolloeschen == false) {
        strQueryInfo = "Nur als Abfrage (ohne tatsächliches Löschen)!";
  }
  try 
  {
      // Hier wird die Konfiguration aus der Datenbank gelesen
      const snapshot = await ref.get();
      if (snapshot.exists()) {
        const cfgdata = snapshot.val();
        console.log("Daten aus der Datenbank:", cfgdata);
        console.log("MaxDays:",cfgdata.MaxDays);
        // fblog("MaxOnTime:"+cfgdata.MaxOnTime);
        // so nun wollen wir die Daten abfragen
        var startDatum = "";
        var AnzahlTage  = cfgdata.MaxDays;
        if ((AnzahlTage > 0) && (boolloeschen == false))
        {
          AnzahlTage = AnzahlTage -1; // damit wir die Werte die morgen geloescht werden sollen abfragen 
        }
        var AnzahlDatasets = 0;
        if (AnzahlTage > 0)
        {
          var endDate = new Date();
          endDate.setDate(endDate.getDate() - AnzahlTage);
          console.log("loeschen bis Datum:", endDate.toString());
          var strEnd = endDate.getFullYear().toString() + "/" + String(endDate.getMonth()+1)+ "/"  + endDate.getDate().toString()+" 00:00:00";
          var endunixTimestamp = Math.round(new Date(strEnd).getTime()/1000);
          // console.log("endunixTimestamp:", endunixTimestamp.toString());
          const ProtokollQuery = admin.database().ref(simulprefix+loeschpfad);
          const Abfrage = ProtokollQuery.orderByChild("LoggingTimestamp").endAt(endunixTimestamp); 
          try
          {
            const datensnapshot = await Abfrage.get();
            if (datensnapshot.exists()) {
                const data = datensnapshot.val();
                // console.log("pumpenprotokoll gelesen:", data);
                // array durchlaufen
                // Object.keys(data).forEach(function(key) 
                for (const key of Object.keys(data)) 
                {
                  // var val = data[key];
                  // Gesamtaufzeit = Gesamtaufzeit + val["LoggingTagesLaufzeit"];
                  AnzahlDatasets++;
                  // if (AnzahlDatasets<10)
                  //     console.log("zu loeschender Key:",key);
                  if (boolloeschen == true) {
                      // console.log("Loeschaufruf:",key);
                      try {
                          await ProtokollQuery.child(key).remove();
                          if (AnzahlDatasets < 5) {
                              // console.log(`kein Loeschen nur Demobetrieb mit Schlüssel ${key}`);
                             console.log(`Datensatz mit Schlüssel ${key} erfolgreich gelöscht!`);
                          }
                        } catch (error) {
                          console.log(`Fehler beim Löschen des Datensatzes mit Schlüssel ${key}:`, error);
                        }
                    }
                }
                console.log("Anzahl zu loeschender Datensaetze:",AnzahlDatasets);
            }
            else
            {
              console.log("Keine Datensätze zum Loeschen");
            }
            // Schreibe oder aktualisiere das Feld "DeletedCount"
            // debugger;
            if (boolloeschen == true) {
                try {
                    // Hier wird das letzte Loeschdatum geselen
                    const aktdat = new Date();
                    var lastDeleteCount = 0;
                    const formattedaktDate = aktdat.toLocaleDateString("de-DE", { timeZone: "Europe/Berlin" }); // Nur das Datum, z.B. 7.6.2025
                    const aktsnapshot = await ref.get();
                    if (aktsnapshot.exists()) {
                        const aktdat = aktsnapshot.val();
                        LoeschDatum = aktdat.LoeschDatum;
                        const lastdatum = LoeschDatum.split(",")[0].trim();
                        if (formattedaktDate == lastdatum) {
                            // Wenn das aktuelle Datum  gleich dem letzten Löschdatum ist, d.h. da wurde heute schon was geloescht
                            lastDeleteCount = aktdat.DeletedCount;
                        }
                        console.log("letztes Loeschdatum:",lastdatum,"AktDatum:",formattedaktDate," Heute schon geloescht:",lastDeleteCount); 
                    }
                    await ref.update({ DeletedCount: lastDeleteCount+AnzahlDatasets })
                    console.log("DelCount erfolgreich aktualisiert auf ",lastDeleteCount+AnzahlDatasets," Datensaetze");
                  } catch (error) {
                      console.log("Fehler beim Aktualisieren von DelCount:", error);
                  } 
              // Schreibe oder aktualisiere das Feld "LoeschDatum"
                try {
                   const dat = new Date();
                   const formattedDateTime = dat.toLocaleString("de-DE", { timeZone: "Europe/Berlin" }); // Datum und Uhrzeit
                   await ref.update({ LoeschDatum: formattedDateTime })
                      console.log("LoeschDatum erfolgreich aktualisiert!");
                  } catch (error) {
                      console.log("Fehler beim Aktualisieren von LoeschDatum:", error);
                  }
            }
            const dat = new Date();
            const formattedDateTime = dat.toLocaleString("de-DE"); // Datum und Uhrzeit
            const retstring = `Aufraeumen:${cfgpfad} um ${formattedDateTime} durchgeführt! ${strQueryInfo} Anzahl Datensätze: ${AnzahlDatasets} gelöscht!`;
            return retstring;
          }
          catch (error) {
            console.log("Fehler beim Abfragen der Daten:", error);
            throw error; // Fehler weitergeben
          }
        }
        else
        {
          console.log("Anzahl Tage <= 0, keine Löschung!");
            if (boolloeschen == true) {
                try {
                    await ref.update({ DeletedCount: AnzahlDatasets })
                    console.log("DelCount erfolgreich aktualisiert!");
                  } catch (error) {
                      console.log("Fehler beim Aktualisieren von DelCount:", error);
                  } 
              // Schreibe oder aktualisiere das Feld "LoeschDatum"
                try {
                    const dat = new Date();
                    const formattedDateTime = dat.toLocaleString("de-DE", { timeZone: "Europe/Berlin" }); // Datum und Uhrzeit
                    const infostr = "Kein Aufraeumen! Tage = 0:" + formattedDateTime + " Kein Aufraeumen durchgeführt"
                    await ref.update({ LoeschDatum: infostr })
                      console.log("LoeschDatum erfolgreich aktualisiert!");
                  } catch (error) {
                      console.log("Fehler beim Aktualisieren von LoeschDatum:", error);
                  }
            }
            const dat = new Date();
            const formattedDateTime = dat.toLocaleString("de-DE"); // Datum und Uhrzeit
            const retstring = `Kein Aufraeumen:${cfgpfad} um ${formattedDateTime} durchgeführt! ${strQueryInfo} Anzahl Tage =0!`;
            return retstring;
        }
      }
      else 
      {
        console.log("Keine Konfiguration gefunden!");
        const dat = new Date();
        const formattedDateTime = dat.toLocaleString("de-DE"); // Datum und Uhrzeit
        const retstring = `Aufraeumen:${cfgpfad} um ${formattedDateTime} durchgeführt! ${strQueryInfo} No Config loaded`;
        return retstring;
      }
  } 
  catch (error) 
  {
      console.error("Fehler beim Lesen der Konfiguration:", error);
      throw error; // Fehler weitergeben
  }
}


exports.version = v2.https.onRequest((request, response) => {
  const message = "Firebase Cleanup Functions Version: 2.7";
  response.send(`<h1>${message}</h1>`);

});

exports.deleteUser = v2.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send("Client nicht autorisiert: Kein gültiger Token.");
    }

    const idToken = authHeader.split("Bearer ")[1];

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Token ungültig:", error);
      return res.status(403).send("Token ungültig oder abgelaufen.");
    }

    // Nur Admins dürfen löschen
    if (decodedToken.role !== "admin") {
      return res.status(403).send("Zugriff verweigert: Client hat keine Admin-Berechtigung.");
    }

    const email = req.query.email;
    if (!email) {
      return res.status(400).send("Fehlender Parameter: email ist erforderlich.");
    }

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      await admin.auth().deleteUser(userRecord.uid);
      res.status(200).send(`Benutzer mit Email ${email} erfolgreich gelöscht.`);
    } catch (error) {
      console.error("Fehler beim Löschen des Nutzers:", error);
      res.status(500).send("Fehler beim Löschen des Nutzers.");
    }
  });
});


exports.setuserrole = v2.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send("Client nicht autorisiert: Kein gültiger Token.");
    }

    const idToken = authHeader.split("Bearer ")[1];

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error("Token ungültig:", error);
      return res.status(403).send("Token ungültig oder abgelaufen.");
    }

    // Nur Admins dürfen Rollen setzen
    if (decodedToken.role !== "admin") {
      return res.status(403).send("Zugriff verweigert: Client hat keine Admin-Berechtigung.");
    }

    const email = req.query.email;
    const role = req.query.role;

    if (!email || !role) {
      return res.status(400).send(
        "Fehlende Parameter: email und role sind erforderlich.<br>" +
        "Beispiel:<br>" +
        "https://europe-west1-dein-projekt.cloudfunctions.net/setuserrole?email=benutzer@example.com&role=techniker"
      );
    }

    try {
      const userRecord = await admin.auth().getUserByEmail(email);
      const uid = userRecord.uid;

      await admin.auth().setCustomUserClaims(uid, { role: role });

      const message = `Rolle '${role}' für Benutzer ${email} erfolgreich gesetzt.`;
      res.status(200).send(`<h1>${message}</h1>`);
    } catch (error) {
      console.error("Fehler beim Setzen der Rolle:", error);
      res.status(500).send("Fehler beim Setzen der Rolle.");
    }
  });
});


exports.getuserrole = v2.https.onRequest(async (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).send("Fehlender Parameter: 'email' ist erforderlich.<BR>Beispiel:<BR>https://europe-west1-DEIN_PROJEKT.cloudfunctions.net/getUserRole?email=benutzer@example.com");
  }

  try {
    // Benutzer anhand der E-Mail-Adresse suchen
    const userRecord = await admin.auth().getUserByEmail(email);

    // Custom Claims auslesen
    const claims = userRecord.customClaims || {};

    const role = claims.role || "Keine Rolle gesetzt";
    // res.status(200).send(`Benutzer: ${email}\nRolle: ${role}`);
    const message = `Benutzer: ${email}<br>Rolle: ${role}`;
    res.status(200).send(`<h1>${message}</h1>`);

  } catch (error) {
    console.error("Fehler beim Auslesen der Rolle:", error);
    res.status(500).send("Fehler beim Abrufen der Benutzerrolle.");
  }
});

exports.listuserroles = v2.https.onRequest(async (req, res) => {
  try {
    let html = `
      <html>
        <head>
          <title>Benutzerrollen</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 0.75rem; text-align: left; }
            th { background-color: #f4f4f4; }
            tr:nth-child(even) { background-color: #fafafa; }
            .admin { color: green; font-weight: bold; }
            .maschine { color: blue; font-weight: bold; }
            .standard { color: gray; font-weight: bold; }
            .keine { color: red; font-style: italic; }
          </style>
        </head>
        <body>
          <h2>Benutzerrollenübersicht</h2>
          <table>
            <tr>
              <th>E-Mail</th>
              <th>Rolle</th>
            </tr>
    `;

    let nextPageToken;
    do {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      result.users.forEach(user => {
        const email = user.email || "Kein E-Mail";
        const claims = user.customClaims || {};
        const role = claims.role || "Keine Rolle gesetzt";

        // CSS-Klasse abhängig von der Rolle
        const cssClass = (role === "admin") || (role === "administrator") ? "admin"
                        : role === "maschine" ? "maschine"
                        : role === "Nachbar" ? "standard"
                        : "keine";

        html += `<tr><td>${email}</td><td class="${cssClass}">${role}</td></tr>`;
      });
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    html += `
          </table>
        </body>
      </html>
    `;

    res.status(200).send(html);
  } catch (error) {
    console.error("Fehler beim Abrufen der Benutzerrollen:", error);
    res.status(500).send("<h1>Fehler beim Abrufen der Rollen</h1>");
  }
});



exports.listUsers = v2.https.onRequest((req, res) => {
  cors(req, res, async () => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).send("Client nicht authentifiziert.");
    }

    const idToken = authHeader.split("Bearer ")[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      if (decodedToken.role !== "admin") {
        return res.status(403).send("Client hat keine Admin-Berechtigung.");
      }

      const users = [];
      let nextPageToken;

      do {
        const result = await admin.auth().listUsers(1000, nextPageToken);
        result.users.forEach(user => {
          users.push({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            role: user.customClaims?.role || "keine",
          });
        });
        nextPageToken = result.pageToken;
      } while (nextPageToken);

      res.json({ users });
    } catch (error) {
      console.error("Fehler beim Abrufen der Benutzer:", error);
      res.status(500).send("Interner Fehler.");
    }
  });
});



// Funktion mit der die aktuellen Benutzer angezeigt werden und vorhandene Benutzer geloescht werden können
exports.manageUserRoles = v2.https.onRequest(async (req, res) => {
  try {
    const isPost = req.method === "POST";
    // const deleteIndex = isPost ? parseInt(req.body?.deleteIndex) : null;
    const deleteIndex = isPost && req.body && req.body.deleteIndex
    ? parseInt(req.body.deleteIndex, 10)
    : null;

    let deletedEmail = null;

    // POST: Benutzer löschen und Redirect mit Parameter
    if (isPost && !isNaN(deleteIndex) && deleteIndex >= 0) {
      let allUsers = [];
      let nextPageToken;
      do {
        const result = await admin.auth().listUsers(1000, nextPageToken);
        allUsers = allUsers.concat(result.users);
        nextPageToken = result.pageToken;
      } while (nextPageToken);

      if (deleteIndex < allUsers.length) {
        const userToDelete = allUsers[deleteIndex];
        await admin.auth().deleteUser(userToDelete.uid);
        deletedEmail = userToDelete.email || "Unbekannt";
      }

      return res.redirect(303, `/?deleted=${encodeURIComponent(deletedEmail)}`);
    }

    // GET: Nutzerliste abrufen
    let usersList = [];
    let nextPageToken;
    do {
      const result = await admin.auth().listUsers(1000, nextPageToken);
      usersList = usersList.concat(result.users);
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    // Erfolgsmeldung und History-Cleanup
    const deletedParam = req.query.deleted
      ? decodeURIComponent(req.query.deleted)
      : null;
    const deleteMessage = deletedParam
      ? `<p id="deleteMsg" style="color: green;">
           ✅ Benutzer <strong>${deletedParam}</strong> wurde gelöscht.
         </p>
         <script>
           window.addEventListener('load', () => {
             history.replaceState(null, '', window.location.pathname);
           });
         </script>`
      : "";

    // Email-Array für Bestätigungsdialog
    const emailList = usersList
      .map(u => `"${u.email || "Kein E-Mail"}"`)
      .join(",");

    // HTML-Antwort aufbauen
    let html = `
<html>
  <head>
    <meta charset="utf-8" />
    <title>Benutzerrollenverwaltung</title>
    <style>
      body { font-family: Arial; padding: 2rem; }
      table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
      th, td { border: 1px solid #ccc; padding: 0.75rem; }
      th { background-color: #f0f0f0; }
      tr:nth-child(even) { background-color: #fafafa; }
      .admin { color: green; font-weight: bold; }
      .maschine { color: blue; font-weight: bold; }
      .standard { color: gray; font-weight: bold; }
      .keine { color: red; font-style: italic; }
    </style>
    <script>
      const emails = [${emailList}];
      function confirmDeletion() {
        const idx = parseInt(document.getElementById('deleteIndex').value, 10);
        if (isNaN(idx) || idx < 0 || idx >= emails.length) {
          alert('Ungültiger Index!');
          return false;
        }
        return confirm("Soll der Benutzer:'" + emails[idx] + "'wirklich gelöscht werden ?");
      }
    </script>
  </head>
  <body>
    <h2>Benutzerrollenübersicht</h2>
    ${deleteMessage}
    <form method="POST" onsubmit="return confirmDeletion();">
      <label for="deleteIndex">Index zum Löschen:</label>
      <input
        type="number"
        name="deleteIndex"
        id="deleteIndex"
        required
        min="0"
        max="${usersList.length - 1}"
      />
      <button type="submit">Löschen</button>
    </form>
    <table>
      <tr><th>#</th><th>E-Mail</th><th>Rolle</th></tr>`;

    usersList.forEach((user, index) => {
      const email = user.email || "Kein E-Mail";
      const role = (user.customClaims && user.customClaims.role) || "Keine Rolle gesetzt";
      const cssClass =
        role === "admin" ? "admin" :
        role === "maschine" ? "maschine" :
        role === "Nachbar" ? "standard" :
        "keine";
      html += `<tr>
        <td>${index}</td>
        <td>${email}</td>
        <td class="${cssClass}">${role}</td>
      </tr>`;
    });

    html += `
    </table>
  </body>
</html>`;

    res.status(200).send(html);

  } catch (error) {
    console.error("Fehler beim Verarbeiten:", error);
    res.status(500).send("<h1>🚨 Interner Fehler</h1>");
  }
});




// V2 Version
// exports.setCustomUserClaims = onUserCreated(async (event) => {
//   const user = event.data;

//   try {
//     await admin.auth().setCustomUserClaims(user.uid, { role: "Nachbar" });
//     console.log(`Custom Claim gesetzt für User ${user.uid}`);
//   } catch (error) {
//     console.error("Fehler beim Setzen der Claims:", error);
//   }
// });



exports.setcustomuserclaims = functionsv1.auth.user().onCreate(async (user) => {
  
  try {
    // 1) Rolle "Nachbar" setzen
    // Rolle "Nachbar" als Claim hinterlegen fuer alle neu angelegten Benutzer
    await admin.auth().setCustomUserClaims(user.uid, { role: "Nachbar" });
    console.log(`Custom Claim 'role:Nachbar' für User ${user.uid} gesetzt.`);

    // 2) E-Mail vorbereiten
    const mailOptions = {
      from: `Pumpenmonitor-App <${gmailEmail}>`,
      to: "joerg-tiedemann@gmx.de",
      subject: "🔔 Neuer Benutzer angelegt",
      text: [
        "Ein neuer Benutzer wurde im Pumpenmonitor-Projekt angelegt:",
        `UID: ${user.uid}`,
        `E-Mail: ${user.email || "Keine E-Mail-Adresse"}`,
        `Display Name: ${user.displayName || "Nicht gesetzt"}`,
        `Account erstellt: ${user.metadata.creationTime}`,
        "",
        "Benutzerverwaltung: https://manageuserroles-i3lrfp7ewq-uc.a.run.app"
      ].join("\n"),
      html: [
          "<p>Ein neuer Benutzer wurde im Pumpenmonitor-Projekt angelegt:</p>",
          `<ul>
            <li>UID: ${user.uid}</li>
            <li>E-Mail: ${user.email || "Keine E-Mail-Adresse"}</li>
            <li>Display Name: ${user.displayName || "Nicht gesetzt"}</li>
            <li>Account erstellt: ${user.metadata.creationTime}</li>
          </ul>`,
          `<p><a href="https://manageuserroles-i3lrfp7ewq-uc.a.run.app">Zur Benutzerverwaltung</a></p>`
        ].join("")      
    };

    // 3) E-Mail versenden
    await mailTransport.sendMail(mailOptions);
    console.log(`E-Mail-Benachrichtigung an ${mailOptions.to} versendet.`);

  } catch (error) {
    console.error(`Fehler beim Setzen der Claims für User ${user.uid}:`, error);
  }
});


exports.helloworld = v2.https.onRequest((request, response) => {
  const dat = new Date();
  const formattedDateTime = dat.toLocaleString("de-DE", { timeZone: "Europe/Berlin" }); // Datum und Uhrzeit
  const message = "Hallo Welt mit Consolenlog um:" + formattedDateTime;
  response.send(`<h1>${message}</h1>`);

});



exports.pumpenloggingquery = v2.https.onRequest((request, response) => {
//   const name = request.params[0].replace("/", "");
aufraeumen("PumpenLogging","Wasserwerk/Pumpenlogging",false,log)
  .then((testmessage) => {
    if (testmessage )
      response.send(`<h1>${testmessage}</h1>`);
    else
      response.send(`<h1>Keine Daten gefunden!</h1>`);
  })
  .catch((error) => {
    console.log("Fehler beim Aufräumen:", error);
    response.status(500).send("Fehler beim Aufräumen: " + error.message);
  });
});



exports.pumpentageswertequery = v2.https.onRequest((request, response) => {
//   const name = request.params[0].replace("/", "");
aufraeumen("PumpenTageswerte","Wasserwerk/Pumpenmonitor/Tageswerte",false,log)
  .then((testmessage) => {
    if (testmessage )
      response.send(`<h1>${testmessage}</h1>`);
    else
      response.send(`<h1>Keine Daten gefunden!</h1>`);
  })
  .catch((error) => {
    console.log("Fehler beim Aufräumen:", error);
    response.status(500).send("Fehler beim Aufräumen: " + error.message);
  });
});


exports.heizungloggingquery = v2.https.onRequest((request, response) => {
//   const name = request.params[0].replace("/", "");
aufraeumen("HeizungLogging","Heizung/Brennerlogging",false,log)
  .then((testmessage) => {
    if (testmessage )
      response.send(`<h1>${testmessage}</h1>`);
    else
      response.send(`<h1>Keine Daten gefunden!</h1>`);
  })
  .catch((error) => {
    console.log("Fehler beim Aufräumen:", error);
    response.status(500).send("Fehler beim Aufräumen: " + error.message);
  });
});


exports.heizungtageswertequery = v2.https.onRequest((request, response) => {
//   const name = request.params[0].replace("/", "");
aufraeumen("HeizungTageswerte","Heizung/Heizungsmonitor/BrennerTageswerte",false,log)
  .then((testmessage) => {
    if (testmessage )
      response.send(`<h1>${testmessage}</h1>`);
    else
      response.send(`<h1>Keine Daten gefunden!</h1>`);
  })
  .catch((error) => {
    console.log("Fehler beim Aufräumen:", error);
    response.status(500).send("Fehler beim Aufräumen: " + error.message);
  });
});


exports.temperaturloggingquery = v2.https.onRequest((request, response) => {
//   const name = request.params[0].replace("/", "");
aufraeumen("TemperaturLogging","Heizung/Temperaturlogging",false,log)
  .then((testmessage) => {
    if (testmessage )
      response.send(`<h1>${testmessage}</h1>`);
    else
      response.send(`<h1>Keine Daten gefunden!</h1>`);
  })
  .catch((error) => {
    console.log("Fehler beim Aufräumen:", error);
    response.status(500).send("Fehler beim Aufräumen: " + error.message);
  });
});


exports.temperaturtageswertequery = v2.https.onRequest((request, response) => {
//   const name = request.params[0].replace("/", "");
aufraeumen("TemperaturTageswerte","Heizung/Heizungsmonitor/Tageswerte",false,log)
  .then((testmessage) => {
    if (testmessage )
      response.send(`<h1>${testmessage}</h1>`);
    else
      response.send(`<h1>Keine Daten gefunden!</h1>`);
  })
  .catch((error) => {
    console.log("Fehler beim Aufräumen:", error);
    response.status(500).send("Fehler beim Aufräumen: " + error.message);
  });
});


exports.stromtageswertequery = v2.https.onRequest((request, response) => {
aufraeumen("StromTageswerte","Stromzaehler/VerbrauchsTageswerte",false,log)
  .then((testmessage) => {
    if (testmessage )
      response.send(`<h1>${testmessage}</h1>`);
    else
      response.send(`<h1>Keine Daten gefunden!</h1>`);
  })
  .catch((error) => {
    console.log("Fehler beim Aufräumen:", error);
    response.status(500).send("Fehler beim Aufräumen: " + error.message);
  });
});



exports.stromloggingquery = v2.https.onRequest((request, response) => {
  //   const name = request.params[0].replace("/", "");
aufraeumen("StromLogging","Stromzaehler/Leistungslogging",false,log)
  .then((testmessage) => {
    if (testmessage )
      response.send(`<h1>${testmessage}</h1>`);
    else
      response.send(`<h1>Keine Daten gefunden!</h1>`);
  })
  .catch((error) => {
    console.log("Fehler beim Aufräumen:", error);
    response.status(500).send("Fehler beim Aufräumen: " + error.message);
  });
});


exports.sunlittageswertequery = v2.https.onRequest((request, response) => {
aufraeumen("SunlitTageswerte","Sunlit/Tageswerte",false,log)
  .then((testmessage) => {
    if (testmessage )
      response.send(`<h1>${testmessage}</h1>`);
    else
      response.send(`<h1>Keine Daten gefunden!</h1>`);
  })
  .catch((error) => {
    console.log("Fehler beim Aufräumen:", error);
    response.status(500).send("Fehler beim Aufräumen: " + error.message);
  });
});



exports.sunlitloggingquery = v2.https.onRequest((request, response) => {
  //   const name = request.params[0].replace("/", "");
aufraeumen("SunlitLogging","Sunlit/Logging",false,log)
  .then((testmessage) => {
    if (testmessage )
      response.send(`<h1>${testmessage}</h1>`);
    else
      response.send(`<h1>Keine Daten gefunden!</h1>`);
  })
  .catch((error) => {
    console.log("Fehler beim Aufräumen:", error);
    response.status(500).send("Fehler beim Aufräumen: " + error.message);
  });
});



// exports.stromloggingcleanuptest = v2.https.onRequest((request, response) => {
//   //   const name = request.params[0].replace("/", "");
// aufraeumen("StromLogging","Stromzaehler/Leistungslogging",true,log)
//   .then((testmessage) => {
//     if (testmessage )
//       response.send(`<h1>${testmessage}</h1>`);
//     else
//       response.send(`<h1>Keine Daten gefunden!</h1>`);
//   })
//   .catch((error) => {
//     console.log("Fehler beim Aufräumen:", error);
//     response.status(500).send("Fehler beim Aufräumen: " + error.message);
//   });
// });


// Run once a day at midnight, to clean up the users
// Manually run the task here https://console.cloud.google.com/cloudscheduler
//every day 00:00
/*
so geht das wohl auch mit crontab Syntax
five fields with the following possible values:

    Minute. The minute of the hour the command will run, ranging from 0-59.
    Hour. The hour the command will run, ranging from 0-23 in a 24-hour notation.
    Day of the month. The date of the month the user wants the command to run, ranging from 1-31.
    Month. The month that the user wants the command to run. It ranges from 1-12, representing January until December.
    Day of the week. The day of the week for a command to run, ranging from 0-6. The value represents Sunday-Saturday. In some systems, the value 7 represents Sunday.

functions.pubsub.schedule('5 11 * * *').onRun((context) => {
    console.log('This will be run every day at 11:05 AM UTC!');
exports.accountcleanup = onSchedule("every 5 minutes", async (event) => {
*/    
// exports.stromloggingcleanup = functions.pubsub.schedule("0 10 * * *")
//.onRun((context) => {

exports.sunlitloggingcleanup = onSchedule({
  schedule: "40 6 * * *",
  timeoutSeconds:420 //7 Minuten Timeout
  }, async (event) => {
  console.log("sunitloggingcleanup wurde aufgerufen");
  try
  {
   const testmessage = await aufraeumen("SunlitLogging","Sunlit/Logging",true,log);
        if (testmessage )
          console.log("cleanup durchgeführt:", testmessage);
        else
          console.log("cleanup NICHT durchgeführt");
  }
  catch(error)
  {
        console.log("Fehler beim cleanup:", error);
  }
});

exports.sunlittageswertecleanup = onSchedule("45 6 * * *", async (event) => {
  console.log("sunlittageswertecleanup wurde aufgerufen");
  try
  {
   const testmessage = await aufraeumen("SunlitTageswerte","Sunlit/Tageswerte",true,log);
        if (testmessage )
          console.log("cleanup durchgeführt:", testmessage);
        else
          console.log("cleanup NICHT durchgeführt");
  }
  catch(error)
  {
        console.log("Fehler beim cleanup:", error);
  }
});


exports.stromloggingcleanup = onSchedule({
  schedule: "0 6 * * *",
  timeoutSeconds:420 //7 Minuten Timeout
  }, async (event) => {
  console.log("stromloggingcleanup wurde aufgerufen");
  try
  {
   const testmessage = await aufraeumen("StromLogging","Stromzaehler/Leistungslogging",true,log);
        if (testmessage )
          console.log("cleanup durchgeführt:", testmessage);
        else
          console.log("cleanup NICHT durchgeführt");
  }
  catch(error)
  {
        console.log("Fehler beim cleanup:", error);
  }
});

exports.pumpenloggingcleanup = onSchedule("5 6 * * *", async (event) => {
  console.log("pumpenloggingcleanup wurde aufgerufen");
  try
  {
   const testmessage = await aufraeumen("PumpenLogging","Wasserwerk/Pumpenlogging",true,log);
        if (testmessage )
          console.log("cleanup durchgeführt:", testmessage);
        else
          console.log("cleanup NICHT durchgeführt");
  }
  catch(error)
  {
        console.log("Fehler beim cleanup:", error);
  }
});



exports.pumpentageswertecleanup = onSchedule("10 6 * * *", async (event) => {
  console.log("pumpentageswertecleanup wurde aufgerufen");
  try
  {
   const testmessage = await aufraeumen("PumpenTageswerte","Wasserwerk/Pumpenmonitor/Tageswerte",true,log);
        if (testmessage )
          console.log("cleanup durchgeführt:", testmessage);
        else
          console.log("cleanup NICHT durchgeführt");
  }
  catch(error)
  {
        console.log("Fehler beim cleanup:", error);
  }
});


exports.stromtageswertecleanup = onSchedule("15 6 * * *", async (event) => {
  console.log("stromtageswertecleanup wurde aufgerufen");
  try
  {
   const testmessage = await aufraeumen("StromTageswerte","Stromzaehler/VerbrauchsTageswerte",true,log);
        if (testmessage )
          console.log("cleanup durchgeführt:", testmessage);
        else
          console.log("cleanup NICHT durchgeführt");
  }
  catch(error)
  {
        console.log("Fehler beim cleanup:", error);
  }
});


exports.heizungloggingcleanup = onSchedule("20 6 * * *", async (event) => {
  console.log("heizungloggingcleanup wurde aufgerufen");
  try
  {
   const testmessage = await aufraeumen("HeizungLogging","Heizung/Brennerlogging",true,log);
        if (testmessage )
          console.log("cleanup durchgeführt:", testmessage);
        else
          console.log("cleanup NICHT durchgeführt");
  }
  catch(error)
  {
        console.log("Fehler beim cleanup:", error);
  }
});


exports.heizungtageswertecleanup = onSchedule("25 6 * * *", async (event) => {
  console.log("heizungtageswertecleanup wurde aufgerufen");
  try
  {
   const testmessage = await aufraeumen("HeizungTageswerte","Heizung/Heizungsmonitor/BrennerTageswerte",true,log);
        if (testmessage )
          console.log("cleanup durchgeführt:", testmessage);
        else
          console.log("cleanup NICHT durchgeführt");
  }
  catch(error)
  {
        console.log("Fehler beim cleanup:", error);
  }
});


exports.temperaturloggingcleanup = onSchedule("30 6 * * *", async (event) => {
  console.log("temperaturloggingcleanup wurde aufgerufen");
  try
  {
   const testmessage = await aufraeumen("TemperaturLogging","Heizung/Temperaturlogging",true,log);
        if (testmessage )
          console.log("cleanup durchgeführt:", testmessage);
        else
          console.log("cleanup NICHT durchgeführt");
  }
  catch(error)
  {
        console.log("Fehler beim cleanup:", error);
  }
});


exports.temperaturtageswertecleanup = onSchedule("35 6 * * *", async (event) => {
  console.log("temperaturtageswertecleanup wurde aufgerufen");
  try
  {
   const testmessage = await aufraeumen("TemperaturTageswerte","Heizung/Heizungsmonitor/Tageswerte",true,log);
        if (testmessage )
          console.log("cleanup durchgeführt:", testmessage);
        else
          console.log("cleanup NICHT durchgeführt");
  }
  catch(error)
  {
        console.log("Fehler beim cleanup:", error);
  }
});
