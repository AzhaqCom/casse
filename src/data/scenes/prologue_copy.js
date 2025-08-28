
/**
 * Scénario Épique - La Refonte de l'Amulette Céleste
 * Un nouveau prologue centré sur une quête héroïque.
 */

import { SCENE_TYPES } from '../../types/story';
import village from '../../assets/village-ravenscroft.jpg';
import tavernier from '../../assets/tom-aubergiste.jpg';
import tunnel from '../../assets/tunnels.jpg';
import carte from '../../assets/map-raven.jpg';
import tyrion from '../../assets/tyrion.png';
import rhingann from '../../assets/rhingann.png';
import malathor from '../../assets/malathor.png';

export const newPrologue = {

  // ===============================
  // PHASE 1: L'APPEL CÉLESTE
  // ===============================

  "celestial_calling": {
    id: 'celestial_calling',
    type: SCENE_TYPES.TEXT,
    content: {
      title: ` L'Appel des Astres `,
      text: `Une nuit, alors que vous observiez le ciel, une étoile filante a dévié de sa course pour atterrir dans un fracas assourdissant non loin de votre position. Sur le lieu de l'impact, vous n'avez trouvé aucun météore, mais un cristal qui pulsait d'une douce lumière. En le touchant, une vision vous a submergé : le monde menacé par une "Dissonance" cosmique, une force entropique qui consume toute chose. Une voix ancienne a résonné dans votre esprit, vous révélant que seule l'Amulette Céleste, un artefact capable d'harmoniser les énergies du monde, pouvait arrêter la Dissonance. Malheureusement, l'Amulette a été brisée en trois fragments, dispersés à travers le royaume. La vision vous a montré trois lieux, trois gardiens, trois voies.`,
    },
    choices: [
      {
        text: 'Accepter votre destinée et commencer la quête',
        next: 'sanctuary_hub',
      }
    ],
    metadata: {
      chapter: 'prologue',
      location: 'Collines Isolées',
    }
  },

  "sanctuary_hub": {
    id: 'sanctuary_hub',
    type: SCENE_TYPES.TEXT,
    content: {
      title: `Le Sanctuaire de l'Aube`,
      text: `Guidé par le cristal, vous découvrez un sanctuaire caché, un havre de paix baigné d'une lumière éthérée. Au centre se trouve un autel où repose l'Amulette Céleste, ou ce qu'il en reste. Trois emplacements vides attendent les fragments perdus. Le cristal flotte au-dessus de l'autel, projetant trois images : une tour d'astronome, une arène de gladiateurs et les bas-fonds d'une cité portuaire. Lequel de ces chemins choisirez-vous en premier ?`,
      variations: {
        one_fragment: `Un premier fragment a rejoint sa place sur l'autel, son énergie restaurant une partie du sanctuaire. Deux chemins restent à parcourir.`,
        two_fragments: `Deux fragments brillent de concert, leur puissance combinée faisant vibrer l'air. La victoire est proche. Un dernier effort est nécessaire.`,
      }
    },
    conditions: {
      show_variation: {
        one_fragment: "(gameFlags.wisdom_path_complete || gameFlags.courage_path_complete || gameFlags.intrigue_path_complete) && !(gameFlags.wisdom_path_complete && gameFlags.courage_path_complete && gameFlags.intrigue_path_complete)",
        two_fragments: "(gameFlags.wisdom_path_complete && gameFlags.courage_path_complete) || (gameFlags.wisdom_path_complete && gameFlags.intrigue_path_complete) || (gameFlags.courage_path_complete && gameFlags.intrigue_path_complete)",
      }
    },
    choices: [
      {
        text: ' emprunter la Voie de la Sagesse',
        next: 'wisdom_path_start',
        condition: '!gameFlags.wisdom_path_complete',
      },
      {
        text: ' emprunter la Voie du Courage',
        next: 'courage_path_start',
        condition: '!gameFlags.courage_path_complete',
      },
      {
        text: ` emprunter la Voie de l'Intrigue`,
        next: 'intrigue_path_start',
        condition: '!gameFlags.intrigue_path_complete',
      },
      {
        text: `Reforger l'Amulette`,
        next: 'reforging_the_amulet',
        condition: 'gameFlags.wisdom_path_complete && gameFlags.courage_path_complete && gameFlags.intrigue_path_complete',
      }
    ]
  },

  // ===============================
  // BRANCHE 1: VOIE DE LA SAGESSE
  // ===============================

  "wisdom_path_start": {
    id: 'wisdom_path_start',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: `La Tour de l'Archiviste`,
      description: `Vous arrivez devant une tour vertigineuse qui semble toucher les étoiles. À l'entrée, un homme âgé à la barbe chenue vous attend, un sourire malicieux aux lèvres. C'est Tyrion, l'Archiviste des Savoirs Célestes.`,
      text: `"Je vous attendais, jeune Élu. La Gemme de Clarté est à vous, si vous prouvez que votre esprit est aussi vif que votre ambition. L'observatoire est un labyrinthe d'énigmes. Ne vous perdez pas dans les méandres du savoir."`,
      portrait: tyrion,
      speaker: 'Tyrion',
    },
    choices: [
      {
        text: `Relever le défi de l'Archiviste`,
        next: 'wisdom_puzzle_room',
      }
    ]
  },

  "wisdom_puzzle_room": {
    id: 'wisdom_puzzle_room',
    type: SCENE_TYPES.TEXT,
    content: {
      title: `L'Énigme des Constellations`,
      text: `Tyrion vous mène dans une salle circulaire dont le plafond est une réplique parfaite du ciel nocturne. Au centre, un piédestal porte une inscription : "Je n'ai pas de voix, mais je raconte des histoires millénaires. Je n'ai pas de corps, mais je guide les voyageurs perdus. Qui suis-je ?" Trois constellations brillent plus fort que les autres : le Guerrier, le Dragon, et le Navire.`,
    },
    choices: [
      {
        text: 'Toucher la constellation du Guerrier',
        next: 'wisdom_puzzle_fail',
      },
      {
        text: 'Toucher la constellation du Dragon',
        next: 'wisdom_puzzle_fail',
      },
      {
        text: 'Toucher la constellation du Navire',
        next: 'wisdom_puzzle_success',
      }
    ]
  },

  "wisdom_puzzle_fail": {
    id: 'wisdom_puzzle_fail',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Réponse Incorrecte',
      text: `La constellation que vous touchez s'éteint. Tyrion secoue la tête. "La précipitation est l'ennemie de la sagesse. Réessayez, mais méditez davantage sur la nature de l'énigme."`,
    },
    choices: [
      {
        text: 'Réessayer',
        next: 'wisdom_puzzle_room',
      }
    ]
  },

  "wisdom_puzzle_success": {
    id: 'wisdom_puzzle_success',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: 'La Voie Révélée',
      description: `La constellation du Navire brille intensément, projetant un escalier de lumière vers le sommet de la tour. Tyrion hoche la tête, approbateur.`,
      text: `"Excellent. Les étoiles guident ceux qui savent lire leur langage. L'épreuve finale vous attend au sommet. Il s'agit d'un choix, et non d'une énigme."`,
      portrait: tyrion,
      speaker: 'Tyrion',
    },
    choices: [
      {
        text: `Monter l'escalier de lumière`,
        next: 'wisdom_final_choice',
      }
    ]
  },

  "wisdom_final_choice": {
    id: 'wisdom_final_choice',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Le Choix du Savoir',
      text: `Au sommet de la tour, la Gemme de Clarté flotte au-dessus d'un livre ancien. Le livre contient un savoir interdit, une puissance immense mais corruptrice. Tyrion vous observe. "Vous pouvez prendre la Gemme et partir, ou lire le livre et acquérir un pouvoir dangereux en plus de la Gemme. Que ferez-vous ?"`,
    },
    choices: [
      {
        text: 'Prendre la Gemme de Clarté uniquement (Issue 1)',
        next: 'sanctuary_hub',
        consequences: { items: { gem_of_clarity: 1 }, flags: { wisdom_path_complete: true, tyrion_respect: true }, reputation: { scholars: 10 } }
      },
      {
        text: 'Lire le livre, puis prendre la Gemme (Issue 2)',
        next: 'sanctuary_hub',
        consequences: { items: { gem_of_clarity: 1 }, flags: { wisdom_path_complete: true, forbidden_knowledge: true, tyrion_respect: false }, special_abilities: ['power_surge'] }
      }
    ]
  },

  // ===============================
  // BRANCHE 2: VOIE DU COURAGE
  // ===============================

  "courage_path_start": {
    id: 'courage_path_start',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: `L'Arène du Lion`,
      description: `Votre quête vous mène à une arène monumentale taillée dans la roche. Une femme à la carrure imposante et à l'armure étincelante vous y attend. C'est Rhingann, la championne invaincue.`,
      text: `"Alors c'est vous que les étoiles ont choisi. L'Éclat de Bravoure est ma récompense la plus précieuse, offerte au vainqueur du Grand Tournoi. Il est actuellement dans l'antre de la Chimère, la bête que je dois affronter pour clore les jeux. Venez. Prouvez votre courage."`,
      portrait: rhingann,
      speaker: 'Rhingann',
    },
    choices: [
      {
        text: 'Accepter de faire face à la Chimère',
        next: 'courage_chimera_lair',
      }
    ]
  },

  "courage_chimera_lair": {
    id: 'courage_chimera_lair',
    type: SCENE_TYPES.TEXT,
    content: {
      title: `L'Antre de la Chimère`,
      text: `Rhingann vous guide jusqu'à une caverne sombre d'où émanent une chaleur intense et des grognements terrifiants. L'Éclat de Bravoure est visible, enchâssé dans un rocher au fond de la grotte. La Chimère, une créature monstrueuse à trois têtes, dort près de lui.`,
    },
    choices: [
      {
        text: 'Attaquer la bête de front avec Rhingann',
        next: 'courage_combat_chimera',
      },
      {
        text: `Tenter de récupérer l'Éclat en toute discrétion`,
        next: 'courage_stealth_attempt',
      }
    ]
  },

  "courage_combat_chimera": {
    id: 'courage_combat_chimera',
    type: SCENE_TYPES.COMBAT,
    content: {
      title: 'Combat contre la Chimère',
      text: `Vous et Rhingann chargez la bête. Le combat est féroce, les flammes, le venin et les griffes s'abattent sur vous !`,
      ambush: false
    },
    enemies: [
      { type: 'chimera', count: 1 }
    ],
    onVictory: {
      text: `Récupérer l'Éclat de Bravoure (Issue 1)`,
      next: 'sanctuary_hub',
      consequences: { items: { shard_of_valor: 1 }, flags: { courage_path_complete: true, rhingann_ally: true }, companions: ['rhingann'] }
    }
  },

  "courage_stealth_attempt": {
    id: 'courage_stealth_attempt',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Approche Furtive',
      text: `Vous tentez de vous faufiler pendant que Rhingann fait diversion. Vous êtes presque à portée de l'Éclat, mais un caillou roule sous votre pied. La Chimère ouvre un œil...`,
    },
    choices: [
      {
        text: `Persister et arracher l'Éclat (Issue 2)`,
        next: 'sanctuary_hub',
        consequences: { items: { shard_of_valor: 1 }, flags: { courage_path_complete: true, rhingann_ally: false }, text: "Vous arrachez l'Éclat et fuyez, laissant Rhingann seule face à la bête furieuse. Elle survit, mais ne vous pardonnera jamais cette lâcheté." }
      },
      {
        text: 'Abandonner la furtivité et combattre',
        next: 'courage_combat_chimera',
      }
    ]
  },

  // ===============================
  // BRANCHE 3: VOIE DE L'INTRIGUE
  // ===============================

  "intrigue_path_start": {
    id: 'intrigue_path_start',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: 'Les Bas-Fonds de Port-Nébuleux',
      description: `Vous plongez dans le dédale des ruelles sombres de Port-Nébuleux. Dans une taverne clandestine, un homme vêtu de soie sombre vous fait signe. C'est Malathor, le maître de la Guilde des Murmures.`,
      text: `"L'Élu, en personne. Quelle audace. La Rune des Murmures que vous cherchez est en ma possession. Je suis un homme d'affaires. Je vous la céderai, mais tout a un prix. J'ai besoin que vous récupériez un objet pour moi : le journal d'un capitaine de la garde corrompu."`,
      portrait: malathor,
      speaker: 'Malathor',
    },
    choices: [
      {
        text: 'Accepter le marché de Malathor',
        next: 'intrigue_heist_plan',
      },
      {
        text: 'Refuser et tenter de voler la Rune directement',
        next: 'intrigue_direct_theft',
      }
    ]
  },

  "intrigue_heist_plan": {
    id: 'intrigue_heist_plan',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Le Plan du Casse',
      text: `Malathor détaille son plan. Le journal se trouve dans le bureau du capitaine, au sein de la caserne de la garde. La sécurité est maximale. Il vous propose deux approches : une infiltration discrète par les toits, ou créer une diversion bruyante pour détourner l'attention des gardes.`,
    },
    choices: [
      {
        text: `Choisir l'infiltration par les toits`,
        next: 'intrigue_heist_success',
      },
      {
        text: 'Créer une diversion',
        next: 'intrigue_heist_success',
      }
    ]
  },

  "intrigue_heist_success": {
    id: 'intrigue_heist_success',
    type: SCENE_TYPES.DIALOGUE,
    content: {
      title: 'Un Échange de Bons Procédés',
      description: `Vous réussissez à récupérer le journal et le remettez à Malathor. Il le parcourt avec un sourire satisfait.`,
      text: `"Excellent travail. Un accord est un accord." Il vous tend la Rune des Murmures. "Sachez que vous avez rendu un grand service à la Guilde. Nous nous en souviendrons."`,
      portrait: malathor,
      speaker: 'Malathor',
    },
    choices: [
      {
        text: 'Prendre la Rune et partir (Issue 1)',
        next: 'sanctuary_hub',
        consequences: { items: { runestone_of_whispers: 1 }, flags: { intrigue_path_complete: true, malathor_pact: true }, reputation: { thieves_guild: 15 } }
      }
    ]
  },

  "intrigue_direct_theft": {
    id: 'intrigue_direct_theft',
    type: SCENE_TYPES.TEXT,
    content: {
      title: 'Trahison et Fuite',
      text: `Vous décidez de doubler Malathor et de voler la Rune. Après une course-poursuite effrénée à travers les ruelles de la ville, vous parvenez à lui échapper avec la Rune. Mais vous vous êtes fait un ennemi puissant. Des affiches "mort ou vif" avec votre portrait apparaissent déjà sur les murs.`,
    },
    choices: [
      {
        text: 'Fuir la ville avec la Rune (Issue 2)',
        next: 'sanctuary_hub',
        consequences: { items: { runestone_of_whispers: 1 }, flags: { intrigue_path_complete: true, malathor_pact: false }, reputation: { thieves_guild: -50 } }
      }
    ]
  },

  // ===============================
  // PHASE FINALE: LA REFONTE
  // ===============================

  "reforging_the_amulet": {
    id: 'reforging_the_amulet',
    type: SCENE_TYPES.TEXT,
    content: {
      title: `L'Amulette Reforgée`,
      text: `Les trois fragments sont réunis. Vous les placez sur l'autel du Sanctuaire de l'Aube. Une lumière aveuglante jaillit, et les morceaux fusionnent pour reformer l'Amulette Céleste. Sa puissance parcourt votre corps, vous préparant aux épreuves à venir. La Dissonance a été contenue, mais pas vaincue. Votre véritable quête ne fait que commencer.`,
  },
  choices: [
    {
      text: `Continuer vers l'Acte I: La Guerre contre la Dissonance`,
        next: 'acte1_start',
      consequences: { flags: { prologue_complete: true } }
    }
  ]
}
};

export default newPrologue;
