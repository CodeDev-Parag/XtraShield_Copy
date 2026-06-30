'use client';

import React, { useState, useEffect } from 'react';
import { useSecurityStore } from '@/store/securityStore';
import {
  ShieldAlert, 
  ShieldCheck, 
  Copy, 
  Check, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  Lock,
  ListFilter
} from 'lucide-react';

// Native browser SHA-1 implementation
async function getSha1Hash(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex.toUpperCase();
}

export default function PasswordGuardPage() {
  const addScan = useSecurityStore((state) => state.addScan);
  
  // Tab states: 'check' or 'generate'
  const [activeTab, setActiveTab] = useState<'check' | 'generate'>('check');

  // Breach Checker States
  const [passwordToCheck, setPasswordToCheck] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    searched: boolean;
    breached: boolean;
    count: number;
    strengthScore: number; // 0 to 4
    feedback: string;
  } | null>(null);

  // Generator States
  const [genLength, setGenLength] = useState(16);
  const [genUpper, setGenUpper] = useState(true);
  const [genLower, setGenLower] = useState(true);
  const [genNumbers, setGenNumbers] = useState(true);
  const [genSymbols, setGenSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  // Calculate password strength in real-time
  const getStrengthMetrics = (pwd: string) => {
    let score = 0;
    const feedbackList: string[] = [];

    if (!pwd) return { score: 0, feedback: 'Enter a password to analyze.' };

    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;

    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

    const varietyCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;
    if (varietyCount >= 3) score += 1;
    if (varietyCount === 4 && pwd.length >= 10) score += 1;

    let strengthText = 'Very Weak';
    if (score === 1) strengthText = 'Weak';
    if (score === 2) strengthText = 'Fair';
    if (score === 3) strengthText = 'Strong';
    if (score === 4) strengthText = 'Excellent (Strong)';

    return {
      score,
      feedback: `Strength: ${strengthText}. Long, complex passwords are much harder to crack.`,
      criteria: {
        length8: pwd.length >= 8,
        length12: pwd.length >= 12,
        upper: hasUpper,
        lower: hasLower,
        number: hasNumber,
        symbol: hasSymbol
      }
    };
  };

  const checkStrength = getStrengthMetrics(passwordToCheck);

  // Handle breach check
  const handleCheckPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordToCheck) return;

    setIsChecking(true);
    setCheckResult(null);

    try {
      const fullHash = await getSha1Hash(passwordToCheck);
      const prefix = fullHash.substring(0, 5);
      const suffix = fullHash.substring(5);

      const response = await fetch('/api/proxy/breach/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashPrefix: prefix })
      });
      
      if (!response.ok) {
        throw new Error('Failed to reach breach database API.');
      }

      const textData = await response.text();
      const lines = textData.split('\n');
      
      let breached = false;
      let breachCount = 0;

      for (const line of lines) {
        const [lineSuffix, countStr] = line.trim().split(':');
        if (lineSuffix === suffix) {
          breached = true;
          breachCount = parseInt(countStr, 10);
          break;
        }
      }

      const strength = getStrengthMetrics(passwordToCheck);
      
      setCheckResult({
        searched: true,
        breached,
        count: breachCount,
        strengthScore: strength.score,
        feedback: strength.feedback
      });

      // Save to recent scans store
      addScan({
        type: 'password',
        target: '••••••••' + fullHash.slice(-4),
        status: breached ? 'danger' : 'safe',
        details: breached 
          ? `WARNING: Password exposed in ${breachCount.toLocaleString()} known breaches. DO NOT USE.` 
          : 'Safe. Password not found in known database breaches.'
      });

    } catch (err: any) {
      console.error(err);
      setCheckResult({
        searched: true,
        breached: false,
        count: 0,
        strengthScore: checkStrength.score,
        feedback: 'Error querying breach database. Standard strength rules still apply.'
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Password Generator logic
  const handleGeneratePassword = () => {
    let charset = '';
    if (genLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (genUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (genNumbers) charset += '0123456789';
    if (genSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!charset) {
      setGeneratedPassword('Please select at least one character set');
      return;
    }

    let result = '';
    // Ensure cryptographically strong random numbers if browser supports
    const array = new Uint32Array(genLength);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < genLength; i++) {
      result += charset[array[i] % charset.length];
    }

    setGeneratedPassword(result);
    setCopied(false);
  };

  useEffect(() => {
    if (activeTab === 'generate') {
      handleGeneratePassword();
    }
  }, [activeTab, genLength, genUpper, genLower, genNumbers, genSymbols]);

  const copyToClipboard = () => {
    if (!generatedPassword) return;
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 select-none min-h-screen bg-white max-w-7xl mx-auto w-full relative font-mono">
      
      {/* Title */}
      <div className="border-b border-black pb-6">
        <h1 className="text-3xl font-heading font-extrabold tracking-tight text-[#0A0A0A] flex items-center gap-3 uppercase">
          <Lock className="w-8 h-8 text-[#0A0A0A]" />
          {'>'} PASSWORD GUARD
        </h1>
        <p className="mt-2 text-sm text-[#4B5563] font-mono font-medium">
          Analyze password strength, check exposure in leak databases using client-side k-anonymity, and generate high-entropy passwords.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black">
        <button
          data-testid="tab-breach-checker"
          onClick={() => setActiveTab('check')}
          className={`py-3 px-6 text-sm font-heading font-bold uppercase tracking-widest transition-colors ${
            activeTab === 'check'
              ? 'bg-black text-white'
              : 'bg-white text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#0A0A0A]'
          }`}
        >
          BREACH CHECKER &amp; STRENGTH METER
        </button>
        <button
          data-testid="tab-password-generator"
          onClick={() => setActiveTab('generate')}
          className={`py-3 px-6 text-sm font-heading font-bold uppercase tracking-widest transition-colors ${
            activeTab === 'generate'
              ? 'bg-black text-white'
              : 'bg-white text-[#4B5563] hover:bg-[#F3F4F6] hover:text-[#0A0A0A]'
          }`}
        >
          PASSWORD GENERATOR
        </button>
      </div>

      {activeTab === 'check' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main checking panel */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-black p-6 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
              <h2 className="text-lg font-heading font-bold text-[#0A0A0A] mb-4 uppercase tracking-tight">$ CHECK A PASSWORD</h2>
              <form onSubmit={handleCheckPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-bold text-[#4B5563] uppercase tracking-widest mb-2">
                    Enter Password
                  </label>
                  <div className="relative">
                    <input
                      data-testid="input-password-check"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordToCheck}
                      onChange={(e) => {
                        setPasswordToCheck(e.target.value);
                        if (checkResult) setCheckResult(null);
                      }}
                      className="w-full bg-white border border-black py-3 pl-4 pr-12 text-sm text-[#0A0A0A] placeholder-[#4B5563] focus:outline-none focus:ring-1 focus:ring-black focus:border-black font-mono"
                      placeholder="Type a password to test..."
                      required
                    />
                    <button
                      data-testid="btn-toggle-password-visibility"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#4B5563] hover:text-[#0A0A0A]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center text-xs text-[#4B5563] font-mono font-medium">
                    <HelpCircle className="w-4 h-4 mr-1.5 text-[#0A0A0A]" />
                    <span>k-Anonymity ensures your password is never sent to any server.</span>
                  </div>
                  <button
                    data-testid="btn-scan-breaches"
                    type="submit"
                    disabled={isChecking || !passwordToCheck}
                    className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-heading font-bold uppercase tracking-widest bg-black text-white hover:bg-[#16A34A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isChecking ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        SCANNING...
                      </>
                    ) : (
                      'SCAN FOR BREACHES'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Results Panel */}
            {checkResult && (
              <div className={`border border-black p-6 transition-colors duration-100 ${
                checkResult.breached 
                  ? 'bg-white' 
                  : 'bg-white'
              }`}>
                <div className="flex items-start">
                  {checkResult.breached ? (
                    <ShieldAlert className="w-8 h-8 text-[#DC2626] mr-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <ShieldCheck className="w-8 h-8 text-[#16A34A] mr-4 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-heading font-extrabold text-[#0A0A0A] uppercase tracking-tight">
                        {checkResult.breached 
                          ? 'COMPROMISED PASSWORD DETECTED' 
                          : 'NO KNOWN BREACHES FOUND'}
                      </h3>
                      {checkResult.breached ? (
                        <span className="bg-[#DC2626] text-white text-xs tracking-widest uppercase px-2 py-0.5 font-mono">THREAT</span>
                      ) : (
                        <span className="bg-[#16A34A] text-white text-xs tracking-widest uppercase px-2 py-0.5 font-mono">SAFE</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-[#4B5563] font-mono font-medium leading-relaxed">
                      {checkResult.breached 
                        ? `This password has been exposed in database leaks ${checkResult.count.toLocaleString()} times. Do not use this password on any account!` 
                        : 'This password was not found in any breached databases. Good job!'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Strength Guidelines */}
            <div className="bg-white border border-black p-6 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
              <h3 className="text-sm font-heading font-bold text-[#0A0A0A] mb-3 uppercase tracking-tight">{'>'} WHY CHECK FOR BREACHES?</h3>
              <p className="text-xs text-[#4B5563] leading-relaxed font-mono font-medium">
                Even if a password is long and complex (e.g. <code className="font-mono text-[#0A0A0A] bg-[#F8F9FA] px-1 py-0.5 border border-black">P@ssw0rd123!</code>), it could be completely compromised if it has leaked in a past data breach. Hackers load lists of billions of breached passwords into automated tools (credential stuffing) to gain access to accounts. Always use unique passwords for every site.
              </p>
            </div>
          </div>

          {/* Strength meter checklist (Sidebar for checker) */}
          <div className="space-y-6">
            <div className="bg-white border border-black p-6 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
              <h2 className="text-sm font-heading font-bold text-[#0A0A0A] mb-4 uppercase tracking-tight">$ PASSWORD STRENGTH ANALYSIS</h2>

              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#4B5563] font-mono font-medium uppercase tracking-widest">Security Score:</span>
                  <span className={`font-mono font-bold ${
                    checkStrength.score <= 1 ? 'text-[#DC2626]' :
                    checkStrength.score === 2 ? 'text-[#EAB308]' :
                    checkStrength.score === 3 ? 'text-[#0A0A0A]' : 'text-[#16A34A]'
                  }`}>
                    {checkStrength.score} / 4
                  </span>
                </div>
                <div className="h-2.5 bg-[#F3F4F6] overflow-hidden flex border border-black">
                  {[1, 2, 3, 4].map((step) => (
                    <div
                      key={step}
                      className={`h-full flex-1 border-r border-[#F3F4F6] last:border-0 transition-colors duration-300 ${
                        passwordToCheck
                          ? step <= checkStrength.score
                            ? checkStrength.score <= 1 ? 'bg-[#DC2626]' :
                              checkStrength.score === 2 ? 'bg-[#EAB308]' :
                              checkStrength.score === 3 ? 'bg-[#0A0A0A]' : 'bg-[#16A34A]'
                            : 'bg-[#F3F4F6]'
                          : 'bg-[#F3F4F6]'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-[#4B5563] pt-1 leading-relaxed font-mono font-medium">
                  {checkStrength.feedback}
                </p>
              </div>

              {/* Checklist */}
              <div className="mt-6 space-y-3.5 pt-6 border-t border-black">
                <h4 className="text-xs font-mono font-bold text-[#4B5563] uppercase tracking-widest">REQUIREMENTS</h4>
                <ul className="space-y-3.5 text-xs font-semibold text-[#4B5563]">
                  <li className="flex items-center">
                    {checkStrength.criteria?.length8 ? (
                      <ShieldCheck className="w-4 h-4 text-[#16A34A] mr-2.5 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 border border-black bg-white mr-2.5 shrink-0" />
                    )}
                    <span className={checkStrength.criteria?.length8 ? 'text-[#0A0A0A]' : 'text-[#4B5563]'}>
                      At least 8 characters
                    </span>
                  </li>
                  <li className="flex items-center">
                    {checkStrength.criteria?.length12 ? (
                      <ShieldCheck className="w-4 h-4 text-[#16A34A] mr-2.5 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 border border-black bg-white mr-2.5 shrink-0" />
                    )}
                    <span className={checkStrength.criteria?.length12 ? 'text-[#0A0A0A]' : 'text-[#4B5563]'}>
                      Strong target (12+ characters)
                    </span>
                  </li>
                  <li className="flex items-center">
                    {checkStrength.criteria?.upper ? (
                      <ShieldCheck className="w-4 h-4 text-[#16A34A] mr-2.5 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 border border-black bg-white mr-2.5 shrink-0" />
                    )}
                    <span className={checkStrength.criteria?.upper ? 'text-[#0A0A0A]' : 'text-[#4B5563]'}>
                      Includes uppercase letters (A-Z)
                    </span>
                  </li>
                  <li className="flex items-center">
                    {checkStrength.criteria?.lower ? (
                      <ShieldCheck className="w-4 h-4 text-[#16A34A] mr-2.5 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 border border-black bg-white mr-2.5 shrink-0" />
                    )}
                    <span className={checkStrength.criteria?.lower ? 'text-[#0A0A0A]' : 'text-[#4B5563]'}>
                      Includes lowercase letters (a-z)
                    </span>
                  </li>
                  <li className="flex items-center">
                    {checkStrength.criteria?.number ? (
                      <ShieldCheck className="w-4 h-4 text-[#16A34A] mr-2.5 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 border border-black bg-white mr-2.5 shrink-0" />
                    )}
                    <span className={checkStrength.criteria?.number ? 'text-[#0A0A0A]' : 'text-[#4B5563]'}>
                      Includes numeric digits (0-9)
                    </span>
                  </li>
                  <li className="flex items-center">
                    {checkStrength.criteria?.symbol ? (
                      <ShieldCheck className="w-4 h-4 text-[#16A34A] mr-2.5 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 border border-black bg-white mr-2.5 shrink-0" />
                    )}
                    <span className={checkStrength.criteria?.symbol ? 'text-[#0A0A0A]' : 'text-[#4B5563]'}>
                      Includes symbols (!@#$%^&amp;*)
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Password Generator Tab */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-black p-6 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
              <h2 className="text-lg font-heading font-bold text-[#0A0A0A] mb-4 uppercase tracking-tight">$ GENERATE A SECURE PASSWORD</h2>
              
              {/* Generated Password Box */}
              <div className="bg-[#F8F9FA] border border-black p-4 flex items-center justify-between font-mono text-lg text-[#0A0A0A] break-all select-all relative overflow-hidden">
                <span className="pr-12">{generatedPassword}</span>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                  <button
                    data-testid="btn-copy-password"
                    onClick={copyToClipboard}
                    className="p-2 hover:bg-[#F3F4F6] text-[#4B5563] hover:text-[#0A0A0A] transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? <Check className="w-5 h-5 text-[#16A34A]" /> : <Copy className="w-5 h-5" />}
                  </button>
                  <button
                    data-testid="btn-regenerate-password"
                    onClick={handleGeneratePassword}
                    className="p-2 hover:bg-[#F3F4F6] text-[#4B5563] hover:text-[#0A0A0A] transition-colors"
                    title="Generate new"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Customization Options */}
              <div className="mt-8 space-y-6">
                <div>
                  <div className="flex justify-between items-center text-xs font-mono font-bold text-[#4B5563] uppercase tracking-widest mb-2">
                    <span>LENGTH: {genLength} CHARACTERS</span>
                  </div>
                  <input
                    data-testid="input-password-length"
                    type="range"
                    min="8"
                    max="64"
                    value={genLength}
                    onChange={(e) => setGenLength(parseInt(e.target.value, 10))}
                    className="w-full accent-black bg-[#F3F4F6] h-2.5 cursor-pointer appearance-none border border-black"
                  />
                  <div className="flex justify-between text-[10px] text-[#4B5563] font-mono mt-2 font-bold uppercase">
                    <span>8 (Weak)</span>
                    <span>16 (Recommended)</span>
                    <span>32 (Strong)</span>
                    <span>64 (Paranoid)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-black">
                  <label className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                      data-testid="checkbox-uppercase"
                      type="checkbox"
                      checked={genUpper}
                      onChange={(e) => setGenUpper(e.target.checked)}
                      className="border-black text-black bg-white focus:ring-black focus:ring-1 w-4 h-4 accent-black"
                    />
                    <span className="text-sm font-mono font-semibold text-[#4B5563] hover:text-[#0A0A0A] transition-colors">Uppercase Letters (A-Z)</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                      data-testid="checkbox-lowercase"
                      type="checkbox"
                      checked={genLower}
                      onChange={(e) => setGenLower(e.target.checked)}
                      className="border-black text-black bg-white focus:ring-black focus:ring-1 w-4 h-4 accent-black"
                    />
                    <span className="text-sm font-mono font-semibold text-[#4B5563] hover:text-[#0A0A0A] transition-colors">Lowercase Letters (a-z)</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                      data-testid="checkbox-numbers"
                      type="checkbox"
                      checked={genNumbers}
                      onChange={(e) => setGenNumbers(e.target.checked)}
                      className="border-black text-black bg-white focus:ring-black focus:ring-1 w-4 h-4 accent-black"
                    />
                    <span className="text-sm font-mono font-semibold text-[#4B5563] hover:text-[#0A0A0A] transition-colors">Numbers (0-9)</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer select-none">
                    <input
                      data-testid="checkbox-symbols"
                      type="checkbox"
                      checked={genSymbols}
                      onChange={(e) => setGenSymbols(e.target.checked)}
                      className="border-black text-black bg-white focus:ring-black focus:ring-1 w-4 h-4 accent-black"
                    />
                    <span className="text-sm font-mono font-semibold text-[#4B5563] hover:text-[#0A0A0A] transition-colors">Special Symbols (!@#$%^&amp;*)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Guidelines / Tips */}
          <div className="bg-white border border-black p-6 h-fit space-y-4 hover:shadow-[4px_4px_0px_rgba(0,0,0,1)] transition-shadow duration-100">
            <h3 className="text-sm font-heading font-bold text-[#0A0A0A] mb-3 uppercase tracking-tight">{'>'} BEST PRACTICES FOR PASSWORDS</h3>
            <ul className="space-y-4 text-xs font-mono font-semibold text-[#4B5563]">
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-black mr-2.5 mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed"><strong className="text-[#0A0A0A]">Never reuse passwords:</strong> If a single website is breached, hackers will try that exact password on your email, bank, and social media.</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-black mr-2.5 mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed"><strong className="text-[#0A0A0A]">Use a password manager:</strong> Password managers store cryptographically secure passwords so you only need to remember one master password.</span>
              </li>
              <li className="flex items-start">
                <span className="w-1.5 h-1.5 bg-black mr-2.5 mt-1.5 flex-shrink-0" />
                <span className="leading-relaxed"><strong className="text-[#0A0A0A]">Enable MFA:</strong> Multi-factor authentication provides an essential second line of defense even if your password is stolen.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
