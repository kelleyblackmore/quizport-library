# QuizPort Library

A community-driven collection of quizzes in JSON format for [QuizPort](https://www.quizport.io/).

## About

This repository contains a curated collection of quizzes across various subjects and difficulty levels. All quizzes follow the QuizPort JSON format and can be directly imported into the QuizPort application.

## Structure

```
quizport-library/
├── quizzes/
│   └── categories/
│       ├── science/       # Biology, Chemistry, Physics, etc.
│       ├── history/       # World History, US History, etc.
│       ├── programming/   # JavaScript, Python, React, etc.
│       ├── math/          # Algebra, Geometry, Calculus, etc.
│       ├── languages/     # English, Spanish, French, etc.
│       └── general/       # Trivia, Pop Culture, etc.
├── templates/             # Quiz templates and examples
└── schemas/              # JSON schema for validation
```

## Quiz Format

All quizzes must follow this JSON structure:

```json
{
  "title": "Quiz Title",
  "description": "Brief description of the quiz",
  "difficulty": "Easy|Medium|Hard",
  "category": "science",
  "tags": ["biology", "cells", "fundamentals"],
  "questions": [
    {
      "question": "What is the powerhouse of the cell?",
      "choices": ["Nucleus", "Mitochondria", "Ribosome", "Golgi apparatus"],
      "answer": 1,
      "explanation": "Mitochondria are known as the powerhouse of the cell because they produce ATP through cellular respiration."
    }
  ]
}
```

## How to Use

### Import a Quiz

1. Browse the `quizzes/categories/` folder
2. Find a quiz you want to try
3. Copy the raw JSON content
4. Go to [QuizPort](https://www.quizport.io/)
5. Click "Start New Quiz" and upload the JSON file

### Direct Link

You can also create a direct link to load a quiz:
```
https://www.quizport.io/quiz?url=https://raw.githubusercontent.com/kelleyblackmore/quizport-library/main/quizzes/categories/science/biology-basics.json
```

## Contributing

We welcome contributions! To add a quiz:

1. Fork this repository
2. Create a new quiz JSON file in the appropriate category
3. Ensure it follows the quiz format (use the schema for validation)
4. Submit a pull request

### Guidelines

- Use clear, unambiguous questions
- Provide accurate answers
- Include explanations when helpful
- Tag quizzes appropriately
- Set appropriate difficulty levels
- No offensive or inappropriate content
- No copyrighted material without permission

## Categories

### Science
- Biology, Chemistry, Physics, Astronomy, Earth Science

### History
- World History, US History, Ancient Civilizations, Wars

### Programming
- JavaScript, Python, Java, React, Node.js, Algorithms, Security, Linux

### Math
- Algebra, Geometry, Calculus, Statistics, Trigonometry

### Languages
- English, Spanish, French, German, Vocabulary, Grammar

### General
- Trivia, Pop Culture, Geography, Sports, Entertainment

## Tools

### Validation

Use the provided JSON schema to validate your quiz:

```bash
npm install -g ajv-cli
ajv validate -s schemas/quiz-schema.json -d quizzes/categories/science/your-quiz.json
```

### Templates

Check the `templates/` folder for starter templates:
- `multiple-choice-template.json` - Standard multiple choice
- `true-false-template.json` - True/False questions

## License

MIT License - feel free to use these quizzes in your own projects!

## Popular Quizzes

- [JavaScript Fundamentals](quizzes/categories/programming/javascript-basics.json)
- [CompTIA Security+ Fundamentals](quizzes/categories/programming/security-plus.json)
- [CompTIA Linux+ Essentials](quizzes/categories/programming/linux-plus.json)
- [World War II History](quizzes/categories/history/world-war-2.json)
- [Biology Basics](quizzes/categories/science/biology-basics.json)
- [Algebra 101](quizzes/categories/math/algebra-101.json)
- [World Geography Trivia](quizzes/categories/general/world-geography.json)
- [English Vocabulary Builder](quizzes/categories/languages/english-vocabulary.json)
- [Spanish Basics](quizzes/categories/languages/spanish-basics.json)

## Links

- [QuizPort Website](https://www.quizport.io/)
- [QuizPort GitHub](https://github.com/kelleyblackmore/quiz-app)
- [Submit an Issue](https://github.com/kelleyblackmore/quizport-library/issues)
- [Discussions](https://github.com/kelleyblackmore/quizport-library/discussions)

