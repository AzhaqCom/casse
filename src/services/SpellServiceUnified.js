/**
 * SpellService Unifié - Orchestrateur principal pour tous les types de lanceurs
 * Remplace l'ancien SpellService avec une architecture cohérente
 */

import { SpellEngine } from './SpellEngine.js';
import { SpellCaster } from './SpellCaster.js';
import { spells } from '../data/spells.js';

/**
 * Service unifié pour la gestion des sorts
 * Compatible avec joueur, compagnons, ennemis et PNJ
 */
export class SpellServiceUnified {

  /**
   * Constructeur avec injection de dépendances
   * @param {Object} dependencies - Dépendances injectées
   * @param {Function} [dependencies.applyEffect] - Méthode pour appliquer les effets
   * @param {Object} [dependencies.characterStore] - Store des personnages (legacy)
   * @param {Object} [dependencies.combatStore] - Store de combat
   * @param {Object} [dependencies.gameStore] - Store du jeu
   */
  constructor(dependencies = {}) {
    // ✅ NOUVELLE ARCHITECTURE: Injection de dépendances
    this.applyEffect = dependencies.applyEffect;
    
    // Legacy support pour compatibilité
    this.characterStore = dependencies.characterStore;
    this.combatStore = dependencies.combatStore;
    this.gameStore = dependencies.gameStore;
  }

  /**
   * Lance un sort de manière unifiée pour n'importe quel type de lanceur
   * @param {Object} caster - Le lanceur (joueur/compagnon/ennemi)
   * @param {Object|string} spell - Le sort (objet ou nom)
   * @param {Array} targets - Les cibles
   * @param {Object} options - Options de lancement
   * @returns {Object} Résultat du lancement
   */
  castSpell(caster, spell, targets = [], options = {}) {
    console.log(`🔍 [${new Date().toISOString()}] SpellServiceUnified.castSpell - DÉBUT pour ${caster.name}`);
    // 1. Préparer le lanceur et le sort
    const spellCaster = new SpellCaster(caster, options.context || 'combat');
    const spellData = this.getSpellData(spell);

    if (!spellData) {
      return {
        success: false,
        messages: [`Sort non trouvé: ${typeof spell === 'string' ? spell : spell.name}`],
        effects: []
      };
    }

    // 2. Validation de base
    if (!spellCaster.canCast()) {
      return {
        success: false,
        messages: [`${caster.name} ne peut pas lancer de sorts`],
        effects: []
      };
    }

    // 3. Valider et filtrer les cibles
    const validTargets = this.validateAndFilterTargets(spellData, spellCaster, targets, options);


    if (validTargets.length === 0 && !spellData.validTargets?.includes("self")) {

      return {
        success: false,
        messages: [`Aucune cible valide pour ${spellData.name}`],
        effects: []
      };
    }



    // 4. Lancer le sort
    const castResult = spellCaster.castSpell(spellData, validTargets, options);


    if (!castResult.success) {
      return castResult;
    }

    // 5. Traiter les résultats selon le contexte


    this.processSpellResults(castResult, options.context);


    return castResult;
  }

  /**
   * Obtient les données d'un sort par nom ou objet
   * @param {Object|string} spell - Le sort
   * @returns {Object|null} Données du sort
   */
  getSpellData(spell) {
    if (typeof spell === 'object' && spell.name) {
      return spell; // Déjà un objet sort
    }

    if (typeof spell === 'string') {
      // Recherche par nom exact
      if (spells[spell]) {
        return { id: spell, ...spells[spell] };
      }

      // Recherche par nom dans les valeurs
      const spellEntry = Object.entries(spells).find(([key, spellData]) =>
        spellData.name === spell || spellData.name?.toLowerCase() === spell.toLowerCase()
      );

      if (spellEntry) {
        return { id: spellEntry[0], ...spellEntry[1] };
      }
    }

    return null;
  }

