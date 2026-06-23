export class Cat {
  constructor(name, sprite = "") {
    this.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    this.name = name;
    this.sprite = sprite;
    this.type = "Base";
    this.item = null;
    
    // Stats de base
    this.pv = 100;
    this.attack = 20;
    this.defense = 10; // %
    this.speed = 15; // %
    this.crit = 15; // %
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      sprite: this.sprite,
      type: this.type,
      item: this.item,
      pv: this.pv,
      attack: this.attack,
      defense: this.defense,
      speed: this.speed,
      crit: this.crit
    };
  }
}

export class DomesticCat extends Cat {
  constructor(name, sprite = "") {
    super(name, sprite);
    this.type = "Domestique";
    this.pv = 125;
    this.attack = 12;
    this.defense = 20;
    this.speed = 8;
    this.crit = 15;
  }
}

export class WildCat extends Cat {
  constructor(name, sprite = "") {
    super(name, sprite);
    this.type = "Sauvage";
    this.pv = 80;
    this.attack = 35;
    this.defense = 5;
    this.speed = 25;
    this.crit = 20;
  }
}
