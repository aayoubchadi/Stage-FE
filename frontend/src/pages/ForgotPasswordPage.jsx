import { useState } from 'react';
import Header from '../components/Header';
import PageBackground from '../components/PageBackground';
import { forgotPasswordRequest } from '../services/authApi';
import { useLanguage } from '../lib/i18n';

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setMessage('Email is required.');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    try {
      await forgotPasswordRequest(email);
      setMessage('If an account exists, a reset link will be sent to your email.');
      setMessageType('success');
    } catch (error) {
      setMessage('If an account exists, a reset link will be sent to your email.');
      setMessageType('success');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageBackground />
      <Header showNav={false} />
      <main className="section section-shell auth-main">
        <section className="auth-wrap">
          <p className="eyebrow">{t('auth.forgotPassword.eyebrow')}</p>
          <h1>Request Password Reset</h1>
          <p className="auth-hint">Enter your email address to receive a link to reset your password.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              {t('auth.forgotPassword.email') || 'Email'}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.placeholders.email') || 'your@email.com'}
                required
              />
            </label>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Send Reset Link'}
            </button>
          </form>

          <p className={`form-message ${messageType}`} aria-live="polite">
            {message}
          </p>

          <div className="auth-links">
            <a href="/login">{t('auth.forgotPassword.backToLogin') || 'Back to Login'}</a>
            <a href="/signup-pricing">{t('auth.forgotPassword.createAccount') || 'Create Account'}</a>
          </div>
        </section>
      </main>
    </>
  );
}
