/**
 * Content schemas — the single source of truth for grammar points, lessons and items
 * (ARCHITECTURE §4, CONTENT_GUIDE §3–4). Used at build time by scripts/content-validate.ts
 * and at runtime as the TypeScript types of loaded content.
 *
 * Evolves additively: new optional fields are fine; a breaking change needs an ADR,
 * a schemaVersion bump and a converter (CLAUDE.md §9).
 */
import { z } from 'zod';
import { LEVELS } from './levels';

export const CONTENT_SCHEMA_VERSION = 1;

export const LevelSchema = z.enum(LEVELS);
export const CaseSchema = z.enum(['nom', 'akk', 'dat', 'gen']);
export const GenderSchema = z.enum(['m', 'f', 'n', 'pl']);
export const SkillSchema = z.enum(['form', 'syntax', 'meaning', 'style']);

/** Families from CURRICULUM.md. */
export const FamilySchema = z.enum([
	'basics',
	'verbs',
	'tenses',
	'cases',
	'articles',
	'pronouns',
	'adjectives',
	'prepositions',
	'word-order',
	'connectors',
	'clauses',
	'passive',
	'subjunctive',
	'modality',
	'nominal',
	'style',
	'spelling'
]);

/** Closed list (ARCHITECTURE §4); extend via ADR. */
export const ErrorTagSchema = z.enum([
	'case',
	'gender',
	'number',
	'article-form',
	'adj-ending',
	'noun-ending',
	'pronoun-form',
	'verb-conjugation',
	'verb-stem',
	'tense-choice',
	'aux-haben-sein',
	'participle',
	'separable-prefix',
	'v2-position',
	'verb-final',
	'verb-cluster',
	'mittelfeld-order',
	'preposition-choice',
	'preposition-case',
	'connector-choice',
	'reflexive',
	'mood',
	'voice',
	'register',
	'spelling',
	'capitalisation',
	'punctuation'
]);

export const XrayRoleSchema = z.enum([
	'subj',
	'akk-obj',
	'dat-obj',
	'gen-attr',
	'prep-obj',
	'verb',
	'verb-part',
	'pred'
]);

/** kebab-case, stable forever, no level in it. */
export const PointIdSchema = z
	.string()
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'point id must be kebab-case');

/**
 * `<point-id>/<nnn>`, or `<point-id>/<book-slug>.<nnn>` for items from AJ's books (ADR 0003),
 * so book items can never collide with public ones. The part before `/` is the point id.
 */
export const ItemIdSchema = z
	.string()
	.regex(
		/^[a-z0-9]+(?:-[a-z0-9]+)*\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\.)?\d{3}$/,
		'item id must be <point-id>/<nnn> (or <point-id>/<book-slug>.<nnn> for book items)'
	);

const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

export const ReviewSchema = z.object({
	status: z.enum(['draft', 'verified', 'flagged']),
	by: z.string().min(1),
	date: IsoDate,
	note: z.string().optional()
});

export const SourceSchema = z.union([
	z.enum(['original', 'generated', 'book-variant', 'book-exact']),
	z.string().regex(/^tatoeba:\d+$/)
]);

export const OriginSchema = z.object({
	book: z.string().min(1),
	chapter: z.string().min(1),
	exercise: z.string().optional(),
	mode: z.enum(['variant', 'exact', 'remix'])
});

export const BilingualSchema = z.object({ en: z.string().min(1), de: z.string().min(1) });

// ---------- Lesson ----------

export const XraySpanSchema = z.object({
	/** The exact words in the example sentence (first occurrence). */
	text: z.string().min(1),
	role: XrayRoleSchema,
	case: CaseSchema.optional(),
	gender: GenderSchema.optional(),
	/** Optional short note shown when tapped, e.g. "helfen + Dativ". */
	note: z.string().optional()
});

export const ExampleSchema = z.object({
	de: z.string().min(1),
	en: z.string().min(1),
	xray: z.array(XraySpanSchema).default([])
});

export const TableSchema = z.object({
	/** Column headers, e.g. [m, f, n, pl]. */
	columns: z.array(z.string().min(1)).min(1),
	/** Row key (e.g. a case) → one cell per column. */
	rows: z.record(z.string(), z.array(z.string()))
});

export const LessonSchema = z.object({
	summary: z.string().min(1),
	/** Markdown, own words, ≤ 250 words. */
	rule: z.string().min(1),
	table: TableSchema.optional(),
	examples: z.array(ExampleSchema).min(1),
	pitfalls: z.array(z.string().min(1)).default([])
});

// ---------- Items ----------

