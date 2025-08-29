import React, { useEffect, useCallback } from 'react'
import { useCombatStore } from '../../../stores/combatStore'
import { useGameStore } from '../../../stores/gameStore'
import { useCharacterStore } from '../../../stores/characterStore'

/**
 * Gestionnaire automatique des tours de combat - VERSION SIMPLIFIÉE
 */
const CombatTurnManager = React.memo(({
  currentTurn,
  turnOrder,
  phase,
  onPhaseChange,
  onNextTurn
}) => {
  const { addCombatMessage } = useGameStore()
  const { playerCharacter, getActiveCompanions } = useCharacterStore()
  const { 
    combatEnemies: enemies,
    combatPositions: positions,
    executeUnifiedEntityTurn
  } = useCombatStore()

  // Protection contre les re-exécutions multiples
  const [isExecuting, setIsExecuting] = React.useState(false)
  const [lastExecutedTurn, setLastExecutedTurn] = React.useState(null)

  /**
   * Gestionnaire principal des tours automatiques (ennemis et compagnons)
   */
  useEffect(() => {
    // Ne traiter que la phase 'executing-turn'
    if (phase !== 'executing-turn' || !currentTurn || isExecuting) {
      return;
    }

    // Ignorer les tours de joueur
    if (currentTurn.type === 'player') {
      return;
    }

    // Éviter les re-exécutions du même tour
    const { turnCounter, currentTurnIndex } = useCombatStore.getState()
    const currentTurnKey = `${currentTurn.name}-${currentTurn.type}-${turnCounter}-${currentTurnIndex}`

    if (lastExecutedTurn === currentTurnKey) {
      return
    }

    console.log(`🎯 Démarrage tour ${currentTurn.name} (${currentTurn.type})`)
    setIsExecuting(true)
    setLastExecutedTurn(currentTurnKey)

    // Vérifier si l'entité est vivante
    const isEntityDead = () => {
      if (currentTurn.type === 'companion') {
        const activeCompanions = getActiveCompanions()
        const companion = activeCompanions.find(c =>
          c.id === currentTurn.id || c.name === currentTurn.name
        )
        return !companion || companion.currentHP <= 0
      } else if (currentTurn.type === 'enemy') {
        const enemy = enemies.find(e => e.name === currentTurn.name || e.id === currentTurn.id)
        return !enemy || enemy.currentHP <= 0
      }
      return false
    }

    if (isEntityDead()) {
      console.log(`💀 ${currentTurn.name} est mort, passage au tour suivant`)
      setIsExecuting(false)
      
      // Vérifier fin de combat
      const allEnemiesDead = enemies.every(e => e.currentHP <= 0)
      const playerDead = !playerCharacter || playerCharacter.currentHP <= 0

      if (allEnemiesDead) {
        onPhaseChange('victory')
        return
      } else if (playerDead) {
        onPhaseChange('defeat')
        return
      }

      onNextTurn()
      return
    }

    // Exécuter le tour selon le type
    const executeEntityTurn = () => {
      const activeCompanions = getActiveCompanions()
      const gameState = {
        playerCharacter,
        activeCompanions,
        combatEnemies: enemies,
        combatPositions: positions
      }

      let entity
      if (currentTurn.type === 'enemy') {
        entity = enemies.find(e => e.name === currentTurn.name || e.id === currentTurn.id)
      } else if (currentTurn.type === 'companion') {
        entity = activeCompanions.find(c => c.id === currentTurn.id || c.name === currentTurn.name)
      }

      if (!entity) {
        console.error(`❌ Entité non trouvée pour le tour:`, currentTurn)
        setIsExecuting(false)
        onNextTurn()
        return
      }

      // Utiliser le système unifié
      executeUnifiedEntityTurn(entity, gameState, () => {
        console.log(`✅ Tour de ${entity.name} terminé`)
        setIsExecuting(false)
        
        // Vérifier fin de combat après l'action
        const allEnemiesDead = enemies.every(e => e.currentHP <= 0)
        const playerDead = !playerCharacter || playerCharacter.currentHP <= 0

        if (allEnemiesDead) {
          onPhaseChange('victory')
          return
        } else if (playerDead) {
          onPhaseChange('defeat')
          return
        }

        onNextTurn()
      })
    }

    // Exécuter avec un petit délai pour l'animation
    setTimeout(() => {
      try {
        executeEntityTurn()
      } catch (error) {
        console.error(`❌ Erreur dans le tour de ${currentTurn.name}:`, error)
        setIsExecuting(false)
        onNextTurn()
      }
    }, 500)

  }, [phase, currentTurn, isExecuting, lastExecutedTurn, onNextTurn, onPhaseChange, playerCharacter, enemies, positions, getActiveCompanions, executeUnifiedEntityTurn])

  // Ce composant est invisible
  return null
})

export { CombatTurnManager }
export default CombatTurnManager