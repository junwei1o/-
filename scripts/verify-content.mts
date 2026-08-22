import { CURRICULUM_QUESTIONS, SUBJECT_MONSTERS, RARE_SUBJECT_MONSTERS } from "../client/src/game/expeditionContent";
const subjects = ["chinese", "math", "english", "science"] as const;
for (const subject of subjects) {
  const questions = CURRICULUM_QUESTIONS[subject];
  if (questions.length !== 100) throw new Error(`${subject} has ${questions.length} questions`);
  const ids = new Set(questions.map((question) => question.id));
  if (ids.size !== 100) throw new Error(`${subject} question IDs are not unique`);
  for (const question of questions) {
    if (question.options.length !== 4 || question.answer < 0 || question.answer > 3 || !question.prompt || !question.explanation || !question.errorTag) {
      throw new Error(`Incomplete question: ${question.id}`);
    }
  }
}
const rareCount = subjects.reduce((sum, subject) => sum + RARE_SUBJECT_MONSTERS[subject].length, 0);
if (rareCount !== 12) throw new Error(`Rare monster count is ${rareCount}`);
if (subjects.some((subject) => RARE_SUBJECT_MONSTERS[subject].some((monster) => monster.requiredStreak < 10))) throw new Error("Rare monster streak gate is below 10");
console.log(JSON.stringify({ counts: Object.fromEntries(subjects.map((subject) => [subject, CURRICULUM_QUESTIONS[subject].length])), rareCount }, null, 2));
