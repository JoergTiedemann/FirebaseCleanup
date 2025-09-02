# FirebaseCleanup
Firebasefunktionen um die Realtíme Datenbank von alten Loggereintraegen aufzuraeumen und Bereitstellung von Firebasefunktionen für das Benutzermanagement (Listen der User, Vergabe der Benutzerrollen, Loeschen der User und Setzen einer Defaultrolle für neu angelegte User)

Achtung: Firebasefunktionen müssen komplett klein geschrieben sein (nach neusten Infos muss das wohl nicht mehr so sein) !!!

Zum Arbeiten immer den Develop branch verwenden

## Initialisieren und Projekt aufsetzen
im Verzeichnis ```firebase init functions``` aufrufen
Install dependencies with npm am Ende mit Y beantworten und Eslint auch verwenden

### verwendete Node Engine
normalerweise wird die node engine 22 verwendet. Da aber der Trigger setcustomuserclaim, der bei anlegen eines neues firebaseusers die Standardbenutzerrolle setzt, noch nach v1 implementiert ist (weil es für v2 von den firebasefunctions nocjt nicht implementiert wurde) muss die Node Engine auf 20 geändert werden in der package.json da node 22 kein v1 mehr supported. In Package.json muss daher stehen:
```
  "engines": {
    "node": "20"
  },
  ```

siehe hierzu auch: https://github.com/firebase/firebase-functions/issues/1383#issuecomment-3223208410

### versenden von E-Mails bei neu Anlegen eines users
Beim Neuanlegen eines Users wird eine E-Mail von tiedemann.joerg@gmail.com an joerg-tiedemann@gmx.de geschickt
Die Zugangsdaten zu tiedemann.joerg@gmail.com sind in runtimeconfig.json gespeichert das bei npm run serve lokal geladen wird.
Das geht natürrlich nicht in der Cloud, dort wird die Firebase Config Var gelesen. Das ist quasi ein Configspeicher für firebase in der Cloud.
Dieser wird wie folgt gesetzt:
```
firebase functions:config:set gmail.email="tiedemann.joerg@gmail.com"
firebase functions:config:set gmail.password="DEIN_GMAIL_APP_PASSWORT"
```

Ausgelesenn wird dieser Speicher im Komandoprompt mit 
```
firebase functions:config:get
```
oder bei Starten der Cloudfunktion durch demn javascript code
```
gmailConfig = functions.config().gmail;
```

Als Passwort wird ein App-Passwort verwendet, da die 2-Faktor Authentifizierung bei Google aktiviert ist. Dieses App Passwort
wird wie folgt erzeugt:
- Melde dich in deinem Google-Konto an und öffne den Bereich „Sicherheit“.
- Stelle sicher, dass die „Bestätigung in zwei Schritten“ aktiviert ist.
- Scrolle zu „App-Passwörter“ und klicke auf „Passwort erstellen“.
- Wähle als App „Mail“ und als Gerät z. B. „Andere (Custom)“ und gib z. B. „Nodemailer“ ein.
- Kopiere das generierte 16-stellige Passwort.

Zum eigentlichen versenden von E-Mails wird nodemailer verwendet.
Das wars, ziemlich kompliziert aber auch ziemlich cool.


## Test
Zum Testen ```npm run serve``` eingeben
Im Unterverzeichnis functions !
dabei werden 2 Emulatoren gestartet: der functions Emulator und der auth Emulator
Das wird in package.json unter scrips eingestellt
```
 "serve": "firebase emulators:start --only auth,functions",
 ```
