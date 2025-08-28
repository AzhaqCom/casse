/**
 * INTERFACES ET TYPES CRITIQUES - COMBAT STORE
 * 
 * Définit les structures de données partagées utilisées dans combatStore
 * et les futurs services spécialisés.
 * 
 * ⚠️ CRITIQUE : Ces interfaces doivent rester STABLES durant refactorisation
 */

/**
 * @typedef {Object} CombatPositions
 * @description État partagé des positions de toutes les entités sur la grille
 * @property {GridPosition} player - Position du joueur
 * @property {GridPosition} [companion_*] - Positions des compagnons (key dynamique)
 * @property {GridPosition} [enemy_name] - Positions des ennemis (key = enemy.name)
 * 
 * @example
 * {
 *   player: {x: 2, y: 3},
 *   companion_1: {x: 1, y: 4},
 *   Gobelin_1: {x: 5, y: 1}
 * }
 */

/**
 * @typedef {Object} GridPosition
 * @description Position sur la grille de combat (10x10)
 * @property {number} x - Coordonnée X (0-9)
 * @property {number} y - Coordonnée Y (0-9)
 */

/**
 * @typedef {Object} CombatEnemy
 * @description Instance d'ennemi en combat (état mutable)
 * @property {string} name - Identifiant unique (ex: "Gobelin_1")
 * @property {string} template - Template de base (ex: "goblin")
 * @property {number} currentHP - Points de vie actuels
 * @property {number} maxHP - Points de vie maximum
 * @property {number} level - Niveau de l'ennemi
 * @property {number} initiative - Valeur d'initiative
 * @property {Object} [stats] - Statistiques complètes
 * @property {Array} [effects] - Effets temporaires actifs
 * @property {Object} [spells] - Sorts disponibles
 */

/**
 * @typedef {Object} TurnData
 * @description Entrée dans l'ordre d'initiative
 * @property {'player'|'enemy'|'companion'} type - Type d'entité
 * @property {string} [name] - Nom pour enemy/companion
 * @property {Object} [character] - Données caractère pour player/companion
 * @property {number} initiative - Valeur d'initiative (tri DESC)
 */

/**
 * @typedef {Object} PlayerTurnState
 * @description État des actions disponibles pour le tour du joueur
 * @property {PlayerActionsUsed} actionsUsed - Actions déjà utilisées
 * @property {number} remainingMovement - Cases de mouvement restantes
 * @property {boolean} canEndTurn - Peut terminer le tour
 */

/**
 * @typedef {Object} PlayerActionsUsed
 * @description Actions consommées durant le tour
 * @property {boolean} movement - A utilisé du mouvement
 * @property {boolean} action - A utilisé l'action principale
 * @property {boolean} bonusAction - A utilisé l'action bonus
 * @property {boolean} [reaction] - A utilisé la réaction
 */

/**
 * @typedef {Object} OpportunityAttack
 * @description Attaque d'opportunité déclenchée par mouvement
 * @property {string} attackerId - ID de l'attaquant
 * @property {string} targetId - ID de la cible
 * @property {GridPosition} attackerPosition - Position de l'attaquant
 * @property {number} [damage] - Dégâts infligés (après résolution)
 */

/**
 * @typedef {Object} ActionResult
 * @description Résultat d'une action exécutée
 * @property {boolean} success - Action réussie
 * @property {Array<DamageResult>} [damage] - Dégâts infligés
 * @property {Array<HealingResult>} [healing] - Soins prodigués
 * @property {Array<EffectResult>} [effects] - Effets appliqués
 * @property {Array<string|MessageObject>} [messages] - Messages de combat
 */

/**
 * @typedef {Object} DamageResult
 * @description Dégâts à appliquer à une cible
 * @property {string} targetId - ID de la cible
 * @property {number} damage - Montant des dégâts
 * @property {string} [type] - Type de dégâts ('physical', 'fire', etc.)
 * @property {boolean} [critical] - Coup critique
 */

/**
 * @typedef {Object} HealingResult
 * @description Soins à appliquer à une cible
 * @property {string} targetId - ID de la cible
 * @property {number} amount - Montant des soins
 * @property {string} [source] - Source des soins
 */

/**
 * @typedef {Object} EffectResult
 * @description Effet (buff/debuff) à appliquer
 * @property {string} targetId - ID de la cible
 * @property {'buff'|'debuff'} type - Type d'effet
 * @property {string} effectType - Nom du type d'effet
 * @property {number} [duration] - Durée en tours
 * @property {number} [intensity] - Intensité de l'effet
 * @property {string} [source] - Source de l'effet
 */