  /**
   * Valide et filtre les cibles selon le sort
   * @param {Object} spell - Le sort
   * @param {SpellCaster} caster - Le lanceur
   * @param {Array} targets - Cibles proposées
   * @param {Object} options - Options
   * @returns {Array} Cibles valides
   */
  validateAndFilterTargets(spell, caster, targets, options = {}) {
    const context = {
      positions: options.positions || this.combatStore?.combatPositions,
      combat: options.context === 'combat'
    };

    // Valider la portée et le type de cible
    const validTargets = SpellEngine.validateSpellTargets(
      spell,
      caster.entity,
      targets,
      context
    );

    // Résoudre la zone d'effet si applicable
    if (spell.areaOfEffect || spell.isAreaEffect) {
      const origin = options.origin || caster.entity;
      return SpellEngine.resolveAreaOfEffect(spell, origin, validTargets, context);
    }

    return validTargets;
  }

  /**
   * Traite les résultats d'un sort selon le contexte
   * @param {Object} castResult - Résultat du sort
   * @param {string} context - Contexte (combat/exploration/etc.)
   */
  processSpellResults(castResult, context = 'combat') {
    switch (context) {
      case 'combat':
        this.processCombatSpellResults(castResult);
        break;

      case 'exploration':
        this.processExplorationSpellResults(castResult);
        break;

      case 'social':
        this.processSocialSpellResults(castResult);
        break;

      default:
        // Traitement générique
        break;
    }
  }

  /**
   * Traite les résultats de sorts en combat
   * @param {Object} castResult - Résultat du sort
   */
  processCombatSpellResults(castResult) {
    if (!this.combatStore) return;

    // Appliquer les dégâts
    castResult.damageResults.forEach(dmg => {
      if (dmg.targetId === 'player') {
        this.combatStore.dealDamageToPlayer?.(dmg.damage);
      } else if (dmg.targetId) {
        this.combatStore.dealDamageToCompanionById?.(dmg.targetId, dmg.damage);
      }
    });

    // Appliquer les soins
    castResult.healingResults.forEach(heal => {
      if (heal.targetId === 'player') {
        this.combatStore.healPlayer?.(heal.amount);
      } else if (heal.targetId) {
        this.combatStore.healCompanionById?.(heal.targetId, heal.amount);
      }
    });

    // Appliquer les effets
    castResult.effects.forEach(effect => {
      this.combatStore.applyEffect?.(effect);
    });
  }

  /**
   * Traite les résultats de sorts en exploration - VERSION REFACTORISÉE
   * @param {Object} castResult - Résultat du sort
   */
  processExplorationSpellResults(castResult) {
    for (const effect of castResult.effects) {
      // ✅ NOUVEAU: Application unifiée des effets via injection de dépendance
      if (this._isStatisticalEffect(effect.type)) {
        // Effets qui modifient les stats du personnage
        if (this.applyEffect) {
          this.applyEffect(effect);
        } else {
          console.warn('SpellServiceUnified: Aucune méthode applyEffect injectée pour:', effect.type);
        }
      } else {
        // Effets environnementaux séparés
        this._applyEnvironmentalEffect(effect);
      }
    }
  }

  /**
   * Détermine si un effet modifie les statistiques du personnage
   * @param {string} effectType - Type de l'effet
   * @returns {boolean} Vrai si c'est un effet statistique
   * @private
   */
  _isStatisticalEffect(effectType) {
    const statisticalEffects = [
      'mage_armor', 'blessed', 'shield', 'aid', 'sanctuary',
      'restrained', 'poisoned', 'stunned', 'paralyzed', 
      'frightened', 'charmed', 'haste'
    ];
    return statisticalEffects.includes(effectType);
  }

