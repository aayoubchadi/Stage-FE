import { useRef, useState } from 'react';
import Header from '../components/Header';
import PageBackground from '../components/PageBackground';
import {
  forgotPasswordRequest,
  resetPasswordRequest,
  verifyResetCodeRequest,
} from '../services/authApi';
import { useLanguage } from '../lib/i18n';

const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/;

function getPasswordPolicyError(password, email) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const emailLocalPart = normalizedEmail.includes('@')
    ? normalizedEmail.split('@')[0]
    : normalizedEmail;

  if (password.length < 12) {
    return 'Password must be at least 12 characters.';
  }

  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must include uppercase, lowercase, and number characters.';
  }

  if (!SPECIAL_CHAR_REGEX.test(password)) {
    return 'Password must include at least one special character.';
  }

  if (/\s/.test(password)) {
    return 'Password must not include spaces.';
  }

  if (emailLocalPart && password.toLowerCase().includes(emailLocalPart)) {
    return 'Password must not contain the email name.';
  }

  return '';
}

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const codeInputRefs = useRef([]);
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verifiedCode, setVerifiedCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim().toUpperCase();
  const codeChars = Array.from({ length: 6 }, (_, index) => code[index] || '');

  const focusCodeInput = (index) => {
    const nextInput = codeInputRefs.current[index];
    if (nextInput) {
      nextInput.focus();
      nextInput.select();
    }
  };

  const handleCodeChange = (index, value) => {
    const nextValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (nextValue.length > 1) {
      const pastedCode = nextValue.slice(0, 6);
      setCode(pastedCode);
      focusCodeInput(Math.min(pastedCode.length, 5));
      return;
    }

    const nextChars = [...codeChars];
    nextChars[index] = nextValue;
    const nextCode = nextChars.join('').slice(0, 6);

    setCode(nextCode);

    if (nextValue && index < 5) {
      focusCodeInput(index + 1);
    }
  };

  const handleCodeKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !codeChars[index] && index > 0) {
      focusCodeInput(index - 1);
    }
  };

  const handleRequestCode = async (event) => {
    event.preventDefault();

    if (!normalizedEmail) {
      setMessage('Email is required.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      await forgotPasswordRequest(normalizedEmail);
      setCode('');
      setVerifiedCode('');
      setStep(1);
      window.setTimeout(() => focusCodeInput(0), 450);
      setMessage('If an active account exists, a reset code has been sent to your email.');
      setMessageType('success');
    } catch (error) {
      setMessage(error.message || 'We could not send the reset code right now. Please try again later.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();

    if (!/^[A-Z0-9]{6}$/.test(normalizedCode)) {
      setMessage('Enter the 6-character reset code from your email.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      await verifyResetCodeRequest({
        email: normalizedEmail,
        code: normalizedCode,
      });
      setVerifiedCode(normalizedCode);
      setStep(2);
      setMessage('');
      setMessageType('');
    } catch (error) {
      setMessage(error.message || 'Invalid or expired reset code.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();

    const passwordPolicyError = getPasswordPolicyError(newPassword, normalizedEmail);
    if (passwordPolicyError) {
      setMessage(passwordPolicyError);
      setMessageType('error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setMessage(t('auth.forgotPassword.passwordMismatch') || 'Passwords do not match.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      await resetPasswordRequest({
        email: normalizedEmail,
        code: verifiedCode,
        newPassword,
      });
      setMessage(t('auth.forgotPassword.success') || 'Password reset successful. Redirecting...');
      setMessageType('success');
      window.setTimeout(() => {
        window.location.assign('/login');
      }, 1200);
    } catch (error) {
      setMessage(error.message || 'Password reset failed.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageBackground />
      <Header showNav={false} />
      <main className="section section-shell auth-main">
        <section className="auth-wrap auth-recovery-wrap">
          <div className="auth-progress" aria-label="Password recovery progress">
            {[0, 1, 2].map((item) => (
              <span key={item} className={item <= step ? 'is-active' : ''} />
            ))}
          </div>

          <div className="auth-step-frame">
            <div
              className="auth-step-track"
              style={{ transform: `translateX(-${step * 100}%)` }}
            >
              <section className="auth-step-panel" aria-hidden={step !== 0}>
                <p className="eyebrow">{t('auth.forgotPassword.eyebrow')}</p>
                <h1>Recover your account</h1>
                <p className="auth-hint">Enter your account email and we will send a 6-character verification code.</p>

                <form className="auth-form" onSubmit={handleRequestCode}>
                  <label>
                    {t('auth.forgotPassword.email') || 'Email'}
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t('auth.placeholders.email') || 'your@email.com'}
                      required
                    />
                  </label>

                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Send reset code'}
                  </button>
                </form>
              </section>

              <section className="auth-step-panel" aria-hidden={step !== 1}>
                <p className="eyebrow">Verification</p>
                <h1>Enter your code</h1>
                <p className="auth-hint">Check your inbox for the 6-character code. It expires in 15 minutes.</p>

                <form className="auth-form" onSubmit={handleVerifyCode}>
                  <fieldset className="auth-code-fieldset">
                    <legend>Reset code</legend>
                    <div className="auth-code-slots" aria-label="Reset code">
                      {codeChars.map((character, index) => (
                        <input
                          key={index}
                          ref={(element) => {
                            codeInputRefs.current[index] = element;
                          }}
                          className="auth-code-slot"
                          type="text"
                          value={character}
                          onChange={(event) => handleCodeChange(index, event.target.value)}
                          onKeyDown={(event) => handleCodeKeyDown(index, event)}
                          onPaste={(event) => {
                            event.preventDefault();
                            handleCodeChange(index, event.clipboardData.getData('text'));
                          }}
                          inputMode="text"
                          autoComplete={index === 0 ? 'one-time-code' : 'off'}
                          maxLength={1}
                          aria-label={`Reset code character ${index + 1}`}
                        />
                      ))}
                    </div>
                  </fieldset>

                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Checking...' : 'Verify code'}
                  </button>
                </form>

                <button
                  type="button"
                  className="auth-inline-button"
                  onClick={handleRequestCode}
                  disabled={isSubmitting}
                >
                  Send a new code
                </button>
              </section>

              <section className="auth-step-panel" aria-hidden={step !== 2}>
                <p className="eyebrow">Security</p>
                <h1>Create new password</h1>
                <p className="auth-hint">Choose a strong password to protect your StockPro workspace.</p>

                <form className="auth-form" onSubmit={handleResetPassword}>
                  <label>
                    {t('auth.forgotPassword.newPassword') || 'New Password'}
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="12+ characters, mixed case, number, symbol"
                      required
                    />
                  </label>

                  <label>
                    {t('auth.forgotPassword.confirmPassword') || 'Confirm Password'}
                    <input
                      type="password"
                      value={confirmNewPassword}
                      onChange={(event) => setConfirmNewPassword(event.target.value)}
                      placeholder={t('auth.placeholders.retypePassword')}
                      required
                    />
                  </label>

                  <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? 'Submitting...' : 'Reset password'}
                  </button>
                </form>
              </section>
            </div>
          </div>

          <p className={`form-message ${messageType}`} aria-live="polite">
            {message}
          </p>

          <div className="auth-links">
            <a href="/login">{t('auth.forgotPassword.backToLogin') || 'Back to Login'}</a>
          </div>
        </section>
      </main>
    </>
  );
}
