import React, { useEffect, useCallback, useRef } from 'react'
import { useCombatStore } from '../../../stores/combatStore'
import { useGameStore } from '../../../stores/gameStore'
import { useCharacterStore } from '../../../stores/characterStore'
import { CombatService } from '../../../services/CombatService'
import { Card, Button } from '../../ui'
import { CombatGrid } from './CombatGrid'
import { CombatTurnManager } from './CombatTurnManager'
import { CombatActionPanel } from './CombatActionPanel'
import { CombatLog } from '../../ui/CombatLog'

/**
 * Panneau de combat principal - VERSION NETTOYÉE
 */
const CombatPanel = React.memo(({
  playerCharacter,
  activeCompanions = [],
  encounterData,
  onCombatEnd,
  onReplayCombat,
  combatKey,
  victoryButtonText = "Continuer l'aventure"
}) => {
  const initializingRef = useRef(false)
  const [isMovementMode, setIsMovementMode] = React.useState(false)

  // Store principal
  const {
    turnOrder,
    getCurrentTurn,
    combatEnemies: enemies,
    combatPositions: positions,
    combatPhase: phase,
    isInitialized,
    playerAction: selectedAction,
    actionTargets: selectedTargets,
    
    // Actions
    initializeCombat,
    startCombat,
    nextTurn,
    setPlayerAction: selectAction,
    setActionTargets,
    resetCombat,
    moveCharacter,
    resetPlayerTurnState,
    usePlayerAction,
    endPlayerTurn,
    getPlayerTurnState,
    dealDamageToEnemy,
    setDamageCallbacks
  } = useCombatStore()

  const { addCombatMessage, clearCombatLog } = useGameStore()
  const { takeDamagePlayer, takeDamageCompanionById } = useCharacterStore()

  const currentTurn = getCurrentTurn()

  // Configuration des callbacks
  useEffect(() => {
    setDamageCallbacks(takeDamagePlayer, takeDamageCompanionById)
  }, [setDamageCallbacks, takeDamagePlayer, takeDamageCompanionById])

  // Initialisation du combat - CORRIGÉE
  useEffect(() => {
    console.log('🎮 CombatPanel useEffect - Initialisation', { 
      encounterData: !!encounterData, 
      enemies: encounterData?.enemies?.length,
      isInitialized,
      combatKey 
    })

    if (!encounterData || !encounterData.enemies?.length) {
      console.warn('❌ Pas de données de rencontre valides')
      return
    }

    // Reset pour nouveau combat (rejouer)
    if (combatKey !== undefined && isInitialized) {
      console.log('🔄 Reset pour rejouer le combat')
      resetCombat()
      initializingRef.current = false
      return
    }

    // Initialiser le combat pour la première fois
    if (!isInitialized && !initializingRef.current) {
      console.log('🚀 Première initialisation du combat')
      initializingRef.current = true
      
      try {
        initializeCombat(encounterData, playerCharacter, activeCompanions)
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error)
        initializingRef.current = false
      }
    }
  }, [encounterData, combatKey, isInitialized, playerCharacter, activeCompanions, initializeCombat, resetCombat])

  // Messages d'initiative
  useEffect(() => {
    if (phase === 'initiative-display' && turnOrder.length > 0) {
      addCombatMessage('⚔️ Un combat commence !', 'combat-start')
      
      turnOrder.forEach(combatant => {
        addCombatMessage(
          `🎲 ${combatant.name} obtient ${combatant.initiative} en initiative`, 
          'initiative'
        )
      })
    }
  }, [phase, turnOrder, addCombatMessage])

  // Reset état joueur au début de son tour
  useEffect(() => {
    if (phase === 'player-turn' && currentTurn?.type === 'player') {
      resetPlayerTurnState()
      setIsMovementMode(false) // Reset mode mouvement
    }
  }, [phase, currentTurn, resetPlayerTurnState])

  // Gestionnaires d'actions
  const handleActionSelect = useCallback((action) => {
    console.log('🎯 Sélection action:', action.name)
    selectAction(action)
    setIsMovementMode(false) // Sortir du mode mouvement
  }, [selectAction])

  const handleTargetSelect = useCallback((target) => {
    if (!selectedAction) return

    console.log('🎯 Sélection cible:', target.name || target)
    
    const newTargets = [...selectedTargets, target]
    setActionTargets(newTargets)

    const maxTargets = selectedAction.projectiles || 1

    if (newTargets.length >= maxTargets) {
      // Auto-exécution
      setTimeout(() => {
        executeAction(selectedAction, newTargets)
      }, 300)
    }
  }, [selectedAction, selectedTargets, setActionTargets])

  const executeAction = useCallback((action, targets) => {
    console.log('⚡ Exécution action:', action.name, 'sur', targets.length, 'cibles')
    
    const result = CombatService.executePlayerAction(
      playerCharacter,
      action,
      targets,
      enemies,
      positions
    )

    // Traiter les messages
    result.messages.forEach(message => {
      const messageText = typeof message === 'string' ? message : message.text
      const messageType = typeof message === 'object' ? message.type : 'info'
      addCombatMessage(messageText, messageType)
    })

    // Traiter les dégâts
    if (result.damage && result.damage.length > 0) {
      result.damage.forEach(damageData => {
        dealDamageToEnemy(damageData.targetId, damageData.damage)
        
        // Vérifier si l'ennemi est mort
        setTimeout(() => {
          const updatedEnemy = enemies.find(e => 
            e.name === damageData.targetId || e.id === damageData.targetId
          )
          if (updatedEnemy && updatedEnemy.currentHP <= 0) {
            addCombatMessage(`💀 ${updatedEnemy.name} tombe au combat !`, 'victory')
          }
        }, 100)
      })
    }

    // Marquer l'action comme utilisée
    usePlayerAction('action')
    
    // Nettoyer la sélection
    setActionTargets([])
    selectAction(null)
  }, [playerCharacter, enemies, positions, addCombatMessage, dealDamageToEnemy, usePlayerAction, setActionTargets, selectAction])

  const handleMovementToggle = useCallback(() => {
    setIsMovementMode(!isMovementMode)
    if (selectedAction) {
      selectAction(null)
      setActionTargets([])
    }
  }, [isMovementMode, selectedAction, selectAction, setActionTargets])

  const handlePlayerMovement = useCallback((characterId, newPosition) => {
    if (characterId !== 'player') return
    
    console.log('🏃 Mouvement joueur vers:', newPosition)
    
    moveCharacter(characterId, newPosition)
    usePlayerAction('movement')
    setIsMovementMode(false)
  }, [moveCharacter, usePlayerAction])

  // Rendu selon la phase
  const renderPhaseContent = () => {
    switch (phase) {
      case 'initializing':
        return (
          <Card>
            <div className="combat-phase-content">
              <h3>⚙️ Initialisation du combat...</h3>
              <p>Préparation des combattants et jets d'initiative</p>
            </div>
          </Card>
        )

      case 'initiative-display':
        return (
          <Card>
            <div className="combat-phase-content">
              <h3>🎲 Initiative lancée !</h3>
              <p>Ordre d'initiative calculé. Prêt à commencer ?</p>
              <Button onClick={() => startCombat()}>
                ⚔️ Commencer le combat
              </Button>
            </div>
          </Card>
        )

      case 'player-turn':
        return (
          <CombatActionPanel
            playerCharacter={playerCharacter}
            selectedAction={selectedAction}
            selectedTargets={selectedTargets}
            onSelectAction={handleActionSelect}
            onClearTargets={() => setActionTargets([])}
            onPassTurn={() => endPlayerTurn()}
            canMove={!playerTurnState.actionsUsed.movement}
            onMoveToggle={handleMovementToggle}
            isMovementMode={isMovementMode}
          />
        )

      case 'executing-turn':
        return (
          <Card>
            <div className="combat-phase-content">
              <h3>⏳ Tour en cours</h3>
              <p>
                {currentTurn?.name || 'Entité inconnue'} réfléchit à son action...
              </p>
            </div>
          </Card>
        )

      case 'victory':
        return (
          <Card variant="success">
            <div className="combat-phase-content">
              <h3>🎉 Victoire !</h3>
              <p>Tous les ennemis ont été vaincus !</p>
              <Button onClick={() => {
                clearCombatLog()
                onCombatEnd?.(encounterData)
              }}>
                {victoryButtonText}
              </Button>
            </div>
          </Card>
        )

      case 'defeat':
        return (
          <Card variant="error">
            <div className="combat-phase-content">
              <h3>💀 Défaite</h3>
              <p>Vous avez été vaincu...</p>
              <Button
                variant="secondary"
                onClick={onReplayCombat}
              >
                🔄 Rejouer le combat
              </Button>
            </div>
          </Card>
        )

      default:
        return (
          <Card>
            <div className="combat-phase-content">
              <h3>⚔️ Combat en cours</h3>
              <p>Phase: {phase}</p>
            </div>
          </Card>
        )
    }
  }

  // Debug des données de combat
  console.log('🔍 CombatPanel render - État:', {
    phase,
    isInitialized,
    enemiesCount: enemies.length,
    positionsCount: Object.keys(positions).length,
    currentTurn: currentTurn?.name
  })

  if (!isInitialized) {
    return (
      <div className="combat-container">
        <Card>
          <div className="combat-loading">
            <h3>⏳ Chargement du combat...</h3>
            <p>Initialisation en cours...</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="combat-container">
      {/* Gestionnaire de tours automatique */}
      <CombatTurnManager
        currentTurn={currentTurn}
        turnOrder={turnOrder}
        phase={phase}
        onPhaseChange={(newPhase) => {
          console.log('🔄 Changement de phase:', phase, '→', newPhase)
          useCombatStore.setState({ combatPhase: newPhase })
        }}
        onNextTurn={nextTurn}
      />

      <div className="combat-layout">
        {/* Grille de combat */}
        <div className="combat-grid-section">
          <CombatGrid
            playerCharacter={playerCharacter}
            activeCompanions={activeCompanions}
            enemies={enemies}
            positions={positions}
            selectedAction={selectedAction}
            selectedTargets={selectedTargets}
            currentTurn={currentTurn}
            phase={phase}
            onTargetSelect={handleTargetSelect}
            onMoveCharacter={handlePlayerMovement}
            isMovementMode={isMovementMode}
          />
        </div>

        {/* Panneau latéral */}
        <div className="combat-side-container">
          {/* Contrôles de phase */}
          <div className="combat-controls">
            {renderPhaseContent()}
          </div>

          {/* Journal de combat */}
          <div className="combat-log-section">
            <CombatLog 
              title="Journal de Combat" 
              maxEntries={20} 
              showTimestamps={false}
              compact={true}
            />
          </div>
        </div>
      </div>

      {/* Debug info en développement */}
      {process.env.NODE_ENV === 'development' && (
        <div className="combat-debug" style={{ 
          position: 'fixed', 
          bottom: '10px', 
          right: '10px', 
          background: 'rgba(0,0,0,0.8)', 
          color: 'white', 
          padding: '10px', 
          borderRadius: '5px',
          fontSize: '12px',
          maxWidth: '300px'
        }}>
          <details>
            <summary>🔍 Debug Combat</summary>
            <div>
              <p><strong>Phase:</strong> {phase}</p>
              <p><strong>Tour actuel:</strong> {currentTurn?.name || 'Aucun'}</p>
              <p><strong>Ennemis:</strong> {enemies.length}</p>
              <p><strong>Positions:</strong> {Object.keys(positions).length}</p>
              <p><strong>Ennemis vivants:</strong> {enemies.filter(e => e.currentHP > 0).length}</p>
              <div>
                <strong>Positions des ennemis:</strong>
                {enemies.map(enemy => (
                  <div key={enemy.id}>
                    {enemy.name}: {positions[enemy.id] ? `(${positions[enemy.id].x},${positions[enemy.id].y})` : 'Pas de position'}
                  </div>
                ))}
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  )
})

export { CombatPanel }
export default CombatPanel