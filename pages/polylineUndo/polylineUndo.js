import Stack from './stack';
import Konva from "konva";
import { createMachine, interpret } from "xstate";

const stage = new Konva.Stage({
    container: "container",
    width: 400,
    height: 400,
});

const undoButton = document.getElementById("undo_button");
const redoButton = document.getElementById("redo_button");


// Une couche pour le dessin
const dessin = new Konva.Layer();
// Une couche pour la polyline en cours de construction
const temporaire = new Konva.Layer();
stage.add(dessin);
stage.add(temporaire);

const MAX_POINTS = 10;
let polyline // La polyline en cours de construction;

class Command {
    execute() {
        //do nothing
    }

    undo() {
        //do nothing
    }
}

class ConcreteCommand extends Command {
    constructor(dessin, line) {
        super();
        this.dessin = dessin;
        this.line = line;
    }
    execute() {
        this.dessin.add(this.line);
    }
    undo() {
        this.line.remove();
    }
}

class UndoManager {
    constructor() {
        this.undoStack = new Stack();
        this.redoStack = new Stack();
    }

    execute(command) {
        try {
            command.execute();
            this.undoStack.push(command);
            this.updateButtonState();
        } catch (e) {
            console.log("Erreur. On ne peut pas exécuter la commande !");
        }

    }

    canUndo() {
        return !this.undoStack.isEmpty();
    }

    canRedo() {
        return !this.redoStack.isEmpty();

    }

    undo() {
        if (this.canUndo()) {
            const commande = this.undoStack.pop();
            commande.undo();
            this.redoStack.push(commande)
            this.updateButtonState();
        }
    }

    redo() {
        if (this.canRedo()) {
            const commande = this.redoStack.pop();
            commande.execute();
            this.undoStack.push(commande)
            this.updateButtonState();
        }
    }

    updateButtonState() {
        undoButton.disabled = !this.canUndo();
        redoButton.disabled = !this.canRedo();
    }
}


