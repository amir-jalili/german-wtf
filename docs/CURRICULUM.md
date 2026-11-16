# Curriculum — A1 to C2 grammar points

The catalogue of grammar points. `content/catalogue.yaml` is the machine version of this file; keep both in sync (the validator checks it).

**How it was built:** the CEFR progression used by the Goethe-Institut/ÖSD reference _Profile deutsch_ (which specifies grammar for A1–B2) and common C1/C2 exam syllabi, organised by our own families. Level placement is approximate: textbooks differ by ±1 level. Adjust levels freely (IDs never change).

Format: `id` — **Deutsch** · English · ⟵ prerequisites (ids)

Families: `basics` · `verbs` · `tenses` · `cases` · `articles` · `pronouns` · `adjectives` · `prepositions` · `word-order` · `connectors` · `clauses` · `passive` · `subjunctive` · `modality` · `nominal` · `style` · `spelling`

---

## A1 (26 points)

- `pronouns-nominative` — **Personalpronomen im Nominativ** · subject pronouns
- `present-regular` — **Präsens: regelmäßige Verben** · present tense, regular verbs ⟵ pronouns-nominative
- `sein-haben-present` — **sein und haben im Präsens** · to be / to have ⟵ pronouns-nominative
- `present-stem-change` — **Präsens mit Vokalwechsel** (e→i, e→ie, a→ä, au→äu) ⟵ present-regular
- `word-order-v2` — **Verbzweitstellung im Hauptsatz** · verb second ⟵ present-regular
- `questions-yes-no-w` — **Ja/Nein- und W-Fragen** · questions ⟵ word-order-v2
- `noun-gender-articles` — **Genus und bestimmter/unbestimmter Artikel (Nominativ)** · gender and articles
- `noun-plural` — **Pluralformen der Nomen** · plural forms ⟵ noun-gender-articles
- `compound-nouns` — **Komposita: das letzte Wort bestimmt den Artikel** · compound nouns ⟵ noun-gender-articles
- `negation-nicht-kein` — **Negation mit nicht und kein** ⟵ noun-gender-articles
- `accusative-articles` — **Akkusativ: Artikel** · accusative articles ⟵ noun-gender-articles
- `es-gibt` — **es gibt + Akkusativ** ⟵ accusative-articles
- `possessive-articles-nom-akk` — **Possessivartikel (Nominativ, Akkusativ)** ⟵ accusative-articles
- `pronouns-accusative` — **Personalpronomen im Akkusativ** ⟵ accusative-articles
- `modal-verbs-present` — **Modalverben im Präsens + Satzklammer** ⟵ word-order-v2
- `separable-verbs` — **Trennbare Verben** ⟵ word-order-v2
- `imperative` — **Imperativ (du, ihr, Sie)** ⟵ present-stem-change, separable-verbs
- `perfect-haben` — **Perfekt mit haben (regelmäßige Partizipien)** ⟵ sein-haben-present
- `perfect-sein` — **Perfekt mit sein** (Bewegung, Zustandswechsel) ⟵ perfect-haben
- `participle-irregular` — **Unregelmäßige Partizipien** ⟵ perfect-haben
- `preteritum-sein-haben` — **Präteritum von sein und haben** ⟵ sein-haben-present
- `time-prepositions-basic` — **Zeitangaben: am, um, im, von … bis** · time prepositions
- `dative-basic-mit-bei-zu` — **Dativ nach mit, bei, zu, aus, von, nach, seit (Einstieg)** ⟵ accusative-articles
- `conjunctions-aduso` — **und, aber, oder, denn, sondern (Position 0)** ⟵ word-order-v2
- `man-indefinite` — **man** · the generic pronoun ⟵ present-regular
- `gern-lieber` — **gern, lieber, am liebsten** ⟵ present-regular

## A2 (28 points)

