import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { CombatService } from '../services/CombatService'
import { EnemyFactory } from '../services/EnemyFactory'
import { CombatAI } from '../services/CombatAI'

// Store SIMPLIFIÉ et CORRIGÉ pour le combat
export const useCombatStore = create(
  devtools(
    (set, get) => ({
      // === ÉTAT SIMPLE ===
      isActive: false,
      isInitialized: false,
      combatPhase: 'idle',
      combatKey: 0,

      // Données partagées - CORRECTION: Initialisation correcte
      combatEnemies: [],
      turnOrder: [],
      combatPositions: {},
      currentTurnIndex: 0,
      turnCounter: 1,

      // Actions joueur
      playerAction: null,
      actionTargets: [],

      // Tour joueur
      playerTurnState: {
        actionsUsed: {
          action: false,
          movement: false
        },
        hasMovedThisTurn: false
      },

      // === MÉTHODES ESSENTIELLES CORRIGÉES ===

      initializeCombat: (encounterData, playerCharacter, activeCompanions) => {
        console.log('🎮 Initialisation du combat avec:', { encounterData, playerCharacter, activeCompanions })
        
        try {
          // Créer les ennemis avec IDs corrects
          const enemies = EnemyFactory.createEnemiesFromEncounter(encounterData)
          console.log('👹 Ennemis créés:', enemies)
          
          // Calculer l'ordre d'initiative
          const turnOrder = CombatService.rollInitiative(playerCharacter, activeCompanions, enemies)
          console.log('🎲 Ordre d\'initiative:', turnOrder)
          
          // Calculer les positions initiales - CORRECTION MAJEURE
          const positions = CombatService.initializePositions(
            playerCharacter, 
            activeCompanions, 
            enemies, 
            encounterData.enemyPositions
          )
          console.log('📍 Positions calculées:', positions)

          set({
            isActive: true,
            isInitialized: true,
            combatPhase: 'initiative-display',
            combatEnemies: enemies,
            turnOrder: turnOrder,
            combatPositions: positions,
            currentTurnIndex: 0,
            turnCounter: 1
          })
          
          console.log('✅ Combat initialisé avec succès')
        } catch (error) {
          console.error('❌ Erreur lors de l\'initialisation du combat:', error)
        }
      },

      startCombat: () => {
        set({ combatPhase: 'player-turn' })
      },

      nextTurn: () => {
        const state = get()
        let nextIndex = state.currentTurnIndex + 1

        if (nextIndex >= state.turnOrder.length) {
          nextIndex = 0
          set({ turnCounter: state.turnCounter + 1 })
        }

        const nextTurn = state.turnOrder[nextIndex]
        console.log('➡️ Passage au tour suivant:', nextTurn)

        set({
          currentTurnIndex: nextIndex,
          combatPhase: nextTurn.type === 'player' ? 'player-turn' : 'executing-turn'
        })

        if (nextTurn.type === 'player') {
          get().resetPlayerTurnState()
        }
      },

      getCurrentTurn: () => {
        const state = get()
        return state.turnOrder[state.currentTurnIndex] || null
      },

      // Actions joueur
      setPlayerAction: (action) => set({ playerAction: action }),
      setActionTargets: (targets) => set({ actionTargets: targets }),

      // NOUVELLE MÉTHODE: Mouvement de personnage
      moveCharacter: (characterId, newPosition) => {
        const state = get()
        const oldPosition = state.combatPositions[characterId]
        
        console.log(`🏃 Mouvement de ${characterId} de`, oldPosition, 'vers', newPosition)
        
        set({
          combatPositions: {
            ...state.combatPositions,
            [characterId]: newPosition
          }
        })
        
        return { success: true, oldPosition, newPosition }
      },

      // CORRECTION: Méthode pour mettre à jour la position d'un ennemi
      updateEnemyPosition: (enemyKey, newPosition) => {
        const state = get()
        console.log(`👹 Mise à jour position ennemi ${enemyKey}:`, newPosition)
        
        set({
          combatPositions: {
            ...state.combatPositions,
            [enemyKey]: newPosition
          }
        })
      },

      dealDamageToEnemy: (enemyIdentifier, damage) => {
        console.log(`💥 Dégâts à ${enemyIdentifier}: ${damage}`)
        
        set((state) => ({
          combatEnemies: state.combatEnemies.map(enemy => {
            // Chercher l'ennemi par plusieurs identifiants possibles
            if (enemy.name === enemyIdentifier || 
                enemy.id === enemyIdentifier ||
                `${enemy.name}_${enemy.instance || 0}` === enemyIdentifier) {
              const newHP = Math.max(0, enemy.currentHP - damage)
              console.log(`👹 ${enemy.name} HP: ${enemy.currentHP} → ${newHP}`)
              return { ...enemy, currentHP: newHP }
            }
            return enemy
          })
        }))
      },

      // Tour joueur
      resetPlayerTurnState: () => {
        set({
          playerTurnState: {
            actionsUsed: { action: false, movement: false },
            hasMovedThisTurn: false
          }
        })
      },

      usePlayerAction: (actionType) => {
        set((state) => ({
          playerTurnState: {
            ...state.playerTurnState,
            actionsUsed: {
              ...state.playerTurnState.actionsUsed,
              [actionType]: true
            },
            hasMovedThisTurn: actionType === 'movement' ? true : state.playerTurnState.hasMovedThisTurn
          }
        }))
      },

      endPlayerTurn: () => {
        get().resetPlayerTurnState()
        get().nextTurn()
      },

      getPlayerTurnState: () => {
        return get().playerTurnState
      },

      canEndTurn: () => {
        const state = get().playerTurnState
        return state.actionsUsed.action || state.actionsUsed.movement
      },

      // IA unifiée
      executeUnifiedEntityTurn: (entity, gameState, onNextTurn) => {
        console.log(`🤖 Exécution tour IA pour ${entity.name}`)
        
        const onMessage = (message, type = 'info') => {
          console.log(`💬 ${entity.name}: ${message}`)
          // Ajouter le message au combat log si disponible
          const { addCombatMessage } = require('../stores/gameStore').useGameStore.getState()
          if (addCombatMessage) {
            addCombatMessage(message, type)
          }
        }
        
        const onDamage = (targetId, damage) => {
          console.log(`💥 Dégâts de ${entity.name} à ${targetId}: ${damage}`)
          
          if (targetId === 'player') {
            const { _onPlayerDamage } = get()
            if (_onPlayerDamage) _onPlayerDamage(damage)
          } else {
            get().dealDamageToEnemy(targetId, damage)
          }
        }

        try {
          CombatAI.executeEntityTurn(entity, gameState, onMessage, onDamage, onNextTurn)
        } catch (error) {
          console.error(`❌ Erreur dans le tour de ${entity.name}:`, error)
          onMessage(`Erreur dans le tour de ${entity.name}`, 'error')
          setTimeout(() => onNextTurn(), 500)
        }
      },

      // Callbacks externes
      _onPlayerDamage: null,
      setDamageCallbacks: (onPlayerDamage, onCompanionDamage) => {
        set({ _onPlayerDamage: onPlayerDamage })
      },

      setCombatMessageCallback: (callback) => {
        // Stocker le callback pour les messages
        set({ _onCombatMessage: callback })
      },

      // Reset complet
      resetCombat: () => {
        console.log('🔄 Reset du combat')
        set({
          isActive: false,
          isInitialized: false,
          combatPhase: 'idle',
          combatEnemies: [],
          turnOrder: [],
          combatPositions: {},
          currentTurnIndex: 0,
          turnCounter: 1,
          playerAction: null,
          actionTargets: [],
          playerTurnState: {
            actionsUsed: { action: false, movement: false },
            hasMovedThisTurn: false
          }
        })
      },

      // Méthode pour incrémenter la clé de combat (pour forcer re-render)
      incrementCombatKey: () => {
        set((state) => ({ combatKey: state.combatKey + 1 }))
      }
    }),
    { name: 'combat-store' }
  )
)