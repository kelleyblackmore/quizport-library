# Contributing to QuizPort Library

Thank you for your interest in contributing to the QuizPort Library! This document provides guidelines for contributing quizzes and improvements to the repository.

## 📋 Ways to Contribute

- Add new quizzes
- Improve existing quizzes
- Fix errors or typos
- Add new categories
- Improve documentation
- Report issues

## 🎯 Quiz Submission Guidelines

### Quality Standards

1. **Accuracy**: All questions and answers must be factually correct
2. **Clarity**: Questions should be clear and unambiguous
3. **Explanations**: Include explanations for answers when possible
4. **Difficulty**: Set appropriate difficulty levels
5. **Format**: Follow the standard quiz JSON format

### Quiz Format

```json
{
  "title": "Clear, Descriptive Title",
  "description": "Brief description (1-2 sentences)",
  "difficulty": "Easy|Medium|Hard",
  "category": "appropriate-category",
  "tags": ["relevant", "searchable", "tags"],
  "questions": [
    {
      "question": "Clear question text?",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "answer": 1,
      "explanation": "Why this is the correct answer"
    }
  ]
}
```

## 🚀 How to Submit a Quiz

### Step 1: Fork the Repository

Click the "Fork" button at the top right of the repository page.

### Step 2: Create Your Quiz

1. Choose the appropriate category folder
2. Create a new JSON file with a descriptive name (use kebab-case)
3. Follow the quiz format and guidelines
4. Validate your JSON (see Validation section below)

### Step 3: Submit a Pull Request

1. Commit your changes with a descriptive message
2. Push to your fork
3. Create a Pull Request with:
   - Title: "Add [Quiz Name]" or "Update [Quiz Name]"
   - Description: Brief overview of the quiz content
   - Any relevant context or sources

## ✅ Validation

Before submitting, validate your quiz:

```bash
# Install AJV CLI if you haven't already
npm install -g ajv-cli

# Validate your quiz
ajv validate -s schemas/quiz-schema.json -d quizzes/categories/your-category/your-quiz.json
```

## 📝 Checklist

Before submitting your quiz, ensure:

- [ ] Quiz follows the standard JSON format
- [ ] All questions have correct answers
- [ ] Explanations are provided where helpful
- [ ] No spelling or grammar errors
- [ ] Appropriate difficulty level is set
- [ ] Relevant tags are included
- [ ] Category is correct
- [ ] File name uses kebab-case
- [ ] JSON is valid and properly formatted

## 🚫 What Not to Include

- Offensive or inappropriate content
- Copyrighted material without permission
- Questions with ambiguous or debatable answers
- Personal information
- Malicious code or links

## 🏷️ Categories

Current categories:
- `science` - Biology, Chemistry, Physics, etc.
- `history` - World History, specific events, etc.
- `programming` - Languages, frameworks, concepts
- `math` - Algebra, Geometry, Calculus, etc.
- `languages` - Human languages, vocabulary, grammar
- `general` - Trivia, pop culture, geography, etc.

Need a new category? Open an issue to discuss!

## 💡 Tips for Great Quizzes

1. **Research thoroughly**: Verify facts from reliable sources
2. **Avoid trick questions**: Be fair to quiz takers
3. **Provide context**: Add explanations that teach
4. **Use consistent formatting**: Follow existing examples
5. **Test your quiz**: Try it yourself on QuizPort first
6. **Be inclusive**: Ensure content is appropriate for a global audience

## 🐛 Reporting Issues

Found an error in a quiz? Please open an issue with:
- Quiz name and file path
- Question number
- Description of the issue
- Correct information (with source if possible)

## 📖 Style Guide

### Question Writing
- Use complete sentences
- End questions with a question mark
- Avoid overly complex language
- Be specific and precise

### Answer Choices
- Keep choices roughly equal in length
- Avoid "all of the above" or "none of the above"
- Make all choices plausible
- Use consistent formatting

### Explanations
- Start with the correct answer
- Provide reasoning or context
- Keep it concise (1-3 sentences)
- Use simple language

## 🤝 Code of Conduct

- Be respectful and constructive
- Welcome newcomers
- Focus on the content, not the contributor
- Collaborate openly

## 📬 Questions?

Have questions about contributing? Feel free to:
- Open an issue
- Start a discussion
- Reach out to the maintainers

Thank you for helping build a great quiz library for everyone! 🎉