/**
 * @typedef {Object} MessageObject
 * @description Message de combat avec type
 * @property {string} text - Texte du message
 * @property {'damage'|'healing'|'buff'|'debuff'|'info'|'victory'|'defeat'} [type] - Type de message
 */

/**
 * @typedef {Object} CombatCallbacks
 * @description Callbacks vers stores externes (characterStore, gameStore)
 * @property {function(number, string=): void} onPlayerDamage - Dégâts joueur
 * @property {function(string, number, string=): void} onCompanionDamageById - Dégâts compagnon
 * @property {function(string, string=): void} [onCombatMessage] - Message de combat
 */

/**
 * @typedef {Object} CombatState
 * @description État métadata du combat (non partagé)
 * @property {boolean} isActive - Combat en cours
 * @property {boolean} isInitialized - Combat initialisé
 * @property {'idle'|'initiative-display'|'turn'|'end'} combatPhase - Phase actuelle
 * @property {number} combatKey - Clé React pour forcer re-render
 * @property {Object} [encounterData] - Données de la rencontre
 * @property {boolean} victory - Combat gagné
 * @property {boolean} defeated - Combat perdu
 * @property {number} totalXpGained - XP gagnée totale
 */

/**
 * @typedef {Object} MovementResult
 * @description Résultat d'une tentative de mouvement
 * @property {boolean} success - Mouvement réussi
 * @property {GridPosition} [newPosition] - Nouvelle position
 * @property {Array<OpportunityAttack>} [opportunityAttacks] - Attaques déclenchées
 * @property {number} [distance] - Distance parcourue
 * @property {string} [reason] - Raison de l'échec si success=false
 */

/**
 * @typedef {Object} CombatGameState
 * @description État de jeu enrichi pour IA
 * @property {Object} playerCharacter - Données du joueur
 * @property {Array<Object>} [companions] - Compagnons actifs
 * @property {CombatPositions} combatPositions - Positions des entités
 * @property {Array<CombatEnemy>} combatEnemies - Ennemis en combat
 * @property {Array<TurnData>} turnOrder - Ordre d'initiative
 */

/**
 * VALIDATION DES INTERFACES
 */

/**
 * Valide qu'un objet position respecte le format GridPosition
 * @param {*} position - Position à valider
 * @returns {boolean} Position valide
 */
export function isValidGridPosition(position) {
  if (!position || typeof position !== 'object') {
    return false;
  }
  
  return (
    typeof position.x === 'number' &&
    typeof position.y === 'number' &&
    position.x >= 0 && position.x < 10 &&
    position.y >= 0 && position.y < 10
  );
}

/**
 * Valide qu'un objet ennemi respecte le format CombatEnemy
 * @param {*} enemy - Ennemi à valider
 * @returns {boolean} Ennemi valide
 */
export function isValidCombatEnemy(enemy) {
  if (!enemy || typeof enemy !== 'object') {
    return false;
  }
  
  return (
    typeof enemy.name === 'string' &&
    typeof enemy.template === 'string' &&
    typeof enemy.currentHP === 'number' &&
    typeof enemy.maxHP === 'number' &&
    enemy.currentHP >= 0 &&
    enemy.currentHP <= enemy.maxHP
  );
}

/**
 * Valide qu'un objet tour respecte le format TurnData
 * @param {*} turn - Tour à valider
 * @returns {boolean} Tour valide
 */
export function isValidTurnData(turn) {
  return (
    turn &&
    typeof turn === 'object' &&
    ['player', 'enemy', 'companion'].includes(turn.type) &&
    typeof turn.initiative === 'number'
  );
}

/**
 * Valide qu'un objet callbacks respecte le format CombatCallbacks
 * @param {*} callbacks - Callbacks à valider
 * @returns {boolean} Callbacks valides
 */
export function isValidCombatCallbacks(callbacks) {
  return (
    callbacks &&
    typeof callbacks === 'object' &&
    typeof callbacks.onPlayerDamage === 'function' &&
    typeof callbacks.onCompanionDamageById === 'function'
  );
}

// Export par défaut pour compatibilité
export default {
  isValidGridPosition,
  isValidCombatEnemy,
  isValidTurnData,
  isValidCombatCallbacks
};