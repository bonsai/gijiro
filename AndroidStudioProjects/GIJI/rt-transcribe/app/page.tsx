'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [segments, setSegments] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [summary, setSummary] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const harkRef = useRef<any>(null);

  // 録音開始
  const startRecording = async () => {
    try {
      // マイクとシステム音声を取得
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // システム音声の取得（ブラウザによっては制限あり）
      // @ts-ignore
      const audioStream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: false,
      });

      // マイクとシステム音声をミックス
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const micSource = audioContext.createMediaStreamSource(stream);
      const systemSource = audioContext.createMediaStreamSource(audioStream);
      
      const destination = audioContext.createMediaStreamDestination();
      micSource.connect(destination);
      systemSource.connect(destination);
      
      const mixedStream = new MediaStream([...stream.getTracks(), ...audioStream.getTracks()]);
      
      // Harkで発話検知を設定
      // @ts-ignore
      const Hark = (await import('hark')).default;
      harkRef.current = Hark(mixedStream, {
        interval: 100,
        threshold: -50,
        play: false,
      });

      harkRef.current.on('speaking', () => {
        setLog(prev => ['発話検知', ...prev]);
      });

      harkRef.current.on('stopped_speaking', () => {
        setLog(prev => ['無音検知', ...prev]);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      });

      // 録音開始
      const mediaRecorder = new MediaRecorder(mixedStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (audioBlob.size > 100) { // 空の録音を防ぐ
          await sendChunk(audioBlob);
        }
        
        // 再度録音を開始（無音状態が終了した場合）
        if (isRecording) {
          audioChunksRef.current = [];
          mediaRecorder.start(1000); // 1秒ごとにデータを取得
        }
      };

      mediaRecorder.start(1000); // 1秒ごとにデータを取得
      setIsRecording(true);
      setLog(prev => ['録音開始', ...prev]);
      
      streamRef.current = mixedStream;
      audioContextRef.current = audioContext;

    } catch (err) {
      console.error('録音開始エラー:', err);
      setLog(prev => [`エラー: ${err}`, ...prev]);
    }
  };

  // 録音停止
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (harkRef.current) {
      harkRef.current.stop();
      harkRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    mediaRecorderRef.current = null;
    setIsRecording(false);
    setLog(prev => ['録音停止', ...prev]);
  };

  // 音声データをサーバーに送信
  const sendChunk = async (blob: Blob) => {
    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': blob.type || 'audio/webm' },
        body: blob,
      });
      const json = await res.json();
      if (json.text) {
        setSegments(prev => [...prev, json.text]);
      }
    } catch (e) {
      console.error('送信エラー:', e);
      setLog(prev => ['送信エラー', ...prev]);
    }
  };

  // 要約を取得
  const getSummary = async () => {
    try {
      const transcript = segments.join('\n');
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      const json = await res.json();
      if (json.text) {
        setSummary(json.text);
      }
    } catch (e) {
      console.error('要約エラー:', e);
      setLog(prev => ['要約エラー', ...prev]);
    }
  };

  // コンポーネントのアンマウント時にリソースを解放
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">リアルタイム文字起こしアプリ</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-center gap-4 mb-6">
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full flex items-center"
              >
                <span className="w-3 h-3 bg-white rounded-full mr-2"></span>
                録音開始
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-full"
              >
                録音停止
              </button>
            )}
            
            <button
              onClick={getSummary}
              disabled={segments.length === 0}
              className={`py-2 px-6 rounded-full font-bold ${
                segments.length > 0
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              要約を生成
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-3">文字起こし</h2>
              <div className="bg-gray-50 p-4 rounded-md h-96 overflow-y-auto">
                {segments.length > 0 ? (
                  <div className="space-y-4">
                    {segments.map((segment, index) => (
                      <div key={index} className="p-3 bg-white rounded shadow">
                        <p className="whitespace-pre-wrap">{segment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center my-16">
                    録音を開始すると、ここに文字起こしが表示されます
                  </p>
                )}
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold mb-3">要約</h2>
              <div className="bg-gray-50 p-4 rounded-md h-96 overflow-y-auto">
                {summary ? (
                  <div className="whitespace-pre-wrap">{summary}</div>
                ) : (
                  <p className="text-gray-500 text-center my-16">
                    「要約を生成」ボタンをクリックすると、
                    文字起こしの内容を要約します
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-3">ログ</h2>
          <div className="bg-gray-50 p-4 rounded-md h-48 overflow-y-auto text-sm">
            {log.length > 0 ? (
              <ul className="space-y-1">
                {log.map((entry, index) => (
                  <li key={index} className="font-mono">
                    [{new Date().toLocaleTimeString()}] {entry}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center my-12">
                ログがここに表示されます
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
