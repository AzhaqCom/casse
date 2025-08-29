import React, { useState, useCallback } from 'react'
import { calculateDistance } from '../../../utils/calculations'

/**
 * Grille de combat tactique - Version nettoyée et simplifiée
 */
const CombatGrid = React.memo(({
  playerCharacter,
  activeCompanions = [],
  enemies = [],
  positions = {},
  selectedAction,
  selectedTargets = [],
  currentTurn,
  phase,
  onTargetSelect,
  onMoveCharacter,
  isMovementMode = false
}) => {
  const GRID_WIDTH = 8
  const GRID_HEIGHT = 6
  const MOVEMENT_RANGE = 6

  const [hoveredCell, setHoveredCell] = useState(null)

  // Obtenir le combattant à une position donnée - VERSION SIMPLIFIÉE
  const getCombatantAtPosition = useCallback((x, y) => {
    // Vérifier le joueur
    if (positions.player?.x === x && positions.player?.y === y) {
      return { 
        ...playerCharacter, 
        id: 'player', 
        type: 'player',
        name: playerCharacter.name || 'Joueur'
      }
    }

    // Vérifier les compagnons actifs
    for (const companion of activeCompanions) {
      const companionKey = companion.id || companion.name?.toLowerCase() || 'companion'
      const companionPos = positions[companionKey]
      
      if (companionPos?.x === x && companionPos?.y === y) {
        return { 
          ...companion, 
          id: companionKey, 
          type: 'companion' 
        }
      }
    }

    // Vérifier les ennemis - CORRECTION PRINCIPALE
    for (const enemy of enemies) {
      // Essayer plusieurs clés possibles pour trouver la position de l'ennemi
      const possibleKeys = [
        enemy.id,
        enemy.name,
        `enemy_${enemy.templateKey}_${enemy.instance}`,
        `${enemy.name}_${enemy.instance || 0}`
      ].filter(Boolean)

      for (const key of possibleKeys) {
        const enemyPos = positions[key]
        if (enemyPos?.x === x && enemyPos?.y === y && enemy.currentHP > 0) {
          return {
            ...enemy,
            type: 'enemy',
            id: key
          }
        }
      }
    }

    return null
  }, [positions, playerCharacter, activeCompanions, enemies])

  const getHealthColor = (currentHP, maxHP) => {
    const ratio = currentHP / maxHP
    if (ratio > 0.6) return "#4caf50"
    if (ratio > 0.3) return "#ff9800"
    return "#f44336"
  }

  const getManhattanDistance = (x1, y1, x2, y2) => {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2)
  }

  const isValidMovementTarget = (x, y) => {
    if (phase !== 'player-turn' || !isMovementMode) return false

    const playerPos = positions.player
    if (!playerPos) return false

    const distance = getManhattanDistance(playerPos.x, playerPos.y, x, y)
    return distance <= MOVEMENT_RANGE && !getCombatantAtPosition(x, y)
  }

  const isValidActionTarget = (x, y) => {
    if (!selectedAction || phase !== 'player-turn') return false

    const combatant = getCombatantAtPosition(x, y)

    if (selectedAction.type === 'attack') {
      return combatant?.type === 'enemy' && combatant.currentHP > 0
    }

    if (selectedAction.areaOfEffect) {
      return true
    }

    if (selectedAction.type === 'spell') {
      return combatant?.type === 'enemy' && combatant.currentHP > 0
    }

    return false
  }

  const handleCellHover = (x, y) => {
    setHoveredCell({ x, y })
  }

  const handleCellLeave = () => {
    setHoveredCell(null)
  }

  const handleCellClick = (x, y) => {
    if (phase === 'player-turn' && isMovementMode) {
      if (isValidMovementTarget(x, y)) {
        onMoveCharacter?.('player', { x, y })
      }
      return
    }

    if (phase === 'player-turn' && selectedAction) {
      if (selectedAction.areaOfEffect) {
        onTargetSelect?.({ x, y, isPosition: true })
      } else {
        const combatant = getCombatantAtPosition(x, y)
        if (combatant && isValidActionTarget(x, y)) {
          onTargetSelect?.(combatant)
        }
      }
    }
  }

  const getCellClasses = (x, y) => {
    const classes = ['combat-grid__cell']
    const combatant = getCombatantAtPosition(x, y)

    if (combatant) {
      classes.push('combat-grid__cell--occupied')
      classes.push(`combat-grid__cell--${combatant.type}`)

      if (currentTurn && combatant.id === currentTurn.id) {
        classes.push('combat-grid__cell--current-turn')
      }

      if (selectedTargets.some(target => target.id === combatant.id)) {
        classes.push('combat-grid__cell--selected-target')
      }
    }

    if (hoveredCell?.x === x && hoveredCell?.y === y) {
      classes.push('combat-grid__cell--hovered')
    }

    if (isValidMovementTarget(x, y)) {
      classes.push('combat-grid__cell--valid-movement')
    }

    if (isValidActionTarget(x, y)) {
      classes.push('combat-grid__cell--valid-target')
    }

    return classes.join(' ')
  }

  const getCombatantIcon = (combatant) => {
    switch (combatant.type) {
      case 'player':
        return '🧙‍♂️'
      case 'companion':
        return '🐺'
      case 'enemy':
        return '👹'
      default:
        return '❓'
    }
  }

  const renderCell = (x, y) => {
    const combatant = getCombatantAtPosition(x, y)
    const cellKey = `${x}-${y}`

    return (
      <div
        key={cellKey}
        className={getCellClasses(x, y)}
        onMouseEnter={() => handleCellHover(x, y)}
        onMouseLeave={handleCellLeave}
        onClick={() => handleCellClick(x, y)}
        title={combatant ? `${combatant.name} (${combatant.currentHP}/${combatant.maxHP} PV)` : `Case (${x}, ${y})`}
      >
        <span className="combat-grid__coordinates">
          {x},{y}
        </span>

        {combatant && (
          <div className="combat-grid__combatant">
            {combatant.image ? (
              <img 
                src={combatant.image} 
                alt={combatant.name} 
                className="combat-grid__combatant-image" 
              />
            ) : (
              <span className="combat-grid__combatant-icon">
                {getCombatantIcon(combatant)}
              </span>
            )}
            <span className="combat-grid__combatant-name">
              {combatant.name}
            </span>
            <span className="combat-grid__combatant-ac">
              CA{combatant.ac}
            </span>
            <span className="combat-grid__combatant-hp">
              {combatant.currentHP}/{combatant.maxHP}❤️
            </span>
            <div className="combat-grid__health-bar">
              <div
                className="combat-grid__health-fill"
                style={{
                  width: `${(combatant.currentHP / combatant.maxHP) * 100}%`,
                  backgroundColor: getHealthColor(combatant.currentHP, combatant.maxHP),
                }}
              />
            </div>
          </div>
        )}

        {isValidMovementTarget(x, y) && (
          <div className="combat-grid__movement-indicator">🏃</div>
        )}

        {isValidActionTarget(x, y) && !combatant && (
          <div className="combat-grid__target-indicator">🎯</div>
        )}
      </div>
    )
  }

  return (
    <div className="combat-grid">
      <div
        className="combat-grid__container"
        style={{
          gridTemplateColumns: `repeat(${GRID_WIDTH}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_HEIGHT}, 1fr)`
        }}
      >
        {Array.from({ length: GRID_HEIGHT }, (_, y) =>
          Array.from({ length: GRID_WIDTH }, (_, x) => renderCell(x, y))
        )}
      </div>
    </div>
  )
})

export { CombatGrid }
export default CombatGrid