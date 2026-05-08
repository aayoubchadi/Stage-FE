import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import Header from '../components/Header';
import PageBackground from '../components/PageBackground';
import { useLanguage } from '../lib/i18n';
import { registerGoogleRequest, registerRequest } from '../services/authApi';

export default function CreateAccountPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectTimeoutRef = useRef(null);

  const scheduleRedirect = useCallback(() => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }

    redirectTimeoutRef.current = setTimeout(() => {
      navigate('/');
    }, 1200);
  }, [navigate]);

  const resolveFriendlyAuthError = useCallback((error, fallbackMessage) => {
    const rawMessage = String(error?.message || '').trim();

    if (!rawMessage) {
      return fallbackMessage;
    }

    const normalized = rawMessage.toLowerCase();
    const isNetworkError =
      normalized.includes('failed to fetch') ||
      normalized.includes('networkerror') ||
      normalized.includes('network request failed') ||
      normalized.includes('load failed');

    if (isNetworkError) {
      return t('auth.createAccount.networkIssue');
    }

    return rawMessage;
  }, [t]);

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

    try {
      await registerRequest({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: 'employee',
      });

      setMessage(t('auth.createAccount.pendingRequest'));
      setMessageType('success');
      scheduleRedirect();
    } catch (error) {
      setMessage(resolveFriendlyAuthError(error, t('auth.createAccount.emailExists')));
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleCredential = useCallback(
    async (googleResponse) => {
      if (!googleResponse?.credential) {
        setMessage(t('auth.createAccount.googleCredentialMissing'));
        setMessageType('error');
        return;
      }

      setIsGoogleSubmitting(true);
      setMessage('');
      setMessageType('');

      try {
        await registerGoogleRequest({
          idToken: googleResponse.credential,
        });

        setMessage(t('auth.createAccount.pendingRequest'));
        setMessageType('success');
        scheduleRedirect();
      } catch (error) {
        setMessage(resolveFriendlyAuthError(error, t('auth.createAccount.googleSignupFailed')));
        setMessageType('error');
      } finally {
        setIsGoogleSubmitting(false);
      }
    },
    [resolveFriendlyAuthError, t]
  );

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return undefined;
    }

    let isActive = true;

    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current || !isActive) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        text: 'signup_with',
        shape: 'pill',
        size: 'large',
        width: Math.max(220, Math.round(googleButtonRef.current.clientWidth || 320)),
      });

      setIsGoogleReady(true);
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return () => {
        isActive = false;
      };
    }

    const existingScript = document.getElementById('google-identity-services');

    if (existingScript) {
      existingScript.addEventListener('load', initializeGoogle, { once: true });
      return () => {
        isActive = false;
      };
    }

    const script = document.createElement('script');
    script.id = 'google-identity-services';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => {
      if (!isActive) {
        return;
      }

      setMessage(t('auth.createAccount.googleScriptFailed'));
      setMessageType('error');
    };

    document.head.appendChild(script);

    return () => {
      isActive = false;
    };
  }, [googleClientId, handleGoogleCredential]);

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

            <div className="auth-social-divider" aria-hidden="true">
              <span>or</span>
            </div>

            {googleClientId ? (
              <div className="google-login-wrap" aria-busy={isGoogleSubmitting}>
                <div ref={googleButtonRef} className="google-login-button" />
                {!isGoogleReady && <small>Loading Google sign-up...</small>}
              </div>
            ) : (
              <small className="auth-google-missing">
                Set VITE_GOOGLE_CLIENT_ID to enable Google sign-up.
              </small>
            )}
          </form>

          <p className={`form-message ${messageType}`} aria-live="polite">
            {message}
          </p>

          <div className="auth-links">
            <a href="/login">{t('auth.createAccount.hasAccount')}</a>
            <Link to="/demo-onboarding">{t('landing.pricing.startDemoCta')}</Link>
          </div>
        </section>
      </main>
    </>
  );
}