- `dative-articles` — **Dativ: Artikel und Nomen (Dativ-Plural -n)** ⟵ dative-basic-mit-bei-zu
- `pronouns-dative` — **Personalpronomen im Dativ** ⟵ dative-articles
- `possessive-articles-dative` — **Possessivartikel im Dativ** ⟵ dative-articles
- `dative-verbs` — **Verben mit Dativ** (helfen, gefallen, gehören, danken …) ⟵ dative-articles
- `dative-accusative-verbs` — **Verben mit Dativ und Akkusativ + Reihenfolge der Objekte** ⟵ dative-verbs, pronouns-dative
- `accusative-prepositions` — **Präpositionen mit Akkusativ** (durch, für, gegen, ohne, um, bis, entlang) ⟵ accusative-articles
- `dative-prepositions` — **Präpositionen mit Dativ (vollständig)** ⟵ dative-articles
- `two-way-prepositions` — **Wechselpräpositionen: wo? (Dativ) / wohin? (Akkusativ)** ⟵ dative-prepositions, accusative-prepositions
- `position-verbs` — **stellen/stehen, legen/liegen, setzen/sitzen, hängen** ⟵ two-way-prepositions
- `preposition-contractions` — **im, ins, am, ans, zum, zur, beim, vom** ⟵ two-way-prepositions
- `adj-endings-definite` — **Adjektivdeklination nach bestimmtem Artikel** ⟵ dative-articles
- `adj-endings-indefinite` — **Adjektivdeklination nach unbestimmtem Artikel / Possessivartikel / kein** ⟵ adj-endings-definite
- `comparison` — **Komparativ und Superlativ** (prädikativ und attributiv; als/wie) ⟵ adj-endings-definite
- `reflexive-verbs-akk` — **Reflexive Verben (Akkusativ)** ⟵ pronouns-accusative
- `reflexive-dative` — **Reflexivpronomen im Dativ** (ich wasche mir die Hände) ⟵ reflexive-verbs-akk, pronouns-dative
- `modal-verbs-preterite` — **Präteritum der Modalverben** ⟵ modal-verbs-present
- `subordinate-weil-dass` — **Nebensätze mit weil und dass (Verb am Ende)** ⟵ word-order-v2
- `subordinate-wenn-ob` — **Nebensätze mit wenn und ob** ⟵ subordinate-weil-dass
- `indirect-questions` — **Indirekte Fragen (W-Wort / ob)** ⟵ subordinate-wenn-ob
- `subordinate-first` — **Nebensatz vorne: Verb-Verb in der Mitte** ⟵ subordinate-weil-dass
- `adverbial-connectors` — **deshalb, trotzdem, dann, danach, sonst (Inversion)** ⟵ word-order-v2
- `konjunktiv2-politeness` — **Konjunktiv II: würde, hätte, wäre, könnte (Höflichkeit, Wünsche, Ratschläge)** ⟵ modal-verbs-preterite
- `future-werden` — **Futur I mit werden** ⟵ modal-verbs-present
- `indefinite-pronouns` — **jemand, niemand, etwas, nichts, alle, viele** ⟵ pronouns-accusative
- `ordinal-dates` — **Ordinalzahlen und Datum** (am ersten Mai, vom 3. bis 5.) ⟵ dative-articles
- `genitive-names` — **Genitiv bei Namen** (Annas Buch) ⟵ noun-gender-articles
- `question-words-cases` — **wer, wen, wem, wessen** ⟵ dative-articles
- `welcher-dieser` — **welch-, dies-, jed- (Artikelwörter)** ⟵ dative-articles

## B1 (36 points)