  /**
   * Gestion séparée des effets environnementaux - NOUVELLE MÉTHODE
   * @param {Object} effect - L'effet à appliquer
   * @private
   */
  _applyEnvironmentalEffect(effect) {
    switch (effect.type) {
      case 'light':
        this.gameStore?.setEnvironmentFlag?.('lighting', effect.duration || 30);
        break;

      case 'detect_magic':
        this.gameStore?.setEnvironmentFlag?.('showMagicAuras', true);
        break;

      case 'comprehend_languages':
        this.gameStore?.setEnvironmentFlag?.('translateText', true);
        break;

      default:
        // Log pour les effets non reconnus (debug)
        console.debug('SpellServiceUnified: Effet environnemental non géré:', effect.type);
        break;
    }
  }

  /**
   * Traite les résultats de sorts sociaux
   * @param {Object} castResult - Résultat du sort
   */
  processSocialSpellResults(castResult) {
    // TODO: Implémenter effets sociaux (charme, suggestion, etc.)
  }

  /**
   * Vérifie si un lanceur peut lancer un sort spécifique
   * @param {Object} caster - Le lanceur
   * @param {Object|string} spell - Le sort
   * @param {number} atLevel - Niveau de lancement optionnel
   * @returns {boolean} Vrai si peut lancer
   */
  canCastSpell(caster, spell, atLevel = null) {
    const spellCaster = new SpellCaster(caster);
    const spellData = this.getSpellData(spell);

    if (!spellData) return false;

    return spellCaster.canCastSpell(spellData, atLevel);
  }

  /**
   * Obtient tous les sorts disponibles pour un lanceur
   * @param {Object} caster - Le lanceur
   * @returns {Array} Liste des sorts disponibles
   */
  getAvailableSpells(caster) {
    const spellCaster = new SpellCaster(caster);
    return spellCaster.getAvailableSpells();
  }

  /**
   * Obtient les emplacements de sorts disponibles
   * @param {Object} caster - Le lanceur
   * @returns {Object} Emplacements disponibles
   */
  getAvailableSpellSlots(caster) {
    const spellCaster = new SpellCaster(caster);
    return spellCaster.getAvailableSpellSlots();
  }

  /**
   * Calcule les statistiques de sort pour un lanceur
   * @param {Object} caster - Le lanceur
   * @returns {Object} Statistiques (DC, bonus attaque, etc.)
   */
  getSpellcastingStats(caster) {
    const spellCaster = new SpellCaster(caster);

    if (!spellCaster.canCast()) {
      return null;
    }

    return {
      ability: spellCaster.getSpellcastingAbility(),
      modifier: spellCaster.getSpellcastingModifier(),
      attackBonus: spellCaster.getSpellAttackBonus(),
      saveDC: spellCaster.getSpellSaveDC(),
      proficiencyBonus: spellCaster.getProficiencyBonus()
    };
  }

  /**
   * MÉTHODES DE COMPATIBILITÉ AVEC L'ANCIEN SYSTÈME
   * À supprimer une fois la migration terminée
   */


  // ===== MÉTHODES MANQUANTES POUR COMPATIBILITÉ UI =====

  /**
   * Obtient les emplacements de sorts d'un personnage
   * @param {Object} character - Le personnage
   * @returns {Object} Emplacements de sorts
   */
  getSpellSlots(character) {
    if (!character?.spellcasting?.spellSlots) {
      return {};
    }
    return character.spellcasting.spellSlots;
  }

  /**
   * Obtient le bonus d'attaque de sort
   * @param {Object} character - Le personnage
   * @returns {number} Bonus d'attaque
   */
  getSpellAttackBonus(character) {
    const stats = this.getSpellcastingStats(character);
    return stats ? stats.attackBonus : 0;
  }

  /**
   * Obtient le DC de sauvegarde des sorts
   * @param {Object} character - Le personnage
   * @returns {number} DC de sauvegarde
   */
  getSpellSaveDC(character) {
    const stats = this.getSpellcastingStats(character);
    return stats ? stats.saveDC : 10;
  }

