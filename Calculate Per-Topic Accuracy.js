// 1. Get response data from the current node (checkResponses)
const responseData = $input.first().json;
const responses = responseData.data;

// 2. PULL topics and quiz from EARLIER nodes in the workflow
// Replace these names if your nodes are named differently
const topics = $("Parse Prerequisite JSON").first().json.topics;
const quiz = $("Parse Quiz JSON").first().json.quiz;

// 3. Build scoring structure
const topicScores = {};
topics.forEach(t => {
  topicScores[t.topicId] = { 
    topicId: t.topicId,
    topicName: t.topicName, 
    threshold: t.suggestedThreshold,
    severity: t.severityIfBelow,
    total: 0, 
    correct: 0 
  };
});

// 4. Grade each response
responses.forEach((row, rowIdx) => {
  quiz.forEach((q, idx) => {
    // FIX: idx + 1 because only Timestamp is before questions (no email column)
    const studentAnswer = row[idx + 1] ? row[idx + 1].toString().trim() : null;
    const correctAnswer = q.choices[q.correctAnswer];
    
    if (studentAnswer) {
      topicScores[q.topicId].total++;
      if (studentAnswer === correctAnswer) {
        topicScores[q.topicId].correct++;
      }
    }
  });
});

// 5. Calculate accuracy
const scores = Object.values(topicScores).map(s => ({
  ...s,
  accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
}));

// 6. Return everything needed for the next AI node
return [{
  json: {
    courseName: $("Parse Prerequisite JSON").first().json.courseName,
    topics: topics,
    quiz: quiz,
    scores: scores,
    totalResponses: responses.length
  }
}];
