/**
 * Card keys (ARCHITECTURE §5.2). A card is one grammar point × one skill: `pointId:skill`,
 * e.g. `dative-articles:form`. Keys are storage ids: never change their format.
 */
import { SkillSchema, type Skill } from '../content/schema';

export type CardKey = `${string}:${Skill}`;

export function cardKey(pointId: string, skill: Skill): CardKey {
	return `${pointId}:${skill}`;
}

export function parseCardKey(key: string): { pointId: string; skill: Skill } | undefined {
	const at = key.lastIndexOf(':');
	if (at <= 0) return undefined;
	const pointId = key.slice(0, at);
	const skill = key.slice(at + 1);
	const parsed = SkillSchema.safeParse(skill);
	return parsed.success ? { pointId, skill: parsed.data } : undefined;
}