- `preterite-regular-irregular` — **Präteritum (regelmäßig, unregelmäßig, gemischt)** ⟵ participle-irregular
- `pluperfect` — **Plusquamperfekt** ⟵ preterite-regular-irregular
- `tense-choice-narration` — **Perfekt oder Präteritum? (mündlich/schriftlich)** ⟵ preterite-regular-irregular
- `future-assumption` — **Futur I für Vermutungen** (Er wird krank sein) ⟵ future-werden
- `relative-nom-akk` — **Relativsätze (Nominativ, Akkusativ)** ⟵ subordinate-weil-dass
- `relative-dat-gen` — **Relativsätze (Dativ, Genitiv: dessen, deren)** ⟵ relative-nom-akk, genitive-articles
- `relative-prepositions` — **Relativsätze mit Präposition** ⟵ relative-dat-gen
- `relative-was-wo` — **Relativpronomen was, wo, worüber** (alles, was …) ⟵ relative-nom-akk
- `genitive-articles` — **Genitiv: Artikel und Endung -(e)s** ⟵ dative-articles
- `genitive-prepositions` — **Präpositionen mit Genitiv** (wegen, trotz, während, statt, innerhalb, außerhalb) ⟵ genitive-articles
- `adj-endings-zero` — **Adjektivdeklination ohne Artikel (starke Deklination)** ⟵ adj-endings-indefinite
- `adj-endings-full` — **Adjektivdeklination: alle Fälle inkl. Genitiv (Gesamtsystem)** ⟵ adj-endings-zero, genitive-articles
- `n-declension` — **n-Deklination** (der Student → den Studenten) ⟵ dative-articles
- `adjectives-as-nouns` — **Nominalisierte Adjektive und Partizipien** (der Deutsche, ein Deutscher, die Angestellten) ⟵ adj-endings-full
- `passive-present` — **Passiv Präsens (Vorgangspassiv)** ⟵ participle-irregular
- `passive-preterite` — **Passiv Präteritum** ⟵ passive-present
- `passive-modal` — **Passiv mit Modalverben** (muss gemacht werden) ⟵ passive-present
- `passive-von-durch` — **Agens im Passiv: von oder durch** ⟵ passive-present
- `konjunktiv2-present-forms` — **Konjunktiv II Gegenwart: Formen (starke Verben: käme, ginge, wüsste …)** ⟵ konjunktiv2-politeness
- `konjunktiv2-past` — **Konjunktiv II Vergangenheit** (hätte gemacht, wäre gegangen) ⟵ konjunktiv2-present-forms
- `irreal-conditions` — **Irreale Bedingungssätze** (Wenn ich Zeit hätte, …) ⟵ konjunktiv2-past
- `irreal-wishes` — **Irreale Wünsche** (Wenn ich doch … hätte!) ⟵ irreal-conditions
- `infinitive-zu` — **Infinitiv mit zu** ⟵ separable-verbs
- `um-zu-damit` — **Finalsätze: um … zu / damit** ⟵ infinitive-zu
- `temporal-clauses` — **Temporalsätze: als, wenn, während, bevor, nachdem, seit(dem), bis, sobald** ⟵ subordinate-wenn-ob, pluperfect
- `concessive-obwohl-trotzdem` — **obwohl vs. trotzdem** ⟵ adverbial-connectors
- `consecutive-sodass` — **sodass / so …, dass** ⟵ subordinate-weil-dass
- `two-part-connectors` — **entweder … oder, weder … noch, sowohl … als auch, nicht nur … sondern auch, zwar … aber** ⟵ conjunctions-aduso
- `je-desto` — **je … desto/umso** ⟵ comparison
- `verbs-with-prepositions` — **Verben mit Präpositionen** (warten auf + Akk, träumen von + Dat …) ⟵ two-way-prepositions
- `da-wo-compounds` — **da(r)- und wo(r)-Wörter** (darauf, worüber) ⟵ verbs-with-prepositions
- `lassen` — **lassen (veranlassen, erlauben)** ⟵ modal-verbs-present
- `mittelfeld-order` — **Reihenfolge im Mittelfeld (TeKaMoLo, Pronomen vor Nomen)** ⟵ dative-accusative-verbs
- `modal-perfect-double-infinitive` — **Modalverben im Perfekt (Ersatzinfinitiv)** (hat kommen müssen) ⟵ modal-verbs-preterite, perfect-haben
- `indefinite-substitutes` — **einer, keiner, welche, meins** · pronouns replacing nouns ⟵ indefinite-pronouns
- `word-formation-nouns-basic` — **Nomen aus Verben/Adjektiven: -ung, -heit, -keit, -ion, das + Infinitiv** ⟵ noun-gender-articles

## B2 (34 points)