const BaseItemSchema = z.object({
	id: ItemIdSchema,
	level: LevelSchema,
	skill: SkillSchema,
	/** Instruction or EN translation hint. */
	prompt: z.string().optional(),
	/** Lemma / tense hint shown next to the gap, e.g. "(alt)". */
	hint: z.string().optional(),
	/** The rule applied in this item, 1–2 lines. */
	explanation: z.string().min(1),
	errorTags: z.array(ErrorTagSchema).min(1),
	/** Wrong answer → specific feedback. */
	distractorNotes: z.record(z.string(), z.string()).optional(),
	audio: z.boolean().default(true),
	review: ReviewSchema,
	source: SourceSchema,
	origin: OriginSchema.optional(),
	/** Retired items are never served; history stays (CLAUDE.md §9). */
	retired: z.boolean().default(false)
});

/** Accepted answers for one gap: non-empty, first one canonical. */
const Accepted = z.array(z.string().min(1)).min(1);

/**
 * Cloze: typed gap(s) written as {{answer}} in `text`. One gap → flat list; several
 * gaps → one list per gap. Normalised to `string[][]` on parse.
 */
export const ClozeItemSchema = BaseItemSchema.extend({
	type: z.literal('cloze'),
	text: z.string().regex(/\{\{[^{}]+\}\}/, 'cloze text needs at least one {{gap}}'),
	accepted: z
		.union([Accepted, z.array(Accepted).min(1)])
		.transform((value): string[][] =>
			typeof value[0] === 'string' ? [value as string[]] : (value as string[][])
		)
});

export const ChoiceItemSchema = BaseItemSchema.extend({
	type: z.literal('choice'),
	/** Sentence with ___ for the gap (or a question). */
	text: z.string().min(1),
	options: z.array(z.string().min(1)).min(2).max(6),
	answer: z.string().min(1)
});

/** Feldermodell zones for the order visualiser. */
export const FieldsSchema = z
	.object({
		vorfeld: z.string(),
		leftBracket: z.string(),
		connector: z.string(),
		mittelfeld: z.string(),
		rightBracket: z.string(),
		nachfeld: z.string()
	})
	.partial();

export const OrderItemSchema = BaseItemSchema.extend({
	type: z.literal('order'),
	/** Fixed text before the tiles, e.g. "Ich komme heute nicht, ". */
	prefix: z.string().optional(),
	tiles: z.array(z.string().min(1)).min(2),
	/** Every correct tile order, tiles joined by single spaces. */
	accepted: Accepted,
	/** Fixed text after the tiles, e.g. ".". */
	suffix: z.string().optional(),
	fields: FieldsSchema.optional()
});

export const ItemSchema = z.discriminatedUnion('type', [
	ClozeItemSchema,
	ChoiceItemSchema,
	OrderItemSchema
]);

export const ITEM_TYPES = ['cloze', 'choice', 'order'] as const;

// ---------- Grammar point & catalogue ----------

export const GeneratorRefSchema = z.object({
	id: z.string().min(1),
	params: z.record(z.string(), z.unknown()).default({})
});

export const CatalogueEntrySchema = z.object({
	id: PointIdSchema,
	title: BilingualSchema,
	level: LevelSchema,
	family: FamilySchema,
	prerequisites: z.array(PointIdSchema).default([]),
	compareWith: z.array(PointIdSchema).default([])
});

export const CatalogueSchema = z.object({
	schemaVersion: z.literal(CONTENT_SCHEMA_VERSION),
	points: z.array(CatalogueEntrySchema).min(1)
});

export const GrammarPointSchema = CatalogueEntrySchema.extend({
	/** Bump when the lesson's meaning changes. */
	version: z.number().int().positive(),
	lesson: LessonSchema,
	items: z.array(ItemSchema).default([]),
	generators: z.array(GeneratorRefSchema).default([])
});

// ---------- Types ----------

export type Case = z.infer<typeof CaseSchema>;
export type Gender = z.infer<typeof GenderSchema>;
export type Skill = z.infer<typeof SkillSchema>;
export type Family = z.infer<typeof FamilySchema>;
export type ErrorTag = z.infer<typeof ErrorTagSchema>;
export type XrayRole = z.infer<typeof XrayRoleSchema>;
export type XraySpan = z.infer<typeof XraySpanSchema>;
export type Example = z.infer<typeof ExampleSchema>;
export type Lesson = z.infer<typeof LessonSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type ClozeItem = z.infer<typeof ClozeItemSchema>;
export type ChoiceItem = z.infer<typeof ChoiceItemSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type ItemType = Item['type'];
export type CatalogueEntry = z.infer<typeof CatalogueEntrySchema>;
export type Catalogue = z.infer<typeof CatalogueSchema>;
export type GrammarPoint = z.infer<typeof GrammarPointSchema>;
/** Raw (pre-parse) shapes, e.g. what YAML authors write. */
export type GrammarPointInput = z.input<typeof GrammarPointSchema>;
export type ItemInput = z.input<typeof ItemSchema>;
