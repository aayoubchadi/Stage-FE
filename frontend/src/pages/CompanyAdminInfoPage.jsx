import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import PageBackground from '../components/PageBackground';
import { getBillingPlans } from '../services/platformApi';

const CHECKOUT_STORAGE_KEY = 'company-admin-checkout';
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/;

function slugify(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);
}

function validateAdminPassword(password, email) {
    const errors = [];
    const value = String(password || '');
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const emailLocalPart = normalizedEmail.includes('@')
        ? normalizedEmail.split('@')[0]
        : normalizedEmail;

    if (value.length < 12) {
        errors.push('minimum length is 12');
    }

    if (value.length > 72) {
        errors.push('maximum length is 72');
    }

    if (!/[A-Z]/.test(value)) {
        errors.push('must include at least one uppercase letter');
    }

    if (!/[a-z]/.test(value)) {
        errors.push('must include at least one lowercase letter');
    }

    if (!/[0-9]/.test(value)) {
        errors.push('must include at least one digit');
    }

    if (!SPECIAL_CHAR_REGEX.test(value)) {
        errors.push('must include at least one special character');
    }

    if (/\s/.test(value)) {
        errors.push('must not include spaces');
    }

    if (emailLocalPart && value.toLowerCase().includes(emailLocalPart)) {
        errors.push('must not contain the email name');
    }

    return errors;
}

function getCheckoutValidationError({ selectedPlan, form }) {
    if (!selectedPlan) {
        return 'Please select a subscription plan.';
    }

    if (!String(form.companyName || '').trim()) {
        return 'Company name is required.';
    }

    if (!String(form.adminFullName || '').trim()) {
        return 'Admin full name is required.';
    }

    if (!String(form.adminEmail || '').trim()) {
        return 'Admin email is required.';
    }

    if (!form.adminPassword || !form.adminPasswordConfirm) {
        return 'Please complete and confirm your admin password.';
    }

    const passwordPolicyErrors = validateAdminPassword(form.adminPassword, form.adminEmail);

    if (passwordPolicyErrors.length > 0) {
        return `Password policy: ${passwordPolicyErrors.join(', ')}`;
    }

    if (form.adminPassword !== form.adminPasswordConfirm) {
        return 'Passwords do not match.';
    }

    return '';
}