- `passive-perfect` — **Passiv Perfekt und Plusquamperfekt** (ist gemacht worden) ⟵ passive-preterite
- `state-passive` — **Zustandspassiv** (ist geöffnet) ⟵ passive-perfect
- `passive-alternatives` — **Passiversatz: man, sein + zu, sich lassen, -bar/-lich** ⟵ passive-modal
- `konjunktiv1-present` — **Konjunktiv I: indirekte Rede (Gegenwart)** ⟵ konjunktiv2-present-forms
- `konjunktiv1-past-future` — **Konjunktiv I: Vergangenheit und Zukunft; Ersatzformen mit Konjunktiv II** ⟵ konjunktiv1-present
- `reported-speech-sollen-wollen` — **sollen/wollen zur Redewiedergabe** ⟵ konjunktiv1-present
- `als-ob` — **als ob / als wenn / als + Konjunktiv II** ⟵ konjunktiv2-past
- `participle-adjectives` — **Partizip I und II als Adjektiv** (der lachende Mann, das geöffnete Fenster) ⟵ adj-endings-full
- `participial-attributes-intro` — **Erweiterte Partizipialattribute (Einstieg)** ⟵ participle-adjectives, relative-nom-akk
- `subjective-modal-verbs` — **Modalverben subjektiv: Vermutung und Behauptung** (Sie muss krank sein; er soll reich sein) ⟵ future-assumption
- `future-2` — **Futur II** (Vermutung über Vergangenes) ⟵ future-assumption
- `infinitive-past` — **Infinitiv Perfekt und Passiv** (gemacht zu haben, gemacht zu werden) ⟵ infinitive-zu, passive-perfect
- `ohne-statt-zu-dass` — **ohne … zu / ohne dass; (an)statt … zu / (an)statt dass** ⟵ infinitive-zu
- `modal-clauses-indem` — **Modalsätze: indem, dadurch dass, ohne dass** ⟵ ohne-statt-zu-dass
- `conditional-falls-sofern` — **Konditional: falls, sofern, es sei denn, Bedingungssatz ohne wenn (Verb vorn)** ⟵ irreal-conditions
- `adversative-connectors` — **während, wohingegen, dagegen, jedoch, hingegen** ⟵ temporal-clauses
- `causal-connectors` — **da, denn, nämlich, deshalb, aufgrund** ⟵ concessive-obwohl-trotzdem
- `concessive-advanced` — **obgleich, dennoch, allerdings, auch wenn, selbst wenn** ⟵ concessive-obwohl-trotzdem
- `final-advanced` — **damit, um … zu, zwecks, zum + Nominalisierung** ⟵ um-zu-damit
- `genitive-prepositions-advanced` — **Genitivpräpositionen: angesichts, aufgrund, bezüglich, hinsichtlich, mithilfe, anlässlich, infolge** ⟵ genitive-prepositions
- `adjectives-with-prepositions` — **Adjektive mit Präpositionen** (stolz auf, abhängig von) ⟵ verbs-with-prepositions
- `nouns-with-prepositions` — **Nomen mit Präpositionen** (Interesse an, Angst vor) ⟵ verbs-with-prepositions
- `relative-wer-was` — **Relativsätze mit wer/was** (Wer A sagt, muss auch B sagen) ⟵ relative-was-wo
- `es-correlate` — **es als Platzhalter und Korrelat** (Ich finde es gut, dass …) ⟵ subordinate-weil-dass
- `prepositional-correlates` — **Korrelate: darauf, dass …; damit, dass …** ⟵ da-wo-compounds
- `modal-particles-basic` — **Modalpartikeln: doch, ja, mal, eben, halt, denn** ⟵ word-order-v2
- `negation-position` — **Position von nicht (Satz- vs. Teilnegation)** ⟵ mittelfeld-order
- `adj-after-quantifiers` — **Adjektivendungen nach alle, beide, einige, viele, mehrere, manche** ⟵ adj-endings-full
- `nominalization-intro` — **Nominalisierung: Verbalstil → Nominalstil (Einstieg)** ⟵ word-formation-nouns-basic, genitive-articles
- `function-verb-structures` — **Funktionsverbgefüge** (zur Verfügung stellen, in Frage kommen) ⟵ nominalization-intro
- `word-formation-prefixes` — **Verbpräfixe: be-, ver-, er-, zer-, ent-, miss-** ⟵ separable-verbs
- `separable-inseparable-pairs` — **Trennbar oder untrennbar? (umfahren, übersetzen, wiederholen)** ⟵ word-formation-prefixes
- `word-formation-adjectives` — **Adjektivbildung: -bar, -lich, -ig, -los, -haft, -sam** ⟵ word-formation-nouns-basic
- `comma-rules` — **Kommasetzung (Nebensätze, Infinitivgruppen, Aufzählungen)** ⟵ subordinate-weil-dass, infinitive-zu