  /**
   * Obtient les sorts préparés
   * @param {Object} character - Le personnage
   * @returns {Array} Sorts préparés
   */
  getPreparedSpells(character) {
    if (!character?.spellcasting?.preparedSpells) {
      return [];
    }

    return character.spellcasting.preparedSpells.map(spellName => {
      const spellData = this.getSpellData(spellName);
      return spellData ? { id: spellData.id, ...spellData } : null;
    }).filter(Boolean);
  }

  /**
   * Obtient tous les sorts du grimoire (sorts connus mais pas forcément préparés)
   * @param {Object} character - Le personnage
   * @returns {Array} Sorts du grimoire
   */
  getGrimoireSpells(character) {
    if (!character?.spellcasting?.knownSpells) {
      return [];
    }

    return character.spellcasting.knownSpells.map(spellName => {
      const spellData = this.getSpellData(spellName);
      return spellData ? { id: spellData.id, ...spellData } : null;
    }).filter(Boolean);
  }

  /**
   * Obtient les sorts connus mais non préparés
   * @param {Object} character - Le personnage
   * @returns {Array} Sorts non préparés
   */
  getUnpreparedSpells(character) {
    const allKnown = this.getGrimoireSpells(character);
    const prepared = this.getPreparedSpells(character);
    const preparedIds = prepared.map(s => s.id);

    return allKnown.filter(spell => !preparedIds.includes(spell.id));
  }

  /**
   * Obtient les cantrips du personnage
   * @param {Object} character - Le personnage
   * @returns {Array} Cantrips
   */
  getCantrips(character) {
    if (!character?.spellcasting?.cantrips) {
      return [];
    }

    return character.spellcasting.cantrips.map(cantripName => {
      const spellData = this.getSpellData(cantripName);
      return spellData ? { id: spellData.id, ...spellData } : null;
    }).filter(Boolean);
  }

  /**
   * Vérifie si un sort est actuellement actif sur le personnage
   * @param {string} spellId - ID du sort
   * @param {Object} character - Le personnage
   * @returns {boolean} Vrai si actif
   */
  isSpellActive(spellId, character) {
    if (!character?.activeSpells) {
      return false;
    }
    return !!character.activeSpells[spellId];
  }

  /**
   * Obtient le nombre maximum de sorts préparés
   * @param {Object} character - Le personnage
   * @returns {number} Maximum de sorts préparés
   */
  getMaxPreparedSpells(character) {
    if (!character?.spellcasting) {
      return 0;
    }

    const spellCaster = new SpellCaster(character);
    if (!spellCaster.canCast()) {
      return 0;
    }

    // Formule D&D standard : niveau + modificateur de caractéristique
    const stats = this.getSpellcastingStats(character);
    const baseAmount = character.level + (stats?.modifier || 0);

    return Math.max(1, baseAmount); // Minimum 1 sort préparé
  }

  /**
   * Filtre une liste de sorts selon des critères
   * @param {Array} spells - Liste des sorts
   * @param {Object} filters - Filtres à appliquer
   * @returns {Array} Sorts filtrés
   */
  filterSpells(spells, filters = {}) {
    if (!spells || !Array.isArray(spells)) {
      return [];
    }

    return spells.filter(spell => {
      // Filtre par école
      if (filters.school && filters.school !== 'all' && spell.school !== filters.school) {
        return false;
      }

      // Filtre par niveau
      if (filters.level && filters.level !== 'all') {
        const levelFilter = parseInt(filters.level);
        if (spell.level !== levelFilter) {
          return false;
        }
      }

      // Filtre par terme de recherche
      if (filters.searchTerm && filters.searchTerm.trim()) {
        const searchLower = filters.searchTerm.toLowerCase();
        const nameMatch = spell.name?.toLowerCase().includes(searchLower);
        const descMatch = spell.description?.toLowerCase().includes(searchLower);
        if (!nameMatch && !descMatch) {
          return false;
        }
      }

      // Filtre sorts castables seulement
      if (filters.castableOnly && !this.canCastSpell(filters.character || {}, spell)) {
        return false;
      }

      return true;
    });
  }
}