/**
 * SceneManager - Gestionnaire centralisé pour le nouveau système de scènes unifié
 * Remplace la logique dispersée dans App.jsx et gère le chargement à la demande
 */

import { SCENE_TYPES} from '../types/story';
import { StoryService } from './StoryService';
import { prologueScenes } from '../data/scenes/prologue';
import { acte1Scenes } from '../data/scenes/acte1';
import {newPrologue } from '../data/scenes/prologue_copy'; // Exemple de scène migrée

import { TimeService } from './TimeService';
import { useTimeStore } from '../stores/timeStore';
// SUPPRIMÉ: ProceduralGenerator qui marche pas
// import { newScenes } from '../data/scenes_examples';

export class SceneManager {
  // Cache des scènes chargées
  static loadedScenes = new Map();
  
  // Modules de scènes chargés (pour le lazy loading futur)
  static loadedModules = new Map();
  
  // Scène d'erreur par défaut
  static ERROR_SCENE = {
    id: 'error',
    type: SCENE_TYPES.TEXT,
    content: {
      text: "Une erreur est survenue. La scène demandée n'existe pas.",
      title: "Erreur"
    },
    choices: [
      {
        text: "Retourner au menu principal",
        next: "prologue_heritage"
      }
    ]
  };

  /**
   * Récupère une scène par son ID (y compris génération procédurale)
   * @param {string} sceneId - L'identifiant de la scène
   * @param {Object} context - Contexte pour la génération procédurale
   * @param {Object} generatedScene - Scène pré-générée à stocker
   * @returns {Object|null} La scène trouvée ou générée
   */
  static getOrGenerateScene(sceneId, context = {}, generatedScene = null) {
    // Si une scène pré-générée est fournie, la stocker et la retourner
    if (generatedScene) {
   
      this.loadedScenes.set(sceneId, generatedScene);
      return generatedScene;
    }
    
    // Vérifier le cache en premier - IMPORTANT pour les retours au hub !
    if (this.loadedScenes.has(sceneId)) {
   
      const cachedScene = this.loadedScenes.get(sceneId);
      // FORCER le retour de la scène cachée pour éviter la re-génération
      if (cachedScene) {
        return cachedScene;
      }
    }



    // Sinon, charger depuis le système normal
    return this.loadFromNewSystem(sceneId);
  }

  /**
   * Méthode legacy pour compatibilité - utilise getOrGenerateScene
   * @param {string} sceneId - L'identifiant de la scène
   * @returns {Object|null} La scène trouvée ou null
   */
  static getScene(sceneId) {
    return this.getOrGenerateScene(sceneId);
  }


  /**
   * Charge une scène depuis le nouveau système de fichiers modulaire
   * @param {string} sceneId 
   * @returns {Object}
   */
  static loadFromNewSystem(sceneId) {
    try {
      // Charger les scènes du prologue
      if (prologueScenes[sceneId]) {
       
        const scene = prologueScenes[sceneId];
        this.loadedScenes.set(sceneId, scene);
        return scene;
      }

      // Charger les scènes d'acte 1
      if (acte1Scenes[sceneId]) {
   
        const scene = acte1Scenes[sceneId];
        this.loadedScenes.set(sceneId, scene);
        return scene;
      }
       if (newPrologue[sceneId]) {
   
        const scene = newPrologue[sceneId];
        this.loadedScenes.set(sceneId, scene);
        return scene;
      }
      
      // Scène non trouvée
      console.warn(`Scène "${sceneId}" non trouvée dans le nouveau système`);
      return this.ERROR_SCENE;
    } catch (error) {
      console.error(`Erreur lors du chargement de la scène "${sceneId}":`, error);
      return this.ERROR_SCENE;
    }
  }