## C1 (24 points)

- `nominal-verbal-causal` — **Nominal ↔ Verbal: kausal** (weil → wegen/aufgrund) ⟵ nominalization-intro, causal-connectors
- `nominal-verbal-temporal` — **Nominal ↔ Verbal: temporal** (als → bei, nachdem → nach, bevor → vor, während → während) ⟵ nominalization-intro, temporal-clauses
- `nominal-verbal-concessive` — **Nominal ↔ Verbal: konzessiv** (obwohl → trotz) ⟵ nominalization-intro, concessive-advanced
- `nominal-verbal-final` — **Nominal ↔ Verbal: final** (um … zu → zu/zur, zwecks) ⟵ nominalization-intro, final-advanced
- `nominal-verbal-conditional` — **Nominal ↔ Verbal: konditional** (wenn → bei, im Falle, ohne) ⟵ nominalization-intro, conditional-falls-sofern
- `nominal-verbal-modal` — **Nominal ↔ Verbal: modal** (indem → durch, mittels) ⟵ nominalization-intro, modal-clauses-indem
- `participial-attributes` — **Partizipialattribute ↔ Relativsätze (komplex)** ⟵ participial-attributes-intro
- `gerundive` — **Gerundivum** (das zu lösende Problem) ⟵ participial-attributes, passive-alternatives
- `passive-all-tenses-modal` — **Passiv in allen Zeiten mit Modalverben** (hätte gemacht werden müssen) ⟵ passive-perfect, konjunktiv2-past
- `konjunktiv1-news` — **Konjunktiv I in Nachrichten und Berichten (alle Zeiten, Passiv)** ⟵ konjunktiv1-past-future
- `konjunktiv2-advanced` — **Konjunktiv II: Passiv, Modalverben, irreale Vergleiche und Folgen (zu …, als dass)** ⟵ passive-all-tenses-modal
- `subjective-modal-past` — **Subjektive Modalverben in der Vergangenheit** (Er soll es gewusst haben) ⟵ subjective-modal-verbs, infinitive-past
- `function-verb-advanced` — **Funktionsverbgefüge (erweitert, Passiv-Bedeutung)** (zur Diskussion stehen, Anwendung finden) ⟵ function-verb-structures
- `connectors-advanced` — **insofern (als), soweit, je nachdem, zumal, wenngleich, geschweige denn, vorausgesetzt dass** ⟵ adversative-connectors, concessive-advanced
- `modal-particles-advanced` — **Modalpartikeln: wohl, schon, etwa, ruhig, bloß, nur, eigentlich, überhaupt** ⟵ modal-particles-basic
- `nachfeld` — **Ausklammerung und Nachfeld** ⟵ mittelfeld-order
- `apposition` — **Apposition und Kasuskongruenz** (mit Herrn Weber, unserem Chef) ⟵ adj-endings-full
- `genitive-vs-von` — **Genitivattribut vs. von + Dativ (Register)** ⟵ genitive-articles
- `verb-noun-collocations` — **Nomen-Verb-Verbindungen** (eine Entscheidung treffen, Kritik üben) ⟵ function-verb-structures
- `participle-clauses` — **Partizipialkonstruktionen als Satzersatz** (Im Hotel angekommen, …) ⟵ participle-adjectives
- `capitalisation-nominalized` — **Großschreibung von Nominalisierungen** (das Beste, beim Lesen, etwas Neues) ⟵ adjectives-as-nouns
- `text-cohesion` — **Textkohärenz: Pro-Formen, Verweiswörter, Konnektoren** ⟵ prepositional-correlates
- `academic-style` — **Wissenschaftssprache: Passiv, man, unpersönliche Konstruktionen, Nominalstil** ⟵ nominal-verbal-causal
- `indirect-speech-complex` — **Indirekte Rede in komplexen Sätzen und Fragen** ⟵ konjunktiv1-news