export default function CompanyAdminInfoPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [plans, setPlans] = useState([]);
    const [isPlansLoading, setIsPlansLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [hasEditedSlug, setHasEditedSlug] = useState(false);
    const [form, setForm] = useState({
        companyName: '',
        companySlug: '',
        adminFullName: '',
        adminEmail: '',
        adminPassword: '',
        adminPasswordConfirm: '',
    });

    const selectedPlanCodeFromUrl = searchParams.get('plan') || '';
    const [selectedPlanCode, setSelectedPlanCode] = useState(selectedPlanCodeFromUrl);

    const selectedPlan = useMemo(
        () => plans.find((plan) => plan.code === selectedPlanCode) || plans[0] || null,
        [plans, selectedPlanCode]
    );

    useEffect(() => {
        let isActive = true;

        const loadPlans = async () => {
            setIsPlansLoading(true);

            try {
                const fetchedPlans = await getBillingPlans();

                if (!isActive) {
                    return;
                }

                setPlans(fetchedPlans);

                if (selectedPlanCodeFromUrl) {
                    setSelectedPlanCode(selectedPlanCodeFromUrl);
                } else if (fetchedPlans[0]?.code) {
                    setSelectedPlanCode(fetchedPlans[0].code);
                }
            } catch (error) {
                if (!isActive) {
                    return;
                }

                setMessage(error.message || 'Unable to load subscription plans.');
                setMessageType('error');
            } finally {
                if (isActive) {
                    setIsPlansLoading(false);
                }
            }
        };

        loadPlans();

        return () => {
            isActive = false;
        };
    }, [selectedPlanCodeFromUrl]);

    useEffect(() => {
        if (hasEditedSlug) {
            return;
        }

        setForm((current) => ({
            ...current,
            companySlug: slugify(current.companyName),
        }));
    }, [form.companyName, hasEditedSlug]);

    const handleSubmit = (event) => {
        event.preventDefault();

        const validationError = getCheckoutValidationError({
            selectedPlan,
            form,
        });

        if (validationError) {
            setMessage(validationError);
            setMessageType('error');
            return;
        }

        const payload = {
            planCode: selectedPlan.code,
            companyName: form.companyName.trim(),
            companySlug: form.companySlug.trim(),
            adminFullName: form.adminFullName.trim(),
            adminEmail: form.adminEmail.trim().toLowerCase(),
            adminPassword: form.adminPassword,
        };

        sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
        navigate('/company-admin-payment');
    };

    return (
        <>
            <PageBackground />
            <Header showNav={false} />
            <main className="section section-shell checkout-main">
                <section className="checkout-wrap">
                    <p className="eyebrow">Company Admin Subscription</p>
                    <h1>Complete your company setup</h1>
                    <p>
                        Enter your company details first. Payment will be handled on the next step.
                    </p>

                    <div className="checkout-grid">
                        <article className="checkout-panel">
                            <h2>Company Setup</h2>

                            {isPlansLoading ? (
                                <p>Loading plans...</p>
                            ) : (
                                <div className="checkout-plan-picker" role="radiogroup" aria-label="Select plan">
                                    {plans.map((plan) => {
                                        const isSelected = selectedPlan?.code === plan.code;

                                        return (
                                            <button
                                                key={plan.code}
                                                type="button"
                                                className={`checkout-plan-option${isSelected ? ' is-selected' : ''}`}
                                                aria-pressed={isSelected}
                                                onClick={() => setSelectedPlanCode(plan.code)}
                                            >
                                                <strong>{plan.name}</strong>
                                                <span>{(plan.monthlyPriceCents / 100).toFixed(0)} {plan.currencyCode} / month</span>
                                                <small>{plan.maxEmployees} users included</small>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <form className="checkout-form" onSubmit={handleSubmit}>
                                <label>
                                    Company name
                                    <input
                                        type="text"
                                        value={form.companyName}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                companyName: event.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </label>

                                <label>
                                    Company slug
                                    <input
                                        type="text"
                                        value={form.companySlug}
                                        onChange={(event) => {
                                            setHasEditedSlug(true);
                                            setForm((current) => ({
                                                ...current,
                                                companySlug: event.target.value,
                                            }));
                                        }}
                                        required
                                    />
                                </label>

                                <label>
                                    Admin full name
                                    <input
                                        type="text"
                                        value={form.adminFullName}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                adminFullName: event.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </label>

                                <label>
                                    Admin email
                                    <input
                                        type="email"
                                        value={form.adminEmail}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                adminEmail: event.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </label>

                                <label>
                                    Admin password
                                    <input
                                        type="password"
                                        value={form.adminPassword}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                adminPassword: event.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </label>

                                <label>
                                    Confirm password
                                    <input
                                        type="password"
                                        value={form.adminPasswordConfirm}
                                        onChange={(event) =>
                                            setForm((current) => ({
                                                ...current,
                                                adminPasswordConfirm: event.target.value,
                                            }))
                                        }
                                        required
                                    />
                                </label>

                                <button type="submit" className="btn btn-primary">
                                    Continue to payment
                                </button>
                            </form>
                        </article>

                        <aside className="checkout-panel checkout-summary-panel">
                            {selectedPlan ? (
                                <>
                                    <h2>Summary</h2>
                                    <div className="checkout-summary-row">
                                        <span>Plan</span>
                                        <strong>{selectedPlan.name}</strong>
                                    </div>
                                    <div className="checkout-summary-row">
                                        <span>Price</span>
                                        <strong>{(selectedPlan.monthlyPriceCents / 100).toFixed(0)} {selectedPlan.currencyCode}</strong>
                                    </div>
                                    <div className="checkout-summary-row">
                                        <span>Users included</span>
                                        <strong>{selectedPlan.maxEmployees}</strong>
                                    </div>
                                </>
                            ) : (
                                <p>Select a plan to continue.</p>
                            )}
                        </aside>
                    </div>

                    {message ? <p className={`form-message ${messageType}`}>{message}</p> : null}
                </section>
            </main>
        </>
    );
}
