import { EnemyFactory } from './EnemyFactory'
import { getModifier } from '../utils/calculations'
import { CombatEngine } from './combatEngine'

/**
 * Service gérant toute la logique métier du combat - VERSION NETTOYÉE
 */
export class CombatService {

  /**
   * Lance l'initiative pour tous les combattants - CORRIGÉ
   */
  static rollInitiative(playerCharacter, activeCompanions, enemies) {
    console.log('🎲 Calcul de l\'initiative pour:', { playerCharacter: playerCharacter?.name, activeCompanions: activeCompanions?.length, enemies: enemies?.length })
    
    const combatants = []

    // Validation
    if (!playerCharacter || !playerCharacter.stats) {
      throw new Error('Personnage joueur requis pour initialiser le combat')
    }

    // Joueur
    const playerInit = CombatEngine.rollD20() + CombatEngine.getInitiativeBonus(playerCharacter)
    combatants.push({
      ...playerCharacter,
      id: 'player',
      type: 'player',
      initiative: playerInit,
      isAlive: true
    })

    // Compagnons actifs - CORRECTION
    if (activeCompanions && activeCompanions.length > 0) {
      activeCompanions.forEach(companion => {
        const companionInit = CombatEngine.rollD20() + CombatEngine.getInitiativeBonus(companion)
        combatants.push({
          ...companion,
          id: companion.id || companion.name?.toLowerCase() || 'companion',
          type: 'companion',
          initiative: companionInit,
          isAlive: true
        })
      })
    }

    // Ennemis - CORRECTION: Utiliser l'ID généré par EnemyFactory
    enemies.forEach(enemy => {
      const enemyInit = CombatEngine.rollD20() + CombatEngine.getInitiativeBonus(enemy)
      combatants.push({
        ...enemy,
        id: enemy.id, // Utiliser l'ID généré par EnemyFactory
        type: 'enemy',
        initiative: enemyInit,
        isAlive: true
      })
    })

    // Trier par initiative (plus haute en premier)
    const sorted = combatants.sort((a, b) => {
      if (b.initiative === a.initiative) {
        // Priorité: player > companion > enemy
        if (a.type === 'player') return -1
        if (b.type === 'player') return 1
        if (a.type === 'companion') return -1
        if (b.type === 'companion') return 1
        return 0
      }
      return b.initiative - a.initiative
    })

    console.log('✅ Initiative calculée:', sorted.map(c => `${c.name}: ${c.initiative}`))
    return sorted
  }

  /**
   * Initialise les positions de combat - VERSION CORRIGÉE
   */
  static initializePositions(playerCharacter, activeCompanions, enemies, customEnemyPositions = null) {
    console.log('📍 Initialisation des positions avec:', { 
      player: playerCharacter?.name, 
      companions: activeCompanions?.length, 
      enemies: enemies?.length,
      customPositions: customEnemyPositions?.length 
    })
    
    const positions = {}

    // Position du joueur
    positions.player = { x: 1, y: 2 }
    console.log('👤 Position joueur:', positions.player)

    // Positions des compagnons actifs - CORRECTION
    if (activeCompanions && activeCompanions.length > 0) {
      activeCompanions.forEach((companion, index) => {
        const companionKey = companion.id || companion.name?.toLowerCase() || `companion_${index}`
        positions[companionKey] = { x: 0, y: index + 1 }
        console.log(`🐺 Position ${companion.name} (${companionKey}):`, positions[companionKey])
      })
    }

    // Positions des ennemis - CORRECTION MAJEURE
    if (enemies && enemies.length > 0) {
      enemies.forEach((enemy, index) => {
        let enemyPosition
        
        // Utiliser les positions personnalisées si disponibles
        if (customEnemyPositions && customEnemyPositions[index]) {
          enemyPosition = customEnemyPositions[index]
        } else {
          // Position par défaut
          enemyPosition = this.getDefaultEnemyPosition(index, enemies.length)
        }
        
        // CORRECTION: Utiliser l'ID généré par EnemyFactory
        const enemyKey = enemy.id || enemy.name
        positions[enemyKey] = enemyPosition
        
        console.log(`👹 Position ${enemy.name} (${enemyKey}):`, positions[enemyKey])
      })
    }

    console.log('✅ Positions finales:', positions)
    return positions
  }

  /**
   * Calcule une position par défaut pour un ennemi
   */
  static getDefaultEnemyPosition(index, totalEnemies) {
    const cols = 8
    const rows = 6
    
    // Placer les ennemis du côté droit
    const startX = Math.floor(cols * 0.6) // Position x = 4-5
    const availableWidth = cols - startX
    
    if (totalEnemies === 1) {
      return { 
        x: startX + Math.floor(availableWidth / 2), 
        y: Math.floor(rows / 2) 
      }
    }
    
    // Répartir sur plusieurs lignes si nécessaire
    const enemiesPerRow = Math.min(availableWidth, totalEnemies)
    const row = Math.floor(index / enemiesPerRow)
    const col = index % enemiesPerRow
    
    return {
      x: startX + col,
      y: Math.max(1, Math.min(rows - 2, row + 1))
    }
  }