## C2 (14 points) — 162 in total

- `konjunktiv1-formal` — **Konjunktiv I in Anweisungen, Wünschen, Formeln** (Man nehme …; Es lebe …; sei es …, sei es …) ⟵ konjunktiv1-news
- `genitive-verbs` — **Verben und Adjektive mit Genitiv** (gedenken, bedürfen, sich enthalten; bewusst, würdig) ⟵ genitive-prepositions-advanced
- `rare-prepositions` — **Seltene Präpositionen: zufolge, ungeachtet, unbeschadet, kraft, vermöge, binnen, zwecks** ⟵ genitive-prepositions-advanced
- `concessive-formal` — **wie dem auch sei, so … auch, mag … auch, wenngleich** ⟵ connectors-advanced
- `topicalization-emphasis` — **Vorfeldbesetzung und Hervorhebung (Topikalisierung, Spaltsätze)** ⟵ nachfeld
- `ellipsis-coordination` — **Ellipse und Koordinationsreduktion** ⟵ topicalization-emphasis
- `nominal-chains` — **Nominalketten und Amtsdeutsch entschlüsseln und vermeiden** ⟵ academic-style
- `participle-chains` — **Mehrfache Partizipialattribute** ⟵ participial-attributes, gerundive
- `modal-particle-combinations` — **Kombinationen: doch mal, ja wohl, eben halt, denn eigentlich** ⟵ modal-particles-advanced
- `word-formation-advanced` — **Wortbildung: Fugenelemente, Konversion, Derivation** ⟵ word-formation-adjectives
- `spoken-vs-written` — **Gesprochene vs. geschriebene Grammatik erkennen** (weil + V2, Dativ statt Genitiv, tun-Periphrase) ⟵ genitive-prepositions
- `regional-variants` — **Österreich und Schweiz: Grammatikvarianten** (sein-Perfekt bei stehen/sitzen, Genus-Varianten) ⟵ perfect-sein
- `register-shift` — **Registerwechsel: dasselbe in umgangssprachlich, neutral, gehoben** ⟵ academic-style
- `punctuation-advanced` — **Zeichensetzung: Kommas bei Partizipial- und Infinitivgruppen, Appositionen, Semikolon** ⟵ comma-rules

---

## Contrast drills (pairs/sets that share a drill)

`als` vs `wenn` vs `wann` · `seit` vs `seitdem` vs `vor` · `weil` vs `denn` vs `deshalb` · `obwohl` vs `trotzdem` vs `trotz` · `während` (temporal) vs `während` (adversative) · `um … zu` vs `damit` · `dass` vs `das` · `ob` vs `wenn` · `wo` vs `wohin` (Wechselpräpositionen) · `stellen` vs `stehen` (and the other position verbs) · `Perfekt mit haben` vs `sein` · `Präteritum` vs `Perfekt` · `Vorgangspassiv` vs `Zustandspassiv` · `werden` (Futur / Passiv / Vollverb / Konjunktiv) · `Konjunktiv I` vs `Konjunktiv II` · `sollen` (Auftrag vs Behauptung) vs `wollen` · `müssen nicht` vs `dürfen nicht` · `nicht` vs `kein` · `aber` vs `sondern` · `Partizip I` vs `Partizip II` · `der/die/das` relative vs article · `ein-` vs `einer` (substitute) · `trennbar` vs `untrennbar` (same prefix) · `in` + Akk vs `nach` vs `zu` (going places) · `an` vs `auf` vs `in` (verbs with prepositions).

Each contrast drill: a 3-line comparison card, then interleaved items from both points; errors produce mistake cards with tag `connector-choice`/`preposition-choice`/etc.
