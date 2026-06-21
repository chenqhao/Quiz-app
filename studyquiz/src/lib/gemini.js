/**
 * Google Gemini API client for question generation and answer grading.
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from Gemini API');
  }

  return JSON.parse(text);
}

/**
 * Generate quiz questions from class notes.
 */
export async function generateQuestions({ notes, count, type, difficulty }) {
  const typeInstruction = type === 'mixed'
    ? 'Generate a mix of multiple_choice and written questions.'
    : `Generate only ${type} questions.`;

  const prompt = `You are an expert educational quiz generator. Generate exactly ${count} quiz questions based ONLY on the following class notes. Do NOT make up information that is not in the notes.

${typeInstruction}

Difficulty level: ${difficulty}

CLASS NOTES:
"""
${notes}
"""

RULES:
- Only use information from the provided notes
- Generate clear, well-formed questions
- For multiple_choice: provide exactly 4 answer choices with only ONE correct answer
- For written: provide a comprehensive sample answer and grading notes
- Include a short explanation for each question
- Set the difficulty to "${difficulty}"

Return a JSON array of objects with this exact schema:
[
  {
    "type": "multiple_choice" or "written",
    "question_text": "The question",
    "choices": ["A", "B", "C", "D"] (only for multiple_choice, null for written),
    "correct_answer": "The correct answer text",
    "explanation": "Brief explanation of why this is correct",
    "difficulty": "${difficulty}"
  }
]

Return ONLY the JSON array, no other text.`;

  const questions = await callGemini(prompt);

  // Validate structure
  if (!Array.isArray(questions)) {
    throw new Error('Invalid response format from AI');
  }

  return questions.map((q) => ({
    type: q.type || 'multiple_choice',
    question_text: q.question_text || '',
    choices: q.type === 'multiple_choice' ? (q.choices || []) : null,
    correct_answer: q.correct_answer || '',
    explanation: q.explanation || '',
    difficulty: q.difficulty || difficulty,
  }));
}

/**
 * Grade a written answer using AI comparison.
 */
export async function gradeWrittenAnswer({ question, sampleAnswer, userAnswer }) {
  const prompt = `You are a fair and encouraging teacher grading a student's written answer.

QUESTION: "${question}"

SAMPLE/CORRECT ANSWER: "${sampleAnswer}"

STUDENT'S ANSWER: "${userAnswer}"

Evaluate the student's answer by comparing it to the sample answer. Consider:
1. Does it capture the key concepts?
2. Is it factually correct?
3. Is it complete enough?

Return a JSON object with this schema:
{
  "is_correct": true/false (true if the answer demonstrates sufficient understanding),
  "score": 0-100 (percentage score),
  "feedback": "Detailed, encouraging feedback explaining what was good and what could be improved"
}

Return ONLY the JSON object, no other text.`;

  return await callGemini(prompt);
}
