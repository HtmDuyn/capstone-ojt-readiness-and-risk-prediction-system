import assert from 'node:assert/strict';
import { test } from 'node:test';
import { earlyWarning } from '../src/modules/student-portal/early-warning';

const valid = {currentSemester:2,earnedCredits:15,completeConfiguration:true,issues:[],eligibilityStatus:'NOT_ELIGIBLE',missingCredits:55,failedCourseCount:0};

test('semester 2 with credits receives progress, never a high risk label for missing 70 credits', () => {
  const result=earlyWarning(valid);
  assert.equal(result.available,true);
  assert.equal(result.status,'PROGRESS_ONLY');
  assert.equal(result.riskLevel,null);
  assert.equal(result.riskScore,null);
  assert.equal(result.isAiPrediction,false);
  assert.ok(result.recommendations.some(text=>text.includes('55')));
  assert.ok(result.message.includes('thiếu 55 tín chỉ'));
  assert.ok(result.message.includes('chưa phải kết luận nguy cơ'));
});

test('semester 0 and 1 cannot activate monitoring even with earned credits', () => {
  for(const currentSemester of [0,1]) {
    const result=earlyWarning({...valid,currentSemester});
    assert.equal(result.available,false);
    assert.ok(result.reasons.includes('BEFORE_SEMESTER_2'));
    assert.deepEqual(result.recommendations,[]);
  }
});

test('missing pathway, no credits, invalid data and unresolved eligibility block monitoring', () => {
  for(const patch of [
    {currentSemester:null},{currentSemester:NaN},{currentSemester:10},
    {earnedCredits:0},{earnedCredits:null},{earnedCredits:NaN},{earnedCredits:-1},
    {completeConfiguration:false},{issues:['GPA_SCORE_MISSING:1']},{eligibilityStatus:'REVIEW_REQUIRED'},
  ]) assert.equal(earlyWarning({...valid,...patch}).available,false,JSON.stringify(patch));
});

test('ready student still receives progress rather than an invented risk score', () => {
  const result=earlyWarning({...valid,currentSemester:5,earnedCredits:75,missingCredits:0,eligibilityStatus:'ELIGIBLE'});
  assert.equal(result.available,true);
  assert.equal(result.riskScore,null);
  assert.equal(result.recommendations.length,1);
  assert.ok(result.message.includes('75 tín chỉ'));
  assert.ok(result.message.includes('hiện đáp ứng'));
  assert.ok(result.message.includes('xác nhận của nhà trường'));
});

test('explanation distinguishes excess debt and unavailable monitoring',()=>{
  assert.ok(earlyWarning({...valid,earnedCredits:72,missingCredits:0,failedCourseCount:3}).message.includes('vượt giới hạn 2 môn'));
  assert.ok(earlyWarning({...valid,currentSemester:1}).message.includes('bắt đầu từ kỳ 2'));
  assert.ok(earlyWarning({...valid,earnedCredits:0}).message.includes('chưa có tín chỉ'));
  assert.ok(earlyWarning({...valid,completeConfiguration:false}).message.includes('đối soát'));
});
