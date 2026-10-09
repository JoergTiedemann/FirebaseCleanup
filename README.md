# FirebaseCleanup
Firebasefunktionen um die Realtíme Datenbank von alten Loggereintraegen aufzuraeumen und Bereitstellung von Firebasefunktionen für das Benutzermanagement (Listen der User, Vergabe der Benutzerrollen, Loeschen der User und Setzen einer Defaultrolle für neu angelegte User)

Achtung: Firebasefunktionen müssen komplett klein geschrieben sein (nach neusten Infos muss das wohl nicht mehr so sein) !!!

Zum Arbeiten immer den Develop branch verwenden

## Initialisieren und Projekt aufsetzen
im Verzeichnis ```firebase init functions``` aufrufen
Install dependencies with npm am Ende mit Y beantworten und Eslint auch verwenden

### verwendete Node Engine
normalerweise wird die node engine 24 verwendet, da der Trigger setcustomuserclaims, der bei anlegen eines neues firebaseusers die Standardbenutzerrolle setzt inzwischen in V2 implementiert wurde. In Package.json muss daher stehen:
```
  "engines": {
    "node": "24"
  },
  ```

siehe hierzu auch: https://github.com/firebase/firebase-functions/issues/1383#issuecomment-3223208410
Weiterhin brauchen wir für den Trigger onUserCreated mindestens:
```
 firebase-admin Version 14.4.0
 firebase-functions Version 7.4.0
```
und für den Emulator die Firebase-Tools in Version 15.33.0
weiterhin muss Node V24 installiert sein (ganz normal von https://nodejs.org/ downloaden und dann als Windows Programm installieren)  
Damit die Node-Module aus der package.json installiert werden einfach ```npm install``` aufrufen

### versenden von E-Mails bei neu Anlegen eines users
Beim Neuanlegen eines Users wird eine E-Mail von tiedemann.joerg@gmail.com an joerg-tiedemann@gmx.de geschickt
Die Zugangsdaten zu tiedemann.joerg@gmail.com sind in Google Cloud Secrets gespeichert die beim E-Mail Versand abgefragt wird.  
die früher verwendete firebase config api wird nicht mehr verwendet da dieses für Mätz 2017 abgkündigt ist  
Anlegen des Secret incl. aller notwendigen Rechte macht man mit:
```
firebase functions:secrets:set GMAIL_EMAIL
firebase functions:secrets:set GMAIL_PASSWORD
```
Dabei wird nach jedem Befehl der Wert eingegeben.
Als E-Mail tiedemann.joerg@gmail.com und als Passwort das App-Passwort für Mail das bei Google hinterlegt ist.
Die Eingabe wird nicht angezeigt. Man kann sich die Secrets aber auch in der Google Cloud Console im Secret Manaager anzeigen lassen oder durch den Befehl: 
```
firebase functions:secrets:access GMAIL_EMAIL
firebase functions:secrets:access GMAIL_PASSWORD
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

Wenn beim Deployment folgende Fehlermeldung kommt:  
```
Error: User code failed to load. Cannot determine backend specification. Timeout after 10000. See https://firebase.google.com/docs/functions/tips#avoid_deployment_timeouts_during_initialization'
```
dann einfach noch einmal probieren

## Logs ansehen
Entweder über den Emulator dort sieht man die Logs in der Terminalkonsole vom Visual Studio  
oder in der Firebase Console und dann bei den 3 Punkten die Detailierte Nutzungsanalyse auswählen und dann den Tab Logs  
Im Komandoprompt mit geht das auch:  
```firebase functions:log --only <Funktionname>```  
Dabei ist ```<Funktionname>``` der echte Funktionsname ohne URL also z.B. ```firebase functions:log --only listUsers``` für die Funktion listUsers

# Liste der Cloundfunktionen
Alle Cloundfunktionen sind als v2 Funktionen implementiert.  
Folgende Cloundfunktionenen sind implementiert

| Funktion                       | Beschreibung                                                                                   |
|---------------------------------|-----------------------------------------------------------------------------------------------|
| **version**                    | Gibt die aktuelle Version der Firebase Cleanup Functions zurück. (Nur zu Diagnosezwecken)                               |
| **deleteUser**                 | Löscht einen Benutzer anhand der E-Mail-Adresse. Nur für Admins mit gültigem Token erlaubt. (Wird von Firebaselogger verwendet)       |
| **setuserrole**                | Setzt die Rolle eines Benutzers anhand der E-Mail-Adresse. Nur für Admins mit gültigem Token erlaubt.  (Wird von Firebaselogger verwendet)     |
| **listUsers**                  | Gibt eine JSON-Liste aller Benutzer mit UID, E-Mail, Name und Rolle zurück.  Nur für Admins mit gültigem Token erlaubt.  (Wird von Firebaselogger verwendet)      |
| **setcustomuserclaims**        | Setzt beim Anlegen eines neuen Benutzers automatisch die Rolle "Nachbar" und versendet eine E-Mail. (ueber onUserCreate Trigger als v2 Funktion implementiert) |
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


