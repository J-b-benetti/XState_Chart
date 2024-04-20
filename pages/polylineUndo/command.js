class Commande {
    constructor(dessin, line) {
        this._dessin = dessin; //on créé un attribut privé "dessin"
        this._line = line; //on créé un attribut privé "line"
    }

    execute() {
        this._dessin.add(this._line);
    }

    undo() {
        this._line.remove();
    }
}

export default Commande;