/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// const {onRequest} = require("firebase-functions/v2/https");


// für Simulation
const simulprefix = "Simul/Test";
// fuer Produktivdatenbank
// const simulprefix = "";


const v2 = require("firebase-functions/v2");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const {log} = require("firebase-functions/logger");

const admin = require("firebase-admin");
admin.initializeApp();

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
function aufraeumen(cfgpfad, loeschpfad, fblog) {
  //debugger; // dies ist ein Breakpoint
  // unter der url: chrome://inspect/#devices taucht ein inpect Link am Ende auf unter Remote Target
  // auf dann startet der Chrom debugger und das Programm stoppt an der entsprechenden Stelle und man 
  // kann im Single Step Betrieb weiter machen
  // perfekt !
  console.log("Aufraeumen wurde aufgerufen Pfad:"+cfgpfad);
  // fblog("Scheduler mit Namen aufraeumen wurde aufgerufen"+param);

  const cfgpath = "Wasserwerk/CleanupConfig/"+cfgpfad;
  console.log("Cfgpath:", cfgpath);
  // const ref = admin.database().ref("Wasserwerk/CleanupConfig/Pumpenlogging");
  const ref = admin.database().ref(cfgpath);

  ref.once("value", (snapshot) => {
        const data = snapshot.val();
        console.log("Daten aus der Datenbank:", data);
        console.log("MaxDays:",data.MaxDays);
        // fblog("MaxOnTime:"+data.MaxOnTime);
        // so nun wollen wir die Daten abfragen
        var startDatum = "";
        var AnzahlTage  = data.MaxDays;
        var endDate = new Date();
        endDate.setDate(endDate.getDate() - AnzahlTage);
        console.log("loeschen bis Datum:", endDate.toString());
        var strEnd = endDate.getFullYear().toString() + "/" + String(endDate.getMonth()+1)+ "/"  + endDate.getDate().toString()+" 00:00:00";
        var endunixTimestamp = Math.round(new Date(strEnd).getTime()/1000);
        // console.log("endunixTimestamp:", endunixTimestamp.toString());
        const ProtokollQuery = admin.database().ref(simulprefix+loeschpfad);
        const Abfrage = ProtokollQuery.orderByChild("LoggingTimestamp").endAt(endunixTimestamp); 
        Abfrage.once("value",(snapshot) => {
            const data = snapshot.val();
            var AnzahlDatasets = 0;
            if (data != null) {
                // console.log("pumpenprotokoll gelesen:", data);
                // array durchlaufen
                Object.keys(data).forEach(function(key) {
                    var val = data[key];
                    // Gesamtaufzeit = Gesamtaufzeit + val["LoggingTagesLaufzeit"];
                    AnzahlDatasets++;
                    if (AnzahlDatasets<10)
                        console.log("zu loeschender Key:",key);

                    ProtokollQuery.child(key).remove()
                        .then(() => {
                            if (AnzahlDatasets<10)
                             console.log(`Datensatz mit Schlüssel ${key} erfolgreich gelöscht!`);
                        })
                        .catch((error) => {
                            console.error(`Fehler beim Löschen des Datensatzes mit Schlüssel ${key}:`, error);
                        });

                });
                console.log("Anzahl zu loeschender Datensaetze:",AnzahlDatasets);
            }
            else
            {
                console.error("Keine Datensätze zum Loeschen");
            }
            // Schreibe oder aktualisiere das Feld "DeletedCount"
            ref.update({ DeletedCount: AnzahlDatasets })
                .then(() => {
                    console.log("DelCount erfolgreich aktualisiert!");
                })
                .catch((error) => {
                    console.error("Fehler beim Aktualisieren von DelCount:", error);
                });
            // Schreibe oder aktualisiere das Feld "LoeschDatum"
            ref.update({ LoeschDatum: Date().toString() })
                .then(() => {
                    console.log("LoeschDatum erfolgreich aktualisiert!");
                })
                .catch((error) => {
                    console.error("Fehler beim Aktualisieren von LoeschDatum:", error);
                });

        });
      });
    return `Aufraeumen beendet Pfad:${cfgpfad}`;
}


exports.version = v2.https.onRequest((request, response) => {
  const message = "Firebase Cleanup Functions Version: 1.0";
  response.send(`<h1>${message}</h1>`);

});


exports.helloworld = v2.https.onRequest((request, response) => {
  const message = "Hallo Welt als js mit Consolenlog mit 2. Funktion als scheduled function";
  response.send(`<h1>${message}</h1>`);

});



exports.databasecleanup = v2.https.onRequest((request, response) => {
//   const name = request.params[0].replace("/", "");
  const testMessage = aufraeumen("PumpenLogging","Wasserwerk/Pumpenlogging",log);

  const message = testMessage ;
  response.send(`<h1>${message}</h1>`);
  
});


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
exports.accountcleanup = onSchedule("5 10 * * *", async (event) => {
    aufraeumen("PumpenLogging","Wasserwerk/Pumpenlogging",log);
  });
