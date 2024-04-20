import Stack from "./stack";

class UndoManager {
    constructor() {
        this.undoStack = new Stack;
        this.redoStack = new Stack;
    }

    execute(commande) {
        commande.execute();
        this.undoStack.push(commande);
        this.redoStack = [];
    }

    canUndo() {
        return !this.undoStack.isEmpty();
    }

    candRedo() {
        return !this.redoStack.isEmpty();
        
    }
}