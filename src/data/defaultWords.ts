export type RawWordPair = [string, string];

export interface WordCategory {
  id: string;
  name: string;
  pairs: RawWordPair[];
}

export const DEFAULT_CATEGORIES_FR: WordCategory[] = [
  {
    id: 'animaux',
    name: '🐱 Animaux',
    pairs: [
      ["Chat", "Chien"],
      ["Lion", "Tigre"],
      ["Singe", "Gorille"],
      ["Cheval", "Poney"],
      ["Dauphin", "Baleine"],
      ["Aigle", "Faucon"],
      ["Souris", "Rat"],
      ["Loup", "Renard"],
      ["Grenouille", "Crapaud"],
      ["Lapin", "Lièvre"],
      ["Abeille", "Guêpe"],
      ["Araignée", "Scorpion"],
      ["Mouton", "Chèvre"],
      ["Vache", "Taureau"],
      ["Panda", "Koala"],
      ["Canard", "Oie"],
      ["Tortue", "Lézard"],
      ["Pingouin", "Manchot"],
      ["Hibou", "Chouette"],
      ["Papillon", "Libellule"]
    ]
  },
  {
    id: 'nourriture',
    name: '🍕 Nourriture & Boisson',
    pairs: [
      ["Pizza", "Flammekueche"],
      ["Burger", "Sandwich"],
      ["Chocolat", "Nutella"],
      ["Café", "Thé"],
      ["Frite", "Chips"],
      ["Coca", "Pepsi"],
      ["Bière", "Vin"],
      ["Pomme", "Poire"],
      ["Fraise", "Framboise"],
      ["Glace", "Sorbet"],
      ["Fromage", "Beurre"],
      ["Croissant", "Pain au chocolat"],
      ["Ketchup", "Moutarde"],
      ["Pâtes", "Riz"],
      ["Sushi", "Maki"],
      ["Jus d'orange", "Limonade"],
      ["Lait", "Crème"],
      ["Miel", "Confiture"],
      ["Poulet", "Dinde"],
      ["Sel", "Poivre"]
    ]
  },
  {
    id: 'objets',
    name: '📱 Objets & Tech',
    pairs: [
      ["Téléphone", "Tablette"],
      ["Ordinateur", "Ordinateur portable"],
      ["Télévision", "Cinéma"],
      ["Livre", "Magazine"],
      ["Stylo", "Crayon"],
      ["Clé", "Badge"],
      ["Voiture", "Moto"],
      ["Vélo", "Trotinette"],
      ["Montre", "Horloge"],
      ["Sac", "Valise"],
      ["Casque", "Écouteurs"],
      ["Lampe", "Bougie"],
      ["Lunettes", "Lentilles"],
      ["Parapluie", "Imperméable"],
      ["Chaise", "Tabouret"],
      ["Bouteille", "Gourde"],
      ["Ciseaux", "Couteau"],
      ["Lit", "Canapé"],
      ["Miroir", "Tableau"],
      ["Savon", "Shampoing"]
    ]
  },
  {
    id: 'activites',
    name: '⚽ Activités & Lieux',
    pairs: [
      ["Football", "Rugby"],
      ["Tennis", "Ping-pong"],
      ["Piscine", "Plage"],
      ["Cinéma", "Théâtre"],
      ["Forêt", "Parc"],
      ["Montagne", "Campagne"],
      ["Hôtel", "Camping"],
      ["Musique", "Chanson"],
      ["Course", "Marche"],
      ["Lecture", "Écriture"],
      ["Voyage", "Vacances"],
      ["École", "Université"],
      ["Restaurant", "Bar"],
      ["Musée", "Galerie d'art"],
      ["Jeux vidéo", "Jeux de société"],
      ["Château", "Palais"],
      ["Boulangerie", "Pâtisserie"],
      ["Avion", "Train"],
      ["Ski", "Snowboard"],
      ["Danse", "Théâtre"]
    ]
  }
];

export const DEFAULT_CATEGORIES_EN: WordCategory[] = [
  {
    id: 'animals',
    name: '🐱 Animals',
    pairs: [
      ["Cat", "Dog"],
      ["Lion", "Tiger"],
      ["Monkey", "Gorilla"],
      ["Horse", "Pony"],
      ["Dolphin", "Whale"],
      ["Eagle", "Falcon"],
      ["Mouse", "Rat"],
      ["Wolf", "Fox"],
      ["Frog", "Toad"],
      ["Rabbit", "Hare"],
      ["Bee", "Wasp"],
      ["Spider", "Scorpion"],
      ["Sheep", "Goat"],
      ["Cow", "Bull"],
      ["Panda", "Koala"],
      ["Duck", "Goose"],
      ["Turtle", "Lizard"],
      ["Penguin", "Puffin"],
      ["Owl", "Falcon"],
      ["Butterfly", "Dragonfly"]
    ]
  },
  {
    id: 'food',
    name: '🍕 Food & Drink',
    pairs: [
      ["Pizza", "Flatbread"],
      ["Burger", "Sandwich"],
      ["Chocolate", "Nutella"],
      ["Coffee", "Tea"],
      ["Fries", "Chips"],
      ["Cola", "Pepsi"],
      ["Beer", "Wine"],
      ["Apple", "Pear"],
      ["Strawberry", "Raspberry"],
      ["Ice Cream", "Sorbet"],
      ["Cheese", "Butter"],
      ["Croissant", "Danish"],
      ["Ketchup", "Mustard"],
      ["Pasta", "Rice"],
      ["Sushi", "Sashimi"],
      ["Orange Juice", "Lemonade"],
      ["Milk", "Cream"],
      ["Honey", "Jam"],
      ["Chicken", "Turkey"],
      ["Salt", "Pepper"]
    ]
  },
  {
    id: 'objects',
    name: '📱 Objects & Tech',
    pairs: [
      ["Phone", "Tablet"],
      ["Computer", "Laptop"],
      ["Television", "Projector"],
      ["Book", "Magazine"],
      ["Pen", "Pencil"],
      ["Key", "Access Card"],
      ["Car", "Motorcycle"],
      ["Bicycle", "Scooter"],
      ["Watch", "Clock"],
      ["Bag", "Suitcase"],
      ["Headphones", "Earbuds"],
      ["Lamp", "Candle"],
      ["Glasses", "Contact Lenses"],
      ["Umbrella", "Raincoat"],
      ["Chair", "Stool"],
      ["Bottle", "Flask"],
      ["Scissors", "Knife"],
      ["Bed", "Couch"],
      ["Mirror", "Painting"],
      ["Soap", "Shampoo"]
    ]
  },
  {
    id: 'activities',
    name: '⚽ Activities & Places',
    pairs: [
      ["Soccer", "Rugby"],
      ["Tennis", "Ping-pong"],
      ["Pool", "Beach"],
      ["Cinema", "Theater"],
      ["Forest", "Park"],
      ["Mountain", "Countryside"],
      ["Hotel", "Camping"],
      ["Music", "Song"],
      ["Running", "Walking"],
      ["Reading", "Writing"],
      ["Travel", "Vacation"],
      ["School", "University"],
      ["Restaurant", "Bar"],
      ["Museum", "Art Gallery"],
      ["Video Games", "Board Games"],
      ["Castle", "Palace"],
      ["Bakery", "Pastry Shop"],
      ["Airplane", "Train"],
      ["Skiing", "Snowboarding"],
      ["Dancing", "Acting"]
    ]
  }
];
