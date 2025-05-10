# FirebaseCleanup
Firebasefunktionen um die Realtíme Datenbank von alten Loggereintraegen aufzuraeumen
Achtung: Firebasefunktionen müssen komplett klein geschrieben sein !!!

Zum Arbeiten immer den Develop branch verwenden


## Initialisieren und Projekt aufsetzen
im Verzeichnis firebase init functions aufrufen
Install dependencies with npm am Ende mit Y beantworten und Eslint auch verwenden

## Test
Zum Testen npm run serve eingeben
Im Unterverzeichnis functions !

## Debuggen
Breakpoint im  im Quellcode als mit  debugger; einbauen
zum Debuggen npm run dev aufrufen und dann Chrome mit dem Inspect Linke starten
Im Unterverzeichnis functions !

Den Inspect Link bekommt man angezeigt unter der url: chrome://inspect/#devices 
dort taucht ein inpect Link am Ende auf unter Remote Target 
auf den Klicken dann startet der Chrom debugger und das Programm stoppt an der entsprechenden Stelle 
und man kann im Single Step Betrieb weiter machen

## Deployen
Actions zum Deployment sind noch nicht implementiert d.h. das deployment muss manuell gemacht werden
Zum Deployen daher npn run deploy aufrufen
Im Unterverzeichnis functions !

Das wars !
  