  /**
   * Exécute une action du joueur - SIMPLIFIÉ
   */
  static executePlayerAction(playerCharacter, action, targets, enemies, positions) {
    console.log('⚔️ Exécution action joueur:', { action: action?.name, targets: targets?.length })
    
    const results = {
      damage: [],
      effects: [],
      messages: []
    }

    if (!action || !targets.length) {
      results.messages.push({ text: "Aucune action ou cible sélectionnée", type: 'error' })
      return results
    }

    switch (action.type) {
      case 'attack':
        return this.executeAttack(playerCharacter, action, targets, results)
      
      case 'spell':
        return this.executeSpell(playerCharacter, action, targets, results)
      
      default:
        results.messages.push({ text: `Type d'action inconnu: ${action.type}`, type: 'error' })
        return results
    }
  }

  /**
   * Exécute une attaque - SIMPLIFIÉ
   */
  static executeAttack(attacker, weapon, targets, results) {
    targets.forEach(target => {
      const attackRoll = CombatEngine.rollD20()
      const attackBonus = this.getAttackBonus(attacker, weapon)
      const totalAttack = attackRoll + attackBonus
      
      const criticalHit = attackRoll === 20
      const hit = totalAttack >= target.ac || criticalHit
      
      if (hit) {
        let damage = this.rollDamage(weapon.damage || '1d6')
        if (criticalHit) damage *= 2
        
        results.messages.push({
          text: criticalHit 
            ? `💥 Coup critique ! ${attacker.name} inflige ${damage} dégâts à ${target.name} !`
            : `${attacker.name} touche ${target.name} et inflige ${damage} dégâts`, 
          type: criticalHit ? 'critical-hit' : 'enemy-damage'
        })
        
        results.damage.push({ 
          targetId: target.id || target.name, 
          damage 
        })
      } else {
        results.messages.push({
          text: `❌ ${attacker.name} manque ${target.name} (${totalAttack} vs CA ${target.ac})`, 
          type: 'miss'
        })
      }
    })
    
    return results
  }

  /**
   * Exécute un sort - SIMPLIFIÉ
   */
  static executeSpell(caster, spell, targets, results) {
    // Logique de sort simplifiée pour éviter les bugs
    targets.forEach(target => {
      if (spell.requiresAttackRoll) {
        const attackRoll = CombatEngine.rollD20()
        const spellAttackBonus = this.getSpellAttackBonus(caster)
        const totalAttack = attackRoll + spellAttackBonus
        
        const hit = totalAttack >= target.ac
        
        if (hit) {
          const damage = spell.damage ? this.rollDamage(spell.damage.dice) + (spell.damage.bonus || 0) : 0
          results.messages.push({
            text: `🔮 ${caster.name} inflige ${damage} dégâts à ${target.name} avec ${spell.name}`, 
            type: 'spell-hit'
          })
          results.damage.push({ targetId: target.id || target.name, damage })
        } else {
          results.messages.push({
            text: `❌ ${caster.name} manque ${target.name} avec ${spell.name}`, 
            type: 'miss'
          })
        }
      } else {
        // Sort à touche automatique
        const damage = spell.damage ? this.rollDamage(spell.damage.dice) + (spell.damage.bonus || 0) : 0
        results.messages.push({
          text: `✨ ${spell.name} inflige ${damage} dégâts à ${target.name}`, 
          type: 'spell-hit'
        })
        results.damage.push({ targetId: target.id || target.name, damage })
      }
    })
    
    return results
  }

  /**
   * Utilitaires de calcul
   */
  static getAttackBonus(character, weapon) {
    return CombatEngine.calculateAttackBonus(character, weapon)
  }

  static getSpellAttackBonus(caster) {
    return CombatEngine.calculateSpellAttackBonus(caster)
  }

  static rollDamage(damageString) {
    return CombatEngine.rollDamage(damageString)
  }

  static isDefeated(character) {
    return CombatEngine.isDefeated(character)
  }

  /**
   * Vérifie les conditions de victoire/défaite
   */
  static checkCombatEnd(playerCharacter, activeCompanions, enemies) {
    const playerDefeated = this.isDefeated(playerCharacter)
    const allCompanionsDefeated = activeCompanions.length === 0 || 
      activeCompanions.every(companion => this.isDefeated(companion))
    const allEnemiesDefeated = enemies.every(enemy => this.isDefeated(enemy))
    
    if (playerDefeated && allCompanionsDefeated) {
      return 'defeat'
    }
    
    if (allEnemiesDefeated) {
      return 'victory'
    }
    
    return null
  }

  /**
   * Alias pour compatibilité
   */
  static calculateInitialPositions = this.initializePositions
}