  /**
   * Valide qu'une scène respecte le nouveau format
   * @param {Object} scene - Scène à valider
   * @returns {Object} Résultat de validation
   */
  static validateScene(scene) {
    const errors = [];

    // Validations obligatoires
    if (!scene.id) errors.push('Scene must have an id');
    if (!scene.type) errors.push('Scene must have a type');
    if (!Object.values(SCENE_TYPES).includes(scene.type)) {
      errors.push(`Invalid scene type: ${scene.type}`);
    }
    if (!scene.content?.text) errors.push('Scene must have content.text');
    if (!scene.choices || !Array.isArray(scene.choices)) {
      errors.push('Scene must have choices array');
    }

    // Validation des choix
    scene.choices?.forEach((choice, index) => {
      if (!choice.text) errors.push(`Choice ${index} must have text`);
      if (!choice.next) errors.push(`Choice ${index} must have next`);
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Obtient les choix disponibles pour une scène selon l'état du jeu
   * @param {Object} scene - La scène
   * @param {Object} gameState - État du jeu
   * @returns {Array} Choix disponibles
   */
  static getAvailableChoices(scene, gameState) {
    if (!scene.choices) return [];
    
    return scene.choices.filter(choice => {
      if (!choice.condition) return true;
      return StoryService.evaluateCondition(choice.condition, gameState);
    });
  }

  /**
   * Obtient le texte d'une scène avec interpolation
   * @param {Object} scene - La scène
   * @param {Object} gameState - État du jeu
   * @returns {string} Texte interpolé
   */
  static getSceneText(scene, gameState) {
    return StoryService.getSceneText(scene, gameState);
  }

  /**
   * Prépare les données de combat à partir d'une scène
   * Centralise la logique de préparation qui était dispersée dans App.jsx
   * @param {Object} scene - La scène de combat
   * @returns {Object} Données formatées pour le combat
   */
  static prepareCombatData(scene) {
    if (scene.type !== SCENE_TYPES.COMBAT) {
      throw new Error('Scene must be of type COMBAT');
    }

    // Validation des données requises
    if (!scene.enemies || !Array.isArray(scene.enemies)) {
      throw new Error('Combat scene must have enemies array');
    }

    // Préparer les données dans le format attendu par combatStore
    const combatData = {
      type: 'combat',
      enemies: scene.enemies,
      // Passer directement le tableau des positions - combatStore les gère
      enemyPositions: scene.enemyPositions || [],
      playerPosition: scene.playerPosition || null,
      companionPositions: scene.companionPositions || null,
      // Métadonnées additionnelles
      sceneId: scene.id,
      background: scene.content?.background,
      title: scene.content?.title,
      description: scene.content?.text
    };

    return combatData;
  }

  // =============================================
  // 🕐 GESTION TEMPORELLE INTÉGRÉE
  // =============================================

  /**
   * Traite la transition de scène avec progression temporelle automatique
   * @param {Object} fromScene - Scène d'origine
   * @param {Object} toScene - Scène de destination  
   * @param {Object} choice - Choix effectué par le joueur
   * @param {Object} context - Contexte additionnel
   * @returns {Object} Résultat de la transition
   */
  static processSceneTransition(fromScene, toScene, choice, context = {}) {
    const result = {
      success: true,
      timeAdvanced: 0,
      events: [],
      messages: []
    };

    try {
      // 1. Calculer le coût temporel de l'action
      const timeCost = this.calculateTransitionTimeCost(fromScene, toScene, choice, context);
     
      if (timeCost > 0) {
        // 2. Avancer le temps dans le store
        const timeStore = useTimeStore.getState();
        const oldTime = { ...timeStore.currentTime };
        
        timeStore.advanceTimeByAction(this.getActionType(fromScene, toScene, choice), timeCost);
        
        const newTime = timeStore.currentTime;
        result.timeAdvanced = timeCost;
        
        // 3. Générer des événements temporels si nécessaire
        const timeEvents = TimeService.generateTimeEvents(oldTime, newTime, context);
        result.events = timeEvents;
        
        // 4. Messages informatifs pour le joueur
        if (timeCost >= 60) { // Plus d'une heure
          const hours = Math.floor(timeCost / 60);
          const minutes = timeCost % 60;
          let timeMessage = `Temps écoulé: ${hours}h`;
          if (minutes > 0) timeMessage += ` ${minutes}min`;
          
          result.messages.push({
            type: 'time_passage',
            text: timeMessage
          });
        }
        
        // 5. Messages d'événements temporels
        timeEvents.forEach(event => {
          if (event.message) {
            result.messages.push({
              type: 'time_event',
              text: event.message
            });
          }
        });
      }

      // 6. Vérifier les restrictions temporelles de la scène de destination
      const restrictions = this.checkTimeRestrictions(toScene, context);
      if (restrictions.length > 0) {
        result.messages.push(...restrictions.map(r => ({
          type: 'time_restriction',
          text: r
        })));
      }

    } catch (error) {
      console.error('Erreur lors du traitement temporel de la transition:', error);
      result.success = false;
    }

    return result;
  }

  /**
   * Calcule le coût temporel d'une transition de scène
   * @param {Object} fromScene - Scène d'origine
   * @param {Object} toScene - Scène de destination
   * @param {Object} choice - Choix effectué
   * @param {Object} context - Contexte additionnel
   * @returns {number} Coût en minutes
   */
  static calculateTransitionTimeCost(fromScene, toScene, choice, context) {
    // 1. Coût explicite dans les conséquences du choix
    if (choice?.consequences?.timeCost) {
      return choice.consequences.timeCost;
    }

    // 2. Coût selon le type de transition
    const transitionType = this.getTransitionType(fromScene, toScene);
    const baseCosts = {
      same_location: 5,      // Même lieu = 5 minutes
      local_move: 15,        // Déplacement local = 15 minutes
      travel: 120,           // Voyage = 2 heures
      exploration: 45,       // Exploration = 45 minutes
      combat: 30,            // Combat = 30 minutes
      dialogue: 10,          // Dialogue = 10 minutes
      rest: 0               // Repos géré séparément
    };

    let baseCost = baseCosts[transitionType] || baseCosts.local_move;

    // 3. Utiliser le TimeService pour calculs avancés
    baseCost = TimeService.calculateActionTimeCost(toScene, choice, {
      ...context,
      transitionType,
      fromScene,
      isNight: useTimeStore.getState().isNightTime()
    });

    // 4. Modificateurs contextuels
    const modifiers = this.getTimeCostModifiers(fromScene, toScene, context);
    const finalCost = Math.round(baseCost * modifiers.multiplier + modifiers.additive);

    return Math.max(0, finalCost);
  }

  /**
   * Détermine le type de transition entre deux scènes
   */
  static getTransitionType(fromScene, toScene) {
    // Même lieu
    if (fromScene?.metadata?.location === toScene?.metadata?.location) {
      return 'same_location';
    }

    // Types de scènes spécifiques
    if (toScene?.type === SCENE_TYPES.COMBAT) return 'combat';
    if (toScene?.type === SCENE_TYPES.DIALOGUE) return 'dialogue';
    if (toScene?.type?.includes('REST')) return 'rest';
    if (toScene?.type === SCENE_TYPES.INTERACTIVE) return 'exploration';

    // Voyage selon la distance (métadonnées)
    const distance = this.calculateDistance(fromScene, toScene);
    if (distance > 2) return 'travel';
    
    return 'local_move';
  }

  /**
   * Détermine le type d'action pour le système temporel
   */
  static getActionType(fromScene, toScene, choice) {
    if (toScene?.type === SCENE_TYPES.COMBAT) return 'combat';
    if (toScene?.type === SCENE_TYPES.INTERACTIVE) return 'exploration';
    if (toScene?.type === SCENE_TYPES.DIALOGUE) return 'dialogue';
    if (toScene?.type?.includes('REST')) return choice?.restType || 'rest_short';
    
    return 'scene_transition';
  }

  /**
   * Calcule une distance approximative entre deux scènes
   */
  static calculateDistance(fromScene, toScene) {
    // Simple heuristique basée sur les métadonnées
    const fromChapter = fromScene?.metadata?.chapter || 'unknown';
    const toChapter = toScene?.metadata?.chapter || 'unknown';
    
    if (fromChapter !== toChapter) return 5; // Changement de chapitre = distance max
    
    const fromLocation = fromScene?.metadata?.location || '';
    const toLocation = toScene?.metadata?.location || '';
    
    // Même lieu exact
    if (fromLocation === toLocation) return 0;
    
    // Même zone générale (même village, etc.)
    if (fromLocation.includes('Ravenscroft') && toLocation.includes('Ravenscroft')) return 1;
    
    return 3; // Distance modérée par défaut
  }

  /**
   * Obtient les modificateurs de coût temporel
   */
  static getTimeCostModifiers(fromScene, toScene, context) {
    const modifiers = {
      multiplier: 1,
      additive: 0
    };

    // Modificateur nocturne
    const isNight = context.isNight || useTimeStore.getState().isNightTime();
    if (isNight && toScene?.type === SCENE_TYPES.INTERACTIVE) {
      modifiers.multiplier *= 1.3; // +30% de temps la nuit
    }

    // Sécurité du lieu
    const safety = toScene?.metadata?.safety || 3;
    if (safety <= 1) {
      modifiers.multiplier *= 1.2; // +20% en lieu dangereux
    }

    // Fatigue du personnage (si implémentée)
    if (context.characterFatigue > 0.8) {
      modifiers.multiplier *= 1.1; // +10% si fatigué
    }

    return modifiers;
  }

  /**
   * Vérifie les restrictions temporelles d'une scène
   */
  static checkTimeRestrictions(scene, context) {
    const restrictions = [];
    const timeState = useTimeStore.getState();
    const { hour, phase } = timeState.currentTime;

    // Restrictions basées sur l'heure
    if (scene?.metadata?.timeRestrictions) {
      const timeRestrictions = scene.metadata.timeRestrictions;
      
      if (timeRestrictions.dayOnly && TimeService.isNightHour(hour)) {
        restrictions.push('Ce lieu n\'est accessible qu\'en journée');
      }
      
      if (timeRestrictions.nightOnly && TimeService.isDayHour(hour)) {
        restrictions.push('Ce lieu n\'est accessible que la nuit');
      }
    }

    // Restrictions de sécurité nocturne
    const safety = scene?.metadata?.safety || 3;
    if (safety <= 2 && TimeService.isNightHour(hour)) {
      restrictions.push('Ce lieu est particulièrement dangereux la nuit');
    }

    return restrictions;
  }

  /**
   * Nettoie le cache des scènes
   */
  static clearCache() {
    this.loadedScenes.clear();
    this.loadedModules.clear();
  }

  /**
   * Obtient des statistiques sur le cache
   * @returns {Object} Statistiques
   */
  static getCacheStats() {
    return {
      loadedScenesCount: this.loadedScenes.size,
      loadedModulesCount: this.loadedModules.size,
      memoryUsage: this.loadedScenes.size * 50 // Estimation approximative en kB
    };
  }
}

export default SceneManager;