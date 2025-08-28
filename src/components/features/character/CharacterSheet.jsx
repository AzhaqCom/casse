import React, { useMemo } from 'react'
import { useCharacterStore, characterSelectors } from '../../../stores'
import { CharacterManager } from '../../../services/characterManager'
import { getModifier } from '../../../utils/calculations'
import { CombatEffects } from '../../../services/combatEffects'
import {
  Card,
  CardHeader,
  CardBody,
  CollapsibleSection,
  ResourceBars,
  HealthBar
} from '../../ui'

import { StatBlock } from './StatBlock'
import { AbilityScores } from './AbilityScores'
import { SkillsList } from './SkillsList'
import { XPBar } from './XPBar'

/**
 * Fiche de personnage modernisée avec stores Zustand
 */
export const CharacterSheet = ({
  characterType = 'player', // 'player' ou 'companion'
  compact = false,
  showControls = false
}) => {
  const character = useCharacterStore(state =>
    characterType === 'player'
      ? state.playerCharacter
      : state.playerCompanion
  )
  
  // Forcer la réactivité pour activeEffects
  const activeEffectsCount = useCharacterStore(state => 
    characterType === 'player' 
      ? state.playerCharacter?.activeEffects?.length || 0
      : state.playerCompanion?.activeEffects?.length || 0
  )

  // Calculs memoïsés du personnage
  const characterStats = useMemo(() => {
    if (!character) return null

    const xpToNext = CharacterManager.getXPToNextLevel(character.level) // XP pour niveau suivant
    const xpCurrentLevel = CharacterManager.getXPForLevel(character.level) // XP total pour le niveau actuel
    const currentXP = character.currentXP || character.experience || 0 // Support des deux propriétés
    const spellSlots = CharacterManager.generateSpellSlotsForLevel(character.level, character.class)
    // Calcul correct de la progression dans le niveau actuel
    const xpInCurrentLevel = currentXP - xpCurrentLevel // XP gagné dans le niveau actuel
    const xpNeededForLevel = xpToNext - xpCurrentLevel // XP total nécessaire pour passer au niveau suivant
    const xpProgress = xpNeededForLevel > 0 ? (xpInCurrentLevel / xpNeededForLevel) * 100 : 100

    // Bonus d'attaque de sorts
    const spellAttackBonus = character.spellcasting
      ? CharacterManager.getAttackBonus(character, { actionType: 'spell' })
      : null

    // Bonus d'attaque d'armes (utilise la stat primaire)
    const primaryStat = character.class === 'Roublard' ? 'dexterite' : 'force'
    const weaponAttackBonus = getModifier(character.stats[primaryStat]) +
      CharacterManager.getProficiencyBonus(character.level)

    // DD des sorts
    const spellSaveDC = character.spellcasting
      ? CharacterManager.getSpellSaveDC(character)
      : null

    return {
      xpToNext: xpNeededForLevel, // XP nécessaire pour le niveau suivant (pas le total)
      xpProgress,
      spellAttackBonus,
      weaponAttackBonus,
      spellSaveDC,
      spellSlots: spellSlots,
      proficiencyBonus: CharacterManager.getProficiencyBonus(character.level)
    }
  }, [character])

  if (!character) {
    return (
      <Card className="character-sheet character-sheet--empty">
        <CardBody>
          <p>Aucun {characterType === 'player' ? 'personnage' : 'compagnon'}</p>
        </CardBody>
      </Card>
    )
  }

  // Calculer la CA totale avec les effets de buff
  const totalAC = useMemo(() => {
    const newAC = CombatEffects.calculateTotalACPure(character);
    if (character?.activeEffects?.[0]) {
      const effect = character.activeEffects[0];
    }
    return newAC; // Utiliser la nouvelle méthode pure
  }, [character, activeEffectsCount]);

  const containerClass = [
    'character-sheet',
    compact && 'character-sheet--compact',
    `character-sheet--${characterType}`
  ].filter(Boolean).join(' ')

  return (
    <Card className={containerClass}>
      <CardHeader>
        <div className="character-sheet__header">
          <h3 className="character-sheet__name">{character.name} {character.familyName}</h3>
           
          {!compact && (
            <XPBar
              currentXP={Math.max(0, (character.currentXP || character.experience || 0) - CharacterManager.getXPForLevel(character.level))}
              nextLevelXP={characterStats.xpToNext}
              progress={characterStats.xpProgress}
              level={character.level}
            />
          )}

          <p className="character-sheet__details">
            Niv. {character.level} {character.race} {character.class}
          </p>
          {character.historic && (
            <p className="character-sheet__background">{character.historic}</p>
          )}



        </div>
      </CardHeader>

      <CardBody>
        {/* Stats principales */}
        <div className="character-sheet__main-stats">
          <div className="character-sheet__combat-stats">
            <StatBlock
              label="CA"
              value={totalAC}
              tooltip="Classe d'Armure"
            />

          </div>

          {/* Barre de vie */}
          {!compact && (
            <CollapsibleSection
              id={`${characterType}-resources`}
              title="Ressources"
              defaultExpanded={true}
            >
              <ResourceBars
                character={character}
                characterStats={characterStats}
                layout="vertical"
              />
            </CollapsibleSection>
          )}
        </div>

        {/* Caractéristiques */}
        <CollapsibleSection
          id={`${characterType}-abilities`}
          title="Caractéristiques"
          defaultExpanded={compact}
        >
          <AbilityScores
            stats={character.stats}
            saves={character.proficiencies?.saves || []}
            proficiencyBonus={characterStats.proficiencyBonus}
            compact={!compact}
            showSaveBonus={false}
          />
        </CollapsibleSection>

        {/* Bonus de maîtrise et attaques */}
        <CollapsibleSection
          id={`${characterType}-combat`}
          title="Combat"
          defaultExpanded={compact}
        >
          <div className="character-sheet__combat-info">
            <StatBlock
              label="Bonus de Maîtrise"
              value={`+${characterStats.proficiencyBonus}`}
            />



            {characterStats.spellAttackBonus !== null && (

              <StatBlock
                label="Att. Sorts"
                value={`+${characterStats.spellAttackBonus}`}
                tooltip="Bonus d'attaque des sorts"
              />

            )}


            <StatBlock
              label="Att. Armes"
              value={`+${characterStats.weaponAttackBonus}`}
              tooltip="Bonus d'attaque des armes"
            />


            {characterStats.spellSaveDC && (
              <StatBlock
                label="DD des sorts"
                value={characterStats.spellSaveDC}
                tooltip="Difficulté des jets de sauvegarde contre vos sorts"
              />
            )}
          </div>
        </CollapsibleSection>

        {/* Compétences */}
        <CollapsibleSection
          id={`${characterType}-skills`}
          title="Compétences"
          defaultExpanded={compact}
        >
          <SkillsList
            character={character}
            proficiencyBonus={characterStats.proficiencyBonus}
            compact={compact}
          />
        </CollapsibleSection>

        {/* Ressources (HP, sorts, dés de vie) */}

      </CardBody>
    </Card>
  )
}

/**
 * Version compacte pour les interfaces restreintes
 */
export const CompactCharacterSheet = ({ characterType = 'player' }) => (
  <CharacterSheet characterType={characterType} compact={true} />
)

/**
 * Fiche de personnage avec contrôles
 */

export default CharacterSheet