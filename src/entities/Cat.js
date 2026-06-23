// ==========================================
// Entités Chat — modèle de données du CdC (§5.2).
// 4 statistiques : maxpv, atk, def, vit. Le critique est DÉRIVÉ de vit
// (vit/350) et n'est donc pas stocké.
// Valeurs réglées à la main par type (le budget auto de 100 pts est écarté).
// ==========================================

export class Cat {
  constructor(name, asset = "") {
    this.id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    this.name = name;
    this.asset = asset; // référence du sprite (emoji placeholder pour l'instant)
    this.type = "base"; // 'domestique' | 'base' | 'sauvage'
    this.item = null;
    this.lvl = 1;
    this.wins = 0;

    // Statistiques (4)
    this.maxpv = 100;
    this.atk = 20;
    this.def = 10;
    this.vit = 15;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      asset: this.asset,
      type: this.type,
      item: this.item,
      lvl: this.lvl,
      wins: this.wins,
      maxpv: this.maxpv,
      atk: this.atk,
      def: this.def,
      vit: this.vit,
    };
  }
}

// Domestique : « tank » — bonus PV/DEF, malus ATK/VIT
export class DomesticCat extends Cat {
  constructor(name, asset = "") {
    super(name, asset);
    this.type = "domestique";
    this.maxpv = 130;
    this.atk = 12;
    this.def = 20;
    this.vit = 8;
  }
}

// Sauvage : « offensif » — bonus ATK/VIT, malus PV/DEF
export class WildCat extends Cat {
  constructor(name, asset = "") {
    super(name, asset);
    this.type = "sauvage";
    this.maxpv = 80;
    this.atk = 35;
    this.def = 5;
    this.vit = 25;
  }
}
