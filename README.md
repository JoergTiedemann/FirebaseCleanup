# FirebaseCleanup
Firebasefunktionen um die Realtíme Datenbank von alten Loggereintraegen aufzuraeumen
Achtung: Firebasefunktionen müssen komplett klein geschrieben sein !!!

Zum Arbeiten immer den Develop branch verwenden


## Initialisieren und Projekt aufsetzen
im Verzeichnis ```firebase init functions``` aufrufen
Install dependencies with npm am Ende mit Y beantworten und Eslint auch verwenden

## Test
Zum Testen ```npm run serve``` eingeben
Im Unterverzeichnis functions !

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
  