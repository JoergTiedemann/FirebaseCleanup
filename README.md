# FirebaseCleanup
Firebasefunktionen um die Realtíme Datenbank von alten Loggereintraegen aufzuraeumen
Achtung: Firebasefunktionen müssen komplett klein geschrieben sein (nach neusten Infos muss das wohl nicht mehr so sein) !!!

Zum Arbeiten immer den Develop branch verwenden


## Initialisieren und Projekt aufsetzen
im Verzeichnis ```firebase init functions``` aufrufen
Install dependencies with npm am Ende mit Y beantworten und Eslint auch verwenden

### verwendete Node Engine
normalerweise wird die node engine 22 verwendet. Da aber der Trigger setcustomuserclaim, der bei anlegen eines neues firebaseusers die Standardbenuterrolle setzt, noch nach v1 implementiert ist (weil es ich mit v2 nicht hinbekommen habe) muss die Node Engine auf 20 geändert werden in der package.json da node 22 kein v1 mehr supported. In Package.json muss daher stehen:
```
  "engines": {
    "node": "20"
  },
  ```

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


Das wars !
  