Es gibt auch noch weitere Emulatoren die mit ```firebase init emulators``` installiert werden können
Die Homepage der Emulatoren kann man nach ```npm run serve ``` unter [http://127.0.0.1:4000/](http://127.0.0.1:4000/) erreichen    

## Debuggen
Breakpoint im  im Quellcode als mit  ```debugger;``` einbauen
zum Debuggen ```npm run dev``` aufrufen und dann Chrome mit dem Inspect Link starten
Im Unterverzeichnis functions !

Den Inspect Link bekommt man angezeigt unter der url: ```chrome://inspect/#devices``` 
dort taucht ein inspect Link am Ende auf unter Remote Target (nachdem run dev bei paar sekunden läuft,man braucht die Chromeseite nicht aktualisieren) 
auf den Klicken dann startet der Chrom debugger und das Programm stoppt an der entsprechenden Stelle wenn man von irgendwo (auch von anderen Browsern eine Funktion aufruft) 
und man kann im Single Step Betrieb weiter machen

## Deployen
Actions zum Deployment sind noch nicht implementiert d.h. das deployment muss manuell gemacht werden
Zum Deployen daher ```npm run deploy``` aufrufen
Im Unterverzeichnis functions !

## Logs ansehen
Entweder über die Firebase Console oder im Komandoprompt mit
```firebase functions:log --only <Funktionname>```


# Liste der Cloundfunktionen
Alle Cloundfunktionen sind als v2 Funktionen implementiert ausser ```setcustomuserclaims```. Diese Funktion iszt als v1 Funktion implementiert, da der OnCreateTrigger bei V2 noch nicht zur Verfügung steht. Aus diesem Grund muss auch ```node 20``` in ```package.json``` als node engine verwendet werden, da neuere Node Versionen keine V1 Versionen mehr unterstützen

Folgende Cloundfunktionenen sind implementiert

| Funktion                       | Beschreibung                                                                                   |
|---------------------------------|-----------------------------------------------------------------------------------------------|
| **version**                    | Gibt die aktuelle Version der Firebase Cleanup Functions zurück. (Nur zu Diagnosezwecken)                               |
| **deleteUser**                 | Löscht einen Benutzer anhand der E-Mail-Adresse. Nur für Admins mit gültigem Token erlaubt. (Wird von Firebaselogger verwendet)       |
| **setuserrole**                | Setzt die Rolle eines Benutzers anhand der E-Mail-Adresse. Nur für Admins mit gültigem Token erlaubt.  (Wird von Firebaselogger verwendet)     |
| **listUsers**                  | Gibt eine JSON-Liste aller Benutzer mit UID, E-Mail, Name und Rolle zurück.  Nur für Admins mit gültigem Token erlaubt.  (Wird von Firebaselogger verwendet)      |
| **setcustomuserclaims**        | Setzt beim Anlegen eines neuen Benutzers automatisch die Rolle "Nachbar" und versendet eine E-Mail. (ueber OnCreateTrigger als v1 Funktion implementiert) |
| **helloworld**                 | Gibt eine Begrüßung mit aktuellem Datum und Uhrzeit zurück. (nur als Testfunktion)                                   |
| **pumpenloggingquery**         | Zeigt die Anzahl der zu löschenden PumpenLogging-Datensätze (nur Abfrage, kein Löschen).      |
| **pumpentageswertequery**      | Zeigt die Anzahl der zu löschenden PumpenTageswerte-Datensätze (nur Abfrage, kein Löschen).   |
| **heizungloggingquery**        | Zeigt die Anzahl der zu löschenden HeizungLogging-Datensätze (nur Abfrage, kein Löschen).     |
| **heizungtageswertequery**     | Zeigt die Anzahl der zu löschenden HeizungTageswerte-Datensätze (nur Abfrage, kein Löschen).  |
| **temperaturloggingquery**     | Zeigt die Anzahl der zu löschenden TemperaturLogging-Datensätze (nur Abfrage, kein Löschen).  |
| **temperaturtageswertequery**  | Zeigt die Anzahl der zu löschenden TemperaturTageswerte-Datensätze (nur Abfrage, kein Löschen).|
| **stromtageswertequery**       | Zeigt die Anzahl der zu löschenden StromTageswerte-Datensätze (nur Abfrage, kein Löschen).    |
| **stromloggingquery**          | Zeigt die Anzahl der zu löschenden StromLogging-Datensätze (nur Abfrage, kein Löschen).       |
| **sunlittageswertequery**      | Zeigt die Anzahl der zu löschenden SunlitTageswerte-Datensätze (nur Abfrage, kein Löschen).   |
| **sunlitloggingquery**         | Zeigt die Anzahl der zu löschenden SunlitLogging-Datensätze (nur Abfrage, kein Löschen).      |
| **sunlitloggingcleanup**       | Löscht alte SunlitLogging-Datensätze (wird regelmäßig per Scheduler ausgeführt).              |
| **sunlittageswertecleanup**    | Löscht alte SunlitTageswerte-Datensätze (wird regelmäßig per Scheduler ausgeführt).           |
| **stromloggingcleanup**        | Löscht alte StromLogging-Datensätze (wird regelmäßig per Scheduler ausgeführt).               |
| **pumpenloggingcleanup**       | Löscht alte PumpenLogging-Datensätze (wird regelmäßig per Scheduler ausgeführt).              |
| **pumpentageswertecleanup**    | Löscht alte PumpenTageswerte-Datensätze (wird regelmäßig per Scheduler ausgeführt).           |
| **stromtageswertecleanup**     | Löscht alte StromTageswerte-Datensätze (wird regelmäßig per Scheduler ausgeführt).            |
| **heizungloggingcleanup**      | Löscht alte HeizungLogging-Datensätze (wird regelmäßig per Scheduler ausgeführt).             |
| **heizungtageswertecleanup**   | Löscht alte HeizungTageswerte-Datensätze (wird regelmäßig per Scheduler ausgeführt).          |
| **temperaturloggingcleanup**   | Löscht alte TemperaturLogging-Datensätze (wird regelmäßig per Scheduler ausgeführt).          |
| **temperaturtageswertecleanup**| Löscht alte TemperaturTageswerte-Datensätze (wird regelmäßig per Scheduler ausgeführt).       |

Jede Cleanup-Funktion mit dem Zusatz **cleanup** wird automatisch nach Zeitplan ausgeführt und entfernt alte Einträge aus der jeweiligen Datenbank.

## Löschen alter Datensätze
**Achung:**Die Funktionen zur Abfrage und zum Loeschen alter Datensätze sind nicht passwortgeschützt !!
Jede **cleanup**-Funktion die **query**-Funktionen rufen die interne Funktion 
``` 
aufraeumen(cfgpfad, loeschpfad,boolloeschen, fblog)
```
auf. Hier wird zunächst die Datenbank ```Wasserwerk/CleanupConfig/+cfgpfad``` gelesen aus der ermittelt wird wann die Datensätze als zu alt klassifiziert werden. Danach wird dann die echte Datenbank abgefragt und die zu löschenden Datensätze gezählt bzw. bei **cleanup**-Funktionen auch gleich gelöscht (angegeben über Parameter ```boolloeschen```). Der Parameter ```cfgpfad``` definiert den Eintrag in der CleanupConfig Datenbank und der Parameter ``loeschpfad``` die eigentlichen Pfad in dem die aufzuräumenden Datensätze stehen


