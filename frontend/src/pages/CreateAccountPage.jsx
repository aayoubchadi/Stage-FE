import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Header from '../components/Header';
import PageBackground from '../components/PageBackground';
import { useLanguage } from '../lib/i18n';

const SIGNUP_PREFILL_KEY = 'company-admin-signup';

export default function CreateAccountPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      setMessage(t('auth.createAccount.passwordMismatch'));
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');
    setMessageType('');

    const payload = {
      fullName: form.fullName.trim(),
      username: form.username.trim().toLowerCase(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };

    sessionStorage.setItem(SIGNUP_PREFILL_KEY, JSON.stringify(payload));
    setIsSubmitting(false);
    navigate('/signup-pricing');
  };

  return (
    <>
      <PageBackground />
      <Header showNav={false} />
      <main className="section section-shell auth-main">
        <section className="auth-wrap">
          <p className="eyebrow">{t('auth.createAccount.eyebrow')}</p>
          <h1>{t('auth.createAccount.title')}</h1>
          <p>{t('auth.createAccount.subtitle')}</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              {t('auth.createAccount.fullName')}
              <input
                type="text"
                value={form.fullName}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  fullName: event.target.value,
                }))}
                required
              />
            </label>

            <label>
              {t('auth.createAccount.username')}
              <input
                type="text"
                value={form.username}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  username: event.target.value,
                }))}
                required
              />
            </label>

            <label>
              {t('auth.createAccount.email')}
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))}
                required
              />
            </label>

            <label>
              {t('auth.createAccount.password')}
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))}
                required
              />
            </label>

            <label>
              {t('auth.createAccount.confirmPassword')}
              <input
                type="password"
                value={form.confirmPassword}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  confirmPassword: event.target.value,
                }))}
                required
              />
            </label>

            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? t('auth.createAccount.submitting') : t('auth.createAccount.submit')}
            </button>
          </form>

          <p className={`form-message ${messageType}`} aria-live="polite">
            {message}
          </p>

          <div className="auth-links">
            <a href="/login">{t('auth.createAccount.hasAccount')}</a>
          </div>
        </section>
      </main>
    </>
  );
}
