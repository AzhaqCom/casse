import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { CombatService } from '../services/CombatService'
import { calculateDistance } from '../utils/calculations'
import { isValidGridPosition } from '../utils/validation'
import { EnemyFactory } from '../services/EnemyFactory'
import { CombatAI } from '../services/CombatAI'

// Store SIMPLIFIÉ pour le combat
export const useCombatStore = create(
  devtools(
    (set, get) => ({
      // === ÉTAT SIMPLE ===
      isActive: false,
      isInitialized: false,
      combatPhase: 'idle',
      combatKey: 0,

      // Données partagées
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
        }
      },

      // === MÉTHODES ESSENTIELLES ===

      initializeCombat: (encounterData, playerCharacter, activeCompanions) => {
        const enemies = EnemyFactory.createEnemiesFromEncounter(encounterData)
        const turnOrder = CombatService.rollInitiative(playerCharacter, activeCompanions, enemies)
        const positions = CombatService.calculateInitialPositions(enemies, activeCompanions)

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
      },

      startCombat: () => {
        set({ combatPhase: 'player-turn' })
      },
      setCombatMessageCallback: (callback) => set({
        _onCombatMessage: callback
      }),
      nextTurn: () => {
        const state = get()
        let nextIndex = state.currentTurnIndex + 1

        if (nextIndex >= state.turnOrder.length) {
          nextIndex = 0
          set({ turnCounter: state.turnCounter + 1 })
        }

        const nextTurn = state.turnOrder[nextIndex]

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

      executeAction: () => {
        const state = get()
        if (!state.playerAction || !state.actionTargets.length) return

        const result = CombatService.executePlayerAction(
          state.turnOrder[state.currentTurnIndex].character,
          state.playerAction,
          state.actionTargets,
          state.combatEnemies,
          state.combatPositions
        )

        get().applyActionResults(result)
        set({ playerAction: null, actionTargets: [] })
      },

      applyActionResults: (result) => {
        if (result.damage?.length > 0) {
          result.damage.forEach(dmg => {
            if (dmg.targetId === 'player') {
              // Callback vers characterStore
              const { _onPlayerDamage } = get()
              if (_onPlayerDamage) _onPlayerDamage(dmg.damage)
            } else {
              get().dealDamageToEnemy(dmg.targetId, dmg.damage)
            }
          })
        }
      },

      dealDamageToEnemy: (enemyName, damage) => {
        set((state) => ({
          combatEnemies: state.combatEnemies.map(enemy =>
            enemy.name === enemyName
              ? { ...enemy, currentHP: Math.max(0, enemy.currentHP - damage) }
              : enemy
          )
        }))
      },

      // Tour joueur
      resetPlayerTurnState: () => {
        set({
          playerTurnState: {
            actionsUsed: { action: false, movement: false }
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
            }
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

      // IA
      executeUnifiedEntityTurn: (entity, gameState, onNextTurn) => {
        const onMessage = (message) => console.log(`💬 ${message}`)
        const onDamage = (targetId, damage) => {
          if (targetId === 'player') {
            const { _onPlayerDamage } = get()
            if (_onPlayerDamage) _onPlayerDamage(damage)
          } else {
            get().dealDamageToEnemy(targetId, damage)
          }
        }

        CombatAI.executeEntityTurn(entity, gameState, onMessage, onDamage, onNextTurn)
      },

      // Callbacks externes
      _onPlayerDamage: null,
      setDamageCallbacks: (onPlayerDamage, onCompanionDamage) => {
        set({ _onPlayerDamage: onPlayerDamage })
      },

      // Reset
      resetCombat: () => {
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
          actionTargets: []
        })
      }
    })
  )
)