const polylineMachine = createMachine(
    {
        /** @xstate-layout N4IgpgJg5mDOIC5QAcD2AbAngGQJYDswA6XCdMAYgFkB5AVQGUBRAYWwEkWBpAbQAYAuohSpYuAC65U+YSAAeiAIwAWAGxEArAGYAHDo0AmA3x2qNqxRoA0ITEoCciosoDsRg-Zf6DWg4pcAvgE2aFh4hETSYAAKqATi1PTMbJy8grJoYpLSsgoIFvZEOpbKij5l9jou9jZ2CIqOzm4+Ospa1YZ8qkEhGDgExFGx8YmMTLQAakz8QkggmRJSMnN5rlpE9ho69j5aWpVtLta2SnxOBjpaDRcWygZqOj3zfeGDhMP4CUywAMYAhsgwDMMqJFjkVkpVAZnNt2mV9tVfFpaohfHwigYNG0NOZVEcdAYnqF+hEALZ-fCYD7iWCjZIcbjAuYLbLLUB5RR8FzrcxaZR8YwXFyuFEIAxeIgubmqPH2eyuExtIkvAZEcmU6m02hjFKMxSzERZJa5U6qHSadp85RYy6KKqirR45xaPhdUqKO1mZTKsKq9VUuKfLVJcY0KZMw1gtnyJRlDREGVQtyGLHWlyiznnW07Uwqe6BYLPX1kikB+K077-QER55G8HsxA6AWaLmeHFVLFQh2FKoGKHy-ZaDRlAu9YvEf2aihMT5gABONZZxohCB2PalRiHpj5JlFAFpOc4PUd2splJcXDLHoXia81aWpwAhP4-ADWsGQL6B6WZoNZJoQFxFHUNp2kuGVrTxZQHWMDEsSHXF8UJG8VRLDVAxpChnzfD8vx4fUQTraNVlUZQikqTo7XsLlqhg9ECXgnEZXxRQtCCQt8FQCA4BBcdCKjAC9zUI9pVUAUvDRZETgQPdPHIvhHC8M12guZCxxJYhSHIfj-xXJwtj7PZPD8WUzR0UU-DIzFTE8UoqmAvkfQ0yJ3gwnTlwbBBTyIfZzz4DRqIJPgrgslQiGs1RbLtIDVEclDx3vdDy3c+sY1XS5JQ0BT2li6zzOkyyE0RD1gv2Kp5XYgIgA */
        id: "polyLine",
        initial: "idle",
        states: {
            idle: {
                on: {
                    MOUSECLICK: {
                        target: "onePoint",
                        actions: "createLine",
                    },
                },
            },
            onePoint: {
                on: {
                    MOUSECLICK: {
                        target: "manyPoints",
                        actions: "addPoint",
                    },
                    MOUSEMOVE: {
                        actions: "setLastPoint",
                    },
                    Escape: { // event.key
                        target: "idle",
                        actions: "abandon",
                    },
                },
            },
            manyPoints: {
                on: {
                    MOUSECLICK: [
                        {
                            actions: "addPoint",
                            cond: "pasPlein",
                        },
                        {
                            target: "idle",
                            actions: ["addPoint", "saveLine"],
                        },
                    ],

                    MOUSEMOVE: {
                        actions: "setLastPoint",
                    },

                    Escape: {
                        target: "idle",
                        actions: "abandon",
                    },

                    Enter: { // event.key
                        target: "idle",
                        actions: "saveLine",
                    },

                    Backspace: [ // event.key
                        {
                            target: "manyPoints",
                            actions: "removeLastPoint",
                            cond: "plusDeDeuxPoints",
                            internal: true,
                        },
                        {
                            target: "onePoint",
                            actions: "removeLastPoint",
                        },
                    ],
                },
            },
        },
    },
    {
        actions: {
            createLine: (context, event) => {
                const pos = stage.getPointerPosition();
                polyline = new Konva.Line({
                    points: [pos.x, pos.y, pos.x, pos.y],
                    stroke: "red",
                    strokeWidth: 2,
                });
                temporaire.add(polyline);
            },
            setLastPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;

                const newPoints = currentPoints.slice(0, size - 2); // Remove the last point
                polyline.points(newPoints.concat([pos.x, pos.y]));
                temporaire.batchDraw();
            },
            saveLine: (context, event) => {
                polyline.remove(); // On l'enlève de la couche temporaire
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                // Le dernier point(provisoire) ne fait pas partie de la polyline
                const newPoints = currentPoints.slice(0, size - 2);
                polyline.points(newPoints);
                polyline.stroke("black"); // On change la couleur
                // On sauvegarde la polyline dans la couche de dessin
                //dessin.add(polyline); // On l'ajoute à la couche de dessin
                undoManager.execute(new ConcreteCommand(dessin, polyline));
            },
            addPoint: (context, event) => {
                const pos = stage.getPointerPosition();
                const currentPoints = polyline.points(); // Get the current points of the line
                const newPoints = [...currentPoints, pos.x, pos.y]; // Add the new point to the array
                polyline.points(newPoints); // Set the updated points to the line
                temporaire.batchDraw(); // Redraw the layer to reflect the changes
            },
            abandon: (context, event) => {
                polyline.remove();
            },
            removeLastPoint: (context, event) => {
                const currentPoints = polyline.points(); // Get the current points of the line
                const size = currentPoints.length;
                const provisoire = currentPoints.slice(size - 2, size); // Le point provisoire
                const oldPoints = currentPoints.slice(0, size - 4); // On enlève le dernier point enregistré
                polyline.points(oldPoints.concat(provisoire)); // Set the updated points to the line
                temporaire.batchDraw(); // Redraw the layer to reflect the changes
            },
        },
        guards: {
            pasPlein: (context, event) => {
                // On peut encore ajouter un point
                return polyline.points().length < MAX_POINTS * 2;
            },
            plusDeDeuxPoints: (context, event) => {
                // Deux coordonnées pour chaque point, plus le point provisoire
                return polyline.points().length > 6;
            },
        },
    }
);

const undoManager = new UndoManager();

const polylineService = interpret(polylineMachine)
    .onTransition((state) => {
        console.log("Current state:", state.value);
    })
    .start();

stage.on("click", () => {
    polylineService.send("MOUSECLICK");
});

stage.on("mousemove", () => {
    polylineService.send("MOUSEMOVE");
});

window.addEventListener("keydown", (event) => {
    console.log("Key pressed:", event.key);
    polylineService.send(event.key);
});

undoButton.addEventListener("click", () => {
    console.log("Bouton Undo appuyé !")
    undoManager.undo();
});

redoButton.addEventListener("click", () => {
    console.log("Bouton Redo appuyé !")
    undoManager.redo();
});