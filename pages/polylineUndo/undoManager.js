import Stack from "./stack";

class UndoManager {
    constructor() {
        this.undoStack = new Stack();
        this.redoStack = new Stack();
    }

    execute(command) {
        try {
            command.execute();
            this.undoStack.push(command);
            this.redoStack = [];
            this.updateButton();
        } catch(e) {
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
            this.updateButton();
        }
    }

    redo() {
        if (this.canRedo()) {
            const commande = this.redoStack.pop();
            commande.execute();
            this.undoStack.push(commande)
            this.updateButton();
        }
    }

    updateButton() {
        undoButton.disabled = !this.canUndo();
        redoButton.disabled = !this.canRedo();   
    }
}

export default UndoManager;