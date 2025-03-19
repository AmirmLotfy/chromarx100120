import React, { useState, useEffect } from 'react';
import { TimerDisplay } from '@/components/timer/TimerDisplay';
import { TimerControls } from '@/components/timer/TimerControls';
import { TimerSettings } from '@/components/timer/TimerSettings';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/Layout';
import PageTitle from '@/components/PageTitle';

const TimerPage: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [originalTime, setOriginalTime] = useState<number>(25 * 60);
  
  useEffect(() => {
    console.log("Timer page rendered");
    let timer: number;
    
    if (isRunning && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      // You could add a sound notification here
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft]);
  
  const handleStart = () => {
    setIsRunning(true);
  };
  
  const handlePause = () => {
    setIsRunning(false);
  };
  
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(originalTime);
  };
  
  const handleModeToggle = () => {
    setIsRunning(false);
    
    if (timerMode === 'focus') {
      setTimerMode('break');
      const breakTime = 5 * 60; // 5 minute break
      setTimeLeft(breakTime);
      setOriginalTime(breakTime);
    } else {
      setTimerMode('focus');
      const focusTime = 25 * 60; // 25 minute focus
      setTimeLeft(focusTime);
      setOriginalTime(focusTime);
    }
  };
  
  const handleTimeChange = (minutes: number) => {
    const newTime = minutes * 60;
    setTimeLeft(newTime);
    setOriginalTime(newTime);
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <PageTitle>Pomodoro Timer</PageTitle>
        <div className="max-w-md mx-auto">
          <Card className="mb-6">
            <CardContent className="pt-6">
              <TimerDisplay 
                timeLeft={timeLeft} 
                mode={timerMode}
                maxTime={originalTime}
              />
              
              <TimerControls 
                isRunning={isRunning}
                onStart={handleStart}
                onPause={handlePause}
                onReset={handleReset}
                onModeToggle={handleModeToggle}
                mode={timerMode}
              />
            </CardContent>
          </Card>
          
          <TimerSettings 
            duration={originalTime / 60}
            onDurationChange={handleTimeChange}
            mode={timerMode}
            disabled={isRunning}
          />
        </div>
      </div>
    </Layout>
  );
};

export default TimerPage;
