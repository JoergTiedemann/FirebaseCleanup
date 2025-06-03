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
// const simulprefix = "Simul/Test";
// fuer Produktivdatenbank
const simulprefix = "";


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
  const message = "Firebase Cleanup Functions Version: 1.6";
  response.send(`<h1>${message}</h1>`);

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

exports.stromloggingcleanup = onSchedule({
  schedule: "0 6 * * *",
  timeoutSeconds:300 //5 Minuten Timeout
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
