import React, { useState, useEffect } from 'react';
import { Volume2, Check, X, Plus, Trash2, Play, RotateCcw, Trophy, Flame, Star, Award, Target, LogOut, Settings, GraduationCap, Calendar } from 'lucide-react';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function SpellStarsApp() {
  const [words, setWords] = useState([]);
  const [newWord, setNewWord] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [mode, setMode] = useState('auth');
  const [showWord, setShowWord] = useState(false);
  const [attempts, setAttempts] = useState(0);
  
  const [userType, setUserType] = useState('parent');
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [childName, setChildName] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [teacherName, setTeacherName] = useState('');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [currentAccount, setCurrentAccount] = useState(null);
  
  const [accounts, setAccounts] = useState({});
  const [users, setUsers] = useState({});
  const [classes, setClasses] = useState({});
  const [schools, setSchools] = useState({});
  const [weeklySpellings, setWeeklySpellings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accountsDoc, usersDoc, classesDoc, schoolsDoc, spellingsDoc] = await Promise.all([
        getDoc(doc(db, 'data', 'accounts')),
        getDoc(doc(db, 'data', 'users')),
        getDoc(doc(db, 'data', 'classes')),
        getDoc(doc(db, 'data', 'schools')),
        getDoc(doc(db, 'data', 'weeklySpellings'))
      ]);
      
      if (accountsDoc.exists()) setAccounts(accountsDoc.data());
      if (usersDoc.exists()) setUsers(usersDoc.data());
      if (classesDoc.exists()) setClasses(classesDoc.data());
      if (schoolsDoc.exists()) {
        setSchools(schoolsDoc.data());
      } else {
        const defaultSchools = {
          'st-bernadettes': {
            name: "St. Bernadette's",
            verified: true,
            classes: ['Year 3'],
            teachers: []
          }
        };
        setSchools(defaultSchools);
        await setDoc(doc(db, 'data', 'schools'), defaultSchools);
      }
      if (spellingsDoc.exists()) setWeeklySpellings(spellingsDoc.data());
    } catch (error) {
      console.log('First time setup', error);
    }
    setLoading(false);
  };

  const saveData = async (updatedAccounts, updatedUsers, updatedClasses, updatedSchools, updatedSpellings) => {
    try {
      await Promise.all([
        setDoc(doc(db, 'data', 'accounts'), updatedAccounts || accounts),
        setDoc(doc(db, 'data', 'users'), updatedUsers || users),
        setDoc(doc(db, 'data', 'classes'), updatedClasses || classes),
        setDoc(doc(db, 'data', 'schools'), updatedSchools || schools),
        setDoc(doc(db, 'data', 'weeklySpellings'), updatedSpellings || weeklySpellings)
      ]);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const handleAuth = () => {
    if (authMode === 'login') {
      if (!email.trim() || !password.trim()) {
        alert('Please enter email and password');
        return;
      }

      const account = accounts[email.toLowerCase()];
      if (!account || account.password !== password) {
        alert('Invalid email or password');
        return;
      }

      setCurrentAccount(account);
      
      if (account.type === 'teacher') {
        setMode('teacher-dashboard');
      } else {
        setMode('register');
      }
    } else {
      if (!email.trim() || !password.trim()) {
        alert('Please enter email and password');
        return;
      }

      if (accounts[email.toLowerCase()]) {
        alert('An account with this email already exists');
        return;
      }

      if (userType === 'teacher' && !teacherName.trim()) {
        alert('Please enter your name');
        return;
      }

      const newAccount = {
        email: email.toLowerCase(),
        password: password,
        type: userType,
        createdAt: new Date().toISOString()
      };

      if (userType === 'teacher') {
        newAccount.name = teacherName.trim();
        newAccount.schools = [];
        newAccount.classes = [];
      } else {
        newAccount.children = [];
      }

      const updatedAccounts = { ...accounts, [email.toLowerCase()]: newAccount };
      setAccounts(updatedAccounts);
      setCurrentAccount(newAccount);
      saveData(updatedAccounts, users, classes, schools, weeklySpellings);
      
      if (userType === 'teacher') {
        setMode('teacher-setup');
      } else {
        setMode('register');
      }
    }
  };

  const handleAddChild = () => {
    if (!childName.trim() || !selectedSchool || !selectedClass) {
      alert('Please fill in all fields');
      return;
    }

    const userId = `${selectedSchool}-${selectedClass}-${childName}`.toLowerCase().replace(/\s/g, '-');
    
    let updatedAccounts = { ...accounts };
    let updatedUsers = { ...users };
    let updatedClasses = { ...classes };

    if (!updatedUsers[userId]) {
      updatedUsers[userId] = {
        name: childName.trim(),
        school: selectedSchool,
        class: selectedClass,
        totalPoints: 0,
        totalPractices: 0,
        streak: 0,
        lastPracticeDate: null,
        badges: [],
        practiceHistory: []
      };
    }

    if (!updatedAccounts[currentAccount.email].children.includes(userId)) {
      updatedAccounts[currentAccount.email].children.push(userId);
    }

    const classKey = `${selectedSchool}-${selectedClass}`;
    if (!updatedClasses[classKey]) {
      updatedClasses[classKey] = {
        school: selectedSchool,
        className: selectedClass,
        students: []
      };
    }

    if (!updatedClasses[classKey].students.includes(userId)) {
      updatedClasses[classKey].students.push(userId);
    }

    setCurrentUser(updatedUsers[userId]);
    setCurrentAccount(updatedAccounts[currentAccount.email]);
    setAccounts(updatedAccounts);
    setUsers(updatedUsers);
    setClasses(updatedClasses);
    saveData(updatedAccounts, updatedUsers, updatedClasses, schools, weeklySpellings);
    
    loadWeeklySpellings(selectedSchool, selectedClass);
    setMode('setup');
  };

  const handleTeacherSetup = () => {
    if (!selectedSchool) {
      alert('Please select a school');
      return;
    }

    let updatedAccounts = { ...accounts };
    let updatedSchools = { ...schools };
    
    const schoolKey = selectedSchool.toLowerCase().replace(/\s/g, '-');
    
    if (!updatedSchools[schoolKey].teachers.includes(currentAccount.email)) {
      updatedSchools[schoolKey].teachers.push(currentAccount.email);
    }

    if (!updatedAccounts[currentAccount.email].schools.includes(selectedSchool)) {
      updatedAccounts[currentAccount.email].schools.push(selectedSchool);
    }

    setAccounts(updatedAccounts);
    setSchools(updatedSchools);
    setCurrentAccount(updatedAccounts[currentAccount.email]);
    saveData(updatedAccounts, users, classes, updatedSchools, weeklySpellings);
    setMode('teacher-dashboard');
  };

  const handleAddClass = (schoolName, className) => {
    let updatedSchools = { ...schools };
    let updatedAccounts = { ...accounts };
    
    const schoolKey = schoolName.toLowerCase().replace(/\s/g, '-');
    
    if (!updatedSchools[schoolKey].classes.includes(className)) {
      updatedSchools[schoolKey].classes.push(className);
    }

    const classKey = `${schoolName}-${className}`;
    if (!updatedAccounts[currentAccount.email].classes.includes(classKey)) {
      updatedAccounts[currentAccount.email].classes.push(classKey);
    }

    setSchools(updatedSchools);
    setAccounts(updatedAccounts);
    setCurrentAccount(updatedAccounts[currentAccount.email]);
    saveData(updatedAccounts, users, classes, updatedSchools, weeklySpellings);
  };

  const handleSetWeeklySpellings = (schoolName, className, wordsList) => {
    const classKey = `${schoolName}-${className}`;
    let updatedSpellings = { ...weeklySpellings };
    
    updatedSpellings[classKey] = {
      words: wordsList,
      setBy: currentAccount.email,
      setAt: new Date().toISOString(),
      weekOf: new Date().toISOString()
    };

    setWeeklySpellings(updatedSpellings);
    saveData(accounts, users, classes, schools, updatedSpellings);
  };

  const loadWeeklySpellings = (schoolName, className) => {
    const classKey = `${schoolName}-${className}`;
    if (weeklySpellings[classKey]) {
      setWords(weeklySpellings[classKey].words);
    } else {
      setWords(['friend', 'because', 'beautiful', 'school', 'necessary']);
    }
  };

  const handleSelectChild = (userId) => {
    const child = users[userId];
    setCurrentUser(child);
    loadWeeklySpellings(child.school, child.class);
    setMode('setup');
  };

  const handleLogout = () => {
    setCurrentAccount(null);
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    setMode('auth');
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      setShowWord(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setTimeout(() => setShowWord(false), 2000);
    }
  };

  const addWord = () => {
    if (newWord.trim()) {
      setWords([...words, newWord.trim().toLowerCase()]);
      setNewWord('');
    }
  };

  const removeWord = (index) => {
    setWords(words.filter((_, i) => i !== index));
  };

  const startPractice = () => {
    if (words.length === 0) return;
    setMode('practice');
    setCurrentWordIndex(0);
    setScore({ correct: 0, total: 0 });
    setUserAnswer('');
    setFeedback(null);
    setAttempts(0);
    speak(words[0]);
  };

  const checkAnswer = () => {
    const correct = userAnswer.toLowerCase().trim() === words[currentWordIndex];
    setFeedback(correct ? 'correct' : 'incorrect');
    
    if (correct) {
      setScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
    } else {
      setAttempts(prev => prev + 1);
    }
  };

  const nextWord = () => {
    if (currentWordIndex < words.length - 1) {
      setCurrentWordIndex(currentWordIndex + 1);
      setUserAnswer('');
      setFeedback(null);
      setShowWord(false);
      setAttempts(0);
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
      speak(words[currentWordIndex + 1]);
    } else {
      setScore(prev => ({ ...prev, total: prev.total + 1 }));
      completePractice();
    }
  };
  
  const tryAgain = () => {
    setUserAnswer('');
    setFeedback(null);
  };

  const completePractice = () => {
    const userId = `${currentUser.school}-${currentUser.class}-${currentUser.name}`.toLowerCase().replace(/\s/g, '-');
    const today = new Date().toDateString();
    const percentage = Math.round((score.correct / score.total) * 100);
    
    const basePoints = score.correct * 10;
    const retryPenalty = Math.max(0, score.total - score.correct) * 5;
    const points = basePoints - retryPenalty + (percentage === 100 ? 50 : 0);
    
    let updatedUsers = { ...users };
    let user = updatedUsers[userId];
    
    if (user.lastPracticeDate === today) {
    } else if (user.lastPracticeDate === new Date(Date.now() - 86400000).toDateString()) {
      user.streak += 1;
    } else if (user.lastPracticeDate === null) {
      user.streak = 1;
    } else {
      user.streak = 1;
    }
    
    user.lastPracticeDate = today;
    user.totalPoints += points;
    user.totalPractices += 1;
    user.practiceHistory.push({
      date: today,
      score: percentage,
      points: points,
      wordsCount: score.total
    });

    if (user.totalPractices === 1 && !user.badges.includes('first-practice')) {
      user.badges.push('first-practice');
    }
    if (percentage === 100 && !user.badges.includes('perfect-score')) {
      user.badges.push('perfect-score');
    }
    if (user.streak >= 7 && !user.badges.includes('week-streak')) {
      user.badges.push('week-streak');
    }
    if (user.totalPractices >= 10 && !user.badges.includes('dedicated')) {
      user.badges.push('dedicated');
    }

    setCurrentUser(user);
    setUsers(updatedUsers);
    saveData(accounts, updatedUsers, classes, schools, weeklySpellings);
    setMode('complete');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && userAnswer.trim()) {
      if (feedback === null) {
        checkAnswer();
      } else if (feedback === 'correct') {
        nextWord();
      }
    }
  };

  const getBadgeInfo = (badgeId) => {
    const badges = {
      'first-practice': { icon: '🎯', name: 'First Steps' },
      'perfect-score': { icon: '⭐', name: 'Perfect!' },
      'week-streak': { icon: '🔥', name: '7-Day Streak' },
      'dedicated': { icon: '🏆', name: 'Dedicated' }
    };
    return badges[badgeId] || { icon: '🎖️', name: badgeId };
  };

  const getLeaderboard = () => {
    if (!currentUser) return [];
    const classKey = `${currentUser.school}-${currentUser.class}`;
    const classStudents = classes[classKey]?.students || [];
    return classStudents
      .map(userId => users[userId])
      .filter(u => u)
      .sort((a, b) => b.totalPoints - a.totalPoints);
  };

  const getClassStats = (schoolName, className) => {
    const classKey = `${schoolName}-${className}`;
    const classData = classes[classKey];
    if (!classData) return null;

    const students = classData.students.map(id => users[id]).filter(u => u);
    const totalStudents = students.length;
    const avgPoints = totalStudents > 0 ? Math.round(students.reduce((sum, s) => sum + s.totalPoints, 0) / totalStudents) : 0;
    const avgStreak = totalStudents > 0 ? Math.round(students.reduce((sum, s) => sum + s.streak, 0) / totalStudents) : 0;
    const totalPractices = students.reduce((sum, s) => sum + s.totalPractices, 0);

    return { students, totalStudents, avgPoints, avgStreak, totalPractices };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-2xl text-indigo-600">Loading...</div>
      </div>
    );
  }

  if (mode === 'auth') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">⭐</div>
            <h1 className="text-3xl font-bold text-indigo-600 mb-2">SpellStars</h1>
            <p className="text-gray-600">Practice, compete, and shine!</p>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setUserType('parent')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                userType === 'parent' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Parent
            </button>
            <button
              onClick={() => setUserType('teacher')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                userType === 'teacher' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Teacher
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setAuthMode('login')}
              className={`flex-1 py-2 rounded-lg font-semibold ${
                authMode === 'login' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`flex-1 py-2 rounded-lg font-semibold ${
                authMode === 'signup' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            {authMode === 'signup' && userType === 'teacher' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={userType === 'parent' ? 'parent@email.com' : 'teacher@school.com'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                placeholder="Enter password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleAuth}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-lg font-semibold"
            >
              {authMode === 'login' ? 'Login' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'teacher-setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-green-600 mb-6">Teacher Setup</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Your School</label>
            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="">Choose a school...</option>
              {Object.values(schools).map(school => (
                <option key={school.name} value={school.name}>{school.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTeacherSetup}
            disabled={!selectedSchool}
            className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 text-lg font-semibold"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'teacher-dashboard') {
    const teacherSchool = currentAccount.schools[0];
    const schoolKey = teacherSchool?.toLowerCase().replace(/\s/g, '-');
    const schoolData = schools[schoolKey];
    const [newClassName, setNewClassName] = useState('');
    const [selectedDashboardClass, setSelectedDashboardClass] = useState('');
    const [weeklyWords, setWeeklyWords] = useState('');

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-green-600 flex items-center gap-3">
                  <GraduationCap size={36} />
                  Teacher Dashboard
                </h1>
                <p className="text-gray-600 mt-1">{currentAccount.name} • {teacherSchool}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>

            <div className="bg-green-50 p-6 rounded-xl mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Class</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="e.g., Year 4"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={() => {
                    if (newClassName.trim()) {
                      handleAddClass(teacherSchool, newClassName.trim());
                      setNewClassName('');
                    }
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Classes</h3>
              <div className="space-y-4">
                {schoolData?.classes.map(className => {
                  const stats = getClassStats(teacherSchool, className);
                  const classKey = `${teacherSchool}-${className}`;
                  const hasSpellings = weeklySpellings[classKey];

                  return (
                    <div key={className} className="bg-gray-50 p-6 rounded-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xl font-bold text-gray-800">{className}</h4>
                        <button
                          onClick={() => {
                            setSelectedDashboardClass(selectedDashboardClass === className ? '' : className);
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                        >
                          {selectedDashboardClass === className ? 'Hide' : 'View Details'}
                        </button>
                      </div>

                      {stats && (
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-sm text-gray-600">Students</div>
                            <div className="text-2xl font-bold text-indigo-600">{stats.totalStudents}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-sm text-gray-600">Avg Points</div>
                            <div className="text-2xl font-bold text-green-600">{stats.avgPoints}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-sm text-gray-600">Avg Streak</div>
                            <div className="text-2xl font-bold text-orange-600">{stats.avgStreak}</div>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-sm text-gray-600">Total Practices</div>
                            <div className="text-2xl font-bold text-purple-600">{stats.totalPractices}</div>
                          </div>
                        </div>
                      )}

                      <div className="bg-white p-4 rounded-lg mb-4">
                        <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Calendar size={18} />
                          Weekly Spellings
                        </h5>
                        {hasSpellings && (
                          <div className="mb-3 text-sm text-gray-600">
                            Current words: {weeklySpellings[classKey].words.join(', ')}
                          </div>
                        )}
                        <textarea
                          value={weeklyWords}
                          onChange={(e) => setWeeklyWords(e.target.value)}
                          placeholder="Enter words separated by commas (e.g., friend, school, because)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 mb-2"
                          rows="2"
                        />
                        <button
                          onClick={() => {
                            if (weeklyWords.trim()) {
                              const wordsList = weeklyWords.split(',').map(w => w.trim().toLowerCase()).filter(w => w);
                              handleSetWeeklySpellings(teacherSchool, className, wordsList);
                              setWeeklyWords('');
                              alert('Weekly spellings updated!');
                            }
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Set Weekly Spellings
                        </button>
                      </div>

                      {selectedDashboardClass === className && stats && (
                        <div className="bg-white p-4 rounded-lg">
                          <h5 className="font-semibold text-gray-800 mb-3">Student Progress</h5>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {stats.students.sort((a, b) => b.totalPoints - a.totalPoints).map((student, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <div className="font-medium text-gray-800">{student.name}</div>
                                  <div className="text-sm text-gray-600">
                                    {student.totalPractices} practices • {student.streak} day streak
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-bold text-indigo-600">{student.totalPoints}</div>
                                  <div className="text-xs text-gray-600">points</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'register') {
    const availableSchools = Object.values(schools).map(s => s.name);
    const availableClasses = selectedSchool
      ? schools[selectedSchool.toLowerCase().replace(/\s/g, '-')]?.classes || []
      : [];

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-indigo-600">Your Children</h2>
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>

          {currentAccount.children.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Select a child:</h3>
              <div className="space-y-2">
                {currentAccount.children.map((userId) => {
                  const child = users[userId];
                  if (!child) return null;
                  return (
                    <button
                      key={userId}
                      onClick={() => handleSelectChild(userId)}
                      className="w-full p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-left"
                    >
                      <div className="font-semibold text-indigo-900">{child.name}</div>
                      <div className="text-sm text-indigo-600">{child.school} - {child.class}</div>
                    </button>
                  );
                })}
              </div>
              <div className="my-4 text-center text-gray-500 text-sm">or</div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Add a new child:</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Child's Name</label>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder="Enter child's name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">School</label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select a school...</option>
                  {availableSchools.map(school => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  disabled={!selectedSchool}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                >
                  <option value="">Select a class...</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAddChild}
                disabled={!childName.trim() || !selectedSchool || !selectedClass}
                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 text-lg font-semibold flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add Child
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Welcome, {currentUser.name}!</h2>
                <p className="text-gray-600">{currentUser.school} - {currentUser.class}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('account')}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => setMode('leaderboard')}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
                >
                  <Trophy size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={20} />
                  <div className="text-sm">Points</div>
                </div>
                <div className="text-3xl font-bold">{currentUser.totalPoints}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Flame size={20} />
                  <div className="text-sm">Streak</div>
                </div>
                <div className="text-3xl font-bold">{currentUser.streak}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Target size={20} />
                  <div className="text-sm">Practices</div>
                </div>
                <div className="text-3xl font-bold">{currentUser.totalPractices}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Award size={20} />
                  <div className="text-sm">Badges</div>
                </div>
                <div className="text-3xl font-bold">{currentUser.badges.length}</div>
              </div>
            </div>

            {currentUser.badges.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium text-gray-700 mb-2">Badges</div>
                <div className="flex gap-2 flex-wrap">
                  {currentUser.badges.map(badgeId => {
                    const badge = getBadgeInfo(badgeId);
                    return (
                      <div key={badgeId} className="px-3 py-2 bg-gray-100 rounded-lg flex items-center gap-2">
                        <span className="text-xl">{badge.icon}</span>
                        <span className="text-sm font-medium">{badge.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-indigo-600 mb-6">
              {words.length > 0 && words[0] !== 'friend' ? 'This Week\'s Spellings' : 'Practice Setup'}
            </h1>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Add Spelling Words</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addWord()}
                  placeholder="Type a word..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <button onClick={addWord} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                  <Plus size={20} />
                  Add
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Word List ({words.length} words)</h2>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {words.map((word, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                    <span className="font-medium text-gray-700">{word}</span>
                    <button onClick={() => removeWord(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={startPractice}
              disabled={words.length === 0}
              className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 flex items-center justify-center gap-2 text-lg font-semibold"
            >
              <Play size={24} />
              Start Practice
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'practice') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-600">Word {currentWordIndex + 1} of {words.length}</div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 text-orange-600">
                  <Flame size={18} />
                  <span className="font-bold">{currentUser.streak}</span>
                </div>
                <div className="text-sm font-semibold text-indigo-600">Score: {score.correct}/{score.total}</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all"
                  style={{ width: `${((currentWordIndex + 1) / words.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="text-center mb-8">
              <button
                onClick={() => speak(words[currentWordIndex])}
                className="inline-flex items-center gap-3 px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-lg font-semibold"
              >
                <Volume2 size={28} />
                Hear the word
              </button>
              
              {showWord && (
                <div className="mt-6 animate-pulse">
                  <div className="text-5xl font-bold text-indigo-600">{words[currentWordIndex]}</div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your answer..."
                disabled={feedback !== null}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                className="w-full px-6 py-4 text-xl border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                autoFocus
              />
            </div>

            {feedback === null ? (
              <button
                onClick={checkAnswer}
                disabled={!userAnswer.trim()}
                className="w-full py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-300 text-lg font-semibold"
              >
                Check Answer
              </button>
            ) : feedback === 'correct' ? (
              <div>
                <div className="p-6 rounded-xl mb-4 bg-green-100 border-2 border-green-500">
                  <div className="flex items-center gap-3">
                    <Check size={28} className="text-green-600" />
                    <span className="text-xl font-bold text-green-600">Correct! +10 points</span>
                  </div>
                </div>
                <button
                  onClick={nextWord}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-lg font-semibold"
                >
                  {currentWordIndex < words.length - 1 ? 'Next Word' : 'See Results'}
                </button>
              </div>
            ) : (
              <div>
                <div className="p-6 rounded-xl mb-4 bg-red-100 border-2 border-red-500">
                  <div className="flex items-center gap-3 mb-2">
                    <X size={28} className="text-red-600" />
                    <span className="text-xl font-bold text-red-600">Not quite!</span>
                  </div>
                  <p className="text-lg text-gray-700 mb-3">
                    Correct spelling: <span className="font-bold text-2xl">{words[currentWordIndex]}</span>
                  </p>
                  {attempts > 0 && (
                    <p className="text-sm text-orange-600 font-medium">-5 points</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={tryAgain}
                    className="py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 text-lg font-semibold"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={nextWord}
                    className="py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-lg font-semibold"
                  >
                    {currentWordIndex < words.length - 1 ? 'Next' : 'Results'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'complete') {
    const percentage = Math.round((score.correct / score.total) * 100);
    const points = score.correct * 10 - Math.max(0, score.total - score.correct) * 5 + (percentage === 100 ? 50 : 0);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">{percentage === 100 ? '🎉' : percentage >= 80 ? '🌟' : '👍'}</div>
            <h1 className="text-3xl font-bold text-indigo-600 mb-4">
              {percentage === 100 ? 'Perfect Score!' : percentage >= 80 ? 'Great Job!' : 'Nice Work!'}
            </h1>
            
            <div className="bg-indigo-50 rounded-xl p-6 mb-6">
              <div className="text-5xl font-bold text-indigo-600 mb-2">{percentage}%</div>
              <p className="text-gray-700 mb-4">
                <span className="font-bold text-green-600">{score.correct}</span> out of <span className="font-bold">{score.total}</span> correct
              </p>
              
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-600">
                <Star className="fill-yellow-600" size={28} />
                +{points} points
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-orange-50 p-4 rounded-xl">
                <Flame className="mx-auto mb-2 text-orange-600" size={32} />
                <div className="text-2xl font-bold text-orange-600">{currentUser.streak}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl">
                <Award className="mx-auto mb-2 text-purple-600" size={32} />
                <div className="text-2xl font-bold text-purple-600">{currentUser.badges.length}</div>
                <div className="text-sm text-gray-600">Badges</div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setMode('leaderboard')}
                className="w-full py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center justify-center gap-2 text-lg font-semibold"
              >
                <Trophy size={24} />
                View Leaderboard
              </button>
              <button
                onClick={() => setMode('setup')}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 text-lg font-semibold"
              >
                <RotateCcw size={24} />
                Practice Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'leaderboard') {
    const leaderboard = getLeaderboard();
    const userId = `${currentUser.school}-${currentUser.class}-${currentUser.name}`.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-indigo-600 flex items-center gap-3">
                <Trophy className="text-yellow-500" size={36} />
                {currentUser.class} Leaderboard
              </h1>
              <button
                onClick={() => setMode('setup')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Back
              </button>
            </div>

            <div className="space-y-3">
              {leaderboard.map((student, index) => {
                const isCurrentUser = `${student.school}-${student.class}-${student.name}`.toLowerCase().replace(/\s/g, '-') === userId;
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      isCurrentUser ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-gray-400' :
                        index === 2 ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {student.name} {isCurrentUser && '(You)'}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Flame size={14} className="text-orange-500" />
                            {student.streak} day streak
                          </span>
                          <span>{student.totalPractices} practices</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">{student.totalPoints}</div>
                      <div className="text-sm text-gray-600">points</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'account') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-indigo-600">Account Settings</h2>
            <button
              onClick={() => setMode('setup')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Back
            </button>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Account Information</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="mb-2">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{currentAccount.email}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Children</h3>
            <div className="space-y-3">
              {currentAccount.children.map((userId) => {
                const child = users[userId];
                if (!child) return null;
                const isActive = currentUser && `${currentUser.school}-${currentUser.class}-${currentUser.name}`.toLowerCase().replace(/\s/g, '-') === userId;
                return (
                  <div
                    key={userId}
                    className={`p-4 rounded-lg ${isActive ? 'bg-indigo-100 border-2 border-indigo-500' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-800">
                          {child.name} {isActive && '(Active)'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {child.school} - {child.class}
                        </div>
                        <div className="text-sm text-indigo-600 mt-1">
                          {child.totalPoints} points • {child.streak} day streak
                        </div>
                      </div>
                      {!isActive && (
                        <button
                          onClick={() => handleSelectChild(userId)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                          Switch
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 font-semibold"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>
    );
  }

  return null;
}
