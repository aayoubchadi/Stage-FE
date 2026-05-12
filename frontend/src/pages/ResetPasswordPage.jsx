import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import PageBackground from '../components/PageBackground';
import { resetPasswordRequest } from '../services/authApi';
import { useLanguage } from '../lib/i18n';

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
      setMessage('Invalid or missing reset token.');
      setMessageType('error');
      return;
    }

    if (newPassword.length < 6) {
      setMessage(t('auth.forgotPassword.passwordMin') || 'Password must be at least 6 characters.');
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
      await resetPasswordRequest(token, newPassword);
      setMessage(t('auth.forgotPassword.success') || 'Password reset successful!');
      setMessageType('success');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      setMessage(error.message);
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
        <section className="auth-wrap">
          <p className="eyebrow">{t('auth.forgotPassword.eyebrow')}</p>
          <h1>Reset Password</h1>
          <p className="auth-hint">Create a new password for your account.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              {t('auth.forgotPassword.newPassword') || 'New Password'}
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('auth.placeholders.passwordMin')}
                required
              />
            </label>

            <label>
              {t('auth.forgotPassword.confirmPassword') || 'Confirm Password'}
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder={t('auth.placeholders.retypePassword')}
                required
              />
            </label>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : (t('auth.forgotPassword.submit') || 'Submit')}
            </button>
          </form>

          <p className={`form-message ${messageType}`} aria-live="polite">
            {message}
          </p>
        </section>
      </main>
    </>
  